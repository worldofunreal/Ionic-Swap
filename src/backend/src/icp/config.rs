//! ICP Token Configuration
//! 
//! This module defines the supported tokens and their configuration.

/// Supported token configuration
/// Format: (symbol, name, decimals)
pub const SUPPORTED_TOKENS: &[(&str, &str, u8)] = &[
    ("BTC", "Bitcoin", 8),
    ("ETH", "Ethereum", 8),
    ("XRP", "XRP", 6),
    ("USDT", "Tether USD", 6),
    ("BNB", "BNB", 8),
    ("SOL", "Solana", 9),
    ("DOGE", "Dogecoin", 8),
    ("ADA", "Cardano", 6),
    ("TRX", "TRON", 6),
    ("ICP", "Internet Computer", 8),
];

/// Get the total supply for a token symbol
pub fn get_token_supply(symbol: &str) -> u64 {
    match symbol {
        "USDT" => 2_000_000_000_000, // 2M USDT (6 decimals)
        "BTC" => 100_000_000,        // 100 BTC (8 decimals)
        "ETH" => 1_000_000_000_000_000, // 1000 ETH (8 decimals)
        "SOL" => 1_000_000_000,      // 1000 SOL (9 decimals)
        "XRP" => 1_000_000_000_000,  // 1M XRP (6 decimals)
        "BNB" => 200_000_000_000_000_00, // 200M BNB (8 decimals)
        "DOGE" => 10_000_000_000_000, // 10M DOGE (8 decimals)
        "ADA" => 1_000_000_000_000,  // 1M ADA (6 decimals)
        "TRX" => 1_000_000_000_000,  // 1M TRX (6 decimals)
        "ICP" => 1_000_000_000,      // 1000 ICP (8 decimals)
        _ => 1_000_000_000_000,      // Default 1M tokens
    }
}

/// Get the faucet claim amount for USDT
pub const FAUCET_CLAIM_AMOUNT: u64 = 2_000_000_000_000; // 2M USDT (6 decimals)

/// Check if a token symbol is supported
pub fn is_supported_token(symbol: &str) -> bool {
    SUPPORTED_TOKENS.iter().any(|(s, _, _)| s == &symbol)
}

/// Get token info by symbol
pub fn get_token_config(symbol: &str) -> Option<(&str, &str, u8)> {
    SUPPORTED_TOKENS.iter().find(|(s, _, _)| s == &symbol).copied()
}
