// src/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as dotenv from 'dotenv';
import { db } from "./drizzle/db";

// Import routes
import authRoutes from './routes/auth';
import formRoutes from './routes/form';

// Load environment variables
dotenv.config();

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*', 
    credentials: true,
  })
);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Kilimo App API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/form', formRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Route not found',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  );
});

app.get('/health', async (c) => {
  try {
    // Check database connection
    await db.query.users.findFirst();
    
    return c.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'connected',
        email: process.env.SMTP_USER ? 'configured' : 'not configured',
      },
    });
  } catch (error: any) {
    return c.json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`📚 API Documentation:`);
console.log(`   - POST /api/auth/register - Register new user`);
console.log(`   - POST /api/auth/login - Login user`);
console.log(`   - POST /api/auth/verify-otp - Verify OTP`);
console.log(`   - POST /api/auth/resend-otp - Resend OTP`);
console.log(`   - POST /api/form/submit - Submit form (authenticated)`);
console.log(`   - GET /api/form/submissions - Get all submissions (authenticated)`);
console.log(`   - GET /api/form/submissions/:id - Get specific submission (authenticated)`);