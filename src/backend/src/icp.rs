use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call;
use serde_json::Value;

// ============================================================================
// ICRC-1 TOKEN FUNCTIONS
// ============================================================================

/// Transfer ICRC-1 tokens
pub async fn transfer_icrc_tokens(
    canister_id: &str,
    to: &str,
    amount: u128,
) -> Result<String, String> {
    let canister_principal = Principal::from_text(canister_id)
        .map_err(|e| format!("Invalid canister ID: {}", e))?;
    
    let to_principal = Principal::from_text(to)
        .map_err(|e| format!("Invalid recipient principal: {}", e))?;
    
    let transfer_args = TransferArgs {
        to: Account {
            owner: to_principal,
            subaccount: None,
        },
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
    };
    
    let result: (TransferResult,) = call(canister_principal, "icrc1_transfer", (transfer_args,))
        .await
        .map_err(|e| format!("Transfer failed: {:?}", e))?;
    
    match result.0 {
        TransferResult::Ok(block_index) => {
            Ok(format!("Transfer successful! Block index: {}", block_index))
        }
        TransferResult::Err(error) => {
            Err(format!("Transfer error: {:?}", error))
        }
    }
}

/// Get ICRC-1 token balance
pub async fn get_icrc_balance(
    canister_id: &str,
    account: &str,
) -> Result<u128, String> {
    let canister_principal = Principal::from_text(canister_id)
        .map_err(|e| format!("Invalid canister ID: {}", e))?;
    
    let account_principal = Principal::from_text(account)
        .map_err(|e| format!("Invalid account principal: {}", e))?;
    
    let balance_args = BalanceArgs {
        account: Account {
            owner: account_principal,
            subaccount: None,
        },
    };
    
    let balance: (u128,) = call(canister_principal, "icrc1_balance_of", (balance_args,))
        .await
        .map_err(|e| format!("Failed to get balance: {:?}", e))?;
    
    Ok(balance.0)
}

/// Approve ICRC-1 tokens (ICRC-2)
pub async fn approve_icrc_tokens(
    canister_id: &str,
    spender: &str,
    amount: u128,
) -> Result<String, String> {
    let canister_principal = Principal::from_text(canister_id)
        .map_err(|e| format!("Invalid canister ID: {}", e))?;
    
    let spender_principal = Principal::from_text(spender)
        .map_err(|e| format!("Invalid spender principal: {}", e))?;
    
    let approve_args = ApproveArgs {
        from_subaccount: None,
        spender: Account {
            owner: spender_principal,
            subaccount: None,
        },
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
        expires_at: None,
    };
    
    let result: (ApproveResult,) = call(canister_principal, "icrc2_approve", (approve_args,))
        .await
        .map_err(|e| format!("Approve failed: {:?}", e))?;
    
    match result.0 {
        ApproveResult::Ok(block_index) => {
            Ok(format!("Approve successful! Block index: {}", block_index))
        }
        ApproveResult::Err(error) => {
            Err(format!("Approve error: {:?}", error))
        }
    }
}

/// Transfer from ICRC-1 tokens (ICRC-2)
pub async fn transfer_from_icrc_tokens(
    canister_id: &str,
    from: &str,
    to: &str,
    amount: u128,
) -> Result<String, String> {
    let canister_principal = Principal::from_text(canister_id)
        .map_err(|e| format!("Invalid canister ID: {}", e))?;
    
    let from_principal = Principal::from_text(from)
        .map_err(|e| format!("Invalid from principal: {}", e))?;
    
    let to_principal = Principal::from_text(to)
        .map_err(|e| format!("Invalid to principal: {}", e))?;
    
    let transfer_from_args = TransferFromArgs {
        spender_subaccount: None,
        from: Account {
            owner: from_principal,
            subaccount: None,
        },
        to: Account {
            owner: to_principal,
            subaccount: None,
        },
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
    };
    
    let result: (TransferFromResult,) = call(canister_principal, "icrc2_transfer_from", (transfer_from_args,))
        .await
        .map_err(|e| format!("Transfer from failed: {:?}", e))?;
    
    match result.0 {
        TransferFromResult::Ok(block_index) => {
            Ok(format!("Transfer from successful! Block index: {}", block_index))
        }
        TransferFromResult::Err(error) => {
            Err(format!("Transfer from error: {:?}", error))
        }
    }
}

// ============================================================================
// ICRC-1 DATA STRUCTURES
// ============================================================================

#[derive(CandidType, Deserialize)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: Account,
    pub amount: u128,
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub enum TransferResult {
    Ok(u64),
    Err(TransferError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferError {
    BadFee { expected_fee: u128 },
    BadBurn { min_burn_amount: u128 },
    InsufficientFunds { balance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: u64 },
    GenericError { error_code: u128, message: String },
}

#[derive(CandidType, Deserialize)]
pub struct BalanceArgs {
    pub account: Account,
}

#[derive(CandidType, Deserialize)]
pub struct ApproveArgs {
    pub from_subaccount: Option<Vec<u8>>,
    pub spender: Account,
    pub amount: u128,
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub enum ApproveResult {
    Ok(u64),
    Err(ApproveError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ApproveError {
    BadFee { expected_fee: u128 },
    BadBurn { min_burn_amount: u128 },
    InsufficientFunds { balance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: u64 },
    GenericError { error_code: u128, message: String },
}

#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: Account,
    pub to: Account,
    pub amount: u128,
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub enum TransferFromResult {
    Ok(u64),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Debug)]
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