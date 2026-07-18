const request = require('supertest');
const app = require('../src/app');

// Mock the DB pool so tests don't need a real database
jest.mock('../src/db/index', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Health Check', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth Routes', () => {
  it('POST /api/auth/register should return 400 if body is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('POST /api/auth/login should return 400 if body is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('POST /api/auth/register with invalid email should fail', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', password: '123', display_name: 'Test', role: 'developer' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe('Protected Routes', () => {
  it('GET /api/projects should return 401 without token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(401);
  });
});
