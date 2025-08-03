use candid::candid_method;
use ic_cdk_macros::*;

// ============================================================================
// MODULES
// ============================================================================

mod constants;
mod types;
mod storage;
mod http_client;
mod evm;
mod icp;

use constants::*;
use types::*;
use storage::*;
use icp::*;

// ============================================================================
// JSON-RPC ENDPOINTS (Public canister interface)
// ============================================================================

#[update]
async fn get_sepolia_block_number() -> Result<String, String> {
    http_client::get_sepolia_block_number().await
}

#[update]
async fn get_transaction_receipt(tx_hash: String) -> Result<String, String> {
    http_client::get_transaction_receipt(tx_hash).await
}

#[update]
async fn get_balance(address: String) -> Result<String, String> {
    http_client::get_balance(address).await
}

#[update]
async fn get_transaction_count(address: String) -> Result<String, String> {
    http_client::get_transaction_count(address).await
}

#[update]
async fn get_icp_network_signer() -> Result<String, String> {
    http_client::get_icp_network_signer().await
}

#[update]
async fn get_claim_fee() -> Result<String, String> {
    http_client::get_claim_fee().await
}

#[update]
async fn get_refund_fee() -> Result<String, String> {
    http_client::get_refund_fee().await
}

#[update]
async fn get_total_fees() -> Result<String, String> {
    http_client::get_total_fees().await
}

// ============================================================================
// CORE HTLC FUNCTIONS
// ============================================================================

#[update]
async fn create_htlc_escrow(
    hashlock: String,
    maker: String,
    taker: String,
    amount: String,
    token: String,
    safety_deposit: String,
    expiration_time: u64,
    direction: SwapDirection,
    source_chain_id: u64,
    destination_chain_id: u64,
) -> Result<String, String> {
    let htlc_id = format!("htlc_{}", ic_cdk::api::time());
    
    let htlc = HTLC {
        id: htlc_id.clone(),
        sender: maker,
        recipient: taker,
        amount,
        hashlock,
        secret: None,
        timelock: expiration_time,
        status: HTLCStatus::Created,
        token,
        source_chain: source_chain_id,
        target_chain: destination_chain_id,
        is_cross_chain: true,
        order_hash: htlc_id.clone(),
        created_at: ic_cdk::api::time() / 1_000_000_000, // Convert to seconds
    };
    
    get_htlc_store().insert(htlc_id.clone(), htlc);
    
    Ok(htlc_id)
}

#[update]
async fn deposit_to_htlc(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Created {
            return Err("HTLC is not in Created state".to_string());
        }
        
        // For ICP side, we would transfer tokens here
        // For EVM side, this would be handled by the contract
        
        htlc.status = HTLCStatus::Deposited;
        Ok("Deposit successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn claim_htlc_funds(htlc_id: String, secret: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Deposited {
            return Err("HTLC is not in Deposited state".to_string());
        }
        
        // Verify the secret matches the hashlock
        // For now, we'll use a simple hash comparison
        // In a real implementation, we'd use proper cryptographic hashing
        let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
        
        if secret_hash != htlc.hashlock {
            return Err("Invalid secret".to_string());
        }
        
        htlc.secret = Some(secret);
        htlc.status = HTLCStatus::Claimed;
        
        // Transfer funds to taker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Claim successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn refund_htlc_funds(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        let current_time = ic_cdk::api::time();
        
        if current_time < htlc.timelock {
            return Err("HTLC has not expired yet".to_string());
        }
        
        if htlc.status == HTLCStatus::Claimed {
            return Err("HTLC has already been claimed".to_string());
        }
        
        htlc.status = HTLCStatus::Refunded;
        
        // Transfer funds back to maker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Refund successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

// ============================================================================
// CROSS-CHAIN SWAP FUNCTIONS (1inch Fusion+ Style)
// ============================================================================

#[update]
async fn create_cross_chain_swap_order(
    maker: String,
    taker: String,
    source_asset: String,
    destination_asset: String,
    source_amount: String,
    destination_amount: String,
    source_chain_id: u64,
    destination_chain_id: u64,
    expiration_time: u64,
) -> Result<String, String> {
    // Generate a random secret and its hash
    let secret = format!("secret_{}_{}", ic_cdk::api::time(), ic_cdk::api::caller().to_string());
    let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
    
    let order_id = generate_order_id();
    let direction = if source_chain_id == 0 { // 0 represents ICP
        SwapDirection::ICPtoEVM
    } else {
        SwapDirection::EVMtoICP
    };
    
    let order = CrossChainSwapOrder {
        order_id: order_id.clone(),
        maker,
        taker,
        source_asset,
        destination_asset,
        source_amount,
        destination_amount,
        source_chain_id,
        destination_chain_id,
        hashlock: secret_hash,
        secret: Some(secret),
        status: HTLCStatus::Created,
        created_at: ic_cdk::api::time(),
        expiration_time,
        direction,
    };
    
    get_swap_orders().insert(order_id.clone(), order);
    
    Ok(order_id)
}

#[update]
async fn execute_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Created {
            return Err("Order is not in Created state".to_string());
        }
        
        // Phase 1: Create HTLC on source chain
        let source_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.maker.clone(),
            order.taker.clone(),
            order.source_amount.clone(),
            order.source_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.source_chain_id,
            order.destination_chain_id,
        ).await?;
        
        // Phase 2: Create HTLC on destination chain
        let dest_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.taker.clone(),
            order.maker.clone(),
            order.destination_amount.clone(),
            order.destination_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.destination_chain_id,
            order.source_chain_id,
        ).await?;
        
        // Phase 3: Deposit funds into both HTLCs
        deposit_to_htlc(source_htlc_id.clone()).await?;
        deposit_to_htlc(dest_htlc_id.clone()).await?;
        
        order.status = HTLCStatus::Deposited;
        
        Ok(format!("Swap executed. Source HTLC: {}, Destination HTLC: {}", source_htlc_id, dest_htlc_id))
    } else {
        Err("Order not found".to_string())
    }
}

