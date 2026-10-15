const express = require('express');
const { testConnection } = require('../db');

const router = express.Router();

/**
 * GET /health
 * FR-055: Health check endpoint reporting service status, uptime, and database connectivity
 * Format: { status, uptime, db: "connected"|"down", timestamp } (no auth, no secrets)
 */
router.get('/', async (req, res) => {
  const dbHealth = await testConnection();

  const isConnected = !!dbHealth.connected;
  const healthData = {
    status: isConnected ? 'healthy' : 'degraded',
    uptime: Math.floor(process.uptime()),
    db: isConnected ? 'connected' : 'down',
    timestamp: new Date().toISOString(),
  };

  const statusCode = isConnected ? 200 : 503;
  return res.status(statusCode).json(healthData);
});

module.exports = router;
