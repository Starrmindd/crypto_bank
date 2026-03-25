// API routes — wallet operations, user management, audit
const express = require('express');
const { ethers } = require('ethers');
const { chaoticFingerprint } = require('./chaotic');
const { deriveSharedKey, aesGcmEncrypt, aesGcmDecrypt } = require('./crypto');
const {
  getUserByAddress,
  getUserByID,
  getTransactionHistory,
  getCachedBalance,
  updateKYCStatus,
} = require('./wallet');

const router = express.Router();

// ─── Middleware ────────────────────────────────────────────────────────────────

function requireAddress(req, res, next) {
  const address = req.headers['x-wallet-address'];
  if (!address || !ethers.isAddress(address)) {
    return res.status(401).json({ ok: false, error: 'Valid wallet address required in x-wallet-address header' });
  }
  req.walletAddress = address.toLowerCase();
  next();
}

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  next();
}

// ─── User Routes ───────────────────────────────────────────────────────────────

// GET /api/user/me — get current user profile
router.get('/user/me', requireAddress, async (req, res) => {
  try {
    const user = await getUserByAddress(req.walletAddress);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/user/:id — resolve a uniqueID to user info
router.get('/user/:id', async (req, res) => {
  try {
    const user = await getUserByID(req.params.id);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    // only return public fields
    res.json({ ok: true, user: { uniqueID: user.unique_id, username: user.username } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Wallet Routes ─────────────────────────────────────────────────────────────

// GET /api/wallet/balance — get cached balance
router.get('/wallet/balance', requireAddress, async (req, res) => {
  try {
    const cached = await getCachedBalance(req.walletAddress);
    if (!cached) return res.status(404).json({ ok: false, error: 'Balance not found' });
    res.json({
      ok: true,
      balance: ethers.formatEther(cached.balance_wei),
      balanceWei: cached.balance_wei,
      updatedAt: cached.updated_at,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/wallet/history — get transaction history
router.get('/wallet/history', requireAddress, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const txs = await getTransactionHistory(req.walletAddress, { limit, offset });
    res.json({ ok: true, transactions: txs, count: txs.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Gateway / Anchoring Routes ────────────────────────────────────────────────

// POST /api/submit — submit a transaction for chaotic anchoring
router.post('/submit', async (req, res) => {
  try {
    const { metadata, userPubKey, userSig } = req.body;

    if (!metadata?.txID || !metadata?.from || !metadata?.to || !metadata?.amount) {
      return res.status(400).json({ ok: false, error: 'Missing required metadata fields' });
    }

    // Generate chaotic fingerprint
    const F = chaoticFingerprint(metadata, process.env.GATEWAY_SECRET || 'gateway-test-secret');

    // Build anchor hash
    const anchorPre = ethers.hashMessage(ethers.toUtf8Bytes(metadata.txID + F));
    const anchor = ethers.hashMessage(anchorPre);

    // Optionally encrypt trace for auditor
    let ipfsCID = '';
    const auditorPub = process.env.AUDITOR_PUBLIC_KEY;
    if (auditorPub) {
      const sharedKey = deriveSharedKey(process.env.GATEWAY_PRIVATE_KEY, auditorPub);
      const enc = aesGcmEncrypt(
        sharedKey,
        Buffer.from(JSON.stringify({ metadata, F })),
        null
      );
      ipfsCID = `enc:${enc.iv}:${enc.tag}:${enc.ct.slice(0, 64)}`;
    }

    // Submit to contract
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.GATEWAY_PRIVATE_KEY, provider);
    const abi = [
      'function storeAnchor(bytes32 txID, bytes32 anchorHash, address owner, string ipfsCID) public',
    ];
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
    const txIDBytes = ethers.hashMessage(ethers.toUtf8Bytes(metadata.txID));
    const tx = await contract.storeAnchor(txIDBytes, anchor, metadata.from, ipfsCID);
    await tx.wait();

    res.json({ ok: true, anchor, fingerprint: F, ipfsCID, txHash: tx.hash });
  } catch (err) {
    console.error('[Submit]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/verify — verify a transaction's chaotic fingerprint
router.post('/verify', async (req, res) => {
  try {
    const { metadata, fingerprint } = req.body;
    if (!metadata || !fingerprint) {
      return res.status(400).json({ ok: false, error: 'metadata and fingerprint required' });
    }
    const expected = chaoticFingerprint(metadata, process.env.GATEWAY_SECRET || 'gateway-test-secret');
    const valid = expected === fingerprint;
    res.json({ ok: true, valid, expected: valid ? fingerprint : undefined });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Admin Routes ──────────────────────────────────────────────────────────────

// PATCH /api/admin/kyc — update KYC status
router.patch('/admin/kyc', requireAdmin, async (req, res) => {
  try {
    const { address, status } = req.body;
    if (!address || !status) {
      return res.status(400).json({ ok: false, error: 'address and status required' });
    }
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ ok: false, error: `status must be one of: ${validStatuses.join(', ')}` });
    }
    const updated = await updateKYCStatus(address, status);
    if (!updated) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, message: `KYC status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/health — health check
router.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

module.exports = router;
