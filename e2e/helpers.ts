// e2e/helpers.ts
// Shared helpers for E2E tests – registration, login, unique test data

import { Page, expect } from '@playwright/test';

// Generate unique email per test run to avoid conflicts
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}+${Date.now()}@playwright.test`;
}

export const TEST_PASSWORD = 'TestPass1';

/**
 * Register a new user via the UI and land on the dashboard.
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password = TEST_PASSWORD
): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
}

/**
 * Login via the UI and land on the dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password = TEST_PASSWORD
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
}

/**
 * Create a project via the dashboard UI modal.
 * Assumes the user is already on /dashboard.
 */
export async function createProject(
  page: Page,
  title: string,
  description = ''
): Promise<void> {
  await page.getByRole('button', { name: /new project/i }).click();
  await page.getByLabel('Project Title').fill(title);
  if (description) await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: /create project/i }).click();
  // Wait for modal to close
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Create a task via the project detail UI modal.
 * Assumes the user is already on /projects/:id.
 */
export async function createTask(
  page: Page,
  title: string,
  priority = 'MEDIUM'
): Promise<void> {
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByLabel('Task Title').fill(title);
  if (priority !== 'MEDIUM') {
    await page.getByLabel('Priority').selectOption(priority);
  }
  await page.getByRole('button', { name: /create task/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
}
