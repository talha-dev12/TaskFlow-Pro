// backend/tests/integration.tasks.test.ts
// Integration tests for task CRUD endpoints
// Covers creation, filtering, status updates, ownership, and cascade deletion

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const OWNER    = { name: 'Task Owner',  email: 'taskowner@test.com',  password: 'TestPass1' };
const INTRUDER = { name: 'Intruder',    email: 'intruder@test.com',   password: 'TestPass1' };

let ownerToken:    string;
let intruderToken: string;
let projectId:     number;
let taskId:        number;

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Clean up
  await prisma.user.deleteMany({ where: { email: { in: [OWNER.email, INTRUDER.email] } } });

  // Register both users
  const resOwner    = await request(app).post('/api/auth/register').send(OWNER);
  const resIntruder = await request(app).post('/api/auth/register').send(INTRUDER);
  ownerToken    = resOwner.body.data.token;
  intruderToken = resIntruder.body.data.token;

  // Create a project for the owner
  const resProject = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Task Test Project' });
  projectId = resProject.body.data.project.id;
});

afterAll(async () => {
  await prisma.project.deleteMany({ where: { owner: { email: OWNER.email } } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER.email, INTRUDER.email] } } });
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/tasks
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/projects/:projectId/tasks', () => {
  it('returns 201 and creates a task with default values', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'First Task' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.task.title).toBe('First Task');
    expect(res.body.data.task.priority).toBe('MEDIUM');
    expect(res.body.data.task.status).toBe('TODO');
    expect(res.body.data.task.projectId).toBe(projectId);

    taskId = res.body.data.task.id;
  });

  it('creates a task with explicit priority and status', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'High Priority Task', priority: 'HIGH', status: 'IN_PROGRESS' })
      .expect(201);

    expect(res.body.data.task.priority).toBe('HIGH');
    expect(res.body.data.task.status).toBe('IN_PROGRESS');
  });

  it('creates a task with a due date', async () => {
    const dueDate = '2026-12-31T23:59:59.000Z';
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Deadline Task', dueDate })
      .expect(201);

    expect(res.body.data.task.dueDate).toBeDefined();
  });

  it('returns 403 when intruder tries to add task to owner\'s project', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ title: 'Intruder Task' })
      .expect(403);
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Ghost Task' })
      .expect(401);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ priority: 'HIGH' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 for invalid priority value', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Bad Priority', priority: 'URGENT' })
      .expect(400);
  });

  it('returns 400 for invalid status value', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Bad Status', status: 'PENDING' })
      .expect(400);
  });

  it('returns 404 for a non-existent project', async () => {
    await request(app)
      .post('/api/projects/999999/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Ghost Task' })
      .expect(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/tasks
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/projects/:projectId/tasks', () => {
  it('returns 200 with all tasks for the project owner', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThan(0);
  });

  it('filters tasks by status=TODO', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=TODO`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    res.body.data.tasks.forEach((t: { status: string }) => {
      expect(t.status).toBe('TODO');
    });
  });

  it('filters tasks by priority=HIGH', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?priority=HIGH`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    res.body.data.tasks.forEach((t: { priority: string }) => {
      expect(t.priority).toBe('HIGH');
    });
  });

  it('returns 403 for intruder', async () => {
    await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:projectId/tasks/:taskId
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/projects/:projectId/tasks/:taskId', () => {
  it('returns 200 and updates task title', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Updated Task Title' })
      .expect(200);

    expect(res.body.data.task.title).toBe('Updated Task Title');
  });

  it('updates task status to DONE', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'DONE' })
      .expect(200);

    expect(res.body.data.task.status).toBe('DONE');
  });

  it('updates task priority', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ priority: 'HIGH' })
      .expect(200);

    expect(res.body.data.task.priority).toBe('HIGH');
  });

  it('returns 403 when intruder tries to update', async () => {
    await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ title: 'Hijacked' })
      .expect(403);
  });

  it('returns 404 for non-existent task', async () => {
    await request(app)
      .put(`/api/projects/${projectId}/tasks/999999`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Ghost' })
      .expect(404);
  });

  it('returns 400 for invalid status value', async () => {
    await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'INVALID' })
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/tasks/:taskId
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/projects/:projectId/tasks/:taskId', () => {
  it('returns 403 when intruder tries to delete', async () => {
    await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(403);
  });

  it('returns 200 and deletes the task', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 after the task has been deleted', async () => {
    await request(app)
      .get(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
