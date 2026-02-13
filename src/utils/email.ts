// src/utils/email.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

//  load .env file
dotenv.config();

console.log('Email Configuration Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? ' Set' : 'Missing');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? 'Set' : 'Missing');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Missing');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Missing');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL ? 'Set' : 'Missing');


// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465 and also false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send OTP email
export const sendOTPEmail = async (
  email: string,
  otpCode: string,
  userName?: string
): Promise<void> => {
  const mailOptions = {
    from: `"Kilimo App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Kilimo App OTP Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px solid #4CAF50; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kilimo App</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || 'there'}!</h2>
            <p>You requested a One-Time Password (OTP) to verify your account.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
              <div class="otp-code">${otpCode}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code expires in 2 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>Kilimo App will never ask for your OTP via phone or email</li>
                <li>You have 3 attempts to enter the correct code</li>
              </ul>
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Kilimo App. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<void> => {
  const mailOptions = {
    from: `"Kilimo App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to Kilimo App!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Kilimo App!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for joining Kilimo App. Your account has been successfully verified and you're all set to get started!</p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Happy exploring!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};