use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call;
use serde_json::Value;
use std::collections::HashMap;
use sha3::{Keccak256, Digest};
use crate::storage::{get_htlc_store, get_atomic_swap_orders};
use crate::types::{HTLC, AtomicSwapOrder};

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
// ICP HTLC FUNCTIONS
// ============================================================================

/// Create an ICP HTLC using ICRC-1 tokens
pub async fn create_icp_htlc(
    order_id: &str,
    token_canister_id: &str,
    recipient: &str,
    amount: u128,
    hashlock: &str,
    timelock: u64,
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the order is in the correct state
    match order.status {
        crate::types::SwapOrderStatus::Created => {},
        _ => return Err("Order is not in Created state".to_string()),
    }
    
    // Create the HTLC on ICP side
    // This involves transferring tokens to the HTLC canister with specific metadata
    let htlc_metadata = format!("HTLC:{}:{}:{}", hashlock, timelock, recipient);
    
    // Transfer tokens to the HTLC canister (this would be a special HTLC canister)
    // For now, we'll simulate this by transferring to the backend canister
    let backend_principal = ic_cdk::api::id();
    let backend_account = backend_principal.to_string();
    
    let transfer_result = transfer_icrc_tokens(
        token_canister_id,
        &backend_account,
        amount,
    ).await?;
    
    // Store the HTLC information
    let htlc = HTLC {
        id: format!("icp_htlc_{}", order_id),
        sender: order.maker.clone(), // Original sender (maker)
        recipient: recipient.to_string(),
        amount: amount.to_string(),
        hashlock: hashlock.to_string(),
        secret: None, // Secret will be revealed during claim
        timelock,
        status: crate::types::HTLCStatus::Created,
        token: token_canister_id.to_string(),
        source_chain: 0, // ICP chain ID
        target_chain: 1, // EVM chain ID (Sepolia)
        is_cross_chain: true,
        order_hash: order_id.to_string(),
        created_at: ic_cdk::api::time(),
    };
    
    let htlc_store = get_htlc_store();
    let htlc_id = htlc.id.clone();
    htlc_store.insert(htlc_id.clone(), htlc);
    
    Ok(format!("ICP HTLC created successfully! HTLC ID: {}", htlc_id))
}

/// Claim an ICP HTLC using the secret
pub async fn claim_icp_htlc(
    order_id: &str,
    htlc_id: &str,
    secret: &str,
) -> Result<String, String> {
    // Get the HTLC
    let htlc_store = get_htlc_store();
    let htlc = htlc_store.get(htlc_id)
        .ok_or_else(|| format!("HTLC {} not found", htlc_id))?;
    
    // Validate the HTLC belongs to the order
    if htlc.order_hash != order_id {
        return Err("HTLC does not belong to the specified order".to_string());
    }
    
    // Validate the HTLC is in Created state
    match htlc.status {
        crate::types::HTLCStatus::Created => {},
        _ => return Err("HTLC is not in Created state".to_string()),
    }
    
    // Validate the secret matches the hashlock
    let secret_hash = format!("0x{}", hex::encode(sha3::Keccak256::digest(secret.as_bytes())));
    if secret_hash != htlc.hashlock {
        return Err("Invalid secret for HTLC".to_string());
    }
    
    // Validate the timelock hasn't expired
    let current_time = ic_cdk::api::time();
    if current_time > htlc.timelock {
        return Err("HTLC timelock has expired".to_string());
    }
    
    // Transfer tokens to the recipient
    // In a real implementation, this would be done by the HTLC canister
    // For now, we'll simulate this by transferring from the backend to the recipient
    let backend_principal = ic_cdk::api::id();
    let backend_account = backend_principal.to_string();
    
    // Get the atomic swap order to determine which token to transfer
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Determine the token canister ID based on the HTLC
    let token_canister_id = &htlc.token;
    
    let transfer_result = transfer_icrc_tokens(
        token_canister_id,
        &htlc.recipient,
        htlc.amount.parse::<u128>().unwrap(),
    ).await?;
    
    // Update HTLC status
    let htlc_store = get_htlc_store();
    if let Some(htlc) = htlc_store.get_mut(htlc_id) {
        htlc.status = crate::types::HTLCStatus::Claimed;
    }
    
    Ok(format!("ICP HTLC claimed successfully! Transfer: {}", transfer_result))
}

/// Refund an expired ICP HTLC
pub async fn refund_icp_htlc(
    order_id: &str,
    htlc_id: &str,
) -> Result<String, String> {
    // Get the HTLC
    let htlc_store = get_htlc_store();
    let htlc = htlc_store.get(htlc_id)
        .ok_or_else(|| format!("HTLC {} not found", htlc_id))?;
    
    // Validate the HTLC belongs to the order
    if htlc.order_hash != order_id {
        return Err("HTLC does not belong to the specified order".to_string());
    }
    
    // Validate the HTLC is in Created state
    match htlc.status {
        crate::types::HTLCStatus::Created => {},
        _ => return Err("HTLC is not in Created state".to_string()),
    }
    
    // Validate the timelock has expired
    let current_time = ic_cdk::api::time();
    if current_time <= htlc.timelock {
        return Err("HTLC timelock has not expired yet".to_string());
    }
    
    // Transfer tokens back to the original sender
    // In a real implementation, this would be done by the HTLC canister
    // For now, we'll simulate this by transferring from the backend to the original sender
    let backend_principal = ic_cdk::api::id();
    let backend_account = backend_principal.to_string();
    
    // Get the atomic swap order to determine the original sender
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Determine the token canister ID and original sender
    let token_canister_id = &htlc.token;
    let original_sender = &htlc.sender;
    
    let transfer_result = transfer_icrc_tokens(
        token_canister_id,
        original_sender,
        htlc.amount.parse::<u128>().unwrap(),
    ).await?;
    
    // Update HTLC status
    let htlc_store = get_htlc_store();
    if let Some(htlc) = htlc_store.get_mut(htlc_id) {
        htlc.status = crate::types::HTLCStatus::Refunded;
    }
    
    Ok(format!("ICP HTLC refunded successfully! Transfer: {}", transfer_result))
}

/// Get the status of an ICP HTLC
pub fn get_icp_htlc_status(htlc_id: &str) -> Result<crate::types::HTLCStatus, String> {
    let htlc_store = get_htlc_store();
    let htlc = htlc_store.get(htlc_id)
        .ok_or_else(|| format!("HTLC {} not found", htlc_id))?;
    
    Ok(htlc.status.clone())
}

/// List all ICP HTLCs
pub fn list_icp_htlcs() -> Vec<HTLC> {
    let htlc_store = get_htlc_store();
    htlc_store.values()
        .filter(|htlc| htlc.source_chain == 0) // ICP chain ID
        .cloned()
        .collect()
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