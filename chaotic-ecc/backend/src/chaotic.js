// deterministic chaotic fingerprint (fixed-point approach)
const crypto = require('crypto');

function seedToUnit(seedBuf) {
  // map 256-bit seed to [0,1) deterministically using integer -> fixed point
  const integer = BigInt('0x' + seedBuf.toString('hex'));
  // use modulo to keep within a predictable range
  const denom = BigInt(10) ** BigInt(12);
  const numer = integer % denom;
  return Number(numer) / Number(denom);
}

function logisticIter(x0, r = 3.99, k = 16) {
  let x = x0;
  const seq = [];
  for (let i = 0; i < k; i++) {
    x = r * x * (1 - x);
    seq.push(x);
  }
  return seq;
}

function quantize(seq) {
  const buffers = seq.map(x => {
    const val = Math.floor(x * (2 ** 32)) >>> 0;
    const b = Buffer.alloc(4);
    b.writeUInt32BE(val, 0);
    return b;
  });
  return Buffer.concat(buffers);
}

function chaoticFingerprint(metadataJson, seedSecretHex) {
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify(metadataJson));
  h.update(seedSecretHex);
  const seed = h.digest();
  const x0 = seedToUnit(seed);
  const seq = logisticIter(x0, 3.99, 16);
  const q = quantize(seq);
  const outer = crypto.createHash('sha256');
  outer.update(q);
  outer.update(JSON.stringify(metadataJson));
  return outer.digest('hex'); // 32-byte hex fingerprint
}

module.exports = { chaoticFingerprint };
