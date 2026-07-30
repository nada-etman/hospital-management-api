const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');

describe('Auth API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/auth/register should create a user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: '123456',
        role: 'PATIENT',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('userId');
  });

  it('POST /api/v1/auth/register should fail with invalid role', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: '123456',
      role: 'NOT_A_ROLE',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should fail for a non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'doesnotexist@test.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(404);
  });
});
