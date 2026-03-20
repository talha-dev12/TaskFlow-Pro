// src/app.ts
// Express application setup – middleware stack, routes, Swagger
// This file exports the app for testing without starting the server

import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { requestLogger } from './middleware/logger.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

const app: Application = express();

// ─── Security middleware (OWASP mitigations) ──────────────────────────────────

/**
 * helmet: Sets secure HTTP response headers.
 * Mitigates: clickjacking, MIME sniffing, XSS via headers (OWASP A05).
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

/**
 * CORS: Restrict cross-origin requests to the frontend origin only.
 * Prevents unauthorised sites from making credentialled requests (OWASP A05).
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 * Auth endpoints have their own stricter limiter in auth.routes.ts.
 * Mitigates: brute force and DDoS (OWASP A07).
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

/**
 * Strict limiter for auth endpoints: 10 requests per 15 minutes.
 * Exported so auth routes can apply it specifically.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

app.use(globalLimiter);

// ─── General middleware ───────────────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent abuse

// Parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compress responses (improves performance)
app.use(compression());

// HTTP request logging (50%+ middleware requirement)
app.use(requestLogger);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
// Task routes are mounted under /api/projects/:projectId/tasks (in project.routes.ts)

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * Simple health-check endpoint for deployment monitoring.
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow Pro API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// ─── Swagger API documentation (60%+ requirement) ────────────────────────────

setupSwagger(app);

// ─── Error handling (must be LAST) ───────────────────────────────────────────

// 404 for any route not matched above
app.use(notFound);

// Global error handler – catches all errors passed via next(err)
app.use(errorHandler);

export default app;
