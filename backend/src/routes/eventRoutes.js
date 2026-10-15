const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validate } = require('../middleware/validate');
const {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} = require('../controllers/eventValidation');
const { requireAuth, requireRole } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const registrationController = require('../controllers/registrationController');
const participantController = require('../controllers/participantController');

// ----------------------------------------------------------------------------
// Public/Student Endpoints
// ----------------------------------------------------------------------------
router.get('/', optionalAuth, validate(listEventsQuerySchema, 'query'), eventController.getEvents);
router.get('/:id', optionalAuth, eventController.getEvent);

// ----------------------------------------------------------------------------
// Organizer / Admin Endpoints (requireRole ORGANIZER or ADMIN)
// ----------------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(createEventSchema, 'body'),
  eventController.createEvent
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(updateEventSchema, 'body'),
  eventController.updateEvent
);

router.post(
  '/:id/publish',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  eventController.publishEvent
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  eventController.cancelEvent
);

// ----------------------------------------------------------------------------
// Student Registration Actions
// ----------------------------------------------------------------------------
router.post(
  '/:eventId/registrations',
  requireAuth,
  requireRole('STUDENT'),
  registrationController.registerForEvent
);

router.delete(
  '/:eventId/registrations/me',
  requireAuth,
  requireRole('STUDENT'),
  registrationController.cancelRegistration
);

// ----------------------------------------------------------------------------
// Organizer Participant Management & CSV Export
// ----------------------------------------------------------------------------
router.get(
  '/:eventId/registrations',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  participantController.getEventParticipants
);

router.get(
  '/:eventId/registrations/export',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  participantController.exportEventParticipantsCSV
);

module.exports = router;
