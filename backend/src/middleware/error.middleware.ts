// src/middleware/error.middleware.ts
// Centralised error handler – all errors bubble here via next(err)
// Ensures consistent JSON error responses across the entire API (70%+)

import { Request, Response, NextFunction } from 'express';

// Custom error class so we can attach HTTP status codes to errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Operational = expected, not a bug
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// Shape of every error response from this API
interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Global error-handling middleware.
 * Express identifies it by its 4-parameter signature.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Default to 500 for unexpected errors
  const statusCode = (err as AppError).statusCode ?? 500;

  const body: ErrorResponse = {
    success: false,
    message: err.message || 'Internal server error',
  };

  // Include stack trace in development to aid debugging
  if (isDev) {
    body.stack = err.stack;
  }

  // Log unexpected server errors
  if (statusCode >= 500) {
    console.error('[ERROR]', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json(body);
}

/**
 * 404 handler – must be registered AFTER all routes.
 * Converts unmatched requests into a proper AppError.
 */
export function notFound(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}
