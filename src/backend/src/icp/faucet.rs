//! ICP Token Faucet
//! 
//! This module handles the faucet functionality for claiming tokens.

use candid::Principal;
use ic_cdk::api::{msg_caller, time, canister_self};

use crate::icp::{
    types::FaucetClaim,
    config::FAUCET_CLAIM_AMOUNT,
    storage::IcpTokenDatabase,
};

/// Claim 2M USDT from faucet (one-time only per principal)
pub async fn claim_faucet() -> Result<String, String> {
    let caller = msg_caller();

    // Check if user already claimed
    if IcpTokenDatabase::get_faucet_claim(caller).is_some() {
        return Err("Faucet already claimed by this principal".to_string());
    }

    // Check if USDT token exists
    let _usdt_token = IcpTokenDatabase::get_token("USDT")
        .ok_or("USDT token not found")?;

    // Check if canister has enough USDT
    let canister_id = canister_self();
    let canister_balance = IcpTokenDatabase::get_balance(canister_id, "USDT");
    
    if canister_balance < FAUCET_CLAIM_AMOUNT {
        return Err("Insufficient USDT in faucet".to_string());
    }

    // Transfer USDT from canister to user
    IcpTokenDatabase::transfer_tokens(canister_id, caller, "USDT", FAUCET_CLAIM_AMOUNT)?;

    // Record the claim
    let claim = FaucetClaim {
        user: caller,
        timestamp: time(),
        amount: FAUCET_CLAIM_AMOUNT,
    };
    IcpTokenDatabase::store_faucet_claim(claim);

    ic_cdk::println!("✅ Faucet claim: {} received 2M USDT", caller);
    Ok(format!("Successfully claimed 2,000,000 USDT"))
}


/// Get faucet claim info for a principal
pub fn get_faucet_claim(user: Principal) -> Option<FaucetClaim> {
    IcpTokenDatabase::get_faucet_claim(user)
}

/// Get faucet statistics
pub fn get_faucet_stats() -> (u64, u64) {
    let claims = IcpTokenDatabase::get_all_faucet_claims();
    
    let total_claims = claims.len() as u64;
    let total_distributed = claims.iter().map(|c| c.amount).sum();
    
    (total_claims, total_distributed)
}
