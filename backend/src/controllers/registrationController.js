const registrationService = require('../services/registrationService');

/**
 * POST /api/events/:eventId/registrations
 * Student registers for an event
 */
const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await registrationService.registerForEvent(eventId, req.user);

    return res.status(201).json({
      message: 'Registration successful!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/events/:eventId/registrations/me
 * Student cancels their active registration
 */
const cancelRegistration = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const cancelled = await registrationService.cancelRegistration(eventId, req.user);

    return res.status(200).json({
      message: 'Registration cancelled successfully.',
      data: {
        registration: cancelled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/me/registrations
 * Student views their registered events history
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getStudentRegistrations(req.user.id);

    return res.status(200).json({
      data: {
        total: registrations.length,
        registrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
};
