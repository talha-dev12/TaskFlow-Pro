// e2e/auth.spec.ts
// End-to-end tests for authentication workflows (85%+ requirement)
// Covers: register, login, logout, route protection, validation

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, TEST_PASSWORD } from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Registration workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Registration workflow', () => {
  test('user can register and is redirected to dashboard', async ({ page }) => {
    const email = uniqueEmail('register');
    await registerUser(page, 'E2E Test User', email);

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    // Should show the user's name in navbar
    await expect(page.getByText('E2E Test User')).toBeVisible();
  });

  test('registration page shows validation errors for empty form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should stay on register
    await expect(page).toHaveURL('/register');
    // At least one validation error should appear
    const alerts = page.getByRole('alert');
    await expect(alerts.first()).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Mismatch User');
    await page.getByLabel('Email address').fill(uniqueEmail('mismatch'));
    await page.getByLabel('Password', { exact: true }).fill('TestPass1');
    await page.getByLabel('Confirm password').fill('DifferentPass1');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test('shows password strength indicator as user types', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await expect(page.getByText(/strength/i)).toBeVisible();
  });

  test('shows error for duplicate email', async ({ page }) => {
    const email = uniqueEmail('dup');
    // First registration
    await registerUser(page, 'First User', email);
    // Logout
    await page.getByRole('button', { name: /log out/i }).click();
    // Try to register again with same email
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Second User');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Login workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login workflow', () => {
  let testEmail: string;

  test.beforeAll(async ({ browser }) => {
    // Register a user to log in with
    testEmail = uniqueEmail('login');
    const page = await browser.newPage();
    await registerUser(page, 'Login Test User', testEmail);
    await page.close();
  });

  test('user can log in with correct credentials', async ({ page }) => {
    await loginUser(page, testEmail);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Login Test User')).toBeVisible();
  });

  test('login page shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(testEmail);
    await page.getByLabel('Password').fill('WrongPassword1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('login page shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();

    const alerts = page.getByRole('alert');
    await expect(alerts.first()).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /create one free/i }).click();
    await expect(page).toHaveURL('/register');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Logout workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Logout workflow', () => {
  test('user can log out and is redirected to login', async ({ page }) => {
    const email = uniqueEmail('logout');
    await registerUser(page, 'Logout User', email);

    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('after logout, accessing dashboard redirects to login', async ({ page }) => {
    const email = uniqueEmail('after-logout');
    await registerUser(page, 'After Logout', email);
    await page.getByRole('button', { name: /log out/i }).click();

    // Try to navigate directly
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Route protection
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Route protection', () => {
  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user is redirected from /projects/1 to /login', async ({ page }) => {
    await page.goto('/projects/1');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user on / is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility basics
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('login page has a skip to main content link', async ({ page }) => {
    // The app.tsx skip link is present in the DOM
    await page.goto('/login');
    // Tab once to reveal it
    await page.keyboard.press('Tab');
    const skipLink = page.getByText(/skip to main content/i);
    await expect(skipLink).toBeVisible();
  });

  test('login page title is present', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/taskflow pro/i);
  });
});
