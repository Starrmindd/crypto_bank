// Blockchain event listener — syncs on-chain events to the database in real time
const { ethers } = require('ethers');
const { syncUserRegistration, recordTransaction, updateBalance } = require('./wallet');
const { chaoticFingerprint } = require('./chaotic');

const WALLET_ABI = [
  'event Deposited(address indexed user, uint256 amount, bytes32 txHash)',
  'event Withdrawn(address indexed user, uint256 amount, bytes32 txHash)',
  'event Transferred(address indexed from, address indexed to, uint256 amount, bytes32 txHash)',
];

const REGISTRY_ABI = [
  'event UserRegistered(address indexed user, string uniqueID, uint256 timestamp)',
  'event KYCUpdated(address indexed user, uint8 status)',
];

let provider;
let walletContract;
let registryContract;
let isRunning = false;

/**
 * Start listening to blockchain events
 */
async function startListener() {
  if (isRunning) return;

  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  walletContract = new ethers.Contract(
    process.env.WALLET_CONTRACT_ADDRESS,
    WALLET_ABI,
    provider
  );

  registryContract = new ethers.Contract(
    process.env.REGISTRY_CONTRACT_ADDRESS,
    REGISTRY_ABI,
    provider
  );

  // Listen for deposits
  walletContract.on('Deposited', async (user, amount, txHash, event) => {
    try {
      await recordTransaction({
        txHash: txHash,
        from: user,
        to: process.env.WALLET_CONTRACT_ADDRESS,
        amount,
        txType: 'deposit',
        blockNumber: event.log.blockNumber,
        timestamp: (await event.log.getBlock()).timestamp,
      });
      await _refreshBalance(user);
      console.log(`[Listener] Deposit: ${user} → ${ethers.formatEther(amount)} ETH`);
    } catch (err) {
      console.error('[Listener] Deposit sync error:', err.message);
    }
  });

  // Listen for withdrawals
  walletContract.on('Withdrawn', async (user, amount, txHash, event) => {
    try {
      await recordTransaction({
        txHash: txHash,
        from: user,
        to: null,
        amount,
        txType: 'withdraw',
        blockNumber: event.log.blockNumber,
        timestamp: (await event.log.getBlock()).timestamp,
      });
      await _refreshBalance(user);
      console.log(`[Listener] Withdraw: ${user} ← ${ethers.formatEther(amount)} ETH`);
    } catch (err) {
      console.error('[Listener] Withdraw sync error:', err.message);
    }
  });

  // Listen for transfers
  walletContract.on('Transferred', async (from, to, amount, txHash, event) => {
    try {
      const block = await event.log.getBlock();
      await recordTransaction({
        txHash: txHash,
        from,
        to,
        amount,
        txType: 'transfer',
        blockNumber: event.log.blockNumber,
        timestamp: block.timestamp,
      });
      await _refreshBalance(from);
      await _refreshBalance(to);
      console.log(`[Listener] Transfer: ${from} → ${to} (${ethers.formatEther(amount)} ETH)`);
    } catch (err) {
      console.error('[Listener] Transfer sync error:', err.message);
    }
  });

  // Listen for user registrations
  registryContract.on('UserRegistered', async (user, uniqueID, timestamp) => {
    try {
      await syncUserRegistration({
        address: user,
        uniqueID,
        username: '',
        timestamp: Number(timestamp),
      });
      console.log(`[Listener] User registered: ${user} → ID: ${uniqueID}`);
    } catch (err) {
      console.error('[Listener] Registration sync error:', err.message);
    }
  });

  // Handle provider disconnects with reconnect
  provider.on('error', (err) => {
    console.error('[Listener] Provider error:', err.message);
    isRunning = false;
    setTimeout(startListener, 5000);
  });

  isRunning = true;
  console.log('[Listener] Blockchain event listener started');
}

/**
 * Stop the listener and clean up
 */
async function stopListener() {
  if (!isRunning) return;
  walletContract?.removeAllListeners();
  registryContract?.removeAllListeners();
  isRunning = false;
  console.log('[Listener] Stopped');
}

async function _refreshBalance(address) {
  try {
    const walletWithSigner = new ethers.Contract(
      process.env.WALLET_CONTRACT_ADDRESS,
      ['function getBalance(address) view returns (uint256)'],
      provider
    );
    const balance = await walletWithSigner.getBalance(address);
    await updateBalance(address, balance);
  } catch (err) {
    console.error('[Listener] Balance refresh error:', err.message);
  }
}

module.exports = { startListener, stopListener };
