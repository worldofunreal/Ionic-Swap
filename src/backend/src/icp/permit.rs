use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call;
use std::str::FromStr;

use crate::icp::types::*;

// Simple types for ICRC-1/ICRC-2 calls
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferFromArgs {
    pub from: Account,
    pub to: Account,
    pub amount: u128,
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferFromResult {
    Ok(u128),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferFromError {
    BadFee { expected_fee: u128 },
    BadBurn { min_burn_amount: u128 },
    InsufficientFunds { balance: u128 },
    InsufficientAllowance { allowance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: u64 },
    GenericError { error_code: u128, message: String },
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApproveArgs {
    pub from_subaccount: Option<Vec<u8>>,
    pub spender: Account,
    pub amount: u128,
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum ApproveResult {
    Ok(u128),
    Err(ApproveError),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum ApproveError {
    BadFee { expected_fee: u128 },
    InsufficientFunds { balance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: u64 },
    GenericError { error_code: u128, message: String },
}

/// Get ICRC-1 balance
pub async fn get_icrc1_balance(token_canister: Principal, account: Principal) -> Result<u128, String> {
    let balance_args = Account {
        owner: account,
        subaccount: None,
    };
    
    let balance: (u128,) = call(token_canister, "icrc1_balance_of", (balance_args,))
        .await
        .map_err(|e| format!("Failed to get balance: {:?}", e))?;
    
    Ok(balance.0)
}

/// ICRC-2 transfer_from
pub async fn icrc2_transfer_from(
    token_canister: Principal,
    from: Principal,
    to: Principal,
    amount: u128,
) -> Result<String, String> {
    let transfer_from_args = TransferFromArgs {
        from: Account {
            owner: from,
            subaccount: None,
        },
        to: Account {
            owner: to,
            subaccount: None,
        },
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
    };
    
    let result: (TransferFromResult,) = call(token_canister, "icrc2_transfer_from", (transfer_from_args,))
        .await
        .map_err(|e| format!("ICRC-2 transfer_from failed: {:?}", e))?;
    
    match result.0 {
        TransferFromResult::Ok(block_index) => {
            Ok(format!("Block: {}", block_index))
        }
        TransferFromResult::Err(error) => {
            Err(format!("ICRC-2 transfer_from error: {:?}", error))
        }
    }
}



/// Submit ICP gasless permit - Alice already approved, canister pulls tokens
pub async fn submit_icp_gasless_permit(permit_request: IcpPermitRequest) -> Result<String, String> {
    ic_cdk::println!("🔐 Processing ICP gasless permit...");
    
    // Parse the permit request
    let token_canister_id = permit_request.token;
    let owner = Principal::from_text(&permit_request.owner)
        .map_err(|e| format!("Invalid owner principal: {}", e))?;
    let amount = u128::from_str(&permit_request.amount)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    let token_canister = Principal::from_text(&token_canister_id)
        .map_err(|e| format!("Invalid token canister ID: {}", e))?;
    
    let canister_principal = ic_cdk::id();
    
    ic_cdk::println!("💰 Canister pulling {} tokens from Alice...", amount);
    
    // Canister calls icrc2_transfer_from to pull tokens from Alice
    let result = icrc2_transfer_from(token_canister, owner, canister_principal, amount).await?;
    
    Ok(format!("ICP gasless permit successful! {}", result))
}