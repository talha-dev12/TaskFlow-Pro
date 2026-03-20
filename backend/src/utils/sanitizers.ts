// src/utils/sanitizers.ts
// Input sanitization – guards against XSS and injection attacks (OWASP A03)
// Uses the `xss` library for HTML entity encoding

import xss from 'xss';

/**
 * Strip dangerous HTML from a string value.
 * Uses the xss library with strict options (no allowed tags).
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return '';
  return xss(value.trim(), {
    whiteList: {},       // Allow NO HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

/**
 * Sanitize an entire object's string values recursively.
 * Useful for sanitizing request bodies in one call.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Sanitize an email – lowercase and strip HTML.
 */
export function sanitizeEmail(value: string): string {
  return sanitizeString(value).toLowerCase();
}
