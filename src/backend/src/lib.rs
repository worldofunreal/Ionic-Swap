pub mod http_client;
pub mod oracle;
pub mod solana;
pub mod evm;
pub mod icp;
pub mod types;
pub mod tokens;

use candid::{CandidType, Deserialize};
use ic_cdk::{init, post_upgrade, update, query};

// ============================================================================
// INITIALIZATION
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Default)]
pub struct InitArg {
    pub solana_network: Option<solana::SolanaNetwork>,
}

#[init]
pub fn init(init_arg: InitArg) {
    if let Some(network) = init_arg.solana_network {
        solana::set_solana_network(network);
    }
    ic_cdk::println!("Backend initialized with network: {:?}", solana::get_solana_network());
}

#[post_upgrade]
fn post_upgrade(init_arg: Option<InitArg>) {
    if let Some(init_arg) = init_arg {
        if let Some(network) = init_arg.solana_network {
            solana::set_solana_network(network);
        }
    }
    ic_cdk::println!("Backend post-upgrade with network: {:?}", solana::get_solana_network());
}

// ============================================================================
// PERMIT SYSTEM TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone)]
pub struct PermitMessage {
    pub order_id: [u8; 32],
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub user_pubkey: String,
    pub nonce: u64,
    pub deadline: i64,
    pub token_mint: String,
}

// Removed unused types: CreateEscrowWithPermitArgs, PermitResult

// ============================================================================
// SOLANA OPERATIONS
// ============================================================================

/// Get the canister's own public key (always returns canister's wallet)
#[update]
pub async fn get_canister_public_key() -> String {
    solana::get_canister_public_key().await
}

/// Get comprehensive Solana token balances for all known tokens
#[update]
pub async fn get_solana_token_balances() -> Result<String, String> {
    solana::get_solana_token_balances().await
}

/// Test Ed25519 key generation and signing
#[update]
pub async fn test_ed25519() -> Result<String, String> {
    solana::test_ed25519().await
}

/// Submit atomic delegation + transfer transaction (gasless for user)
#[update]
pub async fn submit_delegation_transaction(transaction_data: Vec<u8>) -> Result<String, String> {
    solana::submit_delegation_transaction(transaction_data).await
}

/// Submit atomic swap transaction (delegation + immediate liquidity transfer)
#[update]
pub async fn swap_solana(
    delegation_tx_data: Vec<u8>,
    swap_request: solana::SwapRequest
) -> Result<solana::SwapResult, String> {
    solana::swap_solana(delegation_tx_data, swap_request).await
}

// ============================================================================
// PRICE ORACLE OPERATIONS
// ============================================================================

/// Update all prices from all sources (manual trigger)
#[update]
pub async fn update_prices() -> Result<oracle::PriceUpdateResult, String> {
    oracle::update_all_prices().await
}

/// Get current prices from cache
#[query]
pub async fn get_current_prices() -> Result<String, String> {
    let prices = oracle::get_current_prices().await?;
    Ok(serde_json::to_string(&prices).map_err(|e| format!("Failed to serialize prices: {}", e))?)
}

/// Get specific trading pair price
#[query]
pub async fn get_pair_price(symbol: String) -> Result<oracle::TradingPair, String> {
    oracle::get_pair_price(&symbol).await
}

/// Start the price update scheduler (runs every second)
#[update]
pub async fn start_price_scheduler() -> Result<String, String> {
    oracle::start_price_scheduler().await
}

/// Stop the price update scheduler
#[update]
pub async fn stop_price_scheduler() -> Result<String, String> {
    oracle::stop_price_scheduler().await
}

/// Debug function to test external API calls (for testing only)
#[update]
pub async fn debug_test_external_apis() -> Result<String, String> {
    oracle::debug_test_external_apis().await
}

// ============================================================================
// EVM OPERATIONS
// ============================================================================

/// Get the canister's own Ethereum address (always returns canister's wallet)
#[query]
pub async fn get_canister_ethereum_address() -> String {
    evm::get_canister_ethereum_address().await
}

/// Test secp256k1 key generation and signing
#[update]
pub async fn test_secp256k1() -> Result<String, String> {
    evm::test_secp256k1().await
}

/// Test simple EVM transaction (get nonce, etc.)
#[update]
pub async fn test_simple_evm_transaction() -> Result<String, String> {
    evm::test_simple_transaction().await
}

