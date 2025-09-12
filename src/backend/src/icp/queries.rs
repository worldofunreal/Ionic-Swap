//! ICP Token Query Functions
//! 
//! This module provides public query methods for the ICP token system.

use std::collections::HashMap;

use crate::icp::{
    types::InternalToken,
    storage::get_tokens_storage,
};

/// Get all internal tokens
pub fn get_all_tokens() -> Vec<InternalToken> {
    let tokens = get_tokens_storage();
    let tokens_guard = tokens.lock().unwrap();
    tokens_guard.values().cloned().collect()
}


/// Get token statistics (total supply, circulating supply, etc.)
pub fn get_token_statistics(symbol: &str) -> Result<HashMap<String, u64>, String> {
    let tokens = get_tokens_storage();
    let tokens_guard = tokens.lock().unwrap();
    
    let token = tokens_guard.get(symbol)
        .ok_or("Token not found")?;
    
    let total_supply = token.total_supply;
    let circulating_supply = crate::icp::balances::get_token_circulating_supply(symbol)
        .unwrap_or(0);
    
    let mut stats = HashMap::new();
    stats.insert("total_supply".to_string(), total_supply);
    stats.insert("circulating_supply".to_string(), circulating_supply);
    stats.insert("canister_balance".to_string(), total_supply - circulating_supply);
    
    Ok(stats)
}
