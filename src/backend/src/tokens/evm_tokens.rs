use crate::tokens::types::*;

// ============================================================================
// EVM TOKEN DEFINITIONS (Sepolia Testnet)
// ============================================================================

/// Get EVM token deployment information
pub fn get_evm_token(symbol: &str) -> Option<ChainToken> {
    let token_data = match symbol {
        "BTC" => ("0x2A6736bC108F6a7eaA007DEce56d98fDdCAFfA11", 8),
        "XRP" => ("0x29f2A9eb954774B5951B2178EFAd9c7F80BF7c13", 6),
        "USDT" => ("0x02c32a72566dE763a7B150B941e770882eF3aCE2", 6),
        "BNB" => ("0x2ecc44a0f01BA5668BF28F07219e421BD8B6D77b", 18),
        "DOGE" => ("0x9Ef8B792bF5B74b77765316000621865fDdABa88", 8),
        "ADA" => ("0x7fc5cf0F29D7F54589FaEE98f15C6EdD7F16911a", 6),
        "TRX" => ("0x061882b3DeDe2dD9Be136592534915a016395F70", 6),
        _ => return None,
    };

    let (address, decimals) = token_data;
    let etherscan_url = format!("https://sepolia.etherscan.io/address/{}", address);

    let chain_token = ChainToken::new(
        ChainType::EVM,
        address.to_string(),
        decimals,
        true, // is_deployed
    )
    .with_explorer_url(etherscan_url.clone())
    .with_additional_info(ChainSpecificInfo::EVM {
        contract_address: address.to_string(),
        permit_supported: true, // All our tokens support EIP-2612 permits
        etherscan_url,
    });

    Some(chain_token)
}

/// Get all EVM token addresses
pub fn get_all_evm_tokens() -> Vec<(String, ChainToken)> {
    let symbols = ["BTC", "XRP", "USDT", "BNB", "DOGE", "ADA", "TRX"];
    
    symbols.iter()
        .filter_map(|&symbol| {
            get_evm_token(symbol).map(|token| (symbol.to_string(), token))
        })
        .collect()
}

/// Check if token is deployed on EVM
pub fn is_evm_token_deployed(symbol: &str) -> bool {
    get_evm_token(symbol).is_some()
}

/// Get EVM contract address for token
pub fn get_evm_token_address(symbol: &str) -> Option<String> {
    get_evm_token(symbol).map(|token| token.address)
}

// ============================================================================
// EVM NETWORK CONFIGURATION
// ============================================================================

pub const EVM_NETWORK_NAME: &str = "Sepolia";
pub const EVM_CHAIN_ID: u64 = 11155111;
pub const EVM_RPC_URL: &str = "https://sepolia.infura.io/v3/YOUR_PROJECT_ID";
pub const EVM_EXPLORER_BASE_URL: &str = "https://sepolia.etherscan.io";

/// Get network information for EVM deployments
pub fn get_evm_network_info() -> NetworkInfo {
    NetworkInfo {
        name: EVM_NETWORK_NAME.to_string(),
        chain_id: Some(EVM_CHAIN_ID),
        rpc_url: EVM_RPC_URL.to_string(),
        explorer_url: EVM_EXPLORER_BASE_URL.to_string(),
        is_testnet: true,
    }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

#[derive(Debug, Clone)]
pub struct NetworkInfo {
    pub name: String,
    pub chain_id: Option<u64>,
    pub rpc_url: String,
    pub explorer_url: String,
    pub is_testnet: bool,
}

// ============================================================================
// TOKEN METADATA
// ============================================================================

/// Get additional metadata for EVM tokens
pub fn get_evm_token_metadata(symbol: &str) -> Option<EvmTokenMetadata> {
    let metadata = match symbol {
        "BTC" => EvmTokenMetadata {
            symbol: "BTC".to_string(),
            name: "Bitcoin Token".to_string(),
            max_supply: Some(21_000_000),
            initial_supply: 1_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "XRP" => EvmTokenMetadata {
            symbol: "XRP".to_string(),
            name: "XRP Token".to_string(),
            max_supply: Some(100_000_000_000),
            initial_supply: 10_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "USDT" => EvmTokenMetadata {
            symbol: "USDT".to_string(),
            name: "Tether Token".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 10_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "BNB" => EvmTokenMetadata {
            symbol: "BNB".to_string(),
            name: "BNB Token".to_string(),
            max_supply: Some(200_000_000),
            initial_supply: 1_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "DOGE" => EvmTokenMetadata {
            symbol: "DOGE".to_string(),
            name: "Dogecoin Token".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 10_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "ADA" => EvmTokenMetadata {
            symbol: "ADA".to_string(),
            name: "Cardano Token".to_string(),
            max_supply: Some(45_000_000_000),
            initial_supply: 10_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        "TRX" => EvmTokenMetadata {
            symbol: "TRX".to_string(),
            name: "TRON Token".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 10_000,
            supports_permit: true,
            supports_meta_tx: true,
        },
        _ => return None,
    };

    Some(metadata)
}

#[derive(Debug, Clone)]
pub struct EvmTokenMetadata {
    pub symbol: String,
    pub name: String,
    pub max_supply: Option<u64>,
    pub initial_supply: u64,
    pub supports_permit: bool,
    pub supports_meta_tx: bool,
}
