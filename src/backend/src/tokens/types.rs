use std::collections::HashMap;
use candid::{CandidType, Deserialize};
use serde::Serialize;

// ============================================================================
// TOKEN TYPES
// ============================================================================

#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq, Eq, Hash)]
pub enum ChainType {
    EVM,
    Solana,
    ICP,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenInfo {
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub is_native: bool,        // true for ETH, SOL, ICP
    pub coingecko_id: String,   // for price fetching
    pub chains: HashMap<ChainType, ChainToken>,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct ChainToken {
    pub chain: ChainType,
    pub address: String,        // Contract address, mint address, or canister ID
    pub decimals: u8,          // Chain-specific decimals (might differ)
    pub is_deployed: bool,
    pub deployment_block: Option<u64>,
    pub explorer_url: Option<String>,
    pub additional_info: Option<ChainSpecificInfo>,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub enum ChainSpecificInfo {
    EVM {
        contract_address: String,
        permit_supported: bool,
        etherscan_url: String,
    },
    Solana {
        mint_address: String,
        token_account: Option<String>,
        solscan_url: String,
    },
    ICP {
        canister_id: String,
        icrc2_supported: bool,
        candid_ui_url: String,
    },
}

// ============================================================================
// REGISTRY TYPES
// ============================================================================

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenRegistry {
    pub tokens: HashMap<String, TokenInfo>, // symbol -> TokenInfo
    pub last_updated: u64,
    pub version: u32,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenListUpdate {
    pub added: Vec<TokenInfo>,
    pub updated: Vec<TokenInfo>,
    pub removed: Vec<String>, // symbols
    pub timestamp: u64,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenQueryResult {
    pub symbol: String,
    pub chains: Vec<ChainType>,
    pub total_deployments: u8,
    pub token_info: TokenInfo,
}

// ============================================================================
// SUPPORTED TOKENS CONFIGURATION
// ============================================================================

pub const SUPPORTED_CRYPTOCURRENCIES: &[&str] = &[
    "BTC", "ETH", "XRP", "USDT", "BNB", "SOL", "USDC", "DOGE", "ADA", "TRX", "ICP"
];

// Native tokens that don't have contract addresses
pub const NATIVE_TOKENS: &[&str] = &["ETH", "SOL", "ICP"];

// Stablecoins for special handling
pub const STABLECOINS: &[&str] = &["USDT", "USDC"];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

impl TokenInfo {
    pub fn new(
        symbol: String,
        name: String,
        decimals: u8,
        coingecko_id: String,
    ) -> Self {
        Self {
            symbol: symbol.clone(),
            name,
            decimals,
            is_native: NATIVE_TOKENS.contains(&symbol.as_str()),
            coingecko_id,
            chains: HashMap::new(),
        }
    }

    pub fn add_chain(&mut self, chain_token: ChainToken) {
        self.chains.insert(chain_token.chain.clone(), chain_token);
    }

    pub fn get_chain(&self, chain: &ChainType) -> Option<&ChainToken> {
        self.chains.get(chain)
    }

    pub fn is_deployed_on(&self, chain: &ChainType) -> bool {
        self.chains.get(chain)
            .map(|ct| ct.is_deployed)
            .unwrap_or(false)
    }

    pub fn get_address_on(&self, chain: &ChainType) -> Option<String> {
        self.chains.get(chain).map(|ct| ct.address.clone())
    }

    pub fn is_stablecoin(&self) -> bool {
        STABLECOINS.contains(&self.symbol.as_str())
    }
}

impl ChainToken {
    pub fn new(
        chain: ChainType,
        address: String,
        decimals: u8,
        is_deployed: bool,
    ) -> Self {
        Self {
            chain,
            address,
            decimals,
            is_deployed,
            deployment_block: None,
            explorer_url: None,
            additional_info: None,
        }
    }

    pub fn with_explorer_url(mut self, url: String) -> Self {
        self.explorer_url = Some(url);
        self
    }

    pub fn with_additional_info(mut self, info: ChainSpecificInfo) -> Self {
        self.additional_info = Some(info);
        self
    }
}

impl TokenRegistry {
    pub fn new() -> Self {
        Self {
            tokens: HashMap::new(),
            last_updated: ic_cdk::api::time(),
            version: 1,
        }
    }

    pub fn add_token(&mut self, token: TokenInfo) {
        self.tokens.insert(token.symbol.clone(), token);
        self.last_updated = ic_cdk::api::time();
        self.version += 1;
    }

    pub fn get_token(&self, symbol: &str) -> Option<&TokenInfo> {
        self.tokens.get(symbol)
    }

    pub fn get_all_tokens(&self) -> Vec<&TokenInfo> {
        self.tokens.values().collect()
    }

    pub fn get_tokens_by_chain(&self, chain: &ChainType) -> Vec<&TokenInfo> {
        self.tokens.values()
            .filter(|token| token.is_deployed_on(chain))
            .collect()
    }

    pub fn get_token_count(&self) -> usize {
        self.tokens.len()
    }

    pub fn get_chain_token_count(&self, chain: &ChainType) -> usize {
        self.get_tokens_by_chain(chain).len()
    }
}

impl Default for TokenRegistry {
    fn default() -> Self {
        Self::new()
    }
}
