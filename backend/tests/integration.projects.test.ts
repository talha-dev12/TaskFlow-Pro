// backend/tests/integration.projects.test.ts
// Integration tests for project CRUD endpoints
// Verifies auth protection, ownership checks, validation, and DB operations

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// ─── Test fixtures ────────────────────────────────────────────────────────────
const USER_A = { name: 'User Alpha', email: 'alpha@projects.test', password: 'TestPass1' };
const USER_B = { name: 'User Beta',  email: 'beta@projects.test',  password: 'TestPass1' };

let tokenA:     string;
let tokenB:     string;
let userAId:    number;
let projectId:  number;

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Clean slate
  await prisma.project.deleteMany({ where: { owner: { email: { in: [USER_A.email, USER_B.email] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [USER_A.email, USER_B.email] } } });

  // Register User A
  const resA = await request(app).post('/api/auth/register').send(USER_A);
  tokenA  = resA.body.data.token;
  userAId = resA.body.data.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send(USER_B);
  tokenB = resB.body.data.token;
});

afterAll(async () => {
  await prisma.project.deleteMany({ where: { owner: { email: { in: [USER_A.email, USER_B.email] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [USER_A.email, USER_B.email] } } });
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/projects', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(app)
      .post('/api/projects')
      .send({ title: 'Ghost Project' })
      .expect(401);
  });

  it('returns 201 and creates a project for authenticated user', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Alpha Project', description: 'Test project for User A' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.project.title).toBe('Alpha Project');
    expect(res.body.data.project.ownerId).toBe(userAId);

    projectId = res.body.data.project.id; // save for later tests
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'No title here' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when title is an empty string', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '' })
      .expect(400);
  });

  it('sanitizes XSS in title', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '<script>alert("xss")</script>Safe Title' })
      .expect(201);

    expect(res.body.data.project.title).not.toContain('<script>');
    expect(res.body.data.project.title).toContain('Safe Title');

    // Clean up
    await prisma.project.delete({ where: { id: res.body.data.project.id } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/projects', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(app).get('/api/projects').expect(401);
  });

  it('returns only projects owned by the authenticated user', async () => {
    // Create a project for User B
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Beta Project' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const titles = res.body.data.projects.map((p: { title: string }) => p.title);
    expect(titles).toContain('Alpha Project');
    expect(titles).not.toContain('Beta Project');
  });

  it('returns projects with _count.tasks field', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.data.projects[0]._count).toBeDefined();
    expect(typeof res.body.data.projects[0]._count.tasks).toBe('number');
  });

  it('filters projects by search query', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Searchable Unique Project XYZ' });

    const res = await request(app)
      .get('/api/projects?search=Searchable')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.data.projects.some((p: { title: string }) =>
      p.title.includes('Searchable')
    )).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/projects/:id', () => {
  it('returns 200 with project and tasks for the owner', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.project.id).toBe(projectId);
    expect(Array.isArray(res.body.data.project.tasks)).toBe(true);
  });

  it('returns 403 when User B tries to access User A\'s project', async () => {
    await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('returns 404 for a non-existent project ID', async () => {
    await request(app)
      .get('/api/projects/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it('returns 400 for an invalid (non-numeric) project ID', async () => {
    await request(app)
      .get('/api/projects/abc')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/projects/:id', () => {
  it('returns 200 and updates the project for the owner', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated Alpha Project', description: 'Updated desc' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.project.title).toBe('Updated Alpha Project');
  });

  it('returns 403 when User B tries to update User A\'s project', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked' })
      .expect(403);
  });

  it('returns 404 for a non-existent project', async () => {
    await request(app)
      .put('/api/projects/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Ghost' })
      .expect(404);
  });

  it('returns 400 when title is set to empty string', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '' })
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/projects/:id', () => {
  it('returns 403 when User B tries to delete User A\'s project', async () => {
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('returns 200 and deletes the project for the owner', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 after the project has been deleted', async () => {
    await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .expect(401);
  });
});
