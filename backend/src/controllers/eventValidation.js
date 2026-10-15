const { z } = require('zod');

// Schema for creating an event (FR-030, FR-031)
// Rules:
// 1. end_at after start_at
// 2. deadline before start_at
// 3. capacity positive integer
// 4. past dates rejected for new events
const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters long'),
  category: z.string().trim().min(2, 'Category is required').max(50),
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO-8601 date-time string' }),
  endAt: z.string().datetime({ message: 'endAt must be a valid ISO-8601 date-time string' }),
  location: z.string().trim().min(2, 'Location is required').max(200),
  capacity: z.number().int().positive('Capacity must be a positive integer greater than 0'),
  registrationDeadline: z.string().datetime({ message: 'registrationDeadline must be a valid ISO-8601 date-time string' }),
}).refine((data) => new Date(data.startAt) > new Date(), {
  message: 'Event start time cannot be in the past.',
  path: ['startAt'],
}).refine((data) => new Date(data.startAt) < new Date(data.endAt), {
  message: 'Event start time must precede end time.',
  path: ['endAt'],
}).refine((data) => new Date(data.registrationDeadline) < new Date(data.startAt), {
  message: 'Registration deadline must be before the event start time.',
  path: ['registrationDeadline'],
});

// Schema for updating an event (FR-032)
const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).optional(),
  category: z.string().trim().min(2).max(50).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().trim().min(2).max(200).optional(),
  capacity: z.number().int().positive().optional(),
  registrationDeadline: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
}).refine((data) => {
  if (data.startAt && data.endAt) {
    return new Date(data.startAt) < new Date(data.endAt);
  }
  return true;
}, {
  message: 'Event start time must precede end time.',
  path: ['endAt'],
}).refine((data) => {
  if (data.registrationDeadline && data.startAt) {
    return new Date(data.registrationDeadline) < new Date(data.startAt);
  }
  return true;
}, {
  message: 'Registration deadline must be before the event start time.',
  path: ['registrationDeadline'],
});

// Query params schema for event listing & filtering (FR-014, FR-015)
// Public GET /api/events (filter by category, date range, search by title, pagination, sort by start_at)
const listEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
};
