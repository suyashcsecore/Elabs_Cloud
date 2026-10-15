const eventService = require('../services/eventService');

/**
 * GET /api/events
 * Public/Student endpoint: List published events with search, category/date filters, pagination, and remaining_seats
 */
const getEvents = async (req, res, next) => {
  try {
    const { search, category, startDate, endDate, sort, limit, offset } = req.query;
    const result = await eventService.listPublicEvents({
      search,
      category,
      startDate,
      endDate,
      sort,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id
 * Public/Student endpoint: View event details + remaining_seats
 */
const getEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const event = await eventService.getEventById(eventId, req.user);
    return res.status(200).json({
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events
 * Organizer/Admin endpoint: Create event as DRAFT
 */
const createEvent = async (req, res, next) => {
  try {
    const newEvent = await eventService.createEvent(req.body, req.user);
    return res.status(201).json({
      message: 'Event created successfully as DRAFT.',
      data: {
        event: newEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id
 * Organizer/Admin endpoint: Update event (Only owner; Admins can update all; cannot reduce capacity below active bookings)
 */
const updateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const updated = await eventService.updateEvent(eventId, req.body, req.user);
    return res.status(200).json({
      message: 'Event updated successfully.',
      data: {
        event: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events/:id/publish
 * Organizer/Admin endpoint: Publish event (Only owner or Admin)
 */
const publishEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const published = await eventService.publishEvent(eventId, req.user);
    return res.status(200).json({
      message: 'Event published successfully. Now visible to students.',
      data: {
        event: published,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events/:id/cancel
 * Organizer/Admin endpoint: Cancel event (Only owner or Admin; marks event CANCELLED)
 */
const cancelEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const cancelled = await eventService.cancelEvent(eventId, req.user);
    return res.status(200).json({
      message: 'Event marked as CANCELLED.',
      data: {
        event: cancelled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/organizer/events
 * Organizer endpoint: List own events with registration counts
 */
const getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await eventService.getOrganizerEvents(req.user);
    return res.status(200).json({
      data: {
        total: events.length,
        events,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getOrganizerEvents,
};
