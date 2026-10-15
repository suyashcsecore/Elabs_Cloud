const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/db');

jest.setTimeout(45000);

describe('Event Management & Discovery Tests (Step 3)', () => {
  let organizer1Cookie;
  let organizer2Cookie;
  let adminCookie;
  let studentCookie;

  let createdEventId;

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
  });

  afterAll(async () => {
    // Clean up any events created during tests
    if (createdEventId) {
      await query('DELETE FROM events WHERE id = $1', [createdEventId]);
    }
    await pool.end();
  });

  // 1. PUBLIC DISCOVERY TESTS
  describe('GET /api/events (Public Discovery)', () => {
    it('should list only PUBLISHED events and include computed remaining_seats', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.events)).toBe(true);
      expect(res.body.data.events.length).toBeGreaterThan(0);

      // Verify all returned events are PUBLISHED
      res.body.data.events.forEach((ev) => {
        expect(ev.status).toBe('PUBLISHED');
        expect(typeof ev.remaining_seats).toBe('number');
        expect(typeof ev.registered_count).toBe('number');
      });
    });

    it('should support search by title', async () => {
      const res = await request(app).get('/api/events?search=Microservices');

      expect(res.status).toBe(200);
      expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.events[0].title).toContain('Microservices');
    });

    it('should support filtering by category', async () => {
      const res = await request(app).get('/api/events?category=Hackathon');

      expect(res.status).toBe(200);
      res.body.data.events.forEach((ev) => {
        expect(ev.category).toBe('Hackathon');
      });
    });
  });

  // 2. VALIDATION FAILURES ON EVENT CREATION
  describe('POST /api/events Validation Failures', () => {
    it('should reject event creation if start_at is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const futureEnd = new Date(Date.now() + 86400000).toISOString();
      const deadline = new Date(Date.now() - 90000000).toISOString();

      const res = await request(app)
        .post('/api/events')
        .set('Cookie', organizer1Cookie)
        .send({
          title: 'Past Event Test',
          description: 'This is an event in the past that must be rejected.',
          category: 'Workshop',
          startAt: pastDate,
          endAt: futureEnd,
          location: 'Lab 1',
          capacity: 20,
          registrationDeadline: deadline,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Event start time cannot be in the past');
    });

    it('should reject event creation if end_at is before start_at', async () => {
      const start = new Date(Date.now() + 10 * 86400000).toISOString();
      const end = new Date(Date.now() + 5 * 86400000).toISOString(); // end is earlier than start
      const deadline = new Date(Date.now() + 2 * 86400000).toISOString();

      const res = await request(app)
        .post('/api/events')
        .set('Cookie', organizer1Cookie)
        .send({
          title: 'Invalid End Date Event',
          description: 'Valid description with sufficient length for testing.',
          category: 'Workshop',
          startAt: start,
          endAt: end,
          location: 'Campus 6',
          capacity: 50,
          registrationDeadline: deadline,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Event start time must precede end time');
    });

    it('should reject event creation if registration deadline is after start_at', async () => {
      const start = new Date(Date.now() + 5 * 86400000).toISOString();
      const end = new Date(Date.now() + 6 * 86400000).toISOString();
      const deadline = new Date(Date.now() + 7 * 86400000).toISOString(); // deadline is after start

      const res = await request(app)
        .post('/api/events')
        .set('Cookie', organizer1Cookie)
        .send({
          title: 'Invalid Deadline Event',
          description: 'Valid description with sufficient length for testing.',
          category: 'Workshop',
          startAt: start,
          endAt: end,
          location: 'Campus 6',
          capacity: 50,
          registrationDeadline: deadline,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Registration deadline must be before the event start time');
    });

    it('should reject non-positive capacity (e.g. 0 or negative)', async () => {
      const start = new Date(Date.now() + 5 * 86400000).toISOString();
      const end = new Date(Date.now() + 6 * 86400000).toISOString();
      const deadline = new Date(Date.now() + 4 * 86400000).toISOString();

      const res = await request(app)
        .post('/api/events')
        .set('Cookie', organizer1Cookie)
        .send({
          title: 'Zero Capacity Event',
          description: 'Valid description with sufficient length for testing.',
          category: 'Workshop',
          startAt: start,
          endAt: end,
          location: 'Campus 6',
          capacity: 0,
          registrationDeadline: deadline,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Capacity must be a positive integer');
    });
  });

  // 3. SUCCESSFUL CREATION & LIFECYCLE
  describe('Event Creation & Publishing Lifecycle', () => {
    it('should create an event as DRAFT for an authorized organizer', async () => {
      const start = new Date(Date.now() + 8 * 86400000).toISOString();
      const end = new Date(Date.now() + 8 * 86400000 + 7200000).toISOString();
      const deadline = new Date(Date.now() + 6 * 86400000).toISOString();

      const res = await request(app)
        .post('/api/events')
        .set('Cookie', organizer1Cookie)
        .send({
          title: 'Real-time Distributed Event Streaming',
          description: 'Deep dive into Apache Kafka, event-driven architectures, and stream processing.',
          category: 'Workshop',
          startAt: start,
          endAt: end,
          location: 'Auditorium 1',
          capacity: 45,
          registrationDeadline: deadline,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.event.status).toBe('DRAFT'); // MUST BE DRAFT
      createdEventId = res.body.data.event.id;
    });

    it('should list own events on GET /api/organizer/events', async () => {
      const res = await request(app)
        .get('/api/organizer/events')
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.events.some((ev) => ev.id === createdEventId)).toBe(true);
    });

    it('should publish the draft event using POST /api/events/:id/publish', async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/publish`)
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.event.status).toBe('PUBLISHED');
    });
  });

  // 4. OWNERSHIP VIOLATIONS
  describe('Ownership & RBAC Violations', () => {
    it('should block Organizer 2 from updating Organizer 1 event (403 FORBIDDEN_EVENT_EDIT)', async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Cookie', organizer2Cookie) // NOT THE OWNER
        .send({
          title: 'Organizer 2 Hijack Attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_EVENT_EDIT');
    });

    it('should block Organizer 2 from cancelling Organizer 1 event (403 FORBIDDEN_EVENT_CANCEL)', async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/cancel`)
        .set('Cookie', organizer2Cookie); // NOT THE OWNER

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_EVENT_CANCEL');
    });

    it('should allow Admin to update Organizer 1 event (Admin override)', async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Cookie', adminCookie) // ADMIN OVERRIDE
        .send({
          title: 'Admin Edited Event Title',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe('Admin Edited Event Title');
    });

    it('should cancel the event when owner requests POST /api/events/:id/cancel', async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/cancel`)
        .set('Cookie', organizer1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.event.status).toBe('CANCELLED');
    });
  });
});