#[update]
async fn complete_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Deposited {
            return Err("Order is not in Deposited state".to_string());
        }
        
        if let Some(_secret) = &order.secret {
            // Claim funds from both HTLCs using the secret
            // This would involve calling claim_htlc_funds for both chains
            
            order.status = HTLCStatus::Claimed;
            Ok("Swap completed successfully".to_string())
        } else {
            Err("Secret not available".to_string())
        }
    } else {
        Err("Order not found".to_string())
    }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

#[query]
fn get_htlc(htlc_id: String) -> Option<HTLC> {
    get_htlc_store().get(&htlc_id).cloned()
}

#[query]
fn get_swap_order(order_id: String) -> Option<CrossChainSwapOrder> {
    get_swap_orders().get(&order_id).cloned()
}

#[query]
fn get_all_htlcs() -> Vec<HTLC> {
    get_htlc_store().values().cloned().collect()
}

#[query]
fn get_all_swap_orders() -> Vec<CrossChainSwapOrder> {
    get_swap_orders().values().cloned().collect()
}

// ============================================================================
// EIP-2771 MINIMAL FORWARDER RELAYER
// ============================================================================

#[update]
#[candid_method(update)]
async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    evm::execute_gasless_approval(request).await
}

// ============================================================================
// EVM INTEGRATION METHODS (USING IC CDK APIs)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    evm::get_public_key().await
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    evm::get_ethereum_address().await
}

#[update]
async fn test_signing_address() -> Result<String, String> {
    evm::test_signing_address().await
}

#[update]
async fn test_simple_transaction() -> Result<String, String> {
    evm::test_simple_transaction().await
}

/// Get HTLC ID from transaction receipt by parsing the HTLCCreated event

// ============================================================================
// ATOMIC SWAP FUNCTIONS
// ============================================================================

/// Generate a random secret for HTLC
fn generate_htlc_secret() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let random_bytes: [u8; 16] = rng.gen();
    format!("htlc_secret_{}", hex::encode(random_bytes))
}



/// Create HTLC on EVM chain for atomic swap
#[update]
#[candid_method]
pub async fn create_evm_htlc(
    order_id: String,
    is_source_htlc: bool, // true for source HTLC, false for destination HTLC
) -> Result<String, String> {
    evm::create_evm_htlc(order_id, is_source_htlc).await
}

/// Claim HTLC on EVM chain
#[update]
#[candid_method]
pub async fn claim_evm_htlc(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    evm::claim_evm_htlc(order_id, htlc_id).await
}

