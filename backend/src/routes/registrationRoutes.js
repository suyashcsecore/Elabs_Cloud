const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/registrations/me (student's registrations with event info and status)
router.get('/me', requireAuth, requireRole('STUDENT'), registrationController.getMyRegistrations);

module.exports = router;
