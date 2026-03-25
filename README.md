# Chaotic ECC Banking DApp

A decentralized banking application leveraging Chaotic Maps and Elliptic Curve Cryptography on Smart Contracts for enhanced traceability and security in blockchain-based bank transactions.

## Overview

This project combines cutting-edge cryptographic techniques with blockchain technology to create a secure, traceable banking platform. It features:

- **Chaotic ECC Encryption**: Advanced encryption using elliptic curve cryptography combined with chaotic maps for enhanced security
- **Smart Contract Banking**: Ethereum-based smart contracts for transparent and secure financial transactions
- **Web3 Integration**: MetaMask-powered wallet connectivity for seamless user experience
- **Encrypted Communication**: End-to-end encrypted messaging with chaotic fingerprint verification
- **Transaction Anchoring**: Immutable transaction records with cryptographic proof on blockchain

## Architecture

```
┌─────────────────┐
│   Frontend      │  HTML/JS Web Interface
│   (Web3 DApp)   │  - Wallet Management
└────────┬────────┘  - Encrypt/Decrypt
         │           - Transaction History
         │
         ▼
┌─────────────────┐
│  Smart Contract │  Solidity on Ethereum
│  (ChaoticECC)   │  - User Registration
└────────┬────────┘  - Fund Management
         │           - Transaction Records
         │
         ▼
┌─────────────────┐
│   Backend       │  Node.js Gateway
│   (Gateway)     │  - Chaotic Fingerprinting
└─────────────────┘  - Transaction Anchoring
                     - IPFS Integration
```

## Features

### 1. Secure Wallet Management
- MetaMask integration for wallet connectivity
- Deposit, withdraw, and transfer ETH
- Real-time balance tracking
- Transaction history with detailed records

### 2. Chaotic ECC Encryption
- **Encryption**: Secure message encryption using ECDH key derivation + AES-256-GCM
- **Decryption**: Authenticated decryption with integrity verification
- **Chaotic Fingerprinting**: Additional security layer using logistic map sequences
- **Metadata Support**: Attach and encrypt metadata with messages

### 3. Smart Contract Features
- User registration with unique ID generation (NIN + BVN based)
- Secure fund deposits and withdrawals
- Peer-to-peer transfers with signature verification
- Proof-of-work validation for transaction integrity
- Event logging for complete audit trail

### 4. Transaction Anchoring
- Cryptographic anchors stored on-chain
- IPFS integration for encrypted trace storage
- Auditor access with ECDH-based encryption
- Tamper-proof verification system

## Project Structure

```
.
├── frontend/                    # Web interface
│   ├── index.html              # Main banking dashboard
│   ├── encrypt.html            # Encryption interface
│   ├── decrypt.html            # Decryption interface
│   ├── js/
│   │   ├── encrypt.js          # Encryption logic
│   │   ├── decrypt.js          # Decryption logic
│   │   └── wallet-simulation.js
│   ├── css/
│   │   └── style.css
│   └── plugins/                # Third-party libraries
│
├── chaotic-ecc/                # Backend & Smart Contracts
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.js        # Server entry point
│   │   │   ├── gateway.js      # Transaction gateway
│   │   │   ├── chaotic.js      # Chaotic fingerprinting
│   │   │   └── crypto.js       # Cryptographic utilities
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── contracts/
│   │   └── ChaoticECCAnchoring.sol  # Smart contract
│   │
│   ├── hardhat/
│   │   ├── hardhat.config.js
│   │   ├── scripts/deploy.js
│   │   └── package.json
│   │
│   ├── docker-compose.yml
│   └── README.md
│
└── README.md                   # This file
```

## Prerequisites

- **Node.js** v16+ and npm
- **Docker** and Docker Compose (for backend services)
- **MetaMask** browser extension
- **Git** for cloning the repository

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Start Backend Services

```bash
cd chaotic-ecc
docker compose up --build
```

This will start:
- Ganache (local Ethereum blockchain) on port 8545
- Hardhat node on port 8546
- IPFS node on ports 5001/8080
- Backend gateway on port 3000

### 3. Deploy Smart Contract

In a new terminal:

```bash
cd chaotic-ecc/hardhat
npm install
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address and update:
- `chaotic-ecc/backend/.env` → `CONTRACT_ADDRESS`
- `frontend/index.html` → `contractAddress` variable

### 4. Configure Backend

Create `chaotic-ecc/backend/.env`:

```env
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...  # From deployment
GATEWAY_PRIVATE_KEY=0x...  # Ganache account private key
AUDITOR_PUBLIC_KEY=0x...  # Optional
GATEWAY_SECRET=your-secret-key
PORT=3000
```

### 5. Launch Frontend

Open `frontend/index.html` in a web browser, or serve it using:

```bash
cd frontend
npx http-server -p 8000
```

Then navigate to `http://localhost:8000`

### 6. Connect MetaMask

1. Install MetaMask browser extension
2. Add local network:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency: ETH
3. Import a Ganache account using its private key
4. Click "Connect Wallet" in the app

## Usage Guide

### Banking Operations

1. **Connect Wallet**: Click the wallet button and approve MetaMask connection
2. **Register User**: First-time users need to register with username, NIN, and BVN
3. **Deposit Funds**: Click deposit and enter amount in ETH
4. **Withdraw**: Click withdraw, enter amount, and confirm transaction
5. **Transfer**: Click transfer, enter recipient address and amount
6. **View History**: Scroll down to see all your transactions

### Encryption/Decryption

#### Encrypting a Message