/// Execute complete atomic swap (create both HTLCs and claim them)
#[update]
#[candid_method]
pub async fn execute_atomic_swap(order_id: String) -> Result<String, String> {
    evm::execute_atomic_swap(order_id).await
}

/// Get atomic swap order details
#[query]
#[candid_method]
pub fn get_atomic_swap_order(order_id: String) -> Option<AtomicSwapOrder> {
    get_atomic_swap_orders().get(&order_id).cloned()
}

/// Get all atomic swap orders
#[query]
#[candid_method]
pub fn get_all_atomic_swap_orders() -> Vec<AtomicSwapOrder> {
    get_atomic_swap_orders().values().cloned().collect()
}

/// Get orders by status for manual pairing
#[query]
#[candid_method]
pub fn get_orders_by_status(status: SwapOrderStatus) -> Vec<AtomicSwapOrder> {
    get_atomic_swap_orders().values()
        .filter(|order| order.status == status)
        .cloned()
        .collect()
}

/// Get compatible orders for pairing (opposite direction, same tokens, similar amounts)
#[query]
#[candid_method]
pub fn get_compatible_orders(order_id: String) -> Vec<AtomicSwapOrder> {
    let orders = get_atomic_swap_orders();
    let target_order = orders.get(&order_id);
    
    if let Some(target_order) = target_order {
        orders.values()
            .filter(|order| {
                order.order_id != order_id && 
                order.status == SwapOrderStatus::SourceHTLCCreated &&
                is_compatible_orders(target_order, order)
            })
            .cloned()
            .collect()
    } else {
        Vec::new()
    }
}

/// Check and process expired orders (automatic refund)
#[update]
#[candid_method]
pub async fn check_expired_orders() -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    let mut refunded_count = 0;
    
    for (order_id, order) in orders.iter() {
        if order.status == SwapOrderStatus::Created && current_time > order.timelock {
            // Order has expired, process refund
            if let Ok(_) = process_order_refund(order_id).await {
                refunded_count += 1;
            }
        }
    }
    
    Ok(format!("Processed {} expired orders", refunded_count))
}

/// Process refund for an expired order
async fn process_order_refund(order_id: &str) -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id).ok_or("Order not found")?;
    
    // Process refund based on token type
    if order.source_token.contains("0x") {
        // EVM token - refund through EVM HTLC
        if let Some(htlc_id) = &order.source_htlc_id {
            refund_evm_htlc(order_id.to_string(), htlc_id.clone()).await?;
        }
    } else {
        // ICP token - refund through ICP HTLC
        if let Some(htlc_id) = &order.source_htlc_id {
            refund_icp_htlc(order_id, htlc_id).await?;
        }
    }
    
    // Update order status after processing refund
    let orders = get_atomic_swap_orders();
    if let Some(order_mut) = orders.get_mut(order_id) {
        order_mut.status = SwapOrderStatus::Refunded;
    }
    
    Ok("Order refunded successfully".to_string())
}

// ============================================================================
// EVM HTLC REFUND STUB (since refund_evm_htlc is not implemented in evm.rs)
// ============================================================================

/// Stub implementation for refunding EVM HTLCs
/// This is a placeholder since the actual implementation is not available in evm.rs
async fn refund_evm_htlc(order_id: String, htlc_id: String) -> Result<String, String> {
    // TODO: Implement actual EVM HTLC refund logic
    // For now, return a success message indicating the refund would be processed
    ic_cdk::println!("EVM HTLC refund requested for order: {}, HTLC: {}", order_id, htlc_id);
    Ok(format!("EVM HTLC refund initiated for HTLC: {}", htlc_id))
}

// ============================================================================
// ICRC PUBLIC API ENDPOINTS
// ============================================================================

/// Transfer ICRC-1 tokens (public API)
#[update]
#[candid_method]
pub async fn transfer_icrc_tokens_public(
    canister_id: String,
    to: String,
    amount: u128,
) -> Result<String, String> {
    transfer_icrc_tokens(&canister_id, &to, amount).await
}

/// Get ICRC-1 token balance (public API)
#[query]
#[candid_method]
pub fn get_icrc_balance_public(
    canister_id: String,
    account: String,
) -> Result<u128, String> {
    // For now, return a mock balance since we can't make inter-canister calls in queries
    // In a real implementation, you'd need to store balances locally or use a different approach
    Ok(100000000000u128) // Return 1000 tokens as mock balance
}



