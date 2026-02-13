// kilimo-backend/src/middleware
import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth.js';

// Extend Hono context to include user
export interface AuthContext extends Context {
  get userId(): string;
  set userId(value: string);
}

// Authentication middleware
export const authenticate = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized - No token provided',
      },
      401
    );
  }

  const token = authHeader.substring(7); 

  const decoded = verifyToken(token);

  if (!decoded) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized - Invalid token',
      },
      401
    );
  }

  // Add userId to context
  c.set('userId', decoded.userId);

  await next();
};