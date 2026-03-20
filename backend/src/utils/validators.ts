// src/utils/validators.ts
// Pure validation functions – used by controllers and unit tests

// ─── Email ────────────────────────────────────────────────────────────────────

/**
 * Returns true if the value is a syntactically valid email address.
 * Covers the vast majority of real email formats.
 */
export function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

// ─── Password ─────────────────────────────────────────────────────────────────

/**
 * Password must be at least 8 characters and contain:
 * - one uppercase letter
 * - one lowercase letter
 * - one digit
 */
export function isValidPassword(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length < 8) return false;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  return hasUpper && hasLower && hasDigit;
}

// ─── Name ─────────────────────────────────────────────────────────────────────

/**
 * Name must be a non-empty string of 2–100 characters.
 */
export function isValidName(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

// ─── Task / Project fields ────────────────────────────────────────────────────

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = (typeof VALID_PRIORITIES)[number];

/**
 * Returns true if the value is one of the allowed Priority enum values.
 */
export function isValidPriority(value: string): value is Priority {
  return VALID_PRIORITIES.includes(value as Priority);
}

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof VALID_STATUSES)[number];

/**
 * Returns true if the value is one of the allowed TaskStatus enum values.
 */
export function isValidStatus(value: string): value is TaskStatus {
  return VALID_STATUSES.includes(value as TaskStatus);
}

/**
 * Returns true if the value is a valid ISO 8601 date string.
 */
export function isValidDate(value: string): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Returns true if the string is non-empty after trimming and within max length.
 */
export function isNonEmptyString(value: string, maxLength = 255): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}
