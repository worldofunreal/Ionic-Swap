// ============================================================================
// CONSTANTS
// ============================================================================

pub const SEPOLIA_CHAIN_ID: u64 = 11155111;

// Ethereum testnets
pub const HOLESKY_CHAIN_ID: u64 = 17000;

// Polygon testnets
pub const MUMBAI_CHAIN_ID: u64 = 80001;
pub const AMOY_CHAIN_ID: u64 = 80002;

// BSC testnets
pub const BSC_TESTNET_CHAIN_ID: u64 = 97;
pub const CHAPEL_CHAIN_ID: u64 = 97;

// Arbitrum testnets
pub const ARBITRUM_SEPOLIA_CHAIN_ID: u64 = 421614;
pub const ARBITRUM_GOERLI_CHAIN_ID: u64 = 421613;

// Optimism testnets
pub const OPTIMISM_SEPOLIA_CHAIN_ID: u64 = 11155420;
pub const OPTIMISM_GOERLI_CHAIN_ID: u64 = 420;

// Base testnets
pub const BASE_SEPOLIA_CHAIN_ID: u64 = 84532;
pub const BASE_GOERLI_CHAIN_ID: u64 = 84531;

// SKALE Europa Hub Chain IDs (unused - keeping for future reference)
// pub const EUROPA_TESTNET_CHAIN_ID: u64 = 1444673419;
// pub const EUROPA_MAINNET_CHAIN_ID: u64 = 2046399126;


pub const EIP1559_TX_ID: u8 = 2;

// ============================================================================
// SEPOLIA CONTRACTS (Working System)
// ============================================================================

// HTLC Contract (newly deployed)
pub const HTLC_CONTRACT_ADDRESS: &str = "0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d";

// pub const SPIRAL_TOKEN_ADDRESS: &str = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";

// pub const STARDUST_TOKEN_ADDRESS: &str = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90";

// ============================================================================
// EUROPA CONTRACTS (Newly Deployed)
// ============================================================================


pub const EUROPA_HTLC_CONTRACT_ADDRESS: &str = "0x6fFfB1Ca5249C76671F4b5426e7f316Ae4B94f8D";

// pub const EUROPA_SPIRAL_TOKEN_ADDRESS: &str = "0xcF0ad4183EB419ced2F709C75E4c937b8d7708d8";

// pub const EUROPA_STARDUST_TOKEN_ADDRESS: &str = "0x9229D364070b6B8bEe81F75D076Dc67AEded3365";

// ICRC-1 Token Canister IDs

pub const SPIRAL_ICRC_CANISTER_ID: &str = "mxzaz-hqaaa-aaaar-qaada-cai";

pub const STARDUST_ICRC_CANISTER_ID: &str = "myb77-3aaaa-aaaar-qaaea-cai";

pub const ICP_SIGNER_ADDRESS: &str = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";

// ============================================================================
// RPC ENDPOINTS
// ============================================================================

// Ethereum testnets
pub const SEPOLIA_RPC_URL: &str = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
pub const HOLESKY_RPC_URL: &str = "https://holesky.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

// Polygon testnets
pub const MUMBAI_RPC_URL: &str = "https://polygon-mumbai.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
pub const AMOY_RPC_URL: &str = "https://polygon-amoy.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

// BSC testnets
pub const BSC_TESTNET_RPC_URL: &str = "https://data-seed-prebsc-1-s1.binance.org:8545";
pub const CHAPEL_RPC_URL: &str = "https://data-seed-prebsc-1-s1.binance.org:8545";

// Arbitrum testnets
pub const ARBITRUM_SEPOLIA_RPC_URL: &str = "https://sepolia-rollup.arbitrum.io/rpc";
pub const ARBITRUM_GOERLI_RPC_URL: &str = "https://goerli-rollup.arbitrum.io/rpc";

// Optimism testnets
pub const OPTIMISM_SEPOLIA_RPC_URL: &str = "https://sepolia.optimism.io";
pub const OPTIMISM_GOERLI_RPC_URL: &str = "https://goerli.optimism.io";

// Base testnets
pub const BASE_SEPOLIA_RPC_URL: &str = "https://sepolia.base.org";
pub const BASE_GOERLI_RPC_URL: &str = "https://goerli.base.org";

// Legacy (keeping for compatibility)
pub const INFURA_URL: &str = SEPOLIA_RPC_URL;

// Function selectors for HTLC contract

pub const CREATE_HTLC_ERC20_SELECTOR: &str = "0x0c89e296";

pub const CLAIM_HTLC_SELECTOR: &str = "0xfa971dd7";

pub const REFUND_HTLC_SELECTOR: &str = "0x95ccea67";

pub const GET_HTLC_SELECTOR: &str = "0x7a22cf61";

// Legacy function selectors (keeping for reference)
pub const ICP_NETWORK_SIGNER_SELECTOR: &str = "0x2a92b710";
pub const CLAIM_FEE_SELECTOR: &str = "0x99d32fc4";
pub const REFUND_FEE_SELECTOR: &str = "0x90fe6ddb";
pub const TOTAL_FEES_SELECTOR: &str = "0x60c6d8ae"; 

// Factory Contract (legacy - keeping for compatibility - old deployment)
pub const FACTORY_ADDRESS: &str = "0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d";