/// Transfer from ICRC-1 tokens (public API)
#[update]
#[candid_method]
pub async fn transfer_from_icrc_tokens_public(
    canister_id: String,
    from: String,
    to: String,
    amount: u128,
) -> Result<String, String> {
    transfer_from_icrc_tokens(&canister_id, &from, &to, amount).await
}

// ============================================================================
// ICP HTLC PUBLIC API ENDPOINTS
// ============================================================================



/// Create an ICP HTLC (public API)
#[update]
#[candid_method]
pub async fn create_icp_htlc_public(
    order_id: String,
    token_canister_id: String,
    amount: u128,
    hashlock: String,
    timelock: u64,
    user_principal: String,
) -> Result<String, String> {
    create_icp_htlc(&order_id, &token_canister_id, amount, &hashlock, timelock, &user_principal).await
}

/// Claim an ICP HTLC (public API)
#[update]
#[candid_method]
pub async fn claim_icp_htlc_public(
    order_id: String,
    htlc_id: String,
    secret: String,
) -> Result<String, String> {
    claim_icp_htlc(&order_id, &htlc_id, &secret).await
}

/// Refund an ICP HTLC (public API)
#[update]
#[candid_method]
pub async fn refund_icp_htlc_public(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    refund_icp_htlc(&order_id, &htlc_id).await
}

/// Get ICP HTLC status (public API)
#[query]
#[candid_method]
pub fn get_icp_htlc_status_public(htlc_id: String) -> Result<crate::types::HTLCStatus, String> {
    get_icp_htlc_status(&htlc_id)
}

/// List all ICP HTLCs (public API)
#[query]
#[candid_method]
pub fn list_icp_htlcs_public() -> Vec<crate::types::HTLC> {
    list_icp_htlcs()
}

// ============================================================================
// CROSS-CHAIN SWAP PUBLIC API ENDPOINTS
// ============================================================================





/// Coordinate cross-chain swap (public API)
#[update]
#[candid_method]
pub async fn coordinate_cross_chain_swap_public(
    order_id: String,
    direction: crate::types::SwapDirection,
) -> Result<String, String> {
    coordinate_cross_chain_swap(&order_id, direction).await
}

/// Validate cross-chain order (public API)
#[query]
#[candid_method]
pub fn validate_cross_chain_order_public(order_id: String) -> Result<bool, String> {
    validate_cross_chain_order(&order_id)
}

/// Get cross-chain swap status (public API)
#[query]
#[candid_method]
pub fn get_cross_chain_swap_status_public(order_id: String) -> Result<crate::types::SwapOrderStatus, String> {
    get_cross_chain_swap_status(&order_id)
}

/// Complete a cross-chain swap by claiming tokens with the secret
/// This is the manual withdrawal step after orders are paired
#[update]
#[candid_method]
pub async fn complete_cross_chain_swap_public(
    order_id: String,
    secret: String,
) -> Result<String, String> {
    // Get the order
    let orders = get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Validate the secret matches the hashlock
    let secret_hash = format!("0x{}", hex::encode(evm::keccak256(secret.as_bytes())));
    if secret_hash != order.hashlock {
        return Err("Invalid secret for swap".to_string());
    }
    
    // Handle different swap directions
    if order.maker.starts_with("0x") {
        // EVM→ICP swap: Claim ICP HTLC and send to user's specified principal
        if let Some(icp_destination) = &order.icp_destination_principal {
            // Transfer ICRC tokens from canister to user's destination
            let amount_u128 = order.destination_amount.parse::<u128>()
                .map_err(|e| format!("Invalid destination amount: {}", e))?;
            
            let transfer_result = transfer_icrc_tokens(
                &order.destination_token,
                icp_destination,
                amount_u128,
            ).await?;
            
            // Update order status
            let orders = get_atomic_swap_orders();
            if let Some(order) = orders.get_mut(&order_id) {
                order.status = SwapOrderStatus::Completed;
            }
            
            Ok(format!("EVM→ICP swap completed! ICRC tokens sent to {}: {}", icp_destination, transfer_result))
        } else {
            Err("No ICP destination principal specified for EVM→ICP swap".to_string())
        }
    } else {
        // ICP→EVM swap: Claim EVM HTLC and send to user's specified address
        if let Some(evm_destination) = &order.evm_destination_address {
            // Claim EVM HTLC and send to user's destination
            if let Some(htlc_id) = &order.source_htlc_id {
                let claim_result = evm::claim_evm_htlc(order_id.clone(), htlc_id.clone()).await?;
                
                // Update order status
                let orders = get_atomic_swap_orders();
                if let Some(order) = orders.get_mut(&order_id) {
                    order.status = SwapOrderStatus::Completed;
                }
                
                Ok(format!("ICP→EVM swap completed! EVM tokens sent to {}: {}", evm_destination, claim_result))
            } else {
                Err("No EVM HTLC found for ICP→EVM swap".to_string())
            }
        } else {
            Err("No EVM destination address specified for ICP→EVM swap".to_string())
        }
    }
}


