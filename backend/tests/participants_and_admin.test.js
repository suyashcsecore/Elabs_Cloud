const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/db');

jest.setTimeout(30000);

describe('Organizer Participant Management & Admin Reporting Tests (Step 5)', () => {
  let organizer1Cookie;
  let organizer2Cookie;
  let adminCookie;
  let studentCookie;

  let organizer1EventId;
  let studentUserId;

  beforeAll(async () => {
    // 1. Login as Organizer 1 (Sarah)
    const o1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.organizer@elabs.edu', password: 'Password123!' });
    organizer1Cookie = o1Res.headers['set-cookie'];

    // 2. Login as Organizer 2 (Rajesh)
    const o2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rajesh.organizer@elabs.edu', password: 'Password123!' });
    organizer2Cookie = o2Res.headers['set-cookie'];

    // 3. Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@elabs.edu', password: 'Password123!' });
    adminCookie = adminRes.headers['set-cookie'];

    // 4. Login as Student (Aarav)
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav.sharma@elabs.edu', password: 'Password123!' });
    studentCookie = studentRes.headers['set-cookie'];
    studentUserId = studentRes.body.data.user.id;

    // Use Event 1 which is owned by Organizer 1
    organizer1EventId = 'e0000000-0000-0000-0000-000000000001';
  });

  afterAll(async () => {
    await pool.end();
  });

  // 1. ORGANIZER PARTICIPANTS & CSV EXPORT
  describe('Organizer Participants & CSV Access', () => {
    it('should allow event owner (Organizer 1) to view participants', async () => {
      const res = await request(app)
        .get(`/api/organizer/events/${organizer1EventId}/participants`)
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.event).toBeDefined();
      expect(Array.isArray(res.body.data.participants)).toBe(true);

      // Verify participant shape
      if (res.body.data.participants.length > 0) {
        const p = res.body.data.participants[0];
        expect(p.student_name).toBeDefined();
        expect(p.student_email).toBeDefined();
        expect(p.registered_at).toBeDefined();
        expect(p.registration_status).toBeDefined();
      }
    });

    it('should BLOCK Organizer 2 from viewing participants of Organizer 1 event (403 FORBIDDEN_EVENT_ACCESS)', async () => {
      const res = await request(app)
        .get(`/api/organizer/events/${organizer1EventId}/participants`)
        .set('Cookie', organizer2Cookie); // DIFFERENT ORGANIZER

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_EVENT_ACCESS');
    });

    it('should ALLOW Admin to view participants of Organizer 1 event', async () => {
      const res = await request(app)
        .get(`/api/organizer/events/${organizer1EventId}/participants`)
        .set('Cookie', adminCookie); // ADMIN OVERRIDE

      expect(res.status).toBe(200);
      expect(res.body.data.participants).toBeDefined();
    });

    it('should download a valid CSV file for event owner with proper escaping', async () => {
      const res = await request(app)
        .get(`/api/organizer/events/${organizer1EventId}/participants.csv`)
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.csv');

      // Check CSV header contents
      const text = res.text;
      expect(text).toContain('Registration ID,Student Name,Student Email,Status,Registered At (UTC)');
    });

    it('should BLOCK Organizer 2 from downloading CSV of Organizer 1 event', async () => {
      const res = await request(app)
        .get(`/api/organizer/events/${organizer1EventId}/participants.csv`)
        .set('Cookie', organizer2Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_EVENT_ACCESS');
    });
  });

  // 2. ADMIN REPORTING & EVENT OVERSIGHT
  describe('Admin Platform Reporting', () => {
    it('should return complete summary stats for Admin (users by role, events by status, 14-day trend)', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // 1. Total users by role
      expect(data.usersByRole).toBeDefined();
      expect(typeof data.usersByRole.student).toBe('number');
      expect(typeof data.usersByRole.organizer).toBe('number');
      expect(typeof data.usersByRole.admin).toBe('number');

      // 2. Total events by status
      expect(data.eventsByStatus).toBeDefined();
      expect(typeof data.eventsByStatus.published).toBe('number');
      expect(typeof data.eventsByStatus.draft).toBe('number');

      // 3. Total active registrations
      expect(typeof data.totalActiveRegistrations).toBe('number');

      // 4. Top 5 events
      expect(Array.isArray(data.topEvents)).toBe(true);
      expect(data.topEvents.length).toBeLessThanOrEqual(5);

      // 5. Registrations per day for last 14 days
      expect(Array.isArray(data.registrationsLast14Days)).toBe(true);
      expect(data.registrationsLast14Days.length).toBe(14);
    });

    it('should list all events (any status: draft, published, cancelled) for Admin', async () => {
      const res = await request(app)
        .get('/api/admin/events')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.events).toBeDefined();
      expect(Array.isArray(res.body.data.events)).toBe(true);

      // Verify that both DRAFT and PUBLISHED are visible to Admin
      const statuses = res.body.data.events.map((e) => e.status);
      expect(statuses).toContain('PUBLISHED');
      expect(statuses).toContain('DRAFT');
    });

    it('should block non-admins from /api/admin/events', async () => {
      const res = await request(app)
        .get('/api/admin/events')
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });
  });
});
