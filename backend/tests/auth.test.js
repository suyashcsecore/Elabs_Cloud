const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/db');

// Increase default test timeout to accommodate bcrypt 12 rounds over remote cloud SSL connection
jest.setTimeout(25000);

describe('Authentication & Role-Based Access Control (RBAC) Tests', () => {
  const uniqueSuffix = Date.now();
  const testStudentEmail = `teststudent_${uniqueSuffix}@elabs.edu`;
  const testStudentPassword = 'Password123!';

  // Clean up test user after suite completes
  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email = $1', [testStudentEmail]);
    } catch (e) {
      // ignore
    }
    await pool.end();
  });

  // 1. REGISTER TEST
  describe('POST /api/auth/register', () => {
    it('should register a new user and ALWAYS assign STUDENT role (ignoring any client-sent role)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: testStudentEmail,
          password: testStudentPassword,
          role: 'ADMIN', // CLIENT ATTEMPTS TO ESCALATE ROLE - MUST BE IGNORED
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudentEmail);
      expect(res.body.data.user.role).toBe('STUDENT'); // STRICTLY ENFORCED STUDENT ROLE

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('elabs_auth_token'))).toBe(true);
      expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
    });

    it('should reject registration if email is already taken', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: testStudentEmail,
          password: testStudentPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  // 2. LOGIN & WRONG PASSWORD TESTS
  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials and set HttpOnly SameSite cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: testStudentPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testStudentEmail);
      expect(res.body.data.token).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('elabs_auth_token'))).toBe(true);
      expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
    });

    it('should return a generic 401 error on wrong password without leaking account existence', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('should return the exact same generic 401 error on non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'completely_unknown_user@elabs.edu',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  // 3. GET /api/auth/me TEST
  describe('GET /api/auth/me', () => {
    it('should return profile when authenticated with cookie', async () => {
      // 1. Log in to get auth cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: testStudentPassword,
        });

      const authCookie = loginRes.headers['set-cookie'];

      // 2. Fetch /api/auth/me with cookie
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(testStudentEmail);
      expect(meRes.body.data.user.role).toBe('STUDENT');
    });

    it('should return 401 NOT_AUTHENTICATED when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('NOT_AUTHENTICATED');
    });
  });

  // 4. RBAC ROUTE BLOCKING TESTS
  describe('Admin RBAC Route Protection', () => {
    it('should block STUDENT from accessing admin user list (403 FORBIDDEN_ROLE)', async () => {
      // Login as student
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'aarav.sharma@elabs.edu',
          password: 'Password123!',
        });

      const studentCookie = studentLogin.headers['set-cookie'];

      // Attempt to access admin-only endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should block ORGANIZER from accessing admin user list (403 FORBIDDEN_ROLE)', async () => {
      // Login as organizer
      const organizerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah.organizer@elabs.edu',
          password: 'Password123!',
        });

      const organizerCookie = organizerLogin.headers['set-cookie'];

      // Attempt to access admin-only endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', organizerCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('should allow ADMIN to access admin user list', async () => {
      // Login as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@elabs.edu',
          password: 'Password123!',
        });

      const adminCookie = adminLogin.headers['set-cookie'];

      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('should prevent ADMIN from demoting themselves (CANNOT_DEMOTE_SELF)', async () => {
      // Login as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@elabs.edu',
          password: 'Password123!',
        });

      const adminCookie = adminLogin.headers['set-cookie'];
      const adminId = adminLogin.body.data.user.id;

      // Attempt to demote self to student
      const res = await request(app)
        .patch(`/api/admin/users/${adminId}/role`)
        .set('Cookie', adminCookie)
        .send({ role: 'STUDENT' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DEMOTE_SELF');
    });
  });
});
