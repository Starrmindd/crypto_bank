// Minimal gateway that receives prepared txs and anchors to contract
const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const { chaoticFingerprint } = require('./chaotic');
const { deriveSharedKey, aesGcmEncrypt } = require('./crypto');

const app = express();
app.use(bodyParser.json());

async function createProvider(rpcUrl, pk) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  return { provider, wallet };
}

app.post('/submit', async (req, res) => {
  try {
    const { metadata, userPubKey, userSig } = req.body;
    // metadata: {from, to, amount, ts, txID}

    // derive local fingerprint using server-known gateway-secret + metadata
    const F = chaoticFingerprint(metadata, process.env.GATEWAY_SECRET || 'gateway-test-secret');

    // create anchor = H(txID || F || hEnc)
    const anchorPre = ethers.hashMessage(ethers.toUtf8Bytes(metadata.txID + F));
    const anchorBytes = ethers.hashMessage(anchorPre);
    const anchor = anchorBytes;

    // optionally encrypt full trace for auditor using ECDH
    const auditorPub = process.env.AUDITOR_PUBLIC_KEY;
    let ipfsCID = "";
    if (auditorPub) {
      const gatewayPriv = process.env.GATEWAY_PRIVATE_KEY;
      const sharedKey = deriveSharedKey(gatewayPriv, auditorPub);
      const enc = aesGcmEncrypt(sharedKey, Buffer.from(JSON.stringify({ metadata, F })), null);
      // for reference implementation we skip IPFS and store a simple JSON
      ipfsCID = `enc:${enc.iv}:${enc.tag}:${enc.ct.slice(0, 64)}`;
    }

    // call contract
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const gatewayWallet = new ethers.Wallet(process.env.GATEWAY_PRIVATE_KEY, provider);
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const abi = [
      "function storeAnchor(bytes32 txID, bytes32 anchorHash, address owner, string ipfsCID) public",
      "event AnchorStored(bytes32 indexed txID, bytes32 anchorHash, address indexed owner, string ipfsCID)"
    ];
    const contract = new ethers.Contract(contractAddress, abi, gatewayWallet);
    const txIDBytes = ethers.hashMessage(ethers.toUtf8Bytes(metadata.txID));
    const tx = await contract.storeAnchor(txIDBytes, anchor, metadata.from, ipfsCID);
    await tx.wait();

    res.json({ ok: true, anchor, F, ipfsCID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = app;