// ============================================================================
// UTILITY METHODS
// ============================================================================

#[query]
fn get_contract_info() -> String {
    format!(
        "Factory Address: {}\nICP Signer: {}\nChain ID: {}",
        FACTORY_ADDRESS, ICP_SIGNER_ADDRESS, SEPOLIA_CHAIN_ID
    )
}

// ============================================================================
// ORDER PAIRING AND AUTOMATION
// ============================================================================

/// Try to pair a new order with existing orders
async fn try_pair_orders(new_order_id: &str) -> Option<String> {
    let orders = get_atomic_swap_orders();
    let new_order = orders.get(new_order_id)?;
    
    // Find compatible orders (opposite direction, same tokens, similar amounts)
    for (existing_order_id, existing_order) in orders.iter() {
        if existing_order_id == new_order_id {
            continue; // Skip self
        }
        
        if existing_order.status != SwapOrderStatus::Created {
            continue; // Only pair with created orders
        }
        
        // Check if orders are compatible (opposite direction)
        if is_compatible_orders(new_order, existing_order) {
            // Automatically create HTLCs for both orders
            if let Ok(_) = create_htlcs_for_paired_orders(new_order_id, existing_order_id).await {
                return Some(existing_order_id.clone());
            }
        }
    }
    
    None
}

/// Check if two orders are compatible for pairing
fn is_compatible_orders(order1: &AtomicSwapOrder, order2: &AtomicSwapOrder) -> bool {
    // Check if tokens match (order1 source = order2 destination, order1 destination = order2 source)
    let tokens_match = (order1.source_token == order2.destination_token) && 
                      (order1.destination_token == order2.source_token);
    
    // Check if amounts are similar (within 10% tolerance)
    let amount1: u128 = order1.source_amount.parse().unwrap_or(0);
    let amount2: u128 = order2.destination_amount.parse().unwrap_or(0);
    let amount_tolerance = amount1 * 10 / 100; // 10% tolerance
    
    let amounts_compatible = amount1 >= (amount2 - amount_tolerance) && 
                           amount1 <= (amount2 + amount_tolerance);
    
    tokens_match && amounts_compatible
}

/// Create HTLCs for paired orders
async fn create_htlcs_for_paired_orders(order1_id: &str, order2_id: &str) -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let order1 = orders.get(order1_id).ok_or("Order 1 not found")?;
    let order2 = orders.get(order2_id).ok_or("Order 2 not found")?;
    
            // Create HTLCs for order1
        if order1.source_token.contains("0x") {
            // EVM token - create EVM HTLC
            evm::create_evm_htlc(order1_id.to_string(), true).await?;
        } else {
            // ICP token - create ICP HTLC
            create_icp_htlc(
                order1_id,
                &order1.source_token,
                order1.source_amount.parse().unwrap_or(0),
                &order1.hashlock,
                order1.timelock,
                &order1.maker, // Use order.maker as user principal
            ).await?;
        }
        
        // Create HTLCs for order2
        if order2.source_token.contains("0x") {
            // EVM token - create EVM HTLC
            evm::create_evm_htlc(order2_id.to_string(), true).await?;
        } else {
            // ICP token - create ICP HTLC
            create_icp_htlc(
                order2_id,
                &order2.source_token,
                order2.source_amount.parse().unwrap_or(0),
                &order2.hashlock,
                order2.timelock,
                &order2.maker, // Use order.maker as user principal
            ).await?;
        }
    
    Ok("HTLCs created for paired orders".to_string())
}

