use candid::Principal;
use std::str::FromStr;

use crate::icp::types::*;
use crate::icp::permit::*;

/// Get canister's ICRC token balances
pub async fn get_canister_icrc_balances() -> Result<String, String> {
    let canister_principal = ic_cdk::id();
    
    // Get SPIRAL balance
    let spiral_principal = Principal::from_text(SPIRAL_TOKEN_ID)
        .map_err(|e| format!("Invalid SPIRAL token ID: {}", e))?;
    let spiral_balance = get_icrc1_balance(spiral_principal, canister_principal).await?;
    
    // Get STD balance
    let std_principal = Principal::from_text(STD_TOKEN_ID)
        .map_err(|e| format!("Invalid STD token ID: {}", e))?;
    let std_balance = get_icrc1_balance(std_principal, canister_principal).await?;
    
    let result = format!(
        "Canister ICRC Balances:\n  SPIRAL: {} tokens\n  STD: {} tokens",
        spiral_balance, std_balance
    );
    
    Ok(result)
}