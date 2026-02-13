# Kilimo App Backend API

> A robust Node.js backend API for the Kilimo farming assistant application, built with Hono, TypeScript, PostgreSQL (Neon), and Drizzle ORM.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-Latest-orange.svg)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791.svg)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green.svg)](https://orm.drizzle.team/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [Security Features](#security-features)
- [Development Notes](#development-notes)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Kilimo App Backend is a production-ready REST API that powers the Kilimo farming assistant mobile application. It provides secure user authentication with email verification via OTP, form submission capabilities, and comprehensive user management.

### Developer's Note

*This project was developed following the Kilimo App Practical Assessment requirements. The initial commit includes the complete implementation with all core features. I acknowledge that in a real-world scenario, commits would be incremental and feature-specific. This approach was taken to deliver a fully functional solution within the assessment timeframe.*

---

##  Features

### Core Functionality
-  **User Registration** with email/password
-  **Email Verification** via 6-digit OTP (2-minute expiry)
-  **Secure Authentication** using JWT tokens
-  **Form Submission** for authenticated users
-  **User Profile Management**

### Security Features
-  **Password Hashing** with bcrypt (10 salt rounds)
-  **JWT Authentication** with 7-day token expiry
-  **Rate Limiting** on authentication endpoints
-  **Email Verification** mandatory before access
-  **OTP Attempt Limiting** (max 3 attempts)
-  **Input Validation** using Zod schemas

### Additional Features
-  **Email Service** with HTML templates (OTP & Welcome emails)
-  **PostgreSQL Database** hosted on Neon (serverless)
-  **Drizzle ORM** for type-safe database queries
-  **Database Migrations** support
-  **Comprehensive Error Handling**
-  **Health Check Endpoint**
-  **TypeScript** for full type safety

---

##  Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Hono.js |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon - Serverless) |
| **ORM** | Drizzle ORM |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | bcrypt.js |
| **Validation** | Zod |
| **Email Service** | Nodemailer |
| **Rate Limiting** | hono-rate-limiter |

---

## Project Structure

```
kilimo-backend/
├── src/
│   ├── drizzle/
│   │   ├── db.ts              # Database connection & configuration
│   │   ├── schema.ts          # Database schema definitions
│   │   ├── migrate.ts         # Migration runner
│   │   └── migrations/        # SQL migration files
│   ├── middleware/
│   │   └── bearAuth.ts        # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.ts            # Authentication endpoints
│   │   └── form.ts            # Form submission endpoints
│   ├── utils/
│   │   ├── auth.ts            # Auth helper functions
│   │   ├── email.ts           # Email service
│   │   ├── validation.ts      # Zod validation schemas
│   │   └── rateLimiter.ts     # Rate limiting configuration
│   └── index.ts               # Main application entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── drizzle.config.ts          # Drizzle configuration
└── README.md
```

---

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (or Neon account)
- **SMTP Email Service** (Gmail, SendGrid, etc.)

---

##  Installation

### 1. Clone the Repository

```bash
git clone https://github.com/stine-ri/kilimo-backend.git
cd kilimo-backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see [Environment Variables](#environment-variables) section).

---

##  Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=your-email@gmail.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### 📧 Email Configuration Notes

For **Gmail**:
1. Enable 2-Factor Authentication
2. Generate an App-Specific Password
3. Use the app password in `SMTP_PASS`

For other providers, adjust `SMTP_HOST` and `SMTP_PORT` accordingly.

### 🗄️ Database Setup (Neon)

Following the assessment requirements, this project uses **Neon** as the PostgreSQL cloud provider:

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env` as `DATABASE_URL`

---

## 💾 Database Setup

### 1. Generate Migration Files

```bash
npm run db:generate
```

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. (Optional) Push Schema Directly

For development, you can push schema changes directly:

```bash
npm run db:push
```

### 4. Open Drizzle Studio (Database GUI)

```bash
npm run db:studio
```

---

##  Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

---

## API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-02-13T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "connected",
    "email": "configured"
  }
}
```

---

### Authentication Endpoints

#### 1. Register User

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+254712345678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP.",
  "data": {
    "userId": "uuid-here",
    "email": "farmer@example.com"
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

#### 2. Login User

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK) - Verified User:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid-here",
      "email": "farmer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+254712345678"
    }
  }
}
```

**Response (403 Forbidden) - Unverified User:**
```json
{
  "success": false,
  "message": "Account not verified. OTP sent to your email.",
  "requiresOTP": true,
  "email": "farmer@example.com"
}
```

---

#### 3. Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "otpCode": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid-here",
      "email": "farmer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+254712345678"
    }
  }
}
```

**OTP Rules:**
- 6-digit code
- Expires in 2 minutes
- Maximum 3 attempts
- New OTP invalidates old ones

---

#### 4. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "farmer@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "New OTP sent to your email"
}
```

---

### Form Endpoints (Protected)

All form endpoints require JWT authentication:

```
Authorization: Bearer <your-jwt-token>
```

#### 5. Submit Form

