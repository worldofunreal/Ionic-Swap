use std::sync::{Mutex, OnceLock};
use crate::tokens::types::*;
use serde::Serialize;

// ============================================================================
// GLOBAL TOKEN REGISTRY
// ============================================================================

static TOKEN_REGISTRY: OnceLock<Mutex<TokenRegistry>> = OnceLock::new();

/// Initialize the token registry
pub fn init_token_registry() -> &'static Mutex<TokenRegistry> {
    TOKEN_REGISTRY.get_or_init(|| {
        let mut registry = TokenRegistry::new();
        
        // Initialize with all supported tokens
        initialize_all_tokens(&mut registry);
        
        Mutex::new(registry)
    })
}

/// Get a reference to the token registry
pub fn get_token_registry() -> &'static Mutex<TokenRegistry> {
    init_token_registry()
}

// ============================================================================
// TOKEN REGISTRY OPERATIONS
// ============================================================================

/// Get token information by symbol
pub fn get_token_info(symbol: &str) -> Option<TokenInfo> {
    let registry = get_token_registry().lock().unwrap();
    registry.get_token(symbol).cloned()
}

/// Get all tokens
pub fn get_all_tokens() -> Vec<TokenInfo> {
    let registry = get_token_registry().lock().unwrap();
    registry.get_all_tokens().into_iter().cloned().collect()
}

/// Get tokens by chain
pub fn get_tokens_by_chain(chain: &ChainType) -> Vec<TokenInfo> {
    let registry = get_token_registry().lock().unwrap();
    registry.get_tokens_by_chain(chain).into_iter().cloned().collect()
}

/// Get token address on specific chain
pub fn get_token_address(symbol: &str, chain: &ChainType) -> Option<String> {
    let registry = get_token_registry().lock().unwrap();
    registry.get_token(symbol)?.get_address_on(chain)
}

/// Check if token is deployed on chain
pub fn is_token_deployed(symbol: &str, chain: &ChainType) -> bool {
    let registry = get_token_registry().lock().unwrap();
    registry.get_token(symbol)
        .map(|token| token.is_deployed_on(chain))
        .unwrap_or(false)
}

/// Get registry statistics
pub fn get_registry_stats() -> RegistryStats {
    let registry = get_token_registry().lock().unwrap();
    RegistryStats {
        total_tokens: registry.get_token_count(),
        evm_tokens: registry.get_chain_token_count(&ChainType::EVM),
        solana_tokens: registry.get_chain_token_count(&ChainType::Solana),
        icp_tokens: registry.get_chain_token_count(&ChainType::ICP),
        last_updated: registry.last_updated,
        version: registry.version,
    }
}

/// Add or update a token in the registry
pub fn add_or_update_token(token: TokenInfo) -> Result<String, String> {
    let mut registry = get_token_registry().lock().unwrap();
    let symbol = token.symbol.clone();
    
    registry.add_token(token);
    
    Ok(format!("Token {} successfully added/updated", symbol))
}

/// Remove a token from the registry
pub fn remove_token(symbol: &str) -> Result<String, String> {
    let mut registry = get_token_registry().lock().unwrap();
    
    match registry.tokens.remove(symbol) {
        Some(_) => {
            registry.last_updated = ic_cdk::api::time();
            registry.version += 1;
            Ok(format!("Token {} successfully removed", symbol))
        },
        None => Err(format!("Token {} not found", symbol))
    }
}

// ============================================================================
// TOKEN INITIALIZATION
// ============================================================================

/// Initialize all supported tokens with their chain deployments
fn initialize_all_tokens(registry: &mut TokenRegistry) {
    // Initialize each supported cryptocurrency
    for &symbol in SUPPORTED_CRYPTOCURRENCIES {
        let token = create_token_info(symbol);
        registry.add_token(token);
    }
}

/// Create token info for a given symbol
fn create_token_info(symbol: &str) -> TokenInfo {
    let (name, decimals, coingecko_id) = get_token_metadata(symbol);
    
    let mut token = TokenInfo::new(
        symbol.to_string(),
        name.to_string(),
        decimals,
        coingecko_id.to_string(),
    );

    // Add chain-specific deployments
    add_chain_deployments(&mut token, symbol);
    
    token
}

/// Get base token metadata
fn get_token_metadata(symbol: &str) -> (&str, u8, &str) {
    match symbol {
        "BTC" => ("Bitcoin", 8, "bitcoin"),
        "ETH" => ("Ethereum", 18, "ethereum"),
        "XRP" => ("XRP", 6, "ripple"),
        "USDT" => ("Tether", 6, "tether"),
        "BNB" => ("BNB", 18, "binancecoin"),
        "SOL" => ("Solana", 9, "solana"),
        "USDC" => ("USD Coin", 6, "usd-coin"),
        "DOGE" => ("Dogecoin", 8, "dogecoin"),
        "ADA" => ("Cardano", 6, "cardano"),
        "TRX" => ("TRON", 6, "tron"),
        "ICP" => ("Internet Computer", 8, "internet-computer"),
        _ => ("Unknown", 18, "unknown"),
    }
}

/// Add chain deployments for a token
fn add_chain_deployments(token: &mut TokenInfo, symbol: &str) {
    // Add EVM deployment (if not ETH native)
    if symbol != "ETH" {
        if let Some(chain_token) = crate::tokens::evm_tokens::get_evm_token(symbol) {
            token.add_chain(chain_token);
        }
    }

    // Add Solana deployment (if not SOL native)  
    if symbol != "SOL" {
        if let Some(chain_token) = crate::tokens::solana_tokens::get_solana_token(symbol) {
            token.add_chain(chain_token);
        }
    }

    // ICP deployment removed - using internal token system instead
}

// ============================================================================
// HELPER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct RegistryStats {
    pub total_tokens: usize,
    pub evm_tokens: usize,
    pub solana_tokens: usize,
    pub icp_tokens: usize,
    pub last_updated: u64,
    pub version: u32,
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/// Reload all tokens from chain definitions (admin function)
pub fn reload_token_registry() -> Result<String, String> {
    let mut registry = get_token_registry().lock().unwrap();
    
    // Clear existing tokens
    registry.tokens.clear();
    
    // Reinitialize
    initialize_all_tokens(&mut registry);
    
    Ok(format!("Token registry reloaded with {} tokens", registry.get_token_count()))
}

/// Export token registry as JSON string
pub fn export_token_registry() -> Result<String, String> {
    let registry = get_token_registry().lock().unwrap();
    
    serde_json::to_string_pretty(&*registry)
        .map_err(|e| format!("Failed to serialize registry: {}", e))
}
