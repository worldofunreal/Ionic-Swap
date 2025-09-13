//! ICP Token Balance Management
//! 
//! This module handles token balance operations and transfers.

use std::collections::HashMap;
use candid::Principal;

use crate::icp::storage::IcpTokenDatabase;

/// Get balance of a token for a user
pub fn get_balance(user: Principal, symbol: &str) -> u64 {
    IcpTokenDatabase::get_balance(user, symbol)
}

/// Get all token balances for a user
pub fn get_user_balances(user: Principal) -> HashMap<String, u64> {
    IcpTokenDatabase::get_user_balances(user)
}

/// Transfer tokens between users
pub fn transfer_tokens(from: Principal, to: Principal, symbol: &str, amount: u64) -> Result<(), String> {
    IcpTokenDatabase::transfer_tokens(from, to, symbol, amount)
}

/// Get circulating supply of a token (total supply minus canister balance)
pub fn get_token_circulating_supply(symbol: &str) -> Option<u64> {
    IcpTokenDatabase::get_token_circulating_supply(symbol)
}
