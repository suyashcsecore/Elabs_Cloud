const { query } = require('../db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper: Verify that the current user owns the event or is an ADMIN
 * Requirements: FR-040, FR-043, UC-05
 */
const verifyEventAccess = async (eventId, currentUser) => {
  const eventRes = await query(
    'SELECT id, title, organizer_id, capacity FROM events WHERE id = $1',
    [eventId]
  );

  if (eventRes.rowCount === 0) {
    throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  const event = eventRes.rows[0];
  const isOwner = event.organizer_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'Access denied: You can only view participant rosters for events you own.',
      403,
      'FORBIDDEN_EVENT_ACCESS'
    );
  }

  return event;
};

/**
 * GET /api/organizer/events/:id/participants
 * Returns participant roster (name, email, registered_at, status)
 * Owner only (or Admin override)
 */
const getEventParticipants = async (eventId, currentUser) => {
  const event = await verifyEventAccess(eventId, currentUser);

  const sql = `
    SELECT 
      r.id AS registration_id,
      u.name AS student_name,
      u.email AS student_email,
      r.status AS registration_status,
      r.created_at AS registered_at,
      r.updated_at AS updated_at
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    WHERE r.event_id = $1
    ORDER BY r.created_at ASC
  `;

  const participantsRes = await query(sql, [eventId]);

  const countSql = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_count,
      COUNT(*) AS total_count
    FROM registrations
    WHERE event_id = $1
  `;
  const countRes = await query(countSql, [eventId]);
  const stats = countRes.rows[0];

  const activeCount = parseInt(stats.active_count, 10);
  const remainingSeats = Math.max(0, event.capacity - activeCount);

  return {
    event: {
      id: event.id,
      title: event.title,
      capacity: event.capacity,
      activeRegistrations: activeCount,
      remainingSeats,
      totalRegistrations: parseInt(stats.total_count, 10),
    },
    participants: participantsRes.rows,
  };
};

/**
 * Helper to prevent CSV Injection (Formula Injection)
 * If a field begins with =, +, -, @, \t, or \r, prefix with a single quote '
 * Also escapes double quotes and wraps in quotes per RFC-4180
 */
const escapeCSVField = (value) => {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value);

  // CSV Injection defense:
  // If cell starts with spreadsheet formula triggers (=, +, -, @, tab, CR), neutralize it
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape internal double quotes by doubling them (" -> "")
  return `"${stringValue.replace(/"/g, '""')}"`;
};

/**
 * GET /api/organizer/events/:id/participants.csv
 * Export participants as a safe CSV file
 * Owner only (or Admin override)
 */
const exportParticipantsCSV = async (eventId, currentUser) => {
  const data = await getEventParticipants(eventId, currentUser);

  const headers = [
    'Registration ID',
    'Student Name',
    'Student Email',
    'Status',
    'Registered At (UTC)',
  ];

  const rows = data.participants.map((p) => [
    escapeCSVField(p.registration_id),
    escapeCSVField(p.student_name),
    escapeCSVField(p.student_email),
    escapeCSVField(p.registration_status),
    escapeCSVField(p.registered_at ? new Date(p.registered_at).toISOString() : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const safeTitle = data.event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const filename = `participants_${safeTitle}_${new Date().toISOString().split('T')[0]}.csv`;

  return {
    filename,
    csvContent,
  };
};

module.exports = {
  verifyEventAccess,
  getEventParticipants,
  exportParticipantsCSV,
  escapeCSVField,
};
