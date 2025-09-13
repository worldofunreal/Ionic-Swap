pub mod http_client;
pub mod oracle;
pub mod solana;
pub mod evm;
pub mod types;
pub mod tokens;
pub mod icp;
pub mod user;
pub mod storage;

use candid::{CandidType, Deserialize, Principal};
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
    
    // Initialize internal token system
    icp::storage::init_storage();
    
}

#[post_upgrade]
fn post_upgrade(init_arg: Option<InitArg>) {
    if let Some(init_arg) = init_arg {
        if let Some(network) = init_arg.solana_network {
            solana::set_solana_network(network);
        }
    }
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
// ICP INTERNAL TOKEN FAUCET OPERATIONS
// ============================================================================

/// Claim 2M USDT from faucet (one-time only per principal)
#[update]
pub async fn claim_faucet() -> Result<String, String> {
    icp::faucet::claim_faucet().await
}

/// Get faucet claim info for a principal
#[query]
pub fn get_faucet_claim(user: Principal) -> Option<icp::types::FaucetClaim> {
    icp::faucet::get_faucet_claim(user)
}

/// Get balance of a token for a user
#[query]
pub fn get_token_balance(user: Principal, symbol: String) -> u64 {
    icp::balances::get_balance(user, &symbol)
}

/// Get all token balances for a user
#[query]
pub fn get_user_balances(user: Principal) -> Vec<(String, u64)> {
    let balances = icp::balances::get_user_balances(user);
    balances.into_iter().collect()
}

/// Transfer tokens between users
#[update]
pub fn transfer_tokens(from: Principal, to: Principal, symbol: String, amount: u64) -> Result<(), String> {
    icp::balances::transfer_tokens(from, to, &symbol, amount)
}

/// Get all internal tokens
#[query]
pub fn get_all_internal_tokens() -> Vec<icp::types::InternalToken> {
    icp::queries::get_all_tokens()
}

/// Get faucet statistics
#[query]
pub fn get_faucet_stats() -> (u64, u64) {
    icp::faucet::get_faucet_stats()
}

// ============================================================================
// USER MANAGEMENT OPERATIONS
// ============================================================================

/// User registration (requires signed call)
#[update]
pub async fn signup(
    username: String, 
    evm_address: Option<String>, 
    bitcoin_address: Option<String>, 
    solana_address: Option<String>
) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::signup(caller, username, evm_address, bitcoin_address, solana_address).await
}

/// Get user by principal
#[query]
pub fn get_user(principal: candid::Principal) -> Result<user::User, user::UserError> {
    user::get_user(principal)
}

/// Get user by username
#[query]
pub fn get_user_by_username(username: String) -> Result<user::User, user::UserError> {
    user::get_user_by_username(username)
}

/// Update user profile (requires signed call, owner only)
#[update]
pub async fn update_profile(update: user::UserUpdate) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::update_profile(caller, update).await
}

