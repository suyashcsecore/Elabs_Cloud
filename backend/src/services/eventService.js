const { query } = require('../db');
const { AppError } = require('../middleware/errorHandler');

/**
 * List events (PUBLISHED only for public/students)
 * Supports:
 * - search by title
 * - filter by category
 * - filter by date range (startDate, endDate)
 * - pagination (limit, offset)
 * - sort by start_at (asc/desc)
 * - computed remaining_seats from active registrations
 */
const listPublicEvents = async ({ search, category, startDate, endDate, sort = 'asc', limit = 20, offset = 0 }) => {
  const conditions = [`e.status = 'PUBLISHED'`];
  const params = [];
  let paramIndex = 1;

  // Search by title
  if (search) {
    conditions.push(`e.title ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  // Filter by category
  if (category) {
    conditions.push(`e.category = $${paramIndex++}`);
    params.push(category);
  }

  // Filter by date range
  if (startDate) {
    conditions.push(`e.start_at >= $${paramIndex++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`e.start_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const orderDirection = sort.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Count total matching published events
  const countSql = `SELECT COUNT(*) FROM events e ${whereClause}`;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // Fetch events with computed remaining_seats
  const eventsSql = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.category,
      e.start_at,
      e.end_at,
      e.location,
      e.capacity,
      e.registration_deadline,
      e.status,
      e.organizer_id,
      u.name AS organizer_name,
      e.created_at,
      e.updated_at,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS registered_count,
      GREATEST(0, e.capacity - COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE')) AS remaining_seats
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    LEFT JOIN registrations r ON e.id = r.event_id
    ${whereClause}
    GROUP BY e.id, u.name
    ORDER BY e.start_at ${orderDirection}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);
  const eventsRes = await query(eventsSql, params);

  return {
    total,
    limit,
    offset,
    events: eventsRes.rows.map((row) => ({
      ...row,
      registered_count: parseInt(row.registered_count, 10),
      remaining_seats: parseInt(row.remaining_seats, 10),
    })),
  };
};

/**
 * Get single event details with computed remaining_seats
 */
const getEventById = async (eventId, currentUser = null) => {
  const sql = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.category,
      e.start_at,
      e.end_at,
      e.location,
      e.capacity,
      e.registration_deadline,
      e.status,
      e.organizer_id,
      u.name AS organizer_name,
      e.created_at,
      e.updated_at,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS registered_count,
      GREATEST(0, e.capacity - COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE')) AS remaining_seats
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.id = $1
    GROUP BY e.id, u.name
  `;

  const res = await query(sql, [eventId]);
  if (res.rowCount === 0) {
    throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  const event = res.rows[0];

  // If event is not published, only the owner organizer or an ADMIN can view it
  if (event.status !== 'PUBLISHED') {
    const isOwner = currentUser && currentUser.id === event.organizer_id;
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    }
  }

  return {
    ...event,
    registered_count: parseInt(event.registered_count, 10),
    remaining_seats: parseInt(event.remaining_seats, 10),
  };
};

/**
 * Create event as DRAFT (ORGANIZER or ADMIN)
 */
const createEvent = async (eventData, organizerUser) => {
  const sql = `
    INSERT INTO events (
      title, description, category, start_at, end_at, location,
      capacity, registration_deadline, status, organizer_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9)
    RETURNING *
  `;

  const params = [
    eventData.title,
    eventData.description,
    eventData.category,
    eventData.startAt,
    eventData.endAt,
    eventData.location,
    eventData.capacity,
    eventData.registrationDeadline,
    organizerUser.id,
  ];

  const res = await query(sql, params);
  return res.rows[0];
};

/**
 * Update event (Only owner; Admins can edit all)
 * Constraint: Cannot reduce capacity below current active registrations
 */
const updateEvent = async (eventId, updates, currentUser) => {
  // 1. Verify existence & check ownership
  const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (eventRes.rowCount === 0) {
    throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  const event = eventRes.rows[0];
  const isOwner = event.organizer_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('Access denied: You can only edit events you own.', 403, 'FORBIDDEN_EVENT_EDIT');
  }

  // 2. If updating capacity, ensure it cannot be reduced below current active registrations
  if (updates.capacity !== undefined) {
    const countRes = await query(
      `SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = 'ACTIVE'`,
      [eventId]
    );
    const activeCount = parseInt(countRes.rows[0].count, 10);

    if (updates.capacity < activeCount) {
      throw new AppError(
        `Cannot reduce capacity to ${updates.capacity}. There are currently ${activeCount} active registrations.`,
        400,
        'CAPACITY_LESS_THAN_ACTIVE_REGISTRATIONS'
      );
    }
  }

  // 3. Build dynamic update query
  const fields = [];
  const params = [];
  let idx = 1;

  const mapping = {
    title: 'title',
    description: 'description',
    category: 'category',
    startAt: 'start_at',
    endAt: 'end_at',
    location: 'location',
    capacity: 'capacity',
    registrationDeadline: 'registration_deadline',
    status: 'status',
  };

  for (const [key, dbCol] of Object.entries(mapping)) {
    if (updates[key] !== undefined) {
      fields.push(`${dbCol} = $${idx++}`);
      params.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return event;
  }

  params.push(eventId);
  const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const updateRes = await query(sql, params);
  return updateRes.rows[0];
};

/**
 * Publish an event (Only owner or ADMIN)
 */
const publishEvent = async (eventId, currentUser) => {
  const eventRes = await query('SELECT organizer_id, status FROM events WHERE id = $1', [eventId]);
  if (eventRes.rowCount === 0) {
    throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  const event = eventRes.rows[0];
  const isOwner = event.organizer_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('Access denied: You can only publish events you own.', 403, 'FORBIDDEN_EVENT_PUBLISH');
  }

  const res = await query(
    `UPDATE events SET status = 'PUBLISHED' WHERE id = $1 RETURNING *`,
    [eventId]
  );
  return res.rows[0];
};

/**
 * Cancel an event (Only owner or ADMIN; marks event as CANCELLED)
 */
const cancelEvent = async (eventId, currentUser) => {
  const eventRes = await query('SELECT organizer_id, status FROM events WHERE id = $1', [eventId]);
  if (eventRes.rowCount === 0) {
    throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  const event = eventRes.rows[0];
  const isOwner = event.organizer_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('Access denied: You can only cancel events you own.', 403, 'FORBIDDEN_EVENT_CANCEL');
  }

  const res = await query(
    `UPDATE events SET status = 'CANCELLED' WHERE id = $1 RETURNING *`,
    [eventId]
  );
  return res.rows[0];
};

/**
 * GET /api/organizer/events
 * List own events with active and total registration counts
 */
const getOrganizerEvents = async (currentUser) => {
  const sql = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.category,
      e.start_at,
      e.end_at,
      e.location,
      e.capacity,
      e.registration_deadline,
      e.status,
      e.created_at,
      e.updated_at,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS registered_count,
      COUNT(r.id) AS total_registrations,
      GREATEST(0, e.capacity - COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE')) AS remaining_seats
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.organizer_id = $1
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const res = await query(sql, [currentUser.id]);
  return res.rows.map((row) => ({
    ...row,
    registered_count: parseInt(row.registered_count, 10),
    total_registrations: parseInt(row.total_registrations, 10),
    remaining_seats: parseInt(row.remaining_seats, 10),
  }));
};

module.exports = {
  listPublicEvents,
  getEventById,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getOrganizerEvents,
};
