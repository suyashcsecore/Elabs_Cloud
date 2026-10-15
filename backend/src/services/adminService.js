const { query } = require('../db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Platform Summary Statistics (SRS FR-046, FR-047, FR-052)
 * Live database-derived analytics:
 * 1. Total users by role (STUDENT, ORGANIZER, ADMIN)
 * 2. Total events by status (DRAFT, PUBLISHED, CANCELLED)
 * 3. Total active registrations
 * 4. Top 5 events by registrations
 * 5. Registrations per day for the last 14 days
 */
const getPlatformSummary = async () => {
  // 1. Total users by role
  const userStatsSql = `
    SELECT 
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE role = 'STUDENT') AS students,
      COUNT(*) FILTER (WHERE role = 'ORGANIZER') AS organizers,
      COUNT(*) FILTER (WHERE role = 'ADMIN') AS admins,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_users,
      COUNT(*) FILTER (WHERE status = 'DISABLED') AS disabled_users
    FROM users
  `;
  const userStatsRes = await query(userStatsSql);

  // 2. Total events by status
  const eventStatsSql = `
    SELECT 
      COUNT(*) AS total_events,
      COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS published,
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
      COALESCE(SUM(capacity), 0) AS total_capacity
    FROM events
  `;
  const eventStatsRes = await query(eventStatsSql);

  // 3. Total active registrations
  const regStatsSql = `
    SELECT 
      COUNT(*) AS total_registrations,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_registrations,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_registrations
    FROM registrations
  `;
  const regStatsRes = await query(regStatsSql);

  // 4. Top 5 events by registrations
  const topEventsSql = `
    SELECT 
      e.id,
      e.title,
      e.category,
      e.capacity,
      e.status,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS active_registrations,
      COUNT(r.id) AS total_registrations
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    GROUP BY e.id
    ORDER BY active_registrations DESC, total_registrations DESC
    LIMIT 5
  `;
  const topEventsRes = await query(topEventsSql);

  // 5. Registrations per day for the last 14 days
  const dailyRegSql = `
    SELECT 
      TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS active_count,
      COUNT(r.id) AS total_count
    FROM generate_series(
      CURRENT_DATE - INTERVAL '13 days',
      CURRENT_DATE,
      '1 day'::interval
    ) d(day)
    LEFT JOIN registrations r 
      ON DATE(r.created_at) = DATE(d.day)
    GROUP BY d.day
    ORDER BY d.day ASC
  `;
  const dailyRegRes = await query(dailyRegSql);

  const u = userStatsRes.rows[0];
  const e = eventStatsRes.rows[0];
  const r = regStatsRes.rows[0];

  return {
    usersByRole: {
      total: parseInt(u.total_users, 10),
      student: parseInt(u.students, 10),
      organizer: parseInt(u.organizers, 10),
      admin: parseInt(u.admins, 10),
      active: parseInt(u.active_users, 10),
      disabled: parseInt(u.disabled_users, 10),
    },
    eventsByStatus: {
      total: parseInt(e.total_events, 10),
      published: parseInt(e.published, 10),
      draft: parseInt(e.draft, 10),
      cancelled: parseInt(e.cancelled, 10),
      totalCapacity: parseInt(e.total_capacity, 10),
    },
    totalActiveRegistrations: parseInt(r.active_registrations, 10),
    totalRegistrations: parseInt(r.total_registrations, 10),
    topEvents: topEventsRes.rows.map((row) => ({
      ...row,
      active_registrations: parseInt(row.active_registrations, 10),
      total_registrations: parseInt(row.total_registrations, 10),
    })),
    registrationsLast14Days: dailyRegRes.rows.map((row) => ({
      date: row.date,
      activeCount: parseInt(row.active_count, 10),
      totalCount: parseInt(row.total_count, 10),
    })),
  };
};

/**
 * GET /api/admin/events
 * List all events across the platform with any status
 */
const getAllAdminEvents = async () => {
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
      u.email AS organizer_email,
      e.created_at,
      e.updated_at,
      COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE') AS registered_count,
      COUNT(r.id) AS total_registrations,
      GREATEST(0, e.capacity - COUNT(r.id) FILTER (WHERE r.status = 'ACTIVE')) AS remaining_seats
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    LEFT JOIN registrations r ON e.id = r.event_id
    GROUP BY e.id, u.name, u.email
    ORDER BY e.created_at DESC
  `;

  const res = await query(sql);
  return res.rows.map((row) => ({
    ...row,
    registered_count: parseInt(row.registered_count, 10),
    total_registrations: parseInt(row.total_registrations, 10),
    remaining_seats: parseInt(row.remaining_seats, 10),
  }));
};

/**
 * List users with pagination and search
 */
const listUsers = async ({ search, role, status, limit = 20, offset = 0 }) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const usersSql = `
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  const usersRes = await query(usersSql, params);

  return {
    total,
    limit,
    offset,
    users: usersRes.rows,
  };
};

/**
 * Assign or revoke organizer role (FR-048, UC-06)
 * Promotes/demotes between STUDENT and ORGANIZER
 * Prevents admin from demoting themselves
 */
const updateUserRole = async (targetUserId, newRole, currentAdmin) => {
  if (targetUserId === currentAdmin.id) {
    throw new AppError('Administrators cannot modify or demote their own admin role.', 400, 'CANNOT_DEMOTE_SELF');
  }

  const res = await query(
    `UPDATE users 
     SET role = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 
     RETURNING id, name, email, role, status, updated_at`,
    [newRole, targetUserId]
  );

  if (res.rowCount === 0) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return res.rows[0];
};

/**
 * Disable or enable user account
 * Prevents admin from disabling themselves
 */
const updateUserStatus = async (targetUserId, newStatus, currentAdmin) => {
  if (targetUserId === currentAdmin.id && (newStatus === 'DISABLED' || newStatus === 'DEACTIVATED')) {
    throw new AppError('Administrators cannot disable their own account.', 400, 'CANNOT_DISABLE_SELF');
  }

  const res = await query(
    `UPDATE users 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 
     RETURNING id, name, email, role, status, updated_at`,
    [newStatus, targetUserId]
  );

  if (res.rowCount === 0) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return res.rows[0];
};

module.exports = {
  getPlatformSummary,
  getAllAdminEvents,
  listUsers,
  updateUserRole,
  updateUserStatus,
};
