// lightweight ECC helpers using ethers for signing & ECDH + AES-GCM (node crypto)
const crypto = require('crypto');
const { ethers } = require('ethers');

async function signPayload(privateKeyHex, payloadHashHex) {
  const wallet = new ethers.Wallet(privateKeyHex);
  const sig = await wallet.signMessage(ethers.HexString.fromString(payloadHashHex));
  return sig;
}

function deriveSharedKey(privateKeyHex, pubKeyHex) {
  // using ECDH on curve secp256k1 via node's crypto
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex'));
  const shared = ecdh.computeSecret(Buffer.from(pubKeyHex.replace(/^0x/, ''), 'hex'));
  // derive using HKDF-SHA256
  return crypto.createHash('sha256').update(shared).digest();
}

function aesGcmEncrypt(keyBuf, plaintextBuf, aadBuf = null) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  if (aadBuf) cipher.setAAD(aadBuf);
  const ct = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), ct: ct.toString('hex'), tag: tag.toString('hex') };
}

function aesGcmDecrypt(keyBuf, ivHex, ctHex, tagHex, aadBuf = null) {
  const iv = Buffer.from(ivHex, 'hex');
  const ct = Buffer.from(ctHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
  if (aadBuf) decipher.setAAD(aadBuf);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt;
}

module.exports = { signPayload, deriveSharedKey, aesGcmEncrypt, aesGcmDecrypt };
