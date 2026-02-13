// kilimo-backend/src/routes/auth.ts

import { Hono } from 'hono';
import { db } from '../drizzle/db.js';
import { users, otpVerifications } from '../drizzle/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
} from '../utils/validation.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateOTP,
  getOTPExpiration,
} from '../utils/auth.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email.js';
import { authLimiter, otpLimiter } from '../utils/rateLimiter.js';

const authRoutes = new Hono();

// Register endpoint
authRoutes.post('/register', authLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        400
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        isVerified: false,
      })
      .returning();

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiration();

    // Save OTP to database
    await db.insert(otpVerifications).values({
      userId: newUser.id,
      otpCode,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(
      newUser.email,
      otpCode,
      newUser.firstName || undefined
    );

    return c.json(
      {
        success: true,
        message: 'Registration successful. Please check your email for OTP.',
        data: {
          userId: newUser.id,
          email: newUser.email,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      return c.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        message: 'Registration failed',
        error: error.message,
      },
      500
    );
  }
});

// Login endpoint
authRoutes.post('/login', authLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        401
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        401
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = getOTPExpiration();

      // Delete old OTPs
      await db
        .delete(otpVerifications)
        .where(eq(otpVerifications.userId, user.id));

      // Save new OTP
      await db.insert(otpVerifications).values({
        userId: user.id,
        otpCode,
        expiresAt,
      });

      // Send OTP email
      await sendOTPEmail(user.email, otpCode, user.firstName || undefined);

      return c.json(
        {
          success: false,
          message: 'Account not verified. OTP sent to your email.',
          requiresOTP: true,
          email: user.email,
        },
        403
      );
    }

    // Generate JWT token
    const token = generateToken(user.id);

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return c.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        message: 'Login failed',
        error: error.message,
      },
      500
    );
  }
});

// Verify OTP endpoint
authRoutes.post('/verify-otp', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = verifyOTPSchema.parse(body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'User not found',
        },
        404
      );
    }

    // Find active OTP
    const otpRecord = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.userId, user.id),
        eq(otpVerifications.verified, false),
        gt(otpVerifications.expiresAt, new Date())
      ),
      orderBy: (otpVerifications, { desc }) => [desc(otpVerifications.createdAt)],
    });

    if (!otpRecord) {
      return c.json(
        {
          success: false,
          message: 'OTP expired or not found. Please request a new one.',
        },
        400
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return c.json(
        {
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
        },
        400
      );
    }

    // Verify OTP
    if (otpRecord.otpCode !== validatedData.otpCode) {
      // Increment attempts
      await db
        .update(otpVerifications)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otpVerifications.id, otpRecord.id));

      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);

      return c.json(
        {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        },
        400
      );
    }

    // Mark OTP as verified
    await db
      .update(otpVerifications)
      .set({ verified: true })
      .where(eq(otpVerifications.id, otpRecord.id));

    // Mark user as verified
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, user.id));

    // Send welcome email
    await sendWelcomeEmail(
      user.email,
      user.firstName || user.email.split('@')[0]
    );

    // Generate JWT token
    const token = generateToken(user.id);

    return c.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
        },
      },
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);

    if (error.name === 'ZodError') {
      return c.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        message: 'OTP verification failed',
        error: error.message,
      },
      500
    );
  }
});

// Resend OTP endpoint
authRoutes.post('/resend-otp', authLimiter,  async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = resendOTPSchema.parse(body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'User not found',
        },
        404
      );
    }

    if (user.isVerified) {
      return c.json(
        {
          success: false,
          message: 'User is already verified',
        },
        400
      );
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiration();

    // Delete old unverified OTPs
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, user.id),
          eq(otpVerifications.verified, false)
        )
      );

    // Save new OTP
    await db.insert(otpVerifications).values({
      userId: user.id,
      otpCode,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(user.email, otpCode, user.firstName || undefined);

    return c.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);

    if (error.name === 'ZodError') {
      return c.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        message: 'Failed to resend OTP',
        error: error.message,
      },
      500
    );
  }
});

export default authRoutes;