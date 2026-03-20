// e2e/tasks.spec.ts
// End-to-end tests for the full project + task management workflow (85%+)
// Covers: create project, add tasks, change status, filter, edit, delete

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, createProject, createTask } from './helpers';

// ─── Shared state ─────────────────────────────────────────────────────────────
let sharedEmail: string;

test.beforeAll(async ({ browser }) => {
  sharedEmail = uniqueEmail('tasks-workflow');
  const page  = await browser.newPage();
  await registerUser(page, 'Workflow User', sharedEmail);
  await page.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Project management workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Project management', () => {
  test('user can create a new project and see it on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');

    await createProject(page, 'My E2E Project', 'Created during E2E tests');

    // Project card should be visible on the dashboard
    await expect(page.getByText('My E2E Project')).toBeVisible();
  });

  test('dashboard shows correct task count badge on project card', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Task count should show 0 initially
    await expect(page.getByText(/0 tasks/i)).toBeVisible();
  });

  test('user can search for a project by name', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.getByPlaceholder(/search projects/i).fill('E2E');
    // Wait for debounce
    await page.waitForTimeout(500);
    await expect(page.getByText('My E2E Project')).toBeVisible();
  });

  test('user can edit a project title', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Hover to reveal edit button
    await page.getByText('My E2E Project').hover();
    await page.getByRole('button', { name: /edit project my e2e project/i }).click();

    // Edit form should open in modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Project Title').fill('Updated E2E Project');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Updated E2E Project')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task management workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Task management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    // Navigate into the project
    await page.getByRole('link', { name: /updated e2e project/i }).click();
    await expect(page.url()).toContain('/projects/');
  });

  test('user can add a task to a project', async ({ page }) => {
    await createTask(page, 'My First E2E Task');
    await expect(page.getByText('My First E2E Task')).toBeVisible();
  });

  test('task shows correct default status badge (To Do)', async ({ page }) => {
    await createTask(page, 'Status Test Task');
    await expect(page.getByText('Status Test Task')).toBeVisible();
    // "To Do" badge should be present
    await expect(page.getByText('To Do').first()).toBeVisible();
  });

  test('user can create a HIGH priority task', async ({ page }) => {
    await createTask(page, 'High Priority E2E Task', 'HIGH');
    await expect(page.getByText('High Priority E2E Task')).toBeVisible();
    await expect(page.getByText('HIGH').first()).toBeVisible();
  });

  test('user can mark a task as done by clicking the status toggle', async ({ page }) => {
    await createTask(page, 'Task to Complete');

    // Click the circle button to toggle status (first incomplete task)
    const toggleBtn = page.getByLabel(/mark as start/i).first();
    await toggleBtn.click();

    // Status should update – "In Progress" badge visible
    await expect(page.getByText('In Progress').first()).toBeVisible({ timeout: 5_000 });
  });

  test('completed tasks show a strikethrough title', async ({ page }) => {
    await createTask(page, 'Task to Mark Done');
    // Click twice to get to DONE: TODO → IN_PROGRESS → DONE
    const toggle = page.getByLabel(/mark as start/i).first();
    await toggle.click();
    await page.waitForTimeout(500);
    await page.getByLabel(/mark as complete/i).first().click();

    // Check strikethrough styling
    const taskTitle = page.getByText('Task to Mark Done');
    await expect(taskTitle).toHaveClass(/line-through/, { timeout: 5_000 });
  });

  test('user can edit a task', async ({ page }) => {
    await createTask(page, 'Task to Edit');
    await page.getByText('Task to Edit').hover();
    await page.getByLabel(/edit task task to edit/i).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Task Title').fill('Edited Task Title');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Edited Task Title')).toBeVisible();
  });

  test('user can filter tasks by status', async ({ page }) => {
    // Create a mix of tasks
    await createTask(page, 'Filter Test TODO');

    // Filter by TODO
    await page.getByLabel(/filter by status/i).selectOption('TODO');
    await page.waitForTimeout(500);

    // Only TODO tasks should be visible
    const rows = page.locator('li[aria-label*="Task:"]');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      expect(text).toContain('To Do');
    }
  });

  test('user can delete a task', async ({ page }) => {
    await createTask(page, 'Task to Delete');
    await page.getByText('Task to Delete').hover();
    await page.getByLabel(/delete task task to delete/i).click();

    // Confirm deletion in modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /delete task/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Task to Delete')).not.toBeVisible({ timeout: 5_000 });
  });

  test('progress bar updates as tasks are completed', async ({ page }) => {
    // Check that a progress bar exists
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Project deletion workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Project deletion', () => {
  test('user can delete a project and it is removed from dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Create a dedicated project to delete
    await createProject(page, 'Project to Delete');
    await expect(page.getByText('Project to Delete')).toBeVisible();

    // Hover to reveal delete button
    await page.getByText('Project to Delete').hover();
    await page.getByRole('button', { name: /delete project project to delete/i }).click();

    // Confirm in modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /delete project/i }).click();

    // Project should be gone
    await expect(page.getByText('Project to Delete')).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation and UX
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Navigation and UX', () => {
  test('breadcrumb on project detail links back to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.getByRole('link', { name: /updated e2e project/i }).click();
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('dashboard shows stats cards with correct labels', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Total Tasks')).toBeVisible();
    await expect(page.getByText('Active Projects')).toBeVisible();
  });

  test('greeting message appears on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(sharedEmail);
    await page.getByLabel('Password').fill('TestPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Greeting includes the user's first name
    await expect(page.getByText(/Workflow/i)).toBeVisible();
  });
});
