const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/db');
const { generateToken } = require('../src/services/authService');

// Increase Jest timeout for heavy concurrent load test over cloud DB
jest.setTimeout(90000);

describe('Concurrency & Race Condition Engine Tests (Step 4)', () => {
  let organizerId = 'b0000000-0000-0000-0000-000000000001';
  let testEventId;
  let testDoubleEventId;
  const testStudentIds = [];

  beforeAll(async () => {
    // 1. Create 50 dedicated test student users in the database
    for (let i = 1; i <= 50; i++) {
      const email = `concurrent_student_${Date.now()}_${i}@elabs.edu`;
      const res = await query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ($1, $2, 'dummy_hash', 'STUDENT', 'ACTIVE')
         RETURNING id, email, role`,
        [`Student ${i}`, email]
      );
      testStudentIds.push(res.rows[0]);
    }

    // 2. Create an event with CAPACITY = 5
    const futureStart = new Date(Date.now() + 7 * 86400000).toISOString();
    const futureEnd = new Date(Date.now() + 7 * 86400000 + 7200000).toISOString();
    const deadline = new Date(Date.now() + 5 * 86400000).toISOString();

    const eventRes = await query(
      `INSERT INTO events (title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id)
       VALUES ($1, $2, 'Workshop', $3, $4, 'Lab 1', 5, $5, 'PUBLISHED', $6)
       RETURNING id`,
      ['Concurrency Stress Test Event', 'Testing atomic seat contention', futureStart, futureEnd, deadline, organizerId]
    );
    testEventId = eventRes.rows[0].id;

    // 3. Create another event with CAPACITY = 1 for double-click test
    const doubleEventRes = await query(
      `INSERT INTO events (title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id)
       VALUES ($1, $2, 'Workshop', $3, $4, 'Lab 2', 1, $5, 'PUBLISHED', $6)
       RETURNING id`,
      ['Double Click Test Event', 'Testing rapid double-click submissions', futureStart, futureEnd, deadline, organizerId]
    );
    testDoubleEventId = doubleEventRes.rows[0].id;
  });

  afterAll(async () => {
    // Clean up created registrations, events, and test users
    if (testEventId) {
      await query('DELETE FROM registrations WHERE event_id = $1', [testEventId]);
      await query('DELETE FROM events WHERE id = $1', [testEventId]);
    }
    if (testDoubleEventId) {
      await query('DELETE FROM registrations WHERE event_id = $1', [testDoubleEventId]);
      await query('DELETE FROM events WHERE id = $1', [testDoubleEventId]);
    }
    if (testStudentIds.length > 0) {
      const ids = testStudentIds.map((s) => `'${s.id}'`).join(',');
      await query(`DELETE FROM users WHERE id IN (${ids})`);
    }
    await pool.end();
  });

  // TEST CASE 1: 50 SIMULTANEOUS STUDENTS COMPETING FOR 5 SEATS
  it('should accept exactly 5 registrations and reject 45 with EVENT_FULL under 50 simultaneous requests', async () => {
    // Generate auth tokens for all 50 students
    const requests = testStudentIds.map((student) => {
      const token = generateToken(student);
      return request(app)
        .post(`/api/events/${testEventId}/registrations`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    });

    // Fire all 50 requests simultaneously via Promise.all
    const responses = await Promise.all(requests);

    // Count 201 Created vs 409 EVENT_FULL
    const successes = responses.filter((r) => r.status === 201);
    const fullRejections = responses.filter((r) => r.status === 409 && r.body.error?.code === 'EVENT_FULL');

    expect(successes.length).toBe(5);
    expect(fullRejections.length).toBe(45);

    // Verify database row count: Exactly 5 ACTIVE registrations in DB
    const dbRes = await query(
      `SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = 'ACTIVE'`,
      [testEventId]
    );
    expect(parseInt(dbRes.rows[0].count, 10)).toBe(5);
  });

  // TEST CASE 2: DOUBLE-CLICK RACE CONDITION (SAME STUDENT FIRES 10 PARALLEL REQUESTS)
  it('should allow only 1 registration and reject 9 duplicates when the SAME student double-clicks 10 times in parallel', async () => {
    const student = testStudentIds[0];
    const token = generateToken(student);

    // Fire 10 simultaneous requests from the exact same student
    const parallelCalls = Array.from({ length: 10 }).map(() =>
      request(app)
        .post(`/api/events/${testDoubleEventId}/registrations`)
        .set('Authorization', `Bearer ${token}`)
        .send()
    );

    const responses = await Promise.all(parallelCalls);

    const successCount = responses.filter((r) => r.status === 201).length;
    const rejectedCount = responses.filter((r) => r.status === 409).length;

    expect(successCount).toBe(1);
    expect(rejectedCount).toBe(9);

    // Verify DB count: Exactly 1 row for this student
    const checkDb = await query(
      `SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND student_id = $2 AND status = 'ACTIVE'`,
      [testDoubleEventId, student.id]
    );
    expect(parseInt(checkDb.rows[0].count, 10)).toBe(1);
  });
});
