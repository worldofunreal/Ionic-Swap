use candid::{CandidType, Deserialize};
use serde::Serialize;

// ============================================================================
// ICP GASLESS PERMIT TYPES
// ============================================================================

/// ICRC-2 permit request for gasless token transfers
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcpPermitRequest {
    /// Token canister ID (SPIRAL or STD)
    pub token: String,
    /// User's principal ID
    pub owner: String,
    /// Canister's principal ID (spender)
    pub spender: String,
    /// Amount to approve (in token units with decimals)
    pub amount: String,
    /// Expiration timestamp (Unix timestamp in seconds)
    pub deadline: String,
    /// ECDSA signature components
    pub v: String,
    pub r: String,
    pub s: String,
}

/// ICP swap request for cross-chain trading
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcpSwapRequest {
    /// Token to transfer to user (from canister's liquidity)
    pub destination_token: String,
    /// Amount to transfer to user
    pub destination_amount: String,
    /// User's destination address (EVM or Solana)
    pub destination_address: String,
    /// Destination chain (EVM or Solana)
    pub destination_chain: String,
}

/// ICP swap result
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct IcpSwapResult {
    /// Transaction hash or block number
    pub transaction_id: String,
    /// Success status
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
}

// ============================================================================
// ICRC TOKEN CONSTANTS
// ============================================================================

/// SPIRAL token canister ID
pub const SPIRAL_TOKEN_ID: &str = "uzt4z-lp777-77774-qaabq-cai";

/// STD token canister ID  
pub const STD_TOKEN_ID: &str = "umunu-kh777-77774-qaaca-cai";

/// ICRC-2 function selectors
pub const ICRC2_APPROVE_SELECTOR: &str = "icrc2_approve";
pub const ICRC2_TRANSFER_FROM_SELECTOR: &str = "icrc2_transfer_from";

// ============================================================================
// EIP-712 DOMAIN SEPARATION FOR ICP
// ============================================================================

/// EIP-712 domain for ICP permits (similar to EVM but for ICP)
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcpEip712Domain {
    pub name: String,
    pub version: String,
    pub chain_id: u64,
    pub verifying_contract: String, // Token canister ID
}

/// ICRC-2 permit message for EIP-712 signing
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcpPermitMessage {
    pub owner: String,
    pub spender: String,
    pub value: String,
    pub nonce: String,
    pub deadline: String,
}
