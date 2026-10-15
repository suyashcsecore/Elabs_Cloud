const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'elabs_registration_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    maxConnections: process.env.NODE_ENV === 'test' ? 50 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_please_set_in_env',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'elabs_auth_token',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }
};

module.exports = config;
