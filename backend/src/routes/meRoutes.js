const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Protected for authenticated STUDENT (or user acting as student)
router.get('/registrations', requireAuth, registrationController.getMyRegistrations);

module.exports = router;
