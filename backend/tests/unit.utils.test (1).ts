// backend/tests/unit.utils.test.ts
// Unit tests for JWT helpers and sanitizer functions

import { signToken, verifyToken, TokenPayload } from '../../src/utils/jwt';
import { sanitizeString, sanitizeEmail, sanitizeObject } from '../../src/utils/sanitizers';

// Set required env vars before tests
beforeAll(() => {
  process.env.JWT_SECRET     = 'test_secret_key_that_is_long_enough_32chars';
  process.env.JWT_EXPIRES_IN = '1h';
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT helpers
// ─────────────────────────────────────────────────────────────────────────────
describe('signToken', () => {
  const payload: TokenPayload = { userId: 1, email: 'user@example.com', role: 'USER' };

  it('returns a non-empty string', () => {
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('returns a JWT with three parts separated by dots', () => {
    const token = signToken(payload);
    expect(token.split('.')).toHaveLength(3);
  });

  it('throws if JWT_SECRET is not set', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => signToken(payload)).toThrow('JWT_SECRET');
    process.env.JWT_SECRET = original;
  });
});

describe('verifyToken', () => {
  const payload: TokenPayload = { userId: 42, email: 'test@example.com', role: 'ADMIN' };

  it('returns decoded payload with correct userId', () => {
    const token   = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(42);
  });

  it('returns decoded payload with correct email', () => {
    const token   = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.email).toBe('test@example.com');
  });

  it('returns decoded payload with correct role', () => {
    const token   = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('ADMIN');
  });

  it('throws for a tampered token', () => {
    const token    = signToken(payload);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws for a completely invalid string', () => {
    expect(() => verifyToken('not.a.token')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sanitizer helpers
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeString', () => {
  it('returns the same clean string unchanged', () => {
    expect(sanitizeString('Hello world')).toBe('Hello world');
  });

  it('strips <script> tags (XSS protection)', () => {
    const result = sanitizeString('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips HTML tags', () => {
    const result = sanitizeString('<b>bold</b> text');
    expect(result).not.toContain('<b>');
    expect(result).toContain('bold');
  });

  it('strips img tags with onerror (XSS vector)', () => {
    const result = sanitizeString('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeString(null as unknown as string)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('lowercases the email', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('strips HTML from email', () => {
    const result = sanitizeEmail('<b>user</b>@example.com');
    expect(result).not.toContain('<b>');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes all string values in a flat object', () => {
    const result = sanitizeObject({
      title: '<script>bad</script>My Title',
      count: 5,
    });
    expect(result.title).not.toContain('<script>');
    expect(result.title).toContain('My Title');
    expect(result.count).toBe(5);
  });

  it('leaves non-string values unchanged', () => {
    const result = sanitizeObject({ num: 42, flag: true, date: null });
    expect(result.num).toBe(42);
    expect(result.flag).toBe(true);
    expect(result.date).toBeNull();
  });

  it('recursively sanitizes nested objects', () => {
    const result = sanitizeObject({
      user: { name: '<b>John</b>' },
    });
    expect((result.user as Record<string, unknown>).name).not.toContain('<b>');
  });
});
