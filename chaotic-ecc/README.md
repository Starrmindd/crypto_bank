# Chaotic-ECC Reference Implementation

Leveraging Chaotic Maps and Elliptic Curve Cryptography on Smart Contracts for Enhanced Traceability and Security in Bank Transactions on a Blockchain Platform.

## Prerequisites

- Docker & Docker Compose
- Node.js (if you prefer running locally)

## Quick Start (Docker Compose)

1. Navigate to the chaotic-ecc directory:
```bash
cd chaotic-ecc
```

2. Set environment variables in `backend/.env.example` and update `docker-compose.yml` `environment` block or pass `.env` to compose.

3. Start services:
```bash
docker compose up --build
```

4. Build & deploy the contract using Hardhat:
   - If running locally: `cd hardhat && npm install && npx hardhat node` then in another shell `node scripts/deploy.js`
   - If using hardhat service from compose, exec into the container and run the deploy script.

5. Set `CONTRACT_ADDRESS` in backend environment with the deployed contract address and `GATEWAY_PRIVATE_KEY`.

6. Submit a test transaction to the gateway:
```bash
curl -X POST http://localhost:3000/submit \
  -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "from": "0x...",
      "to": "0x...",
      "amount": 100,
      "ts": 1690000000,
      "txID": "tx-001"
    },
    "userPubKey": "0x...",
    "userSig": "sig"
  }'
```

## Project Structure

```
chaotic-ecc/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js
│   │   ├── chaotic.js
│   │   ├── crypto.js
│   │   └── gateway.js
│   └── Dockerfile
├── contracts/
│   └── ChaoticECCAnchoring.sol
├── hardhat/
│   ├── package.json
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── docker-compose.yml
└── README.md
```

## Notes

- This reference stores encrypted trace pointers in a simple placeholder format. For a real deployment pin encrypted trace JSON to IPFS and store the CID on-chain.
- Ensure you use deterministic fixed-point quantization for chaotic maps across all languages and platforms.
- Replace `gateway-test-secret` with a properly protected secret and use hardware security modules (HSM) for private keys in production.

## Important Disclaimer

This implementation is a research reference and not intended for production use. The chaotic map is used as an entropy/augmentation source and always combined with standard cryptography (ECDH, ECDSA, HKDF, AES-GCM). Review and harden before any real financial deployment.

## License

MIT