/// Debug function to verify wallet address matches signer
#[update]
pub async fn debug_wallet_verification() -> Result<String, String> {
    evm::debug_wallet_verification().await
}

/// Submit gasless permit transaction (user signs permit, canister pays gas)
#[update]
pub async fn submit_gasless_permit(permit_request: evm::PermitRequest) -> Result<String, String> {
    evm::submit_gasless_permit(permit_request).await
}

/// Submit atomic EVM swap transaction (permit + immediate token transfer)
#[update]
pub async fn swap_evm(
    permit_request: evm::PermitRequest,
    swap_request: evm::EvmSwapRequest
) -> Result<evm::EvmSwapResult, String> {
    evm::swap_evm(permit_request, swap_request).await
}

// ============================================================================
// ICP OPERATIONS
// ============================================================================

/// Submit gasless permit transaction (user signs permit, canister pays gas)
#[update]
pub async fn submit_icp_gasless_permit(permit_request: icp::IcpPermitRequest) -> Result<String, String> {
    icp::submit_icp_gasless_permit(permit_request).await
}


/// Get canister's ICRC token balances
#[update]
pub async fn get_canister_icrc_balances() -> Result<String, String> {
    icp::get_canister_icrc_balances().await
}


// ============================================================================
// TOKEN REGISTRY OPERATIONS
// ============================================================================

/// Get all supported tokens with their chain deployments
#[query]
pub fn get_all_supported_tokens() -> Result<String, String> {
    let tokens = tokens::get_all_tokens();
    serde_json::to_string(&tokens)
        .map_err(|e| format!("Failed to serialize tokens: {}", e))
}

/// Get token information by symbol
#[query]
pub fn get_token_info(symbol: String) -> Result<String, String> {
    match tokens::get_token_info(&symbol) {
        Some(token) => serde_json::to_string(&token)
            .map_err(|e| format!("Failed to serialize token info: {}", e)),
        None => Err(format!("Token {} not found", symbol))
    }
}

/// Get tokens deployed on specific chain
#[query]
pub fn get_tokens_by_chain(chain: String) -> Result<String, String> {
    let chain_type = match chain.to_lowercase().as_str() {
        "evm" => tokens::ChainType::EVM,
        "solana" => tokens::ChainType::Solana,
        "icp" => tokens::ChainType::ICP,
        _ => return Err("Invalid chain type. Use: evm, solana, or icp".to_string()),
    };
    
    let tokens = tokens::get_tokens_by_chain(&chain_type);
    serde_json::to_string(&tokens)
        .map_err(|e| format!("Failed to serialize tokens: {}", e))
}

/// Get token address on specific chain
#[query]
pub fn get_token_address(symbol: String, chain: String) -> Result<String, String> {
    let chain_type = match chain.to_lowercase().as_str() {
        "evm" => tokens::ChainType::EVM,
        "solana" => tokens::ChainType::Solana,
        "icp" => tokens::ChainType::ICP,
        _ => return Err("Invalid chain type. Use: evm, solana, or icp".to_string()),
    };
    
    match tokens::get_token_address(&symbol, &chain_type) {
        Some(address) => Ok(address),
        None => Err(format!("Token {} not deployed on {}", symbol, chain))
    }
}

/// Check if token is deployed on chain
#[query]
pub fn is_token_deployed(symbol: String, chain: String) -> Result<bool, String> {
    let chain_type = match chain.to_lowercase().as_str() {
        "evm" => tokens::ChainType::EVM,
        "solana" => tokens::ChainType::Solana,
        "icp" => tokens::ChainType::ICP,
        _ => return Err("Invalid chain type. Use: evm, solana, or icp".to_string()),
    };
    
    Ok(tokens::is_token_deployed(&symbol, &chain_type))
}

/// Get token registry statistics
#[query]
pub fn get_token_registry_stats() -> Result<String, String> {
    let stats = tokens::get_registry_stats();
    serde_json::to_string(&stats)
        .map_err(|e| format!("Failed to serialize stats: {}", e))
}

/// Export complete token registry (admin function)
#[query]
pub fn export_token_registry() -> Result<String, String> {
    tokens::export_token_registry()
}

/// Reload token registry from chain definitions (admin function)
#[update]
pub fn reload_token_registry() -> Result<String, String> {
    tokens::reload_token_registry()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Enable Candid export
ic_cdk::export_candid!();