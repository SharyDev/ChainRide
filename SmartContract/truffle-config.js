// Load environment variables from .env file
//require('dotenv').config();
// const { MNEMONIC, PROJECT_ID } = process.env;

// Uncomment if you plan to use Infura or another provider for remote deployment
// const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client.
   * If no network is specified, truffle uses the default local development network.
   */
  networks: {
    // Local development network (Ganache or Geth running locally)
    development: {
      host: "127.0.0.1",  // Localhost
      port: 7545,         // Standard Ethereum port (Ganache CLI default)
      network_id: "*",    // Match any network ID
     // gas: 6721975,       // Gas limit (can be adjusted as necessary)
      //gasPrice: 20000000000, // Gas price (20 Gwei)
    },

    // Uncomment and modify for deployment to public test networks like Goerli
    // goerli: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://goerli.infura.io/v3/${PROJECT_ID}`),
    //   network_id: 5,       // Goerli's network ID
    //   confirmations: 2,    // # of confirmations before considering a deployment successful
    //   timeoutBlocks: 200,  // # of blocks before a deployment times out
    //   skipDryRun: true     // Skip dry run before deployment
    // },

    // Uncomment and modify for private network deployments (e.g., custom blockchain)
    // private: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://custom-network.io`),
    //   network_id: 2111,    // Custom network ID
    //   production: true     // Treat as public network
    // }
  },

  // Optional Mocha configuration for testing (set timeout or reporters)
  mocha: {
    // timeout: 100000
  },

  // Solidity compiler settings
  compilers: {
    solc: {
      version: "0.4.26",  // Solidity version (compatible with your contract files)
    }
  }
};
