// Wallet service — off-chain balance tracking, transaction indexing, DB sync
const { query, withTransaction } = require('./db');
const { ethers } = require('ethers');

/**
 * Upsert a user record from on-chain registration event
 */
async function syncUserRegistration({ address, uniqueID, username, timestamp }) {
  await query(
    `INSERT INTO users (address, unique_id, username, registered_at, kyc_status)
     VALUES ($1, $2, $3, to_timestamp($4), 'pending')
     ON CONFLICT (address) DO UPDATE
       SET unique_id = EXCLUDED.unique_id,
           username  = EXCLUDED.username`,
    [address.toLowerCase(), uniqueID, username, timestamp]
  );
}

/**
 * Record a transaction in the DB (deposit, withdraw, transfer)
 */
async function recordTransaction({ txHash, from, to, amount, txType, blockNumber, timestamp }) {
  await query(
    `INSERT INTO transactions (tx_hash, from_address, to_address, amount_wei, tx_type, block_number, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7))
     ON CONFLICT (tx_hash) DO NOTHING`,
    [
      txHash,
      from?.toLowerCase(),
      to?.toLowerCase(),
      amount.toString(),
      txType,
      blockNumber,
      timestamp,
    ]
  );
}

/**
 * Get paginated transaction history for a user
 */
async function getTransactionHistory(address, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT tx_hash, from_address, to_address, amount_wei, tx_type, block_number, created_at
     FROM transactions
     WHERE from_address = $1 OR to_address = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [address.toLowerCase(), limit, offset]
  );
  return rows.map(formatTx);
}

/**
 * Get cached balance for a user (updated by event listener)
 */
async function getCachedBalance(address) {
  const { rows } = await query(
    `SELECT balance_wei, updated_at FROM balances WHERE address = $1`,
    [address.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Update cached balance
 */
async function updateBalance(address, balanceWei) {
  await query(
    `INSERT INTO balances (address, balance_wei, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (address) DO UPDATE
       SET balance_wei = EXCLUDED.balance_wei,
           updated_at  = NOW()`,
    [address.toLowerCase(), balanceWei.toString()]
  );
}

/**
 * Get user by address
 */
async function getUserByAddress(address) {
  const { rows } = await query(
    `SELECT address, unique_id, username, kyc_status, registered_at
     FROM users WHERE address = $1`,
    [address.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Get user by uniqueID
 */
async function getUserByID(uniqueID) {
  const { rows } = await query(
    `SELECT address, unique_id, username, kyc_status, registered_at
     FROM users WHERE unique_id = $1`,
    [uniqueID]
  );
  return rows[0] || null;
}

/**
 * Update KYC status
 */
async function updateKYCStatus(address, status) {
  const { rowCount } = await query(
    `UPDATE users SET kyc_status = $1 WHERE address = $2`,
    [status, address.toLowerCase()]
  );
  return rowCount > 0;
}

function formatTx(row) {
  return {
    txHash: row.tx_hash,
    from: row.from_address,
    to: row.to_address,
    amount: ethers.formatEther(row.amount_wei),
    type: row.tx_type,
    blockNumber: row.block_number,
    timestamp: row.created_at,
  };
}

module.exports = {
  syncUserRegistration,
  recordTransaction,
  getTransactionHistory,
  getCachedBalance,
  updateBalance,
  getUserByAddress,
  getUserByID,
  updateKYCStatus,
};