```http
POST /api/form/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "farmer@example.com",
  "phoneNumber": "+254712345678",
  "message": "I need help with crop disease identification."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "submissionId": "uuid-here",
    "submittedAt": "2024-02-13T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- All fields required
- Message minimum 10 characters
- Phone number minimum 10 digits

---

#### 6. Get All Submissions

```http
GET /api/form/submissions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "userId": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "farmer@example.com",
      "phoneNumber": "+254712345678",
      "message": "I need help with crop disease identification.",
      "createdAt": "2024-02-13T10:30:00.000Z"
    }
  ]
}
```

---

#### 7. Get Specific Submission

```http
GET /api/form/submissions/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "userId": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "farmer@example.com",
    "phoneNumber": "+254712345678",
    "message": "I need help with crop disease identification.",
    "createdAt": "2024-02-13T10:30:00.000Z"
  }
}
```

---

### Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "message": "Error description here",
  "errors": [] // validation errors
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (unverified account)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🔄 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database
    participant Email

    Client->>API: POST /api/auth/register
    API->>Database: Create user (isVerified: false)
    API->>Database: Create OTP record
    API->>Email: Send OTP email
    API-->>Client: 201 Created

    Client->>API: POST /api/auth/verify-otp
    API->>Database: Verify OTP
    API->>Database: Mark user as verified
    API->>Email: Send welcome email
    API-->>Client: 200 OK + JWT token

    Client->>API: POST /api/form/submit (with JWT)
    API->>API: Verify JWT token
    API->>Database: Save form submission
    API-->>Client: 201 Created
```

---

##  Security Features

### Implemented Security Measures

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Strong password requirements enforced
   - Passwords never stored in plain text

2. **JWT Authentication**
   - 7-day token expiry
   - Secure secret key (configurable)
   - Token verification middleware

3. **Rate Limiting**
   - Authentication endpoints: 5 requests per 15 minutes
   - OTP endpoints: 3 requests per 10 minutes
   - IP-based tracking

4. **Email Verification**
   - Mandatory OTP verification
   - OTP expires in 2 minutes
   - Maximum 3 verification attempts
   - OTP invalidation on new request

5. **Input Validation**
   - Zod schema validation
   - SQL injection protection via ORM
   - XSS prevention through input sanitization

6. **Database Security**
   - Parameterized queries via Drizzle ORM
   - Cascade deletes for data integrity
   - UUID primary keys

7. **CORS Configuration**
   - Configurable allowed origins
   - Credentials support

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### OTP Verifications Table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  max_attempts INTEGER DEFAULT 3 NOT NULL
);
```

### Form Submissions Table
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

##  Development Notes

### NPM Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx src/drizzle/migrate.ts",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

### Code Quality

- **TypeScript** strict mode enabled
- **ESLint** (optional -> can be added)
- **Prettier** (optional -> can be added)
- Type-safe database queries with Drizzle
- Comprehensive error handling

### Development Best Practices Followed

 Environment-based configuration  
 Separation of concerns (routes, middleware, utils)  
 Type safety throughout the codebase  
 Consistent API response format  
 Comprehensive input validation  
 Proper error handling and logging  
 Database migrations for version control  
 Modular and reusable code structure  

---

##  Testing

### Manual Testing

Use tools like:
- **Postman** - Import the API collection
- **Thunder Client** (VS Code extension)
- **cURL** - Command-line testing
- **HTTPie** - User-friendly HTTP client

### Example cURL Request

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+254712345678"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Submit form (replace with actual token)
curl -X POST http://localhost:3000/api/form/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "test@example.com",
    "phoneNumber": "+254712345678",
    "message": "This is a test message for the farming assistant."
  }'
```

### Automated Testing (Future Enhancement)

Consider adding:
- **Jest** for unit tests
- **Supertest** for API integration tests
- **Test coverage** reporting

---

##  Deployment

### Prerequisites for Production

- [ ] Change `JWT_SECRET` to a strong random value 
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set up production email service
- [ ] Configure CORS allowed origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Deployment Platforms

This application can be deployed to:

- **Railway** - Recommended for Hono apps
- **Fly.io** - Good for Node.js apps
- **Render** - Easy deployment with free tier
- **Vercel** - Serverless deployment
- **AWS EC2** - Full control
- **Digital Ocean** - Droplets or App Platform
- **Heroku** - Classic PaaS option

### Environment Variables Checklist

Before deploying, ensure all environment variables are set in your hosting platform:

-  `DATABASE_URL` (Neon connection string)
-  `JWT_SECRET` (strong secret key)
-  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
-  `PORT` (usually provided by platform)
-  `NODE_ENV=production`

---

##  Contributing

While this is an assessment project, feedback and suggestions are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  License

This project is part of the Kilimo App Practical Assessment for DataQue Analytics.

---

##  Acknowledgments

- **Hono.js** team for the lightweight, fast framework
- **Neon** for serverless PostgreSQL hosting
- **Drizzle ORM** for the excellent TypeScript-first ORM
- Assessment reviewers for the detailed requirements
- **DataQue Analytics** Thank you for the assessment opportunity

---

## Contact

**Developer:** Christine Nyambwari  
**Email:** [christinenyambwari@gmail.com]  
**GitHub:** [(https://github.com/stine-ri)]

---

##  Project Status

**Completed Features:**
- User registration and authentication
- Email verification with OTP
- Form submission system
- JWT-based authorization
- Database schema and migrations
- Email service with templates
- Rate limiting and security
- Comprehensive error handling

 **Future Enhancements:**
- Unit and integration tests
- API documentation with Swagger
- Admin dashboard
- Email template customization
- Advanced analytics
- Webhook support
- Multi-language support

---

##  Known Issues

No known issues at this time. Please report any bugs via GitHub Issues.

---

##  Performance Considerations

- Database connection pooling via Neon
- Efficient ORM queries with Drizzle
- Minimal middleware overhead with Hono
- JWT verification caching (can be added)
- Email queue system (future enhancement)

---

**Last Updated:** February 2026  
