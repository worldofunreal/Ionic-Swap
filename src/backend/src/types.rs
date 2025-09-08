use candid::{CandidType, Deserialize};
use std::collections::HashMap;

// ============================================================================
// PERMIT SYSTEM TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PermitMessage {
    pub order_id: [u8; 32],
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub user_pubkey: String,
    pub nonce: u64,
    pub deadline: i64,
    pub token_mint: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PermitSignature {
    pub r: [u8; 32],
    pub s: [u8; 32],
    pub v: u8,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PermitData {
    pub message: PermitMessage,
    pub signature: PermitSignature,
}

// ============================================================================
// ESCROW TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct EscrowOrder {
    pub order_id: [u8; 32],
    pub user_pubkey: String,
    pub token_mint: String,
    pub amount: u64,
    pub expiry_timestamp: u64,
    pub nonce: u64,
    pub deadline: u64,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub transaction_hash: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum EscrowStatus {
    Pending,
    Created,
    Expired,
    Claimed,
    Refunded,
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SolanaTransaction {
    pub instructions: Vec<SolanaInstruction>,
    pub recent_blockhash: String,
    pub fee_payer: String,
    pub signatures: Vec<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SolanaInstruction {
    pub program_id: String,
    pub accounts: Vec<SolanaAccountMeta>,
    pub data: Vec<u8>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SolanaAccountMeta {
    pub pubkey: String,
    pub is_signer: bool,
    pub is_writable: bool,
}

// ============================================================================
// WALLET TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SolanaWallet {
    pub owner: String, // Principal as string
    pub solana_address: String,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct WalletBalance {
    pub sol_balance: u64,
    pub token_balances: HashMap<String, u64>, // mint -> balance
    pub last_updated: u64,
}

// ============================================================================
// SPL TOKEN TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SPLTokenAccount {
    pub address: String,
    pub mint: String,
    pub owner: String,
    pub amount: u64,
    pub decimals: u8,
    pub is_initialized: bool,
    pub is_frozen: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SPLTokenMint {
    pub address: String,
    pub supply: u64,
    pub decimals: u8,
    pub mint_authority: Option<String>,
    pub freeze_authority: Option<String>,
    pub is_initialized: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SPLTokenTransfer {
    pub from: String,
    pub to: String,
    pub amount: u64,
    pub mint: String,
    pub transaction_hash: String,
    pub timestamp: u64,
}

// ============================================================================
// NETWORK TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SolanaNetwork {
    Devnet,
    Testnet,
    Mainnet,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct NetworkInfo {
    pub network: SolanaNetwork,
    pub rpc_url: String,
    pub cluster_name: String,
    pub is_healthy: bool,
    pub last_checked: u64,
}

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SolanaError {
    pub code: i32,
    pub message: String,
    pub details: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum BackendError {
    InvalidInput(String),
    NetworkError(String),
    SignatureError(String),
    InsufficientFunds(String),
    TokenError(String),
    EscrowError(String),
    Unknown(String),
}

impl BackendError {
    pub fn message(&self) -> String {
        match self {
            BackendError::InvalidInput(msg) => format!("Invalid input: {}", msg),
            BackendError::NetworkError(msg) => format!("Network error: {}", msg),
            BackendError::SignatureError(msg) => format!("Signature error: {}", msg),
            BackendError::InsufficientFunds(msg) => format!("Insufficient funds: {}", msg),
            BackendError::TokenError(msg) => format!("Token error: {}", msg),
            BackendError::EscrowError(msg) => format!("Escrow error: {}", msg),
            BackendError::Unknown(msg) => format!("Unknown error: {}", msg),
        }
    }
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PermitResult {
    pub success: bool,
    pub transaction_hash: Option<String>,
    pub error_message: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BalanceResult {
    pub success: bool,
    pub balance: Option<u64>,
    pub error_message: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransactionResult {
    pub success: bool,
    pub transaction_hash: Option<String>,
    pub error_message: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct WalletResult {
    pub success: bool,
    pub wallet: Option<SolanaWallet>,
    pub error_message: Option<String>,
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BackendConfig {
    pub solana_network: SolanaNetwork,
    pub rpc_timeout_ms: u64,
    pub max_retries: u32,
    pub enable_logging: bool,
    pub gasless_permit_enabled: bool,
}

impl Default for BackendConfig {
    fn default() -> Self {
        Self {
            solana_network: SolanaNetwork::Devnet,
            rpc_timeout_ms: 30000,
            max_retries: 3,
            enable_logging: true,
            gasless_permit_enabled: true,
        }
    }
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BackendStats {
    pub total_permits_created: u64,
    pub total_tokens_transferred: u64,
    pub total_transactions: u64,
    pub successful_transactions: u64,
    pub failed_transactions: u64,
    pub last_reset: u64,
}

impl Default for BackendStats {
    fn default() -> Self {
        Self {
            total_permits_created: 0,
            total_tokens_transferred: 0,
            total_transactions: 0,
            successful_transactions: 0,
            failed_transactions: 0,
            last_reset: ic_cdk::api::time(),
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

impl SolanaNetwork {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            SolanaNetwork::Devnet => "https://api.devnet.solana.com",
            SolanaNetwork::Testnet => "https://api.testnet.solana.com",
            SolanaNetwork::Mainnet => "https://api.mainnet-beta.solana.com",
        }
    }
    
    pub fn cluster_name(&self) -> &'static str {
        match self {
            SolanaNetwork::Devnet => "devnet",
            SolanaNetwork::Testnet => "testnet",
            SolanaNetwork::Mainnet => "mainnet-beta",
        }
    }
}

impl EscrowOrder {
    pub fn new(
        order_id: [u8; 32],
        user_pubkey: String,
        token_mint: String,
        amount: u64,
        expiry_timestamp: u64,
        nonce: u64,
        deadline: u64,
    ) -> Self {
        Self {
            order_id,
            user_pubkey,
            token_mint,
            amount,
            expiry_timestamp,
            nonce,
            deadline,
            status: EscrowStatus::Pending,
            created_at: ic_cdk::api::time(),
            transaction_hash: None,
        }
    }
    
    pub fn is_expired(&self) -> bool {
        ic_cdk::api::time() > self.expiry_timestamp
    }
    
    pub fn is_deadline_passed(&self) -> bool {
        ic_cdk::api::time() > self.deadline
    }
}
