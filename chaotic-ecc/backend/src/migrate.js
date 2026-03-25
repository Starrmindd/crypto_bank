// Database migration — creates all required tables
const { query } = require('./db');

async function migrate() {
  console.log('[Migrate] Running migrations...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      address       VARCHAR(42) PRIMARY KEY,
      unique_id     VARCHAR(20) UNIQUE,
      username      VARCHAR(100),
      kyc_status    VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending','approved','rejected')),
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id           SERIAL PRIMARY KEY,
      tx_hash      VARCHAR(66) UNIQUE NOT NULL,
      from_address VARCHAR(42),
      to_address   VARCHAR(42),
      amount_wei   NUMERIC(78, 0) NOT NULL,
      tx_type      VARCHAR(20) CHECK (tx_type IN ('deposit','withdraw','transfer')),
      block_number INTEGER,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS balances (
      address     VARCHAR(42) PRIMARY KEY,
      balance_wei NUMERIC(78, 0) DEFAULT 0,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_records (
      id                  SERIAL PRIMARY KEY,
      tx_hash             VARCHAR(66) UNIQUE NOT NULL,
      chaotic_fingerprint VARCHAR(64) NOT NULL,
      encrypted_trace_ref TEXT,
      submitted_by        VARCHAR(42),
      flagged             BOOLEAN DEFAULT FALSE,
      flag_reason         TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Indexes for common queries
  await query(`CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_address)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_address)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_uid ON users(unique_id)`);

  console.log('[Migrate] Done.');
}

migrate().catch((err) => {
  console.error('[Migrate] Failed:', err.message);
  process.exit(1);
});
