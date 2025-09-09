pub mod http_client;
pub mod oracle;
pub mod solana;
pub mod types;

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
// UTILITY FUNCTIONS
// ============================================================================

// Enable Candid export
ic_cdk::export_candid!();