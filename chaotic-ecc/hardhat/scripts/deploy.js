const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // 1. WalletRegistry
  const Registry = await ethers.getContractFactory('WalletRegistry');
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log('WalletRegistry:', await registry.getAddress());

  // 2. CryptoWallet
  const Wallet = await ethers.getContractFactory('CryptoWallet');
  const wallet = await Wallet.deploy(await registry.getAddress());
  await wallet.waitForDeployment();
  console.log('CryptoWallet:', await wallet.getAddress());

  // 3. ChaoticECCAnchoring
  const Anchoring = await ethers.getContractFactory('ChaoticECCAnchoring');
  const anchoring = await Anchoring.deploy(deployer.address);
  await anchoring.waitForDeployment();
  console.log('ChaoticECCAnchoring:', await anchoring.getAddress());

  // 4. TransactionAudit
  const Audit = await ethers.getContractFactory('TransactionAudit');
  const audit = await Audit.deploy(deployer.address, deployer.address);
  await audit.waitForDeployment();
  console.log('TransactionAudit:', await audit.getAddress());

  console.log('\nUpdate your .env with these addresses.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
