const adminService = require('../services/adminService');

/**
 * GET /api/admin/summary
 * Platform overview metrics
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await adminService.getPlatformSummary();
    return res.status(200).json({
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/events
 * List all events across the platform with any status
 */
const getAdminEvents = async (req, res, next) => {
  try {
    const events = await adminService.getAllAdminEvents();
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

/**
 * GET /api/admin/users
 * Paginated user directory for administrators
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, limit, offset } = req.query;
    const result = await adminService.listUsers({
      search,
      role,
      status,
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
 * PATCH /api/admin/users/:id/role
 * Promote or demote user role (between STUDENT and ORGANIZER)
 */
const changeUserRole = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.params.userId;
    const { role } = req.body;

    const updatedUser = await adminService.updateUserRole(targetId, role, req.user);

    return res.status(200).json({
      message: `User role updated to ${role} successfully.`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Activate or disable user account (ACTIVE / DISABLED)
 */
const changeUserStatus = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.params.userId;
    const { status } = req.body;

    const updatedUser = await adminService.updateUserStatus(targetId, status, req.user);

    return res.status(200).json({
      message: `User account status updated to ${status}.`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getAdminEvents,
  getUsers,
  changeUserRole,
  changeUserStatus,
};
