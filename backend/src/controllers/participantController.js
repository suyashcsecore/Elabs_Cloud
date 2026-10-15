const participantService = require('../services/participantService');

/**
 * GET /api/organizer/events/:id/participants
 * Owner only: View attendee roster
 */
const getEventParticipants = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const data = await participantService.getEventParticipants(eventId, req.user);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/organizer/events/:id/participants.csv
 * Owner only: Download attendee roster as CSV (with CSV injection defense)
 */
const exportEventParticipantsCSV = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const { filename, csvContent } = await participantService.exportParticipantsCSV(eventId, req.user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventParticipants,
  exportEventParticipantsCSV,
};
