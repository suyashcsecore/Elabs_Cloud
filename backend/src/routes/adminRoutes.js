const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

// Validation schemas for admin actions
const roleUpdateSchema = z.object({
  role: z.enum(['STUDENT', 'ORGANIZER']),
});

const statusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});

// All admin routes strictly require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// Platform analytics
// GET /api/admin/summary (total users by role, total events by status, total active registrations, top 5 events, registrations per day for last 14 days)
router.get('/summary', adminController.getSummary);

// GET /api/admin/events (all events, any status)
router.get('/events', adminController.getAdminEvents);

// User and role management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', validate(roleUpdateSchema), adminController.changeUserRole);
router.patch('/users/:id/status', validate(statusUpdateSchema), adminController.changeUserStatus);

module.exports = router;
