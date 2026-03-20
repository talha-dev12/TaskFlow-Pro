// src/config/database.ts
// Singleton Prisma client – prevents multiple connections in dev (hot-reload)

import { PrismaClient } from '@prisma/client';

// Extend the global type so TypeScript doesn't complain about globalThis._prisma
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

/**
 * Single shared PrismaClient instance.
 * In development, reuse the instance across hot-reloads to avoid
 * exhausting DB connection pool.
 */
const prisma: PrismaClient =
  globalThis._prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._prisma = prisma;
}

export default prisma;
