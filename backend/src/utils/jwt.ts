// src/utils/jwt.ts
// Utility helpers for signing and verifying JSON Web Tokens

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a JWT with the user's id, email, and role.
 * Secret and expiry come from environment variables.
 */
export function signToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '7d',
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify a JWT and return its decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): DecodedToken {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret) as DecodedToken;
}
