const { Pool } = require('pg');
const config = require('../config');

// Initialize PostgreSQL connection pool using pg
const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: config.db.ssl,
      max: config.db.maxConnections,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl,
      max: config.db.maxConnections,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    };

const pool = new Pool(poolConfig);

// Pool error handling for unexpected backend pool issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client pool', err);
});

/**
 * Execute a query with parameterized values (safe against SQL injection)
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv !== 'production') {
      // console.debug('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', { text: text.substring(0, 100), message: error.message });
    throw error;
  }
};

/**
 * Acquire a dedicated client for running ACID transactions
 * Example usage:
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   ...
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Quick connection check for health signal
 */
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as database');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].database,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
