use candid::{CandidType, Deserialize};

// ============================================================================
// EVM NETWORK CONFIGURATION
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum EvmNetwork {
    Sepolia,
    Mainnet,
    Localhost,
}

impl Default for EvmNetwork {
    fn default() -> Self {
        EvmNetwork::Sepolia
    }
}

impl EvmNetwork {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            EvmNetwork::Sepolia => "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303",
            EvmNetwork::Mainnet => "https://mainnet.infura.io/v3/70b7e4d32357459a9af10d6503eae303",
            EvmNetwork::Localhost => "http://localhost:8545",
        }
    }
    
    pub fn chain_id(&self) -> u64 {
        match self {
            EvmNetwork::Sepolia => 11155111,
            EvmNetwork::Mainnet => 1,
            EvmNetwork::Localhost => 1337,
        }
    }
}

// ============================================================================
// EIP-2612 PERMIT TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct PermitRequest {
    pub token: String,        // ERC-20 token contract address
    pub owner: String,        // User's Ethereum address
    pub spender: String,      // Canister's Ethereum address
    pub value: String,        // Amount to approve (decimal string)
    pub deadline: String,     // Deadline timestamp (decimal string)
    pub v: String,           // Signature v component (decimal string)
    pub r: String,           // Signature r component (hex string)
    pub s: String,           // Signature s component (hex string)
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct GaslessApprovalRequest {
    pub permit_request: PermitRequest,
    pub token_address: String,  // ERC-20 token contract address
}

// ============================================================================
// EVM SWAP TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct EvmSwapRequest {
    pub token_in_mint: String,     // Input token contract address
    pub token_out_mint: String,    // Output token contract address
    pub amount_in: u64,            // Amount user wants to swap
    pub amount_out: u64,           // Amount user expects to receive
    pub min_amount_out: u64,       // Slippage protection
    pub deadline: u64,             // Expiry timestamp
    pub user_address: String,      // User's Ethereum address
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct EvmSwapResult {
    pub permit_tx_hash: String,    // Permit transaction hash
    pub swap_tx_hash: String,      // Swap transaction hash
    pub token_in_amount: u64,      // Amount user sent
    pub token_out_amount: u64,     // Amount user received
}
