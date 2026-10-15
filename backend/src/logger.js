const pino = require('pino');
const config = require('./config');

const isDev = config.nodeEnv === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'elabs-registration-backend',
    env: config.nodeEnv,
  },
});

module.exports = logger;
