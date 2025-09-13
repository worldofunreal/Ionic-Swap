use crate::tokens::types::*;

// ============================================================================
// SOLANA TOKEN DEFINITIONS (Devnet)
// ============================================================================

/// Get Solana token deployment information
pub fn get_solana_token(symbol: &str) -> Option<ChainToken> {
    let token_data = match symbol {
        "BTC" => ("DSwEAajDKB2JBEm2X6ZhFmC1kgNJD44cvkbAUpMu5ZkZ", "3UZBxxNFi2Q6sXijbvVA1UQbSjPe2rB839mRy8Q3bFTF", 8),
        "ETH" => ("DS7AvCcMJoCVkHrH1CFFiFqDZuuT6cqbMbj1RZAPM9C8", "E8SVnXf9e2VydayRpBgQBNckdsjsLVQmB5Fo9rybCSUb", 18),
        "XRP" => ("2pfQs3r123nU5TRzuoTGmdX4qZymJQS29jFACQHT67aY", "CpDEPtBPgq9QTGJJGgMC7UfXU7tSBw89siZRGEkwLJWv", 6),
        "USDT" => ("DPBmipSAHhpUd3ZPTVAbLfaWPVEvp77V13hG1B5nrHKv", "FNKRx7MZS2REkWMeCojN5t6ZySaq4zS1KAAPPebav1ZH", 6),
        "BNB" => ("L48YhNzBgxeWPrVXSZ8M39jrpNs8BJ1dpMbaQP47VXG", "HAtBFWqzEW9UxbGHZZ8nfacsgATa5dhVfqeKJpZEwV92", 18),
        "DOGE" => ("DV5JDdMg55KE8bJKDnCHpYWKhdFZDsoimJFME9AoYDQh", "ANw6vCmkNdMjsaQRZhu8TeFm18usEveqtC6Mb29hmLKz", 8),
        "ADA" => ("BzqvJ1AVL7TSYvugPDr9xqQKeNDyK6QTcouBspRv9Jvp", "3mFWRYqapmvViDk2vM4Z9FaUxnjk2uphht81fgCNWL8q", 6),
        "TRX" => ("4WRoSSeCcGPzXzgFKfZcB4viHau8pZXhdvVG3fKPCrXL", "BU7bJMXGcyQSPGgj1gKocLJYf8wF1aEtK2hReJj1Cru4", 6),
        _ => return None,
    };

    let (mint_address, token_account, decimals) = token_data;
    let solscan_url = format!("https://explorer.solana.com/address/{}?cluster=devnet", mint_address);

    let chain_token = ChainToken::new(
        ChainType::Solana,
        mint_address.to_string(),
        decimals,
        true, // is_deployed
    )
    .with_explorer_url(solscan_url.clone())
    .with_additional_info(ChainSpecificInfo::Solana {
        mint_address: mint_address.to_string(),
        token_account: Some(token_account.to_string()),
        solscan_url,
    });

    Some(chain_token)
}

/// Get all Solana token addresses
pub fn get_all_solana_tokens() -> Vec<(String, ChainToken)> {
    let symbols = ["BTC", "ETH", "XRP", "USDT", "BNB", "DOGE", "ADA", "TRX"];
    
    symbols.iter()
        .filter_map(|&symbol| {
            get_solana_token(symbol).map(|token| (symbol.to_string(), token))
        })
        .collect()
}

/// Check if token is deployed on Solana
pub fn is_solana_token_deployed(symbol: &str) -> bool {
    get_solana_token(symbol).is_some()
}

/// Get Solana mint address for token
pub fn get_solana_mint_address(symbol: &str) -> Option<String> {
    get_solana_token(symbol).map(|token| token.address)
}

/// Get Solana token account address for token
pub fn get_solana_token_account(symbol: &str) -> Option<String> {
    get_solana_token(symbol).and_then(|token| {
        if let Some(ChainSpecificInfo::Solana { token_account, .. }) = token.additional_info {
            token_account
        } else {
            None
        }
    })
}

// ============================================================================
// SOLANA NETWORK CONFIGURATION
// ============================================================================

pub const SOLANA_NETWORK_NAME: &str = "Devnet";
pub const SOLANA_RPC_URL: &str = "https://api.devnet.solana.com";
pub const SOLANA_EXPLORER_BASE_URL: &str = "https://explorer.solana.com";
pub const SOLANA_DEPLOYER_ADDRESS: &str = "GLxeKkwTFodLPcaRmsjrGhpKMorREAf4j4HsT6c8gwRM";

/// Get network information for Solana deployments
pub fn get_solana_network_info() -> SolanaNetworkInfo {
    SolanaNetworkInfo {
        name: SOLANA_NETWORK_NAME.to_string(),
        cluster: "devnet".to_string(),
        rpc_url: SOLANA_RPC_URL.to_string(),
        explorer_url: SOLANA_EXPLORER_BASE_URL.to_string(),
        deployer_address: SOLANA_DEPLOYER_ADDRESS.to_string(),
        is_testnet: true,
    }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

#[derive(Debug, Clone)]
pub struct SolanaNetworkInfo {
    pub name: String,
    pub cluster: String,
    pub rpc_url: String,
    pub explorer_url: String,
    pub deployer_address: String,
    pub is_testnet: bool,
}

// ============================================================================
// TOKEN METADATA
// ============================================================================

/// Get additional metadata for Solana tokens
pub fn get_solana_token_metadata(symbol: &str) -> Option<SolanaTokenMetadata> {
    let metadata = match symbol {
        "BTC" => SolanaTokenMetadata {
            symbol: "BTC".to_string(),
            name: "Bitcoin".to_string(),
            max_supply: Some(21_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "ETH" => SolanaTokenMetadata {
            symbol: "ETH".to_string(),
            name: "Ethereum".to_string(),
            max_supply: Some(120_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "XRP" => SolanaTokenMetadata {
            symbol: "XRP".to_string(),
            name: "XRP".to_string(),
            max_supply: Some(100_000_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "USDT" => SolanaTokenMetadata {
            symbol: "USDT".to_string(),
            name: "Tether".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "BNB" => SolanaTokenMetadata {
            symbol: "BNB".to_string(),
            name: "BNB".to_string(),
            max_supply: Some(200_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "DOGE" => SolanaTokenMetadata {
            symbol: "DOGE".to_string(),
            name: "Dogecoin".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "ADA" => SolanaTokenMetadata {
            symbol: "ADA".to_string(),
            name: "Cardano".to_string(),
            max_supply: Some(45_000_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        "TRX" => SolanaTokenMetadata {
            symbol: "TRX".to_string(),
            name: "TRON".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            freeze_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
            mint_authority: Some(SOLANA_DEPLOYER_ADDRESS.to_string()),
        },
        _ => return None,
    };

    Some(metadata)
}

#[derive(Debug, Clone)]
pub struct SolanaTokenMetadata {
    pub symbol: String,
    pub name: String,
    pub max_supply: Option<u64>,
    pub initial_supply: u64,
    pub freeze_authority: Option<String>,
    pub mint_authority: Option<String>,
}