/// Individual field updates (requires signed call, owner only)
#[update]
pub async fn update_display_name(display_name: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_display_name(&display_name)?;
    user.display_name = Some(display_name);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_bio(bio: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_bio(&bio)?;
    user.bio = Some(bio);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_avatar(avatar_url: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user.avatar_url = Some(avatar_url);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_banner(banner_url: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user.banner_url = Some(banner_url);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_location(location: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_location(&location)?;
    user.location = Some(location);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_website(website: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_website(&website)?;
    user.website = Some(website);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_evm_address(evm_address: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_evm_address(&evm_address)?;
    user.evm_address = Some(evm_address);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_bitcoin_address(bitcoin_address: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_bitcoin_address(&bitcoin_address)?;
    user.bitcoin_address = Some(bitcoin_address);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

#[update]
pub async fn update_solana_address(solana_address: String) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    let mut user = user::UserDatabase::get_user(caller).ok_or(user::UserError::UserNotFound)?;
    user::validate_solana_address(&solana_address)?;
    user.solana_address = Some(solana_address);
    user.updated_at = ic_cdk::api::time();
    user::UserDatabase::update_user(user.clone());
    Ok(user)
}

/// Search users
#[query]
pub fn search_users(query: String, limit: u32) -> Result<Vec<user::CompactProfile>, user::UserError> {
    user::search_users(query, limit)
}

/// Personal search with follow state
#[query]
pub fn search_users_personal(query: String, limit: u32, caller: candid::Principal) -> Result<Vec<user::CompactProfile>, user::UserError> {
    user::search_users_personal(query, limit, caller)
}

/// Personal user lookup with follow state
#[query]
pub fn get_user_personal(target: candid::Principal, caller: candid::Principal) -> Result<user::PersonalUser, user::UserError> {
    user::get_user_personal(target, caller)
}

/// Check if username is available
#[query]
pub fn is_username_available(username: String) -> bool {
    user::is_username_available(username)
}

/// Get total user count
#[query]
pub fn get_user_count() -> u64 {
    user::get_user_count()
}

/// Get all usernames for sitemap generation
#[query]
pub fn get_all_usernames() -> Vec<String> {
    user::get_all_usernames()
}

/// Follow/Unfollow functionality
#[update]
pub async fn follow_user(target: candid::Principal) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::follow_user(caller, target).await
}

#[update]
pub async fn unfollow_user(target: candid::Principal) -> Result<user::User, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::unfollow_user(caller, target).await
}

/// Get following and followers lists
#[query]
pub fn get_following(user: candid::Principal) -> Vec<user::CompactProfile> {
    user::get_following(user)
}

#[query]
pub fn get_followers(user: candid::Principal) -> Vec<user::CompactProfile> {
    user::get_followers(user)
}

/// Check if user is following another user
#[query]
pub fn is_following(follower: candid::Principal, following: candid::Principal) -> bool {
    user::is_following(follower, following)
}

/// Delete account (requires signed call, owner only)
#[update]
pub async fn delete_account() -> Result<(), user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::delete_account(caller).await
}

// ============================================================================
// ASSET UPLOAD OPERATIONS
// ============================================================================

/// Asset upload functions (requires signed call, registered users only)
#[update]
pub async fn init_upload(
    file_path: String,
    file_size: u64,
    chunk_size: Option<u64>,
    file_hash: String,
) -> Result<(), user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    // Validate file size (max 1MB)
    const MAX_FILE_SIZE: u64 = 1 * 1024 * 1024; // 1MB
    if file_size > MAX_FILE_SIZE {
        return Err(user::UserError::InvalidInput("File size exceeds maximum allowed size (1MB)".to_string()));
    }
    
    user::init_upload(caller, file_path, file_size, chunk_size, file_hash).await
}

#[update]
pub async fn store_chunk(
    chunk_id: u64,
    chunk_data: Vec<u8>,
    file_path: String,
) -> Result<(), user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::store_chunk(caller, chunk_id, chunk_data, file_path).await
}

#[update]
pub async fn finalize_upload(file_path: String) -> Result<String, user::UserError> {
    let caller = ic_cdk::api::msg_caller();
    if caller == candid::Principal::anonymous() {
        return Err(user::UserError::Unauthorized);
    }
    
    user::finalize_upload(caller, file_path).await
}

/// HTTP request handler for serving assets
#[query]
pub fn http_request(req: ic_http_certification::HttpRequest) -> ic_http_certification::HttpResponse {
    user::http_request(req)
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

    /// Initialize canister token balances (admin function)
    #[update]
    pub fn init_canister_balances() -> Result<String, String> {
        let canister_id = ic_cdk::api::canister_self();
        let token_symbols = vec!["BTC", "ETH", "XRP", "USDT", "BNB", "SOL", "USDC", "DOGE", "ADA", "TRX", "ICP"];
        let mut initialized = Vec::new();
        
        for symbol in token_symbols {
            if let Some(token) = icp::storage::IcpTokenDatabase::get_token(symbol) {
                let current_balance = icp::storage::IcpTokenDatabase::get_balance(canister_id, symbol);
                if current_balance == 0 {
                    icp::storage::IcpTokenDatabase::set_balance(canister_id, symbol, token.total_supply);
                    initialized.push(format!("{}: {}", symbol, token.total_supply));
                    ic_cdk::println!("✅ Initialized canister balance for {}: {}", symbol, token.total_supply);
                }
            }
        }
        
        if initialized.is_empty() {
            Ok("All canister balances already initialized".to_string())
        } else {
            Ok(format!("Initialized balances: {}", initialized.join(", ")))
        }
    }

    /// Initialize all missing tokens (admin function)
    #[update]
    pub fn init_all_tokens() -> Result<String, String> {
        let canister_id = ic_cdk::api::canister_self();
        let mut added_tokens = Vec::new();
        
        // Define all tokens that should exist
        let all_tokens = vec![
            ("BTC", "Bitcoin", 8, 21_000_000_000_000_000),
            ("ETH", "Ethereum", 18, 120_000_000_000_000_000),
            ("XRP", "XRP", 6, 100_000_000_000_000_000),
            ("USDT", "Tether USD", 6, 1_000_000_000_000_000),
            ("BNB", "BNB", 18, 200_000_000_000_000_000),
            ("SOL", "Solana", 9, 500_000_000_000_000_000),
            ("USDC", "USD Coin", 6, 1_000_000_000_000_000),
            ("DOGE", "Dogecoin", 8, 130_000_000_000_000_000),
            ("ADA", "Cardano", 6, 45_000_000_000_000_000),
            ("TRX", "TRON", 6, 100_000_000_000_000_000),
            ("ICP", "Internet Computer", 8, 500_000_000_000_000_000),
        ];
        
        for (symbol, name, decimals, total_supply) in all_tokens {
            // Check if token already exists
            if icp::storage::IcpTokenDatabase::get_token(symbol).is_none() {
                // Create and add the token
                let token = icp::types::InternalToken {
                    symbol: symbol.to_string(),
                    name: name.to_string(),
                    decimals,
                    total_supply,
                    owner: canister_id,
                };
                
                icp::storage::TokenStorage::create_token(token.clone()).unwrap_or_else(|e| {
                    ic_cdk::println!("Warning: Failed to create token {}: {}", symbol, e);
                });
                
                // Initialize canister balance
                icp::storage::IcpTokenDatabase::set_balance(canister_id, symbol, total_supply);
                
                added_tokens.push(format!("{}: {}", symbol, total_supply));
            }
        }
        
        if added_tokens.is_empty() {
            Ok("All tokens already exist".to_string())
        } else {
            Ok(format!("Added tokens: {}", added_tokens.join(", ")))
        }
    }

// ============================================================================
// TRADING OPERATIONS
// ============================================================================

/// Execute a market swap between internal tokens
#[update]
pub async fn market_swap(request: icp::swap::SwapRequest) -> Result<icp::swap::SwapResult, String> {
    let caller = ic_cdk::api::msg_caller();
    icp::swap::market_swap(caller, request).await
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Enable Candid export
ic_cdk::export_candid!();