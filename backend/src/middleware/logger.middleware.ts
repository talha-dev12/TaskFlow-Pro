// src/middleware/logger.middleware.ts
// HTTP request logging via morgan (50%+ cross-cutting concern middleware)

import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';

// Custom token: log the authenticated user's id if available
morgan.token('user-id', (req: Request) => {
  return req.user?.userId?.toString() ?? 'anonymous';
});

// Custom token: log response body size in a friendly format
morgan.token('body-size', (_req: Request, res: Response) => {
  const len = res.getHeader('content-length');
  return len ? `${len}b` : '-';
});

// Stream that feeds morgan output into console.log
const stream: StreamOptions = {
  write: (message: string) => {
    // Remove trailing newline morgan adds
    console.log(message.trim());
  },
};

/**
 * Development logger – colourful, human-readable output.
 * Format: METHOD /path STATUS time - userId
 */
export const devLogger = morgan(
  ':method :url :status :response-time ms - user::user-id',
  { stream, skip: () => process.env.NODE_ENV === 'test' }
);

/**
 * Production logger – compact combined format.
 * Safe for log aggregators (no ANSI colour codes).
 */
export const prodLogger = morgan('combined', {
  stream,
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Export the appropriate logger based on NODE_ENV.
 */
export const requestLogger =
  process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
