require("@nomiclabs/hardhat-ethers");
const path = require('path');

module.exports = {
  solidity: "0.8.20",
  paths: {
    artifacts: path.join(__dirname, '..', 'backend', 'artifacts')
  },
  networks: {
    localhost: {
      url: "http://ganache:8545"
    }
  }
};
