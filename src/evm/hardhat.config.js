require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    
    // Sepolia Testnet (for initial testing)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 20000000000, // 20 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },
    
    // Etherlink Testnet
    etherlinkTestnet: {
      url: process.env.ETHERLINK_TESTNET_RPC_URL || "https://node.ghostnet.tezos.marigold.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 128123, // Etherlink testnet chain ID
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 1000000000, // 1 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },
    
    // Etherlink Mainnet
    etherlinkMainnet: {
      url: process.env.ETHERLINK_MAINNET_RPC_URL || "https://node.mainnet.tezos.marigold.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42766, // Etherlink mainnet chain ID
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 1000000000, // 1 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },
    
    // SKALE Europa Hub Testnet
    europaTestnet: {
      url: process.env.EUROPA_TESTNET_RPC_URL || "https://testnet.skalenodes.com/v1/juicy-low-small-testnet",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1444673419, // Europa testnet chain ID
      gasPrice: 100000, // Gas price from Europa testnet (0x186a0 = 100,000 wei)
      gas: 5000000, // Standard gas limit
      timeout: 60000,
      allowUnlimitedContractSize: true
    },
    
    // SKALE Europa Hub Mainnet
    europaMainnet: {
      url: process.env.EUROPA_MAINNET_RPC_URL || "https://mainnet.skalenodes.com/v1/elated-tan-skat",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 2046399126, // Europa mainnet chain ID
      gasPrice: 100000, // Gas price from Europa mainnet
      gas: 5000000, // Standard gas limit
      timeout: 60000,
      allowUnlimitedContractSize: true
    }
  },
  
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      etherlink: process.env.ETHERLINK_EXPLORER_API_KEY || "",
      etherlinkTestnet: process.env.ETHERLINK_EXPLORER_API_KEY || ""
    },
    customChains: [
      {
        network: "etherlink",
        chainId: 42766,
        urls: {
          apiURL: "https://explorer.etherlink.com/api",
          browserURL: "https://explorer.etherlink.com"
        }
      },
      {
        network: "etherlinkTestnet",
        chainId: 128123,
        urls: {
          apiURL: "https://testnet-explorer.etherlink.com/api",
          browserURL: "https://testnet-explorer.etherlink.com"
        }
      },
      {
        network: "europaTestnet",
        chainId: 1444673419,
        urls: {
          apiURL: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com/api",
          browserURL: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com"
        }
      },
      {
        network: "europaMainnet",
        chainId: 2046399126,
        urls: {
          apiURL: "https://elated-tan-skat.explorer.mainnet.skalenodes.com/api",
          browserURL: "https://elated-tan-skat.explorer.mainnet.skalenodes.com"
        }
      }
    ]
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 5
  },
  
  mocha: {
    timeout: 60000
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 