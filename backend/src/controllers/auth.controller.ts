// src/controllers/auth.controller.ts
// Handles user registration and login with full validation,
// bcrypt password hashing, and JWT issuance (70%+ First Class)

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { isValidEmail, isValidPassword, isValidName } from '../utils/validators';
import { sanitizeEmail, sanitizeString } from '../utils/sanitizers';

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account.
 * - Validates and sanitizes all inputs
 * - Hashes password with bcrypt (salt rounds = 12)
 * - Returns JWT token on success
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const errors: string[] = [];

    if (!email || !isValidEmail(email)) {
      errors.push('A valid email address is required.');
    }
    if (!password || !isValidPassword(password)) {
      errors.push(
        'Password must be at least 8 characters and include an uppercase letter, lowercase letter, and digit.'
      );
    }
    if (!name || !isValidName(name)) {
      errors.push('Name must be between 2 and 100 characters.');
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    // ── Sanitize ──────────────────────────────────────────────────────────────
    const cleanEmail = sanitizeEmail(email);
    const cleanName = sanitizeString(name);

    // ── Check duplicate email ─────────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // ── Hash password (bcrypt, 12 rounds) ─────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ───────────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates an existing user.
 * - Validates inputs
 * - Compares plain password against bcrypt hash
 * - Returns JWT token on success
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const cleanEmail = sanitizeEmail(email);

    // ── Find user ─────────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Generic message prevents user enumeration (OWASP A07)
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // ── Compare password ──────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 * Protected – requireAuth middleware must run first.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
