//! ICP Token Balance Management
//! 
//! This module handles token balance operations and transfers.

use std::collections::HashMap;
use candid::Principal;

use crate::icp::storage::get_balances_storage;

/// Get balance of a token for a user
pub fn get_balance(user: Principal, symbol: &str) -> u64 {
    let balances = get_balances_storage();
    let balances_guard = balances.lock().unwrap();
    
    balances_guard.get(symbol)
        .and_then(|token_balances| token_balances.get(&user))
        .copied()
        .unwrap_or(0)
}

/// Get all token balances for a user
pub fn get_user_balances(user: Principal) -> HashMap<String, u64> {
    let balances = get_balances_storage();
    let balances_guard = balances.lock().unwrap();
    
    let mut user_balances = HashMap::new();
    for (symbol, token_balances) in balances_guard.iter() {
        if let Some(amount) = token_balances.get(&user) {
            if *amount > 0 {
                user_balances.insert(symbol.clone(), *amount);
            }
        }
    }
    user_balances
}

/// Transfer tokens between users
pub fn transfer_tokens(from: Principal, to: Principal, symbol: &str, amount: u64) -> Result<(), String> {
    let balances = get_balances_storage();
    let mut balances_guard = balances.lock().unwrap();
    
    let token_balances = balances_guard.get_mut(symbol)
        .ok_or("Token not found")?;
    
    let from_balance = token_balances.get(&from).copied().unwrap_or(0);
    if from_balance < amount {
        return Err("Insufficient balance".to_string());
    }
    
    *token_balances.get_mut(&from).unwrap() -= amount;
    *token_balances.entry(to).or_insert(0) += amount;
    
    Ok(())
}


/// Get circulating supply of a token (total supply minus canister balance)
pub fn get_token_circulating_supply(symbol: &str) -> Option<u64> {
    let balances = get_balances_storage();
    let balances_guard = balances.lock().unwrap();
    
    balances_guard.get(symbol).map(|token_balances| {
        let total: u64 = token_balances.values().sum();
        let canister_balance = token_balances.get(&ic_cdk::api::canister_self()).copied().unwrap_or(0);
        total - canister_balance
    })
}
