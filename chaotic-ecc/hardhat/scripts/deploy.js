const hre = require("hardhat");

async function main() {
  const [deployer, gateway] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const ChaoticECC = await hre.ethers.getContractFactory("ChaoticECCAnchoring");
  const chaotic = await ChaoticECC.connect(deployer).deploy(gateway.address);
  await chaotic.deployed();

  console.log("ChaoticECCAnchoring deployed to:", chaotic.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
