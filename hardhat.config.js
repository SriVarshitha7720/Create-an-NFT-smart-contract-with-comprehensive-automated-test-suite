// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Use the same version as the contract pragma
  paths: {
    sources: "./contracts", // Where your .sol files are
    tests: "./test",       // Where your test files are
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    // We only need the default hardhat network for local testing
  }
};