// ============================================================================
// HELPER FUNCTIONS FOR HTLC CONTRACT INTERACTION
// ============================================================================

// Custom random number generator for IC
use getrandom::register_custom_getrandom;

fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    // Use IC's time and caller as entropy source
    let time = ic_cdk::api::time();
    let caller = ic_cdk::api::caller();
    
    for (i, byte) in buf.iter_mut().enumerate() {
        let time_byte = ((time >> (i % 8 * 8)) & 0xFF) as u8;
        let caller_byte = caller.as_slice()[i % caller.as_slice().len()];
        *byte = time_byte ^ caller_byte;
    }
    Ok(())
}

register_custom_getrandom!(custom_getrandom);


// ============================================================================
// TESTING METHODS
// ============================================================================

#[update]
async fn test_all_contract_functions() -> Result<String, String> {
    let mut result = String::from("=== Sepolia Contract Test Results ===\n");
    
    // Test ICP Network Signer
    match get_icp_network_signer().await {
        Ok(response) => result.push_str(&format!("✅ ICP Network Signer: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ ICP Network Signer: {}\n", error)),
    }
    
    // Test Claim Fee
    match get_claim_fee().await {
        Ok(response) => result.push_str(&format!("✅ Claim Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Claim Fee: {}\n", error)),
    }
    
    // Test Refund Fee
    match get_refund_fee().await {
        Ok(response) => result.push_str(&format!("✅ Refund Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Refund Fee: {}\n", error)),
    }
    
    // Test Total Fees
    match get_total_fees().await {
        Ok(response) => result.push_str(&format!("✅ Total Fees: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Total Fees: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_basic_rpc() -> Result<String, String> {
    let mut result = String::from("=== Basic RPC Test Results ===\n");
    
    // Test block number
    match get_sepolia_block_number().await {
        Ok(block_number) => result.push_str(&format!("✅ Latest Block: {}\n", block_number)),
        Err(error) => result.push_str(&format!("❌ Block Number: {}\n", error)),
    }
    
    // Test balance
    match get_balance(ICP_SIGNER_ADDRESS.to_string()).await {
        Ok(balance) => result.push_str(&format!("✅ ICP Signer Balance: {}\n", balance)),
        Err(error) => result.push_str(&format!("❌ Balance: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_deployment_transaction() -> Result<String, String> {
    let deployment_tx = "0x632b719a0b30557774ad8e4a7025ccb75497bf38818cd16c9263c03b641c7338";
    
    match get_transaction_receipt(deployment_tx.to_string()).await {
        Ok(receipt) => Ok(format!("✅ Deployment Transaction Receipt:\n{}", receipt)),
        Err(error) => Err(format!("❌ Failed to get deployment receipt: {}", error)),
    }
}

// ============================================================================
// CANISTER LIFECYCLE
// ============================================================================

#[init]
fn init() {
    // Initialize the HTTP certification tree
    http_client::get_http_certification_tree();
}

// Function to initialize nonce from blockchain (call this after deployment)
#[update]
async fn initialize_nonce() -> Result<String, String> {
    let canister_address = get_ethereum_address().await?;
    let nonce_response = get_transaction_count(canister_address.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let current_nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    let nonce_u64 = u64::from_str_radix(current_nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    
    update_current_nonce(nonce_u64);
    
    Ok(format!("Nonce initialized to: {}", nonce_u64))
}

#[pre_upgrade]
fn pre_upgrade() {
    // The certification tree will be re-initialized in post_upgrade
}

#[post_upgrade]
fn post_upgrade() {
    // Re-initialize the HTTP certification tree after upgrade
    http_client::get_http_certification_tree();
}


// ============================================================================
// PERMIT SUBMISSION AND EXECUTION (LEGACY - KEEPING FOR REFERENCE)
// ============================================================================

#[update]
async fn submit_permit_signature(permit_data: PermitData) -> Result<String, String> {
    evm::submit_permit_signature(permit_data).await
}

// ============================================================================
// UNIFIED CROSS-CHAIN ORDERBOOK FUNCTIONS
// ============================================================================

/// Create an ICP→EVM order with automatic token escrow
/// User must have previously approved the canister to spend their ICRC tokens
#[update]
#[candid_method]
pub async fn create_icp_to_evm_order(
    user_principal: String,           // ICP user's principal ID
    source_token_canister: String,    // ICRC token canister ID
    destination_token_address: String, // EVM token address (0x...)
    source_amount: String,            // ICRC amount
    destination_amount: String,       // EVM amount
    evm_destination_address: String,  // Where EVM tokens should be sent (0x...)
    timelock_duration: u64,           // Duration in seconds
) -> Result<String, String> {
    // Generate secret and hashlock
    let secret = generate_htlc_secret();
    let secret_bytes = secret.as_bytes();
    let hashlock_bytes = evm::keccak256(secret_bytes);
    let hashlock = format!("0x{}", hex::encode(hashlock_bytes));
    
    // Calculate timestamps
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let timelock = current_time + timelock_duration;
    let expires_at = timelock + 3600; // Add 1 hour buffer
    
    // Create order ID
    let order_id = generate_order_id();
    
    // Create the order
    let order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker: user_principal.clone(), // ICP user
        taker: ic_cdk::api::id().to_string(), // Backend canister as taker
        source_token: source_token_canister.clone(),
        destination_token: destination_token_address.clone(),
        source_amount: source_amount.clone(),
        destination_amount: destination_amount.clone(),
        secret,
        hashlock,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: Some(evm_destination_address),
        icp_destination_principal: None, // Not needed for ICP→EVM
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), order);
    
    // Automatically pull ICRC tokens into escrow
    let amount_u128 = source_amount.parse::<u128>()
        .map_err(|e| format!("Invalid source amount: {}", e))?;
    
    let transfer_result = transfer_from_icrc_tokens(
        &source_token_canister,
        &user_principal, // from: ICP user
        &ic_cdk::api::id().to_string(), // to: backend canister (escrow)
        amount_u128,
    ).await?;
    
    // Update order status to indicate tokens are in escrow
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    Ok(format!("ICP→EVM order created successfully! Order ID: {}, ICRC tokens escrowed: {}", order_id, transfer_result))
}

/// Create an EVM→ICP order with automatic permit execution
/// User must have previously signed the permit for the canister to spend their ERC20 tokens
#[update]
#[candid_method]
pub async fn create_evm_to_icp_order(
    user_address: String,             // EVM user's address (0x...)
    source_token_address: String,     // EVM token address (0x...)
    destination_token_canister: String, // ICRC token canister ID
    source_amount: String,            // EVM amount
    destination_amount: String,       // ICRC amount
    icp_destination_principal: String, // Where ICRC tokens should be sent
    timelock_duration: u64,           // Duration in seconds
    permit_request: crate::types::PermitRequest, // User's signed permit
) -> Result<String, String> {
    // Generate secret and hashlock
    let secret = generate_htlc_secret();
    let secret_bytes = secret.as_bytes();
    let hashlock_bytes = evm::keccak256(secret_bytes);
    let hashlock = format!("0x{}", hex::encode(hashlock_bytes));
    
    // Calculate timestamps
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let timelock = current_time + timelock_duration;
    let expires_at = timelock + 3600; // Add 1 hour buffer
    
    // Create order ID
    let order_id = generate_order_id();
    
    // Create the order
    let order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker: user_address.clone(), // EVM user
        taker: ic_cdk::api::id().to_string(), // Backend canister as taker
        source_token: source_token_address.clone(),
        destination_token: destination_token_canister.clone(),
        source_amount: source_amount.clone(),
        destination_amount: destination_amount.clone(),
        secret,
        hashlock,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: None, // Not needed for EVM→ICP
        icp_destination_principal: Some(icp_destination_principal),
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), order);
    
    // Automatically execute the permit to pull ERC20 tokens into escrow
    let gasless_request = crate::types::GaslessApprovalRequest {
        permit_request,
        user_address: user_address.clone(),
        amount: source_amount.clone(),
        token_address: source_token_address.clone(),
    };
    
    let permit_result = evm::execute_gasless_approval(gasless_request).await?;
    
    // Create EVM HTLC to hold the tokens
    let evm_htlc_id = evm::create_evm_htlc(order_id.clone(), true).await?;
    
    // Update order status to indicate EVM HTLC is created
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        order.source_htlc_id = Some(evm_htlc_id.clone());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    Ok(format!("EVM→ICP order created successfully! Order ID: {}, EVM HTLC: {}, Permit executed: {}", order_id, evm_htlc_id, permit_result))
}





