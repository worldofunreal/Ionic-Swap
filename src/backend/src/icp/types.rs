//! ICP Token Types
//! 
//! This module defines the core data structures for the ICP token system.

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

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

impl Storable for InternalToken {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
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

impl Storable for FaucetClaim {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
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

/// Key for storing balances in stable storage
/// Combines user principal and token symbol for unique identification
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct BalanceKey {
    /// User's principal
    pub user: Principal,
    /// Token symbol
    pub symbol: String,
}

impl Storable for BalanceKey {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

/// Represents a completed swap transaction for history tracking
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct SwapTransaction {
    /// Unique transaction ID (timestamp + user principal hash)
    pub id: String,
    /// User who executed the swap
    pub user: Principal,
    /// Token being sold
    pub from_token: String,
    /// Token being bought
    pub to_token: String,
    /// Amount of from_token sold
    pub from_amount: u64,
    /// Amount of to_token received
    pub to_amount: u64,
    /// Price of from_token in USD at time of swap
    pub from_price: f64,
    /// Price of to_token in USD at time of swap
    pub to_price: f64,
    /// Timestamp when swap was executed
    pub timestamp: u64,
    /// Transaction type (always "market" for now)
    pub transaction_type: String,
}

impl Storable for SwapTransaction {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

/// Key for storing swap transactions in stable storage
/// Combines user principal and transaction ID for unique identification
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct SwapTransactionKey {
    /// User's principal
    pub user: Principal,
    /// Transaction ID
    pub transaction_id: String,
}

impl Storable for SwapTransactionKey {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

/// Represents a portfolio value point for tracking over time
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PortfolioPoint {
    /// Timestamp when this point was recorded
    pub timestamp: u64,
    /// Total portfolio value in USDT at this time
    pub value_usdt: f64,
}

impl Storable for PortfolioPoint {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

/// Complete portfolio data for a user
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PortfolioData {
    /// Current total portfolio value in USDT
    pub current_value_usdt: f64,
    /// Initial portfolio value (2M USDT from signup)
    pub initial_value_usdt: f64,
    /// 24h change in absolute USDT value
    pub change_24h: f64,
    /// 24h change as percentage
    pub change_24h_percent: f64,
    /// All-time high portfolio value
    pub all_time_high: f64,
    /// Total number of trades made
    pub total_trades: u32,
    /// Historical portfolio points for charting
    pub portfolio_history: Vec<PortfolioPoint>,
}

/// Key for storing portfolio points in stable storage
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct PortfolioPointKey {
    /// User's principal
    pub user: Principal,
    /// Timestamp of the portfolio point
    pub timestamp: u64,
}

impl Storable for PortfolioPointKey {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}
