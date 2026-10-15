const { getClient, query } = require('../db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register student for an event with strict concurrency protection
 * Requirements: FR-018 to FR-023, FR-027, NFR-002, NFR-003
 *
 * Registration logic inside ONE DB transaction:
 * 1. BEGIN
 * 2. SELECT the event row with FOR UPDATE (locks it)
 * 3. Reject if event not PUBLISHED, cancelled, or past registration_deadline
 * 4. Reject if student already has an ACTIVE registration for this event
 * 5. Count ACTIVE registrations; reject with 409 "EVENT_FULL" if count >= capacity
 * 6. INSERT registration
 * 7. COMMIT (ROLLBACK on any error)
 */
const registerForEvent = async (eventId, studentUser) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Lock the event row for update to eliminate concurrent race conditions
    const eventRes = await client.query(
      `SELECT id, title, capacity, registration_deadline, status
       FROM events 
       WHERE id = $1 
       FOR UPDATE`,
      [eventId]
    );

    if (eventRes.rowCount === 0) {
      throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    }

    const event = eventRes.rows[0];

    // 2. Reject if event not PUBLISHED or cancelled
    if (event.status !== 'PUBLISHED') {
      throw new AppError('Registration is not open for this event.', 400, 'EVENT_NOT_OPEN');
    }

    // 3. Reject if past registration_deadline
    const now = new Date();
    if (now > new Date(event.registration_deadline)) {
      throw new AppError('The registration deadline for this event has passed.', 400, 'REGISTRATION_DEADLINE_PASSED');
    }

    // 4. Reject if student already has an ACTIVE registration for this event
    const existingActiveRes = await client.query(
      `SELECT id FROM registrations 
       WHERE student_id = $1 AND event_id = $2 AND status = 'ACTIVE'`,
      [studentUser.id, eventId]
    );

    if (existingActiveRes.rowCount > 0) {
      throw new AppError('You are already actively registered for this event.', 409, 'DUPLICATE_REGISTRATION');
    }

    // 5. Count ACTIVE registrations; reject with 409 "EVENT_FULL" if count >= capacity
    const countRes = await client.query(
      `SELECT COUNT(*) FROM registrations 
       WHERE event_id = $1 AND status = 'ACTIVE'`,
      [eventId]
    );
    const activeCount = parseInt(countRes.rows[0].count, 10);

    if (activeCount >= event.capacity) {
      throw new AppError('This event has reached its registration limit.', 409, 'EVENT_FULL');
    }

    // 6. INSERT registration
    const insertRes = await client.query(
      `INSERT INTO registrations (student_id, event_id, status, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, student_id, event_id, status, created_at, updated_at`,
      [studentUser.id, eventId]
    );

    const registration = insertRes.rows[0];

    // 7. COMMIT
    await client.query('COMMIT');

    return {
      registration,
      event: {
        id: event.id,
        title: event.title,
        remainingSeats: event.capacity - (activeCount + 1),
      },
    };
  } catch (error) {
    // ROLLBACK on any error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancellation frees the seat immediately (set status CANCELLED, in a transaction).
 * Allows re-registering after cancelling if seats exist.
 */
const cancelRegistration = async (eventId, studentUser) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Fetch active registration for this student and event
    const regRes = await client.query(
      `SELECT r.id, r.status, e.registration_deadline, e.title
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.student_id = $1 AND r.event_id = $2 AND r.status = 'ACTIVE'
       FOR UPDATE`,
      [studentUser.id, eventId]
    );

    if (regRes.rowCount === 0) {
      throw new AppError('No active registration found for this event.', 404, 'REGISTRATION_NOT_FOUND');
    }

    const reg = regRes.rows[0];

    // 2. Mark status as CANCELLED and update updated_at timestamp
    const updateRes = await client.query(
      `UPDATE registrations 
       SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, student_id, event_id, status, created_at, updated_at`,
      [reg.id]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * List all registrations for the student with event info and status
 */
const getStudentRegistrations = async (studentId) => {
  const sql = `
    SELECT 
      r.id AS registration_id,
      r.status AS registration_status,
      r.created_at AS registered_at,
      r.updated_at AS updated_at,
      e.id AS event_id,
      e.title,
      e.description,
      e.category,
      e.start_at,
      e.end_at,
      e.location,
      e.status AS event_status,
      u.name AS organizer_name
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON e.organizer_id = u.id
    WHERE r.student_id = $1
    ORDER BY r.created_at DESC
  `;

  const res = await query(sql, [studentId]);
  return res.rows;
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getStudentRegistrations,
};
