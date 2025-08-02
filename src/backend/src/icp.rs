use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call;
use serde_json::Value;
use std::collections::HashMap;
use sha3::{Keccak256, Digest};
use crate::storage::{get_htlc_store, get_atomic_swap_orders, generate_order_id};
use crate::types::{HTLC, AtomicSwapOrder, SwapOrderStatus, SwapDirection};

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
// CROSS-CHAIN SWAP COORDINATION FUNCTIONS
// ============================================================================

/// Create a cross-chain swap order for EVM<>ICP swaps
pub fn create_cross_chain_order(
    maker: &str,
    taker: &str,
    source_token: &str,
    destination_token: &str,
    source_amount: &str,
    destination_amount: &str,
    direction: SwapDirection,
    timelock: u64,
) -> Result<String, String> {
    // Generate a unique order ID
    let order_id = generate_order_id();
    
    // Generate a secret for the HTLC
    let secret = format!("htlc_secret_{}", ic_cdk::api::time());
    let secret_hash = format!("0x{}", hex::encode(sha3::Keccak256::digest(secret.as_bytes())));
    
    // Calculate expiration time (2 hours from now)
    let expires_at = ic_cdk::api::time() + (2 * 60 * 60 * 1_000_000_000); // 2 hours in nanoseconds
    
    // Create the atomic swap order
    let order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker: maker.to_string(),
        taker: taker.to_string(),
        source_token: source_token.to_string(),
        destination_token: destination_token.to_string(),
        source_amount: source_amount.to_string(),
        destination_amount: destination_amount.to_string(),
        secret,
        hashlock: secret_hash,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: ic_cdk::api::time(),
        expires_at,
    };
    
    // Store the order
    let orders = get_atomic_swap_orders();
    orders.insert(order_id.clone(), order);
    
    Ok(order_id)
}

