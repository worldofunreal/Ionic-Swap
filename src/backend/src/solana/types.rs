use candid::{CandidType, Deserialize};

// ============================================================================
// SOLANA NETWORK CONFIGURATION
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum SolanaNetwork {
    Devnet,
    Testnet,
    Mainnet,
}

impl Default for SolanaNetwork {
    fn default() -> Self {
        SolanaNetwork::Devnet
    }
}

impl SolanaNetwork {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            SolanaNetwork::Devnet => "https://api.devnet.solana.com",
            SolanaNetwork::Testnet => "https://api.testnet.solana.com",
            SolanaNetwork::Mainnet => "https://api.mainnet-beta.solana.com",
        }
    }
}

