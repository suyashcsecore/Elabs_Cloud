const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participantController = require('../controllers/participantController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All organizer endpoints require ORGANIZER or ADMIN role
router.use(requireAuth, requireRole('ORGANIZER', 'ADMIN'));

// GET /api/organizer/events (own events with registration counts)
router.get('/events', eventController.getOrganizerEvents);

// GET /api/organizer/events/:id/participants (owner only; name, email, registered_at, status)
router.get('/events/:id/participants', participantController.getEventParticipants);

// GET /api/organizer/events/:id/participants.csv (CSV export, owner only; escaped fields)
router.get('/events/:id/participants.csv', participantController.exportEventParticipantsCSV);

module.exports = router;
