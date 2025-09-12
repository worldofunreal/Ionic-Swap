//! ICP Token Types
//! 
//! This module defines the core data structures for the ICP token system.

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

/// Represents an internal token in the ICP token system
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct InternalToken {
    /// Token symbol (e.g., "BTC", "ETH", "USDT")
    pub symbol: String,
    /// Human-readable token name
    pub name: String,
    /// Number of decimal places for the token
    pub decimals: u8,
    /// Total supply of the token
    pub total_supply: u64,
    /// Principal that owns the token (usually the canister)
    pub owner: Principal,
}

/// Represents a user's balance for a specific token
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenBalance {
    /// User's principal
    pub user: Principal,
    /// Token symbol
    pub symbol: String,
    /// Balance amount
    pub amount: u64,
}

/// Represents a faucet claim record
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct FaucetClaim {
    /// User who claimed from faucet
    pub user: Principal,
    /// Timestamp when claim was made
    pub timestamp: u64,
    /// Amount claimed
    pub amount: u64,
}

/// Represents faucet statistics
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct FaucetStats {
    /// Total number of claims made
    pub total_claims: u64,
    /// Total amount distributed
    pub total_distributed: u64,
}

/// Represents user balance information for all tokens
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct UserBalances {
    /// User's principal
    pub user: Principal,
    /// Map of token symbol to balance
    pub balances: std::collections::HashMap<String, u64>,
}
