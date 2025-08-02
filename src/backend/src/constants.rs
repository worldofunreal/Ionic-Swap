// ============================================================================
// CONSTANTS
// ============================================================================

pub const SEPOLIA_CHAIN_ID: u64 = 11155111;
pub const EIP1559_TX_ID: u8 = 2;



// HTLC Contract (newly deployed)
pub const HTLC_CONTRACT_ADDRESS: &str = "0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d";
pub const SPIRAL_TOKEN_ADDRESS: &str = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
pub const STARDUST_TOKEN_ADDRESS: &str = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90";

// ICRC-1 Token Canister IDs
pub const SPIRAL_ICRC_CANISTER_ID: &str = "mxzaz-hqaaa-aaaar-qaada-cai";
pub const STARDUST_ICRC_CANISTER_ID: &str = "myb77-3aaaa-aaaar-qaaea-cai";

pub const ICP_SIGNER_ADDRESS: &str = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";
pub const INFURA_URL: &str = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

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