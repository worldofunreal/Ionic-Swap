//! ICP Token Faucet
//! 
//! This module handles the faucet functionality for claiming tokens.

use candid::Principal;
use ic_cdk::api::{msg_caller, time, canister_self};

use crate::icp_tokens::{
    types::FaucetClaim,
    config::FAUCET_CLAIM_AMOUNT,
    storage::{get_tokens_storage, get_balances_storage, get_claims_storage},
};

/// Claim 2M USDT from faucet (one-time only per principal)
pub async fn claim_faucet() -> Result<String, String> {
    let caller = msg_caller();
    let claims = get_claims_storage();
    let balances = get_balances_storage();

    // Check if user already claimed
    let mut claims_guard = claims.lock().unwrap();
    if claims_guard.contains_key(&caller) {
        return Err("Faucet already claimed by this principal".to_string());
    }

    // Check if USDT token exists
    let tokens = get_tokens_storage();
    let tokens_guard = tokens.lock().unwrap();
    let _usdt_token = tokens_guard.get("USDT")
        .ok_or("USDT token not found")?;

    // Check if canister has enough USDT
    let mut balances_guard = balances.lock().unwrap();
    let usdt_balances = balances_guard.get_mut("USDT")
        .ok_or("USDT balances not found")?;
    
    let canister_id = canister_self();
    let canister_balance = usdt_balances.get(&canister_id).unwrap_or(&0);
    
    if *canister_balance < FAUCET_CLAIM_AMOUNT {
        return Err("Insufficient USDT in faucet".to_string());
    }

    // Transfer USDT from canister to user
    *usdt_balances.get_mut(&canister_id).unwrap() -= FAUCET_CLAIM_AMOUNT;
    *usdt_balances.entry(caller).or_insert(0) += FAUCET_CLAIM_AMOUNT;

    // Record the claim
    claims_guard.insert(caller, FaucetClaim {
        user: caller,
        timestamp: time(),
        amount: FAUCET_CLAIM_AMOUNT,
    });

    ic_cdk::println!("✅ Faucet claim: {} received 2M USDT", caller);
    Ok(format!("Successfully claimed 2,000,000 USDT"))
}


/// Get faucet claim info for a principal
pub fn get_faucet_claim(user: Principal) -> Option<FaucetClaim> {
    let claims = get_claims_storage();
    let claims_guard = claims.lock().unwrap();
    claims_guard.get(&user).cloned()
}

/// Get faucet statistics
pub fn get_faucet_stats() -> (u64, u64) {
    let claims = get_claims_storage();
    let claims_guard = claims.lock().unwrap();
    
    let total_claims = claims_guard.len() as u64;
    let total_distributed = claims_guard.values().map(|c| c.amount).sum();
    
    (total_claims, total_distributed)
}
