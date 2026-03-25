// PostgreSQL connection and query helpers
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

/**
 * Run a parameterized query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`Slow query (${duration}ms):`, text);
  }
  return res;
}

/**
 * Get a client for transactions
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Timeout idle clients
  const timeout = setTimeout(() => {
    console.error('Client checked out for too long');
    client.release();
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  return client;
}

/**
 * Run multiple queries in a single transaction
 * @param {Function} fn - async function receiving a client
 */
async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, getClient, withTransaction };
