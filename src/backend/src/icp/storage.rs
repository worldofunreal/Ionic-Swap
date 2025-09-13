//! ICP Token Storage
//! 
//! This module manages the global state for the ICP token system using stable storage.

use candid::Principal;
use crate::icp::types::{InternalToken, FaucetClaim};

// Re-export the unified storage for backward compatibility
pub use crate::storage::{TokenStorage, BalanceStorage, FaucetStorage};

/// Initialize the token storage system
pub fn init_storage() {
    TokenStorage::init_storage();
}

/// ICP Token Database Operations (wrapper for unified storage)
pub struct IcpTokenDatabase;

impl IcpTokenDatabase {
    /// Get a token by symbol
    pub fn get_token(symbol: &str) -> Option<InternalToken> {
        TokenStorage::get_token(symbol)
    }

    /// Get all tokens
    pub fn get_all_tokens() -> Vec<InternalToken> {
        TokenStorage::get_all_tokens()
    }

    /// Update a token
    pub fn update_token(token: InternalToken) {
        TokenStorage::update_token(token);
    }

    /// Get balance for a specific user and token
    pub fn get_balance(user: Principal, symbol: &str) -> u64 {
        BalanceStorage::get_balance(user, symbol)
    }

    /// Set balance for a specific user and token
    pub fn set_balance(user: Principal, symbol: &str, amount: u64) {
        BalanceStorage::set_balance(user, symbol, amount);
    }

    /// Transfer tokens between users
    pub fn transfer_tokens(from: Principal, to: Principal, symbol: &str, amount: u64) -> Result<(), String> {
        BalanceStorage::transfer_balance(from, to, symbol, amount)
    }

    /// Get all balances for a user
    pub fn get_user_balances(user: Principal) -> std::collections::HashMap<String, u64> {
        let balances = BalanceStorage::get_user_balances(user);
        balances.into_iter().collect()
    }

    /// Get circulating supply of a token (total supply minus canister balance)
    pub fn get_token_circulating_supply(symbol: &str) -> Option<u64> {
        let token = Self::get_token(symbol)?;
        let canister_balance = Self::get_balance(ic_cdk::api::canister_self(), symbol);
        Some(token.total_supply - canister_balance)
    }

    /// Store a faucet claim
    pub fn store_faucet_claim(claim: FaucetClaim) {
        FaucetStorage::set_faucet_claim(claim);
    }

    /// Get a faucet claim
    pub fn get_faucet_claim(user: Principal) -> Option<FaucetClaim> {
        FaucetStorage::get_faucet_claim(user)
    }

    /// Get all faucet claims
    pub fn get_all_faucet_claims() -> Vec<FaucetClaim> {
        // This would need to be implemented in FaucetStorage if needed
        vec![]
    }
}
