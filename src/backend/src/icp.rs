use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call;
use sha3::Digest;
use crate::storage::{get_htlc_store, get_atomic_swap_orders};
use crate::types::{HTLC, SwapOrderStatus, SwapDirection};

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
    
    // Call ICRC-2 transfer_from directly with proper type
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
    amount: u128,
    hashlock: &str,
    _timelock: u64,
    user_principal: &str, // User principal for token withdrawal
    is_source_htlc: bool, // true for source HTLC, false for destination HTLC
) -> Result<String, String> {
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the order is in the correct state
    match order.status {
        crate::types::SwapOrderStatus::Created => {},
        crate::types::SwapOrderStatus::SourceHTLCCreated => {},
        _ => return Err("Order is not in Created or SourceHTLCCreated state".to_string()),
    }
    
    // Always use canister as recipient for ICP HTLCs
    let recipient = ic_cdk::api::id().to_string();
    let backend_account = recipient.clone();
    
    // Check if tokens are already in the canister's escrow
    let canister_balance = get_icrc_balance(token_canister_id, &backend_account).await?;
    ic_cdk::println!("🔍 Canister balance for token {}: {}", token_canister_id, canister_balance);
    
    if canister_balance >= amount {
        ic_cdk::println!("✅ Tokens already in canister escrow, skipping transfer");
    } else {
        // Pull tokens from user to canister escrow
        let user_account = user_principal.to_string();
        ic_cdk::println!("🔍 Pulling tokens from user principal {} to escrow", user_account);
        
        let _transfer_result = match transfer_from_icrc_tokens(
            token_canister_id,
            &user_account, // from: ICP user
            &backend_account, // to: backend canister (escrow)
            amount,
        ).await {
            Ok(result) => {
                ic_cdk::println!("✅ Successfully withdrew {} tokens from user {} to canister escrow", amount, user_account);
                Ok(result)
            },
            Err(e) if e.contains("InsufficientAllowance") => {
                Err("User must approve canister to spend tokens. Call ICRC-2 approval first.".to_string())
            },
            Err(e) => {
                ic_cdk::println!("❌ Failed to withdraw tokens: {}", e);
                Err(e)
            },
        }?;
    }
    
    // Determine the correct sender for the HTLC record
    let htlc_sender = if order.maker.starts_with("0x") {
        // EVM→ICP swap: ICP user (taker) is the sender
        order.taker.clone()
    } else {
        // ICP→EVM swap: ICP user (maker) is the sender
        order.maker.clone()
    };
    
    // Calculate fresh timelock for the HTLC (2 hours from now)
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let htlc_timelock = current_time + 7200; // 2 hours from now
    
    // Store the HTLC information
    let htlc = HTLC {
        id: format!("icp_htlc_{}", order_id),
        sender: htlc_sender, // Correct sender based on swap direction
        recipient: recipient, // Always canister
        amount: amount.to_string(),
        hashlock: hashlock.to_string(),
        secret: None, // Secret will be revealed during claim
        timelock: htlc_timelock, // Use fresh timelock
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
    
    // Update the order with the HTLC ID
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(order_id) {
        if is_source_htlc {
            order.source_htlc_id = Some(htlc_id.clone());
            order.status = crate::types::SwapOrderStatus::SourceHTLCCreated;
        } else {
            order.destination_htlc_id = Some(htlc_id.clone());
            order.status = crate::types::SwapOrderStatus::DestinationHTLCCreated;
        }
    }
    
    Ok(format!("ICP HTLC created successfully! HTLC ID: {}", htlc_id))
}

/// Claim an ICP HTLC using the secret
#[allow(dead_code)]
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
    
    // Verify canister is the recipient
    let canister_id = ic_cdk::api::id().to_string();
    if htlc.recipient != canister_id {
        return Err("HTLC does not belong to canister".to_string());
    }
    
    // Get the atomic swap order to determine swap direction
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Handle different swap directions with destination addresses
    let transfer_result = if order.maker.starts_with("0x") {
        // EVM→ICP swap: Canister already has tokens, transfer to user's specified ICP destination
        ic_cdk::println!("🔍 EVM→ICP swap: Canister transferring tokens to user's ICP destination");
        let icp_destination = order.icp_destination_principal.as_ref()
            .unwrap_or(&order.taker); // Fallback to taker if no destination specified
        
        transfer_icrc_tokens(
            &htlc.token,
            icp_destination, // Transfer to the user's specified ICP destination
            htlc.amount.parse::<u128>().unwrap(),
        ).await?
    } else {
        // ICP→EVM swap: Canister needs to pull tokens from user first, then transfer
        ic_cdk::println!("🔍 ICP→EVM swap: Canister pulling tokens from user then transferring");
        
        // First, try to pull tokens from user to canister
        match transfer_from_icrc_tokens(
            &htlc.token,
            &order.maker, // from: ICP user (maker)
            &canister_id, // to: canister
            htlc.amount.parse::<u128>().unwrap(),
        ).await {
            Ok(_) => {
                // Then transfer to the intended recipient (this would be for ICP→EVM, tokens stay on ICP)
                // The actual EVM transfer would happen when the EVM HTLC is claimed
                transfer_icrc_tokens(
                    &htlc.token,
                    &order.taker, // Transfer to the original taker (user)
                    htlc.amount.parse::<u128>().unwrap(),
                ).await?
            },
            Err(e) if e.contains("InsufficientAllowance") => {
                return Err("User must approve canister to spend tokens. Call approve_backend_for_icrc_tokens_public() first.".to_string());
            },
            Err(e) => return Err(e),
        }
    };
    
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
    let _backend_account = backend_principal.to_string();
    
    // Get the atomic swap order to determine the original sender
    let orders = get_atomic_swap_orders();
    let _order = orders.get(order_id)
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



/// Execute a complete EVM→ICP swap flow
#[allow(dead_code)]
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
        SwapOrderStatus::SourceHTLCCreated => {},
        _ => return Err("Order is not in Created or SourceHTLCCreated state".to_string()),
    }
    
    // Clone the values we need before borrowing mutably
    let destination_token = order.destination_token.clone();
    let taker = order.taker.clone();
    let destination_amount = order.destination_amount.clone();
    let hashlock = order.hashlock.clone();
    let timelock = order.timelock;
    let maker = order.maker.clone(); // Clone maker to avoid borrow conflict
    
    // Update order status to indicate EVM HTLC is created
    if let Some(order) = orders.get_mut(order_id) {
        order.source_htlc_id = Some(evm_htlc_id.to_string());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    // For EVM→ICP swap, determine the correct ICP recipient
    // The taker is the backend canister's EVM address, so we use the backend canister as ICP recipient
    let _icp_recipient = if taker.starts_with("0x") {
        // EVM→ICP swap: Use backend canister as recipient (it will distribute to the actual user)
        ic_cdk::api::id().to_string()
    } else {
        // ICP→EVM swap: Use the taker directly (it's already an ICP principal)
        taker.clone()
    };
    
    // Create ICP HTLC (destination HTLC)
    let icp_htlc_result = create_icp_htlc(
        order_id,
        &destination_token, // ICP token canister ID
        destination_amount.parse::<u128>().unwrap(),
        &hashlock,
        timelock,
        &maker, // Use cloned maker as user principal
        true, // This is a source HTLC
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
#[allow(dead_code)]
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
            let _icp_htlc_result = create_icp_htlc(
                order_id,
                &order.source_token, // ICP token canister ID
                order.source_amount.parse::<u128>().unwrap(),
                &order.hashlock,
                order.timelock,
                &order.maker, // Use order.maker as user principal
                true, // This is a source HTLC
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
        SwapOrderStatus::Cancelled |
        SwapOrderStatus::Refunded => Err("Order is not in a valid state".to_string()),
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
#[allow(dead_code)]
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
    Ok(u128), // BlockIndex is nat in Candid, which is u128 in Rust
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
    Ok(u128), // BlockIndex is nat in Candid, which is u128 in Rust
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
    Ok(u128), // BlockIndex is nat in Candid, which is u128 in Rust
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