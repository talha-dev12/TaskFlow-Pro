// backend/tests/integration.auth.test.ts
// Integration tests for authentication endpoints
// Tests the full request → middleware → controller → DB → response cycle
// Uses supertest to make real HTTP requests against the Express app (70%+)

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

// ─── Test data ────────────────────────────────────────────────────────────────
const TEST_USER = {
  name:     'Integration User',
  email:    'integration@test.com',
  password: 'TestPass1',
};

// ─── Setup & teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Clean up any leftover test data
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
});

afterAll(async () => {
  // Always clean up after tests
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('returns 201 and a JWT token for valid registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.split('.')).toHaveLength(3);
  });

  it('returns user object without the password field', async () => {
    // The user was created above; re-register with different email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...TEST_USER, email: 'nopwd@test.com' })
      .expect(201);

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.email).toBe('nopwd@test.com');

    // Clean up
    await prisma.user.deleteMany({ where: { email: 'nopwd@test.com' } });
  });

  it('returns 409 when email is already registered', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Email', password: 'TestPass1' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@test.com', password: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e: string) => /password/i.test(e))).toBe(true);
  });

  it('returns 400 when name is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'short@test.com', password: 'TestPass1' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('stores password as bcrypt hash (not plaintext)', async () => {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe(TEST_USER.password);
    const isHashed = await bcrypt.compare(TEST_USER.password, user!.password);
    expect(isHashed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns 200 and a JWT token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
  });

  it('returns 401 for wrong password (generic message prevents enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPass1' })
      .expect(401);

    expect(res.body.success).toBe(false);
    // Must NOT reveal whether email exists (OWASP A07)
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 for non-existent email (same generic message)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'TestPass1' })
      .expect(401);

    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 400 when credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.data.token;
  });

  it('returns 200 with user profile for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 when no token is provided', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  it('returns 401 for a malformed token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token')
      .expect(401);
  });

  it('returns 401 for a tampered token', async () => {
    const tampered = token.slice(0, -5) + 'xxxxx';
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tampered}`)
      .expect(401);
  });
});
