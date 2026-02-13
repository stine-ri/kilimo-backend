import { Hono } from 'hono';
import { db } from '../drizzle/db';
import { formSubmissions, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { formSubmissionSchema } from '../utils/validation';
import { authenticate } from '../middleware/bearAuth';

// Create a typed Hono instance with AuthContext
type AuthEnv = {
  Variables: {
    userId: string;
  };
};

const formRoutes = new Hono<AuthEnv>();

// Submit form (protected route)
formRoutes.post('/submit', authenticate, async (c) => {
  try {
    const userId = c.var.userId; // Use c.var instead of c.get
    const body = await c.req.json();
    const validatedData = formSubmissionSchema.parse(body);

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
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

    // Create form submission
    const [submission] = await db
      .insert(formSubmissions)
      .values({
        userId: user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        message: validatedData.message,
      })
      .returning();

    return c.json(
      {
        success: true,
        message: 'Form submitted successfully',
        data: {
          submissionId: submission.id,
          submittedAt: submission.createdAt,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Form submission error:', error);

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
        message: 'Form submission failed',
        error: error.message,
      },
      500
    );
  }
});

// Get user's form submissions (protected route)
formRoutes.get('/submissions', authenticate, async (c) => {
  try {
    const userId = c.var.userId;

    const submissions = await db.query.formSubmissions.findMany({
      where: eq(formSubmissions.userId, userId),
      orderBy: (formSubmissions, { desc }) => [desc(formSubmissions.createdAt)],
    });

    return c.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    console.error('Get submissions error:', error);

    return c.json(
      {
        success: false,
        message: 'Failed to fetch submissions',
        error: error.message,
      },
      500
    );
  }
});

// Get specific submission (protected route)
formRoutes.get('/submissions/:id', authenticate, async (c) => {
  try {
    const userId = c.var.userId;
    const submissionId = c.req.param('id');

    const submission = await db.query.formSubmissions.findFirst({
      where: eq(formSubmissions.id, submissionId),
    });

    if (!submission) {
      return c.json(
        {
          success: false,
          message: 'Submission not found',
        },
        404
      );
    }

    // Check if submission belongs to user
    if (submission.userId !== userId) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized to access this submission',
        },
        403
      );
    }

    return c.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Get submission error:', error);

    return c.json(
      {
        success: false,
        message: 'Failed to fetch submission',
        error: error.message,
      },
      500
    );
  }
});

export default formRoutes;