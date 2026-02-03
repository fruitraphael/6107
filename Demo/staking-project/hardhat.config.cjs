/**
 * Hardhat config (CommonJS) for Hardhat v2.x
 */

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {}
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts"
  },
  mocha: {
    timeout: 200000
  }
};
