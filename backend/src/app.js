const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Trust proxy for production reverse proxies (Render, AWS ALB, Cloudflare, etc.)
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Security Headers with Helmet
app.use(helmet());

// CORS Configured for frontend origin
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Morgan HTTP request logging piped to Pino logger
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info({ httpLog: message.trim() }),
      },
    })
  );
}

// API Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/organizer', require('./routes/organizerRoutes'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
});

// Global Centralized Error Handler (SRS format: { error: { code, message } })
app.use(errorHandler);

module.exports = app;
