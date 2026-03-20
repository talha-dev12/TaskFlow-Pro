// backend/tests/unit/validators.test.ts
// Unit tests for all validator utility functions (60%+ requirement)
// These are pure functions – no DB, no HTTP, fast to run

import {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPriority,
  isValidStatus,
  isValidDate,
  isNonEmptyString,
} from '../../src/utils/validators';

// ─────────────────────────────────────────────────────────────────────────────
// isValidEmail
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('returns true for email with plus sign', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('returns false for email with no @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for email with no domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(isValidEmail('   ')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidPassword
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidPassword', () => {
  it('returns true for a valid password with upper, lower, digit', () => {
    expect(isValidPassword('Password1')).toBe(true);
  });

  it('returns true for a complex password', () => {
    expect(isValidPassword('MyP@ssw0rd!')).toBe(true);
  });

  it('returns false when shorter than 8 characters', () => {
    expect(isValidPassword('Pass1')).toBe(false);
  });

  it('returns false when missing uppercase letter', () => {
    expect(isValidPassword('password1')).toBe(false);
  });

  it('returns false when missing lowercase letter', () => {
    expect(isValidPassword('PASSWORD1')).toBe(false);
  });

  it('returns false when missing digit', () => {
    expect(isValidPassword('Password')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(isValidPassword(123 as unknown as string)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidName
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidName', () => {
  it('returns true for a valid name', () => {
    expect(isValidName('Jane Smith')).toBe(true);
  });

  it('returns true for a 2-character name', () => {
    expect(isValidName('Jo')).toBe(true);
  });

  it('returns false for a 1-character name', () => {
    expect(isValidName('J')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(isValidName('   ')).toBe(false);
  });

  it('returns false for name exceeding 100 characters', () => {
    expect(isValidName('a'.repeat(101))).toBe(false);
  });

  it('returns true for name of exactly 100 characters', () => {
    expect(isValidName('a'.repeat(100))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidPriority
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidPriority', () => {
  it('returns true for LOW', () => {
    expect(isValidPriority('LOW')).toBe(true);
  });

  it('returns true for MEDIUM', () => {
    expect(isValidPriority('MEDIUM')).toBe(true);
  });

  it('returns true for HIGH', () => {
    expect(isValidPriority('HIGH')).toBe(true);
  });

  it('returns false for lowercase value', () => {
    expect(isValidPriority('low')).toBe(false);
  });

  it('returns false for an invalid value', () => {
    expect(isValidPriority('CRITICAL')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPriority('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidStatus', () => {
  it('returns true for TODO', () => {
    expect(isValidStatus('TODO')).toBe(true);
  });

  it('returns true for IN_PROGRESS', () => {
    expect(isValidStatus('IN_PROGRESS')).toBe(true);
  });

  it('returns true for DONE', () => {
    expect(isValidStatus('DONE')).toBe(true);
  });

  it('returns false for invalid status', () => {
    expect(isValidStatus('PENDING')).toBe(false);
  });

  it('returns false for lowercase', () => {
    expect(isValidStatus('done')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidDate
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidDate', () => {
  it('returns true for ISO date string', () => {
    expect(isValidDate('2026-04-23')).toBe(true);
  });

  it('returns true for ISO datetime string', () => {
    expect(isValidDate('2026-04-23T10:00:00.000Z')).toBe(true);
  });

  it('returns false for invalid date string', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidDate('')).toBe(false);
  });

  it('returns false for numbers as string', () => {
    expect(isValidDate('99999999')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isNonEmptyString
// ─────────────────────────────────────────────────────────────────────────────
describe('isNonEmptyString', () => {
  it('returns true for a normal string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns false when string exceeds maxLength', () => {
    expect(isNonEmptyString('a'.repeat(256))).toBe(false);
  });

  it('returns true when exactly at maxLength', () => {
    expect(isNonEmptyString('a'.repeat(255))).toBe(true);
  });

  it('respects custom maxLength', () => {
    expect(isNonEmptyString('hello world', 5)).toBe(false);
    expect(isNonEmptyString('hello', 5)).toBe(true);
  });

  it('returns false for non-string input', () => {
    expect(isNonEmptyString(null as unknown as string)).toBe(false);
  });
});