/// Execute a complete EVM→ICP swap flow
pub async fn execute_evm_to_icp_swap(
    order_id: &str,
    evm_htlc_id: &str,
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the order is in the correct state
    match order.status {
        SwapOrderStatus::Created => {},
        _ => return Err("Order is not in Created state".to_string()),
    }
    
    // Clone the values we need before borrowing mutably
    let destination_token = order.destination_token.clone();
    let taker = order.taker.clone();
    let destination_amount = order.destination_amount.clone();
    let hashlock = order.hashlock.clone();
    let timelock = order.timelock;
    
    // Update order status to indicate EVM HTLC is created
    if let Some(order) = orders.get_mut(order_id) {
        order.source_htlc_id = Some(evm_htlc_id.to_string());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    // Create ICP HTLC (destination HTLC)
    let icp_htlc_result = create_icp_htlc(
        order_id,
        &destination_token, // ICP token canister ID
        &taker, // Recipient on ICP
        destination_amount.parse::<u128>().unwrap(),
        &hashlock,
        timelock,
    ).await?;
    
    // Extract HTLC ID from result
    let icp_htlc_id = icp_htlc_result.split("HTLC ID: ").last()
        .ok_or_else(|| "Failed to extract ICP HTLC ID".to_string())?;
    
    // Update order status to indicate ICP HTLC is created
    if let Some(order) = orders.get_mut(order_id) {
        order.destination_htlc_id = Some(icp_htlc_id.to_string());
        order.status = SwapOrderStatus::DestinationHTLCCreated;
    }
    
    Ok(format!("EVM→ICP swap initiated successfully! Order: {}, ICP HTLC: {}", order_id, icp_htlc_id))
}

/// Execute a complete ICP→EVM swap flow
pub async fn execute_icp_to_evm_swap(
    order_id: &str,
    icp_htlc_id: &str,
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the order is in the correct state
    match order.status {
        SwapOrderStatus::Created => {},
        _ => return Err("Order is not in Created state".to_string()),
    }
    
    // Update order status to indicate ICP HTLC is created
    if let Some(order) = orders.get_mut(order_id) {
        order.source_htlc_id = Some(icp_htlc_id.to_string());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    // For ICP→EVM, we need to create the EVM HTLC
    // This would typically be done by calling the EVM module
    // For now, we'll simulate this by updating the order
    if let Some(order) = orders.get_mut(order_id) {
        order.destination_htlc_id = Some("evm_htlc_pending".to_string());
        order.status = SwapOrderStatus::DestinationHTLCCreated;
    }
    
    Ok(format!("ICP→EVM swap initiated successfully! Order: {}, EVM HTLC: pending", order_id))
}

/// Coordinate a complete cross-chain swap (bidirectional)
pub async fn coordinate_cross_chain_swap(
    order_id: &str,
    direction: SwapDirection,
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the order is in the correct state
    match order.status {
        SwapOrderStatus::Created => {},
        _ => return Err("Order is not in Created state".to_string()),
    }
    
    match direction {
        SwapDirection::EVMtoICP => {
            // For EVM→ICP, we need the EVM HTLC to be created first
            // This would be done by the frontend/client
            // We'll simulate the coordination
            if let Some(order) = orders.get_mut(order_id) {
                order.status = SwapOrderStatus::SourceHTLCCreated;
            }
            Ok(format!("EVM→ICP swap coordination initiated for order: {}", order_id))
        },
        SwapDirection::ICPtoEVM => {
            // For ICP→EVM, we create the ICP HTLC first
            let icp_htlc_result = create_icp_htlc(
                order_id,
                &order.source_token, // ICP token canister ID
                &order.maker, // Recipient on ICP
                order.source_amount.parse::<u128>().unwrap(),
                &order.hashlock,
                order.timelock,
            ).await?;
            
            if let Some(order) = orders.get_mut(order_id) {
                order.source_htlc_id = Some("icp_htlc_created".to_string());
                order.status = SwapOrderStatus::SourceHTLCCreated;
            }
            
            Ok(format!("ICP→EVM swap coordination initiated for order: {}", order_id))
        },
    }
}

/// Validate a cross-chain swap order
pub fn validate_cross_chain_order(order_id: &str) -> Result<bool, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Check if order has expired
    let current_time = ic_cdk::api::time();
    if current_time > order.expires_at {
        return Err("Order has expired".to_string());
    }
    
    // Check if order is in a valid state
    match order.status {
        SwapOrderStatus::Created |
        SwapOrderStatus::SourceHTLCCreated |
        SwapOrderStatus::DestinationHTLCCreated |
        SwapOrderStatus::SourceHTLCClaimed |
        SwapOrderStatus::DestinationHTLCClaimed => Ok(true),
        SwapOrderStatus::Completed => Ok(true),
        SwapOrderStatus::Expired |
        SwapOrderStatus::Cancelled => Err("Order is not in a valid state".to_string()),
    }
}

/// Get the status of a cross-chain swap
pub fn get_cross_chain_swap_status(order_id: &str) -> Result<SwapOrderStatus, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    Ok(order.status.clone())
}

/// Complete a cross-chain swap by claiming both HTLCs
pub async fn complete_cross_chain_swap(
    order_id: &str,
    secret: &str,
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the secret matches the hashlock
    let secret_hash = format!("0x{}", hex::encode(sha3::Keccak256::digest(secret.as_bytes())));
    if secret_hash != order.hashlock {
        return Err("Invalid secret for swap".to_string());
    }
    
    // Validate the order is in the correct state
    match order.status {
        SwapOrderStatus::DestinationHTLCCreated => {},
        _ => return Err("Order is not ready for completion".to_string()),
    }
    
    // Claim the destination HTLC (ICP HTLC for EVM→ICP, EVM HTLC for ICP→EVM)
    if let Some(htlc_id) = &order.destination_htlc_id {
        if htlc_id.starts_with("icp_htlc_") {
            // Claim ICP HTLC
            let claim_result = claim_icp_htlc(order_id, htlc_id, secret).await?;
            
            // Update order status
            if let Some(order) = orders.get_mut(order_id) {
                order.status = SwapOrderStatus::DestinationHTLCClaimed;
            }
            
            Ok(format!("Cross-chain swap completed! ICP HTLC claimed: {}", claim_result))
        } else {
            // Claim EVM HTLC (this would be done by the EVM module)
            // For now, we'll simulate this
            if let Some(order) = orders.get_mut(order_id) {
                order.status = SwapOrderStatus::DestinationHTLCClaimed;
            }
            
            Ok(format!("Cross-chain swap completed! EVM HTLC claimed: simulated"))
        }
    } else {
        Err("No destination HTLC found".to_string())
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