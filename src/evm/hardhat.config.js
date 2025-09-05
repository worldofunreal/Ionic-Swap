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
    },

    // Ethereum testnets
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "https://holesky.infura.io/v3/YOUR-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 17000,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 20000000000, // 20 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    // Polygon testnets
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 30000000000, // 30 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    amoy: {
      url: process.env.AMOY_RPC_URL || "https://polygon-amoy.infura.io/v3/YOUR-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 30000000000, // 30 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    // BSC testnets
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 10000000000, // 10 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    // Arbitrum testnets
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 100000000, // 0.1 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    // Optimism testnets
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155420,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 1000000, // 0.001 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    },

    // Base testnets
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : 1000000, // 0.001 gwei default
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
      timeout: 60000
    }
  },
  
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      holesky: process.env.ETHERSCAN_API_KEY || "",
      mumbai: process.env.POLYGONSCAN_API_KEY || "",
      amoy: process.env.POLYGONSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      optimismSepolia: process.env.OPTIMISM_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
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
      },
      {
        network: "mumbai",
        chainId: 80001,
        urls: {
          apiURL: "https://api-testnet.polygonscan.com/api",
          browserURL: "https://mumbai.polygonscan.com"
        }
      },
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      },
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
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