1. Navigate to `encrypt.html`
2. Enter or generate your private key
3. Enter recipient's public key
4. Type your message
5. (Optional) Add metadata JSON
6. (Optional) Generate seed secret for chaotic fingerprinting
7. Click "Encrypt Message"
8. Copy or download the encrypted result

#### Decrypting a Message

1. Navigate to `decrypt.html`
2. Enter your private key
3. Enter sender's public key
4. Paste encrypted data JSON
5. (Optional) Enter seed secret for fingerprint verification
6. Click "Decrypt Data"
7. View decrypted message and verification results

### API Endpoints

#### Submit Transaction for Anchoring

```bash
POST http://localhost:3000/submit
Content-Type: application/json

{
  "metadata": {
    "from": "0x...",
    "to": "0x...",
    "amount": 100,
    "ts": 1690000000,
    "txID": "tx-001"
  },
  "userPubKey": "0x...",
  "userSig": "0x..."
}
```

Response:
```json
{
  "ok": true,
  "anchor": "0x...",
  "F": "chaotic-fingerprint-hex",
  "ipfsCID": "enc:iv:tag:ct..."
}
```

## Cryptographic Details

### Chaotic Fingerprinting

The system uses logistic map iterations for generating deterministic chaotic sequences:

1. **Seed Generation**: `H(metadata || secret)` → 256-bit seed
2. **Unit Conversion**: Seed → x₀ ∈ [0,1)
3. **Logistic Iteration**: `xₙ₊₁ = r·xₙ·(1-xₙ)` where r=3.99, k=16 iterations
4. **Quantization**: Convert sequence to 64-byte buffer
5. **Final Hash**: `H(quantized || metadata)` → fingerprint

### Encryption Flow

1. **Key Derivation**: ECDH(privateKey, recipientPublicKey) → sharedSecret
2. **Key Hashing**: SHA-256(sharedSecret) → AES key
3. **Encryption**: AES-256-GCM(key, plaintext, metadata_as_AAD)
4. **Output**: {iv, ciphertext, tag, metadata, chaoticFingerprint}

### Smart Contract Security

- **Access Control**: Role-based permissions using OpenZeppelin
- **Signature Verification**: ECDSA signature validation
- **Proof-of-Work**: Nonce-based mining for transaction validation
- **Event Logging**: Complete audit trail via blockchain events

## Smart Contract Functions

### User Management
- `registerUser(username, NIN, BVN)`: Register new user with unique ID
- `login(uniqueID, hash, signature)`: Authenticate user

### Fund Operations
- `deposit()`: Deposit ETH (payable)
- `withdraw(amount)`: Withdraw ETH from balance
- `transferFunds(recipientID, amount, signature, nonce)`: Transfer to another user

### Anchoring (ChaoticECCAnchoring.sol)
- `storeAnchor(txID, anchorHash, owner, ipfsCID)`: Store transaction anchor
- `getAnchor(txID)`: Retrieve anchor details
- `verify(txID, candidateAnchor)`: Verify anchor integrity

## Security Considerations

### Production Deployment

⚠️ **This is a reference implementation for research purposes**

Before production use:

1. **Key Management**
   - Use Hardware Security Modules (HSM) for private keys
   - Implement proper key rotation policies
   - Never hardcode secrets in code

2. **Smart Contract Auditing**
   - Conduct professional security audits
   - Implement rate limiting and gas optimization
   - Add emergency pause functionality

3. **Backend Hardening**
   - Use HTTPS/TLS for all communications
   - Implement request validation and sanitization
   - Add rate limiting and DDoS protection
   - Use production-grade IPFS pinning services

4. **Frontend Security**
   - Implement Content Security Policy (CSP)
   - Validate all user inputs
   - Use secure random number generation
   - Implement proper error handling without leaking information

5. **Cryptographic Best Practices**
   - Use deterministic fixed-point quantization across platforms
   - Implement proper nonce management
   - Add replay attack protection
   - Use time-based validity windows

## Testing

### Run Backend Tests

```bash
cd chaotic-ecc/backend
npm test
```

### Test Smart Contract

```bash
cd chaotic-ecc/hardhat
npx hardhat test
```

### Manual Testing

1. Use the provided frontend interfaces
2. Test with Ganache accounts
3. Monitor transaction events in console
4. Verify anchors on blockchain explorer

## Troubleshooting

### MetaMask Connection Issues
- Ensure you're on the correct network (localhost:8545)
- Check that Ganache is running
- Try resetting MetaMask account

### Contract Deployment Fails
- Verify Ganache/Hardhat is running
- Check account has sufficient ETH
- Ensure contract address is updated in frontend

### Encryption/Decryption Errors
- Verify key formats (hex with 0x prefix)
- Check that keys match (sender/recipient)
- Ensure encrypted data is valid JSON

### Backend Gateway Errors
- Check environment variables are set
- Verify RPC_URL is accessible
- Ensure contract is deployed and address is correct

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Web3.js
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Backend**: Node.js, Express.js, Ethers.js
- **Blockchain**: Ethereum, Ganache, Hardhat
- **Storage**: IPFS
- **Cryptography**: Web Crypto API, Node.js Crypto, secp256k1
- **Containerization**: Docker, Docker Compose

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Research & References

This implementation is based on research in:
- Elliptic Curve Cryptography (ECC)
- Chaotic systems in cryptography
- Blockchain-based financial systems
- Zero-knowledge proofs and privacy-preserving protocols

## Disclaimer

This software is provided for educational and research purposes only. It is not intended for production use in financial systems without proper security audits, testing, and hardening. The authors assume no liability for any damages or losses resulting from the use of this software.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Review existing documentation
- Check troubleshooting section

---

**Built with ❤️ for secure, decentralized banking**
