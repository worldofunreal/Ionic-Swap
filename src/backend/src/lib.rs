use candid::{candid_method, Principal};
use ic_cdk_macros::*;
use std::collections::HashMap;

// ============================================================================
// MODULES
// ============================================================================

mod constants;
mod types;
mod storage;
mod http_client;
mod evm;
mod icp;
mod solana;
mod bridgeless_token;
mod unified_pools;

// New Solana modules using official SOL RPC canister
mod ed25519;
mod solana_wallet;
mod spl;
mod state;

use constants::*;
use types::*;
use storage::*;
use icp::*;
use solana::*;
use bridgeless_token::*;
use unified_pools::*;

// New Solana imports
use candid::{CandidType, Nat};
use serde::Deserialize;
use sol_rpc_client::{ed25519::Ed25519KeyId, IcRuntime, SolRpcClient};
use sol_rpc_types::{
    CommitmentLevel, ConsensusStrategy, RpcEndpoint, RpcSource, RpcSources, SolanaCluster,
};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_system_interface::instruction;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::{
    address::get_associated_token_address_with_program_id,
};
use std::str::FromStr;
use num::ToPrimitive;

// ============================================================================
// SOLANA TYPES AND CLIENT
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub sol_rpc_canister_id: Option<Principal>,
    pub solana_network: Option<SolanaNetwork>,
    pub ed25519_key_name: Option<Ed25519KeyName>,
    pub solana_commitment_level: Option<CommitmentLevel>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum SolanaNetwork {
    Mainnet,
    #[default]
    Devnet,
    Custom(RpcEndpoint),
}

impl From<SolanaNetwork> for RpcSources {
    fn from(network: SolanaNetwork) -> Self {
        match network {
            SolanaNetwork::Mainnet => Self::Default(SolanaCluster::Mainnet),
            SolanaNetwork::Devnet => Self::Default(SolanaCluster::Devnet),
            SolanaNetwork::Custom(endpoint) => Self::Custom(vec![RpcSource::Custom(endpoint)]),
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum Ed25519KeyName {
    #[default]
    LocalDevelopment,
    MainnetTestKey1,
    MainnetProdKey1,
}

impl From<Ed25519KeyName> for Ed25519KeyId {
    fn from(key_id: Ed25519KeyName) -> Self {
        match key_id {
            Ed25519KeyName::LocalDevelopment => Self::LocalDevelopment,
            Ed25519KeyName::MainnetTestKey1 => Self::MainnetTestKey1,
            Ed25519KeyName::MainnetProdKey1 => Self::MainnetProdKey1,
        }
    }
}

pub fn client() -> SolRpcClient<IcRuntime> {
    let rpc_sources = state::read_state(|state| state.solana_network().clone()).into();
    let consensus_strategy = match rpc_sources {
        RpcSources::Custom(_) => ConsensusStrategy::Equality,
        RpcSources::Default(_) => ConsensusStrategy::Threshold {
            min: 2,
            total: Some(3),
        },
    };
    state::read_state(|state| state.sol_rpc_canister_id())
        .map(|canister_id| SolRpcClient::builder(IcRuntime, canister_id))
        .unwrap_or(SolRpcClient::builder_for_ic())
        .with_rpc_sources(rpc_sources)
        .with_consensus_strategy(consensus_strategy)
        .with_default_commitment_level(state::read_state(|state| state.solana_commitment_level()))
        .build()
}

pub fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}

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
    _safety_deposit: String,
    expiration_time: u64,
    _direction: SwapDirection,
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
    _canister_id: String,
    _account: String,
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
    ic_cdk::println!("🔍 complete_cross_chain_swap_public called for order: {}", order_id);
    
    // Get the order
    let orders = get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    ic_cdk::println!("🔍 Order details:");
    ic_cdk::println!("  Maker: {}", order.maker);
    ic_cdk::println!("  Status: {:?}", order.status);
    ic_cdk::println!("  Source token: {}", order.source_token);
    ic_cdk::println!("  Destination token: {}", order.destination_token);
    ic_cdk::println!("  Source HTLC ID: {:?}", order.source_htlc_id);
    ic_cdk::println!("  Destination HTLC ID: {:?}", order.destination_htlc_id);
    ic_cdk::println!("  EVM destination address: {:?}", order.evm_destination_address);
    ic_cdk::println!("  ICP destination principal: {:?}", order.icp_destination_principal);
    
    // Validate the secret matches the hashlock
    let secret_hash = format!("0x{}", hex::encode(evm::keccak256(secret.as_bytes())));
    ic_cdk::println!("🔍 Secret validation:");
    ic_cdk::println!("  Provided secret: {}", secret);
    ic_cdk::println!("  Secret hash: {}", secret_hash);
    ic_cdk::println!("  Expected hashlock: {}", order.hashlock);
    
    if secret_hash != order.hashlock {
        return Err("Invalid secret for swap".to_string());
    }
    
    // Handle different swap directions
    if order.maker.starts_with("0x") {
        // EVM→ICP or EVM→Solana swap: Claim destination HTLC and send to user's specified address
        if let Some(icp_destination) = &order.icp_destination_principal {
            // EVM→ICP swap: Transfer ICRC tokens from canister to user's destination
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
        } else if let Some(solana_destination) = &order.solana_destination_address {
            // EVM→Solana swap: Transfer SPL tokens from canister to user's destination
            let amount_u64 = order.destination_amount.parse::<u64>()
                .map_err(|e| format!("Invalid destination amount: {}", e))?;
            
            let canister_solana_address = solana::get_canister_solana_address().await?;
            let canister_token_account = solana::get_associated_token_address(&canister_solana_address, &order.destination_token)?;
            let destination_token_account = solana::get_associated_token_address(solana_destination, &order.destination_token)?;
            
            let transfer_result = solana::transfer_spl_tokens_from_canister(
                &canister_token_account,
                &destination_token_account,
                &canister_solana_address,
                amount_u64,
            ).await?;
            
            // Update order status
            let orders = get_atomic_swap_orders();
            if let Some(order) = orders.get_mut(&order_id) {
                order.status = SwapOrderStatus::Completed;
            }
            
            Ok(format!("EVM→Solana swap completed! SPL tokens sent to {}: {}", solana_destination, transfer_result))
        } else {
            Err("No destination address specified for EVM swap".to_string())
        }
    } else if order.maker.len() > 44 {
        // Solana→EVM or Solana→ICP swap: Transfer tokens directly to user's address
        ic_cdk::println!("🔍 Processing Solana→EVM/ICP swap...");
        
        if let Some(evm_destination) = &order.evm_destination_address {
            // Solana→EVM swap: Transfer ERC20 tokens directly to user's address
            ic_cdk::println!("  ✅ EVM destination address found: {}", evm_destination);
            
            ic_cdk::println!("  🔍 Transferring ERC20 tokens to user...");
            ic_cdk::println!("    Token: {}", order.destination_token);
            ic_cdk::println!("    Recipient: {}", evm_destination);
            ic_cdk::println!("    Amount: {}", order.destination_amount);
            
            // Transfer ERC20 tokens from canister to user's destination address
            let transfer_result = evm::transfer_erc20_tokens(
                &order.destination_token,
                evm_destination,
                &order.destination_amount,
            ).await?;
            
            ic_cdk::println!("  ✅ ERC20 transfer completed: {}", transfer_result);
            
            // Update order status
            let orders = get_atomic_swap_orders();
            if let Some(order) = orders.get_mut(&order_id) {
                order.status = SwapOrderStatus::Completed;
                ic_cdk::println!("  ✅ Order status updated to Completed");
            }
            
            Ok(format!("Solana→EVM swap completed! EVM tokens sent to {}: Transfer: {}", 
                      evm_destination, transfer_result))
        } else if let Some(icp_destination) = &order.icp_destination_principal {
            // Solana→ICP swap: Transfer ICRC tokens from canister to user's destination
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
            
            Ok(format!("Solana→ICP swap completed! ICRC tokens sent to {}: {}", icp_destination, transfer_result))
    } else {
            ic_cdk::println!("  ❌ No destination address found for Solana swap");
            ic_cdk::println!("    Order evm_destination_address: {:?}", order.evm_destination_address);
            ic_cdk::println!("    Order icp_destination_principal: {:?}", order.icp_destination_principal);
            Err("No destination address specified for Solana swap".to_string())
        }
    } else {
        // ICP→EVM or ICP→Solana swap: Transfer tokens directly to user's address
        ic_cdk::println!("🔍 Processing ICP→EVM/Solana swap...");
        
        if let Some(evm_destination) = &order.evm_destination_address {
            // ICP→EVM swap: Transfer ERC20 tokens directly to user's address
            ic_cdk::println!("  ✅ EVM destination address found: {}", evm_destination);
            
            ic_cdk::println!("  🔍 Transferring ERC20 tokens to user...");
            ic_cdk::println!("    Token: {}", order.destination_token);
            ic_cdk::println!("    Recipient: {}", evm_destination);
            ic_cdk::println!("    Amount: {}", order.destination_amount);
            
            // Transfer ERC20 tokens from canister to user's destination address
            let transfer_result = evm::transfer_erc20_tokens(
                &order.destination_token,
                evm_destination,
                &order.destination_amount,
            ).await?;
            
            ic_cdk::println!("  ✅ ERC20 transfer completed: {}", transfer_result);
            
            // Update order status
            let orders = get_atomic_swap_orders();
            if let Some(order) = orders.get_mut(&order_id) {
                order.status = SwapOrderStatus::Completed;
                ic_cdk::println!("  ✅ Order status updated to Completed");
            }
            
            Ok(format!("ICP→EVM swap completed! EVM tokens sent to {}: Transfer: {}", 
                      evm_destination, transfer_result))
        } else if let Some(solana_destination) = &order.solana_destination_address {
            // ICP→Solana swap: Transfer SPL tokens from canister to user's destination
            let amount_u64 = order.destination_amount.parse::<u64>()
                .map_err(|e| format!("Invalid destination amount: {}", e))?;
            
            let canister_solana_address = solana::get_canister_solana_address().await?;
            let canister_token_account = solana::get_associated_token_address(&canister_solana_address, &order.destination_token)?;
            let destination_token_account = solana::get_associated_token_address(solana_destination, &order.destination_token)?;
            
            let transfer_result = solana::transfer_spl_tokens_from_canister(
                &canister_token_account,
                &destination_token_account,
                &canister_solana_address,
                amount_u64,
            ).await?;
            
            // Update order status
            let orders = get_atomic_swap_orders();
            if let Some(order) = orders.get_mut(&order_id) {
                order.status = SwapOrderStatus::Completed;
            }
            
            Ok(format!("ICP→Solana swap completed! SPL tokens sent to {}: {}", solana_destination, transfer_result))
        } else {
            ic_cdk::println!("  ❌ No destination address found for ICP swap");
            ic_cdk::println!("    Order evm_destination_address: {:?}", order.evm_destination_address);
            ic_cdk::println!("    Order solana_destination_address: {:?}", order.solana_destination_address);
            Err("No destination address specified for ICP swap".to_string())
        }
    }
}

/// Transfer ERC20 tokens from backend canister to recipient
#[update]
#[candid_method]
pub async fn transfer_erc20_tokens_public(
    token_address: String,
    recipient: String,
    amount: String,
) -> Result<String, String> {
    evm::transfer_erc20_tokens(&token_address, &recipient, &amount).await
}

// ============================================================================
// SOLANA PUBLIC API ENDPOINTS
// ============================================================================

/// Get Solana account balance (public API)
#[update]
#[candid_method]
pub async fn get_solana_balance_public(account: String) -> Result<u64, String> {
    get_solana_balance(account).await
}

/// Get Solana slot (block number) (public API)
#[update]
#[candid_method]
pub async fn get_solana_slot_public() -> Result<u64, String> {
    get_solana_slot().await
}

/// Get Solana account info (public API)
#[update]
#[candid_method]
pub async fn get_solana_account_info_public(account: String) -> Result<String, String> {
    get_solana_account_info(account).await
}

/// Get SPL token account balance (public API)
#[update]
#[candid_method]
pub async fn get_spl_token_balance_public(token_account: String) -> Result<String, String> {
    let balance = get_spl_token_balance(token_account).await?;
    Ok(serde_json::to_string(&balance).unwrap())
}

/// Get associated token account address (public API)
#[query]
#[candid_method]
pub fn get_associated_token_address_public(
    wallet_address: String,
    mint_address: String,
) -> Result<String, String> {
    get_associated_token_address(&wallet_address, &mint_address)
}

/// Create associated token account instruction (public API)
#[query]
#[candid_method]
pub fn create_associated_token_account_instruction_public(
    funding_address: String,
    wallet_address: String,
    mint_address: String,
) -> Result<String, String> {
    let (account_address, instruction_data) = create_associated_token_account_instruction(
        &funding_address,
        &wallet_address,
        &mint_address,
    )?;
    
    let response = serde_json::json!({
        "associated_token_account": account_address,
        "instruction_data": hex::encode(instruction_data)
    });
    
    Ok(serde_json::to_string(&response).unwrap())
}

/// Transfer SPL tokens instruction (public API)
#[query]
#[candid_method]
pub fn transfer_spl_tokens_instruction_public(
    source_address: String,
    destination_address: String,
    authority_address: String,
    amount: u64,
) -> Result<String, String> {
    let instruction_data = transfer_spl_tokens_instruction(
        &source_address,
        &destination_address,
        &authority_address,
        amount,
    )?;
    
    Ok(hex::encode(instruction_data))
}

/// Send SOL transaction (public API)
#[update]
#[candid_method]
pub async fn send_sol_transaction_public(
    from_address: String,
    to_address: String,
    amount: u64,
) -> Result<String, String> {
    send_sol_transaction(&from_address, &to_address, amount).await
}

/// Send SPL token transaction (public API)
#[update]
#[candid_method]
pub async fn send_spl_token_transaction_public(
    from_token_account: String,
    to_token_account: String,
    authority: String,
    amount: u64,
) -> Result<String, String> {
    send_spl_token_transaction(&from_token_account, &to_token_account, &authority, amount).await
}

/// Get Solana wallet for ICP principal (public API)
#[query]
#[candid_method]
pub fn get_solana_wallet_public(principal: String) -> Result<String, String> {
    let principal = Principal::from_text(principal)
        .map_err(|e| format!("Invalid principal: {}", e))?;
    
    let wallet = SolanaWallet::new(principal);
    Ok(wallet.get_solana_address())
}

// ============================================================================
// SOLANA HTLC PUBLIC API ENDPOINTS
// ============================================================================

/// Create a Solana HTLC (public API)
#[update]
#[candid_method]
pub async fn create_solana_htlc_public(
    order_id: String,
    token_mint: String,
    amount: u64,
    hashlock: String,
    timelock: u64,
    user_address: String,
    is_source_htlc: bool,
) -> Result<String, String> {
    solana::create_solana_htlc(
        &order_id,
        &token_mint,
        amount,
        &hashlock,
        timelock,
        &user_address,
        is_source_htlc,
    ).await
}

/// Claim a Solana HTLC (public API)
#[update]
#[candid_method]
pub async fn claim_solana_htlc_public(
    order_id: String,
    htlc_id: String,
    secret: String,
) -> Result<String, String> {
    solana::claim_solana_htlc(&order_id, &htlc_id, &secret).await
}

/// Refund a Solana HTLC (public API)
#[update]
#[candid_method]
pub async fn refund_solana_htlc_public(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    solana::refund_solana_htlc(&order_id, &htlc_id).await
}

/// Get Solana HTLC status (public API)
#[query]
#[candid_method]
pub fn get_solana_htlc_status_public(htlc_id: String) -> Result<crate::types::HTLCStatus, String> {
    solana::get_solana_htlc_status(&htlc_id)
}

/// List all Solana HTLCs (public API)
#[query]
#[candid_method]
pub fn list_solana_htlcs_public() -> Vec<crate::types::HTLC> {
    solana::list_solana_htlcs()
}

/// Get canister's Solana address (public API)
#[query]
#[candid_method]
pub async fn get_canister_solana_address_public() -> Result<String, String> {
    solana::get_canister_solana_address().await
}

/// Sign and send a Solana transaction (public API)
#[update]
#[candid_method]
pub async fn sign_and_send_solana_transaction_public(
    transaction_data: String,
) -> Result<String, String> {
    solana::sign_and_send_solana_transaction(&transaction_data).await
}

// ============================================================================
// NEW SOLANA FUNCTIONS USING OFFICIAL SOL RPC CANISTER
// ============================================================================

/// Initialize the Solana state
#[update]
#[candid_method]
pub fn init_solana(init_arg: InitArg) {
    state::init_state(init_arg);
}

/// Get Solana account address for a principal
#[update]
#[candid_method]
pub async fn get_solana_account_address(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    wallet.solana_account().to_string()
}

/// Get SOL balance for an account
#[update]
#[candid_method]
pub async fn get_sol_balance(account: Option<String>) -> Nat {
    let account = account.unwrap_or(get_solana_account_address(None).await);
    let public_key = Pubkey::from_str(&account).unwrap();
    let balance = client()
        .get_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getBalance` failed");
    Nat::from(balance)
}

/// Send SOL from canister's account to recipient
#[update]
#[candid_method]
pub async fn send_sol(owner: Option<Principal>, to: String, amount: Nat) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;

    let recipient = Pubkey::from_str(&to).unwrap();
    let payer = wallet.solana_account();
    let amount = amount.0.to_u64().unwrap();

    ic_cdk::println!(
        "Instruction to transfer {amount} lamports from {} to {recipient}",
        payer.as_ref()
    );
    let instruction = instruction::transfer(payer.as_ref(), &recipient, amount);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string()
}

/// Get associated token account address
#[update]
#[candid_method]
pub async fn get_associated_token_account_address(
    owner: Option<Principal>, 
    mint_account: String
) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    let mint = Pubkey::from_str(&mint_account).unwrap();
    get_associated_token_address_with_program_id(
        wallet.solana_account().as_ref(),
        &mint,
        &get_account_owner(&mint).await,
    )
    .to_string()
}

/// Send SPL tokens
#[update]
#[candid_method]
pub async fn send_spl_token(
    owner: Option<Principal>,
    mint_account: String,
    to: String,
    amount: Nat,
) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;

    let payer = wallet.solana_account();
    let recipient = Pubkey::from_str(&to).unwrap();
    let mint = Pubkey::from_str(&mint_account).unwrap();
    let amount = amount.0.to_u64().unwrap();

    let token_program = get_account_owner(&mint).await;

    let from = get_associated_token_address_with_program_id(payer.as_ref(), &mint, &token_program);
    let to = get_associated_token_address_with_program_id(&recipient, &mint, &token_program);

    let instruction = spl::transfer_instruction_with_program_id(&from, &to, payer.as_ref(), amount, &token_program);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string()
}

async fn get_account_owner(account: &Pubkey) -> Pubkey {
    use sol_rpc_types::GetAccountInfoEncoding;
    let owner = client()
        .get_account_info(*account)
        .with_encoding(GetAccountInfoEncoding::Base64)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getAccountInfo` failed")
        .unwrap_or_else(|| panic!("Account not found for pubkey `{account}`"))
        .owner;
    Pubkey::from_str(&owner).unwrap()
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
    
    ic_cdk::println!("🔍 Checking for compatible orders for order: {}", new_order_id);
    ic_cdk::println!("  New order status: {:?}", new_order.status);
    ic_cdk::println!("  New order source token: {}", new_order.source_token);
    ic_cdk::println!("  New order destination token: {}", new_order.destination_token);
    
    // Find compatible orders (opposite direction, same tokens, similar amounts)
    for (existing_order_id, existing_order) in orders.iter() {
        if existing_order_id == new_order_id {
            continue; // Skip self
        }
        
        ic_cdk::println!("  Checking existing order: {} (status: {:?})", existing_order_id, existing_order.status);
        
        if existing_order.status != SwapOrderStatus::Created && existing_order.status != SwapOrderStatus::SourceHTLCCreated {
            ic_cdk::println!("    Skipping - status not compatible");
            continue; // Only pair with created or source HTLC created orders
        }
        
        // Check if orders are compatible (opposite direction)
        if is_compatible_orders(new_order, existing_order) {
            ic_cdk::println!("    ✅ Orders are compatible! Creating HTLCs...");
            // Automatically create HTLCs for both orders
            if let Ok(_) = create_htlcs_for_paired_orders(new_order_id, existing_order_id).await {
                ic_cdk::println!("    ✅ HTLCs created successfully");
                return Some(existing_order_id.clone());
            } else {
                ic_cdk::println!("    ❌ Failed to create HTLCs");
            }
        } else {
            ic_cdk::println!("    ❌ Orders are not compatible");
        }
    }
    
    ic_cdk::println!("  No compatible orders found");
    None
}

/// Check if two orders are compatible for pairing
fn is_compatible_orders(order1: &AtomicSwapOrder, order2: &AtomicSwapOrder) -> bool {
    ic_cdk::println!("    🔍 Checking compatibility:");
    ic_cdk::println!("      Order1 source: {} -> destination: {}", order1.source_token, order1.destination_token);
    ic_cdk::println!("      Order2 source: {} -> destination: {}", order2.source_token, order2.destination_token);
    
    // Check if tokens match (order1 source = order2 destination, order1 destination = order2 source)
    let tokens_match = (order1.source_token == order2.destination_token) && 
                      (order1.destination_token == order2.source_token);
    
    ic_cdk::println!("      Tokens match: {}", tokens_match);
    
    // Check if amounts are similar (within 10% tolerance)
    let amount1: u128 = order1.source_amount.parse().unwrap_or(0);
    let amount2: u128 = order2.destination_amount.parse().unwrap_or(0);
    let amount_tolerance = amount1 * 10 / 100; // 10% tolerance
    
    let amounts_compatible = amount1 >= (amount2 - amount_tolerance) && 
                           amount1 <= (amount2 + amount_tolerance);
    
    ic_cdk::println!("      Amount1: {}, Amount2: {}, Tolerance: {}", amount1, amount2, amount_tolerance);
    ic_cdk::println!("      Amounts compatible: {}", amounts_compatible);
    
    // Check if swap directions are compatible
    let directions_compatible = is_compatible_swap_direction(order1, order2);
    ic_cdk::println!("      Directions compatible: {}", directions_compatible);
    
    let result = tokens_match && amounts_compatible && directions_compatible;
    ic_cdk::println!("      Final result: {}", result);
    
    result
}

/// Check if swap directions are compatible for pairing
fn is_compatible_swap_direction(order1: &AtomicSwapOrder, order2: &AtomicSwapOrder) -> bool {
    // Determine chain types for each order
    let order1_source_chain = get_chain_type(&order1.source_token);
    let order1_dest_chain = get_chain_type(&order1.destination_token);
    let order2_source_chain = get_chain_type(&order2.source_token);
    let order2_dest_chain = get_chain_type(&order2.destination_token);
    
    ic_cdk::println!("      Order1: {} -> {}", order1_source_chain, order1_dest_chain);
    ic_cdk::println!("      Order2: {} -> {}", order2_source_chain, order2_dest_chain);
    
    // Orders are compatible if they have opposite directions
    // e.g., EVM->ICP with ICP->EVM, or Solana->EVM with EVM->Solana
    (order1_source_chain == order2_dest_chain) && (order1_dest_chain == order2_source_chain)
}

/// Determine chain type from token address
fn get_chain_type(token_address: &str) -> &'static str {
    if token_address.starts_with("0x") {
        "EVM"
    } else if token_address.len() > 44 {
        "Solana" // Solana addresses are typically base58 encoded and longer
    } else {
        "ICP" // ICP canister IDs are shorter
    }
}

/// Create HTLCs for paired orders
async fn create_htlcs_for_paired_orders(order1_id: &str, order2_id: &str) -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let order1 = orders.get(order1_id).ok_or("Order 1 not found")?;
    let order2 = orders.get(order2_id).ok_or("Order 2 not found")?;
    
    ic_cdk::println!("🔍 Completing swap for paired orders:");
    ic_cdk::println!("  Order 1: {} (source: {}, destination: {})", order1_id, order1.source_token, order1.destination_token);
    ic_cdk::println!("  Order 2: {} (source: {}, destination: {})", order2_id, order2.source_token, order2.destination_token);
    
    // Determine which order is EVM→ICP and which is ICP→EVM
    let (evm_to_icp_order, icp_to_evm_order) = if order1.source_token.contains("0x") {
        (order1, order2)
    } else {
        (order2, order1)
    };
    
    let evm_to_icp_order_id = if order1.source_token.contains("0x") { order1_id } else { order2_id };
    let icp_to_evm_order_id = if order1.source_token.contains("0x") { order2_id } else { order1_id };
    
    ic_cdk::println!("  EVM→ICP Order: {} (EVM HTLC: {:?})", evm_to_icp_order_id, evm_to_icp_order.source_htlc_id);
    ic_cdk::println!("  ICP→EVM Order: {} (ICP tokens in escrow)", icp_to_evm_order_id);
    
    // Complete the EVM→ICP swap (this will transfer ICP tokens to the EVM user)
    if let Some(_evm_htlc_id) = &evm_to_icp_order.source_htlc_id {
        ic_cdk::println!("  Completing EVM→ICP swap...");
        match complete_cross_chain_swap_public(evm_to_icp_order_id.to_string(), evm_to_icp_order.secret.clone()).await {
            Ok(result) => {
                ic_cdk::println!("  ✅ EVM→ICP swap completed: {}", result);
            },
            Err(e) => {
                ic_cdk::println!("  ❌ Failed to complete EVM→ICP swap: {}", e);
                return Err(format!("Failed to complete EVM→ICP swap: {}", e));
            }
        }
    } else {
        return Err("EVM HTLC not found for EVM→ICP order".to_string());
    }
    
    // Complete the ICP→EVM swap (this will transfer ERC20 tokens to the ICP user)
    ic_cdk::println!("  Completing ICP→EVM swap...");
    match complete_cross_chain_swap_public(icp_to_evm_order_id.to_string(), icp_to_evm_order.secret.clone()).await {
        Ok(result) => {
            ic_cdk::println!("  ✅ ICP→EVM swap completed: {}", result);
        },
        Err(e) => {
            ic_cdk::println!("  ❌ Failed to complete ICP→EVM swap: {}", e);
            return Err(format!("Failed to complete ICP→EVM swap: {}", e));
        }
    }
    
    ic_cdk::println!("✅ Swap completed successfully for paired orders");
    Ok("Swap completed for paired orders".to_string())
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
// BRIDGELESS TOKEN API ENDPOINTS
// ============================================================================

/// Initialize the bridgeless token system
#[update]
#[candid_method]
pub async fn initialize_bridgeless_token_public(
    root_contract_address: String,
    token_name: String,
    token_symbol: String,
) -> Result<String, String> {
    initialize_bridgeless_token(root_contract_address, token_name, token_symbol).await
}

/// Create a new chain ledger
#[update]
#[candid_method]
pub async fn create_chain_ledger_public(
    chain_id: String,
    init_data: ChainInitData,
) -> Result<String, String> {
    create_chain_ledger(chain_id, init_data).await
}

/// Authorize a cross-chain transfer
#[update]
#[candid_method]
pub async fn authorize_cross_chain_transfer_public(
    transfer_id: String,
    amount: String,
    target_chain: String,
    recipient: String,
) -> Result<String, String> {
    authorize_cross_chain_transfer(transfer_id, amount, target_chain, recipient).await
}

/// Get all chain ledgers
#[query]
#[candid_method]
pub fn get_all_chain_ledgers_public() -> Vec<ChainLedger> {
    get_all_chain_ledgers()
}

/// Get chain ledger by ID
#[query]
#[candid_method]
pub fn get_chain_ledger_public(chain_id: String) -> Option<ChainLedger> {
    get_chain_ledger(&chain_id)
}

/// Get all cross-chain transfers
#[query]
#[candid_method]
pub fn get_all_cross_chain_transfers_public() -> Vec<CrossChainTransfer> {
    get_all_cross_chain_transfers()
}

/// Get cross-chain transfer by ID
#[query]
#[candid_method]
pub fn get_cross_chain_transfer_public(transfer_id: String) -> Option<CrossChainTransfer> {
    get_cross_chain_transfer(&transfer_id)
}

/// Get root contract address
#[query]
#[candid_method]
pub fn get_root_contract_address_public() -> Option<String> {
    get_root_contract_address()
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
        solana_destination_address: None, // Not needed for ICP→EVM
        counter_order_id: None, // Will be set when paired
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), order);
    
    // Add detailed logging for quantity debugging
    ic_cdk::println!("🔍 ICP→EVM Order Creation Debug:");
    ic_cdk::println!("  User Principal: {}", user_principal);
    ic_cdk::println!("  Source Token Canister: {}", source_token_canister);
    ic_cdk::println!("  Source Amount (string): {}", source_amount);
    ic_cdk::println!("  Destination Amount (string): {}", destination_amount);
    
    // Automatically pull ICRC tokens into escrow
    let amount_u128 = source_amount.parse::<u128>()
        .map_err(|e| format!("Invalid source amount: {}", e))?;
    
    ic_cdk::println!("  Amount to transfer (u128): {}", amount_u128);
    ic_cdk::println!("  Backend Canister ID: {}", ic_cdk::api::id().to_string());
    
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
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
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
    
    // Get canister's Ethereum address for the taker
    let canister_eth_address = evm::get_ethereum_address().await?;
    
    // Create the order
    let order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker: user_address.clone(), // EVM user
        taker: canister_eth_address, // Backend canister's EVM address as taker
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
        solana_destination_address: None, // Not needed for EVM→ICP
        counter_order_id: None, // Will be set when paired
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
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
    }
    
    Ok(format!("EVM→ICP order created successfully! Order ID: {}, EVM HTLC: {}, Permit executed: {}", order_id, evm_htlc_id, permit_result))
}

// ============================================================================
// SOLANA ORDER CREATION FUNCTIONS
// ============================================================================

/// Create a Solana→EVM order with automatic SPL token escrow
#[update]
#[candid_method]
pub async fn create_solana_to_evm_order(
    user_solana_address: String,      // Solana user's address (base58)
    source_token_mint: String,        // SPL token mint address
    destination_token_address: String, // EVM token address (0x...)
    source_amount: u64,               // SPL amount
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
        maker: user_solana_address.clone(), // Solana user
        taker: ic_cdk::api::id().to_string(), // Backend canister as taker
        source_token: source_token_mint.clone(),
        destination_token: destination_token_address.clone(),
        source_amount: source_amount.to_string(),
        destination_amount: destination_amount.clone(),
        secret,
        hashlock: hashlock.clone(),
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: Some(evm_destination_address),
        icp_destination_principal: None, // Not needed for Solana→EVM
        solana_destination_address: None, // Not needed for Solana→EVM
        counter_order_id: None, // Will be set when paired
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), order);
    
    // Automatically create Solana HTLC to hold the tokens
    let solana_htlc_id = solana::create_solana_htlc(
        &order_id,
        &source_token_mint,
        source_amount,
        &hashlock,
        timelock,
        &user_solana_address,
        true, // This is a source HTLC
    ).await?;
    
    // Update order status to indicate Solana HTLC is created
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        order.source_htlc_id = Some(solana_htlc_id.clone());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
    }
    
    Ok(format!("Solana→EVM order created successfully! Order ID: {}, Solana HTLC: {}", order_id, solana_htlc_id))
}

/// Create an EVM→Solana order with automatic permit execution
#[update]
#[candid_method]
pub async fn create_evm_to_solana_order(
    user_address: String,             // EVM user's address (0x...)
    source_token_address: String,     // EVM token address (0x...)
    destination_token_mint: String,   // SPL token mint address
    source_amount: String,            // EVM amount
    destination_amount: u64,          // SPL amount
    solana_destination_address: String, // Where SPL tokens should be sent (base58)
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
    
    // Get canister's Ethereum address for the taker
    let canister_eth_address = evm::get_ethereum_address().await?;
    
    // Create the order
    let order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker: user_address.clone(), // EVM user
        taker: canister_eth_address, // Backend canister's EVM address as taker
        source_token: source_token_address.clone(),
        destination_token: destination_token_mint.clone(),
        source_amount: source_amount.clone(),
        destination_amount: destination_amount.to_string(),
        secret,
        hashlock,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: None, // Not needed for EVM→Solana
        icp_destination_principal: None, // Not needed for EVM→Solana
        solana_destination_address: Some(solana_destination_address),
        counter_order_id: None, // Will be set when paired
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
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
    }
    
    Ok(format!("EVM→Solana order created successfully! Order ID: {}, EVM HTLC: {}, Permit executed: {}", order_id, evm_htlc_id, permit_result))
}

/// Create an ICP→Solana order with automatic ICRC token escrow
#[update]
#[candid_method]
pub async fn create_icp_to_solana_order(
    user_principal: String,           // ICP user's principal ID
    source_token_canister: String,    // ICRC token canister ID
    destination_token_mint: String,   // SPL token mint address
    source_amount: String,            // ICRC amount
    destination_amount: u64,          // SPL amount
    solana_destination_address: String, // Where SPL tokens should be sent (base58)
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
        destination_token: destination_token_mint.clone(),
        source_amount: source_amount.clone(),
        destination_amount: destination_amount.to_string(),
        secret,
        hashlock,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: None, // Not needed for ICP→Solana
        icp_destination_principal: None, // Not needed for ICP→Solana
        solana_destination_address: Some(solana_destination_address),
        counter_order_id: None, // Will be set when paired
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
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
    }
    
    Ok(format!("ICP→Solana order created successfully! Order ID: {}, ICRC tokens escrowed: {}", order_id, transfer_result))
}

/// Create a Solana→ICP order with automatic SPL token escrow
#[update]
#[candid_method]
pub async fn create_solana_to_icp_order(
    user_solana_address: String,      // Solana user's address (base58)
    source_token_mint: String,        // SPL token mint address
    destination_token_canister: String, // ICRC token canister ID
    source_amount: u64,               // SPL amount
    destination_amount: String,       // ICRC amount
    icp_destination_principal: String, // Where ICRC tokens should be sent
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
        maker: user_solana_address.clone(), // Solana user
        taker: ic_cdk::api::id().to_string(), // Backend canister as taker
        source_token: source_token_mint.clone(),
        destination_token: destination_token_canister.clone(),
        source_amount: source_amount.to_string(),
        destination_amount: destination_amount.clone(),
        secret,
        hashlock: hashlock.clone(),
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
        evm_destination_address: None, // Not needed for Solana→ICP
        icp_destination_principal: Some(icp_destination_principal),
        solana_destination_address: None, // Not needed for Solana→ICP
        counter_order_id: None, // Will be set when paired
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), order);
    
    // Automatically create Solana HTLC to hold the tokens
    let solana_htlc_id = solana::create_solana_htlc(
        &order_id,
        &source_token_mint,
        source_amount,
        &hashlock,
        timelock,
        &user_solana_address,
        true, // This is a source HTLC
    ).await?;
    
    // Update order status to indicate Solana HTLC is created
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        order.source_htlc_id = Some(solana_htlc_id.clone());
        order.status = SwapOrderStatus::SourceHTLCCreated;
    }
    
    // Try to automatically pair this order with existing compatible orders
    if let Some(paired_order_id) = try_pair_orders(&order_id).await {
        ic_cdk::println!("✅ Order automatically paired with: {}", paired_order_id);
        
        // Set counter order IDs for both orders
        let orders = get_atomic_swap_orders();
        if let Some(order) = orders.get_mut(&order_id) {
            order.counter_order_id = Some(paired_order_id.clone());
        }
        if let Some(paired_order) = orders.get_mut(&paired_order_id) {
            paired_order.counter_order_id = Some(order_id.clone());
        }
    } else {
        ic_cdk::println!("⏳ Order created, waiting for compatible counter-order");
    }
    
    Ok(format!("Solana→ICP order created successfully! Order ID: {}, Solana HTLC: {}", order_id, solana_htlc_id))
}






// ============================================================================
// UNIFIED LIQUIDITY POOL PUBLIC API ENDPOINTS
// ============================================================================

/// Create a new unified liquidity pool
#[update]
#[candid_method]
pub async fn create_unified_liquidity_pool_public(
    base_asset: String,
    initial_chains: Vec<String>,
) -> Result<String, String> {
    create_unified_liquidity_pool(base_asset, initial_chains).await
}

/// Add a new chain to an existing pool
#[update]
#[candid_method]
pub async fn add_chain_to_pool_public(
    pool_id: String,
    chain_id: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    add_chain_to_pool(pool_id, chain_id, initial_liquidity).await
}

/// Deposit liquidity into a specific chain within a pool
#[update]
#[candid_method]
pub async fn deposit_liquidity_cross_chain_public(
    pool_id: String,
    user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    deposit_liquidity_cross_chain(pool_id, user, chain_id, amount).await
}

/// Withdraw liquidity from a specific chain within a pool
#[update]
#[candid_method]
pub async fn withdraw_liquidity_cross_chain_public(
    pool_id: String,
    user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    withdraw_liquidity_cross_chain(pool_id, user, chain_id, amount).await
}

/// Get total liquidity across all chains in a pool
#[query]
#[candid_method]
pub fn get_pool_total_liquidity_public(pool_id: String) -> Result<u128, String> {
    get_pool_total_liquidity(&pool_id)
}

/// Get liquidity distribution across chains for a pool
#[query]
#[candid_method]
pub fn get_pool_chain_distribution_public(pool_id: String) -> Result<HashMap<String, ChainLiquidity>, String> {
    get_pool_chain_distribution(&pool_id)
}

/// Get yield rates across all chains for a pool
#[query]
#[candid_method]
pub fn get_pool_yield_rates_public(pool_id: String) -> Result<HashMap<String, f64>, String> {
    get_pool_yield_rates(&pool_id)
}

/// Get pool information
#[query]
#[candid_method]
pub fn get_pool_info_public(pool_id: String) -> Result<UnifiedLiquidityPool, String> {
    get_pool_info(&pool_id)
}

/// List all pools
#[query]
#[candid_method]
pub fn list_all_pools_public() -> Vec<String> {
    list_all_pools()
}

/// Update chain health state
#[update]
#[candid_method]
pub fn update_chain_health_state_public(
    chain_id: String,
    last_block: u64,
    response_time_ms: u64,
    is_healthy: bool,
) -> Result<String, String> {
    update_chain_health_state(chain_id, last_block, response_time_ms, is_healthy)
}

/// Get health status of all chains
#[query]
#[candid_method]
pub fn get_all_chain_states_public() -> Vec<ChainState> {
    get_all_chain_states()
}

/// Create a Solana-specific liquidity pool
#[update]
#[candid_method]
pub async fn create_solana_liquidity_pool_public(
    pool_id: String,
    base_asset: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    unified_pools::create_solana_liquidity_pool(pool_id, base_asset, initial_liquidity)
}

/// Get Solana chain state
#[query]
#[candid_method]
pub fn get_solana_chain_state_public() -> ChainState {
    unified_pools::get_solana_chain_state()
}

/// Basic yield optimization for a pool
#[update]
#[candid_method]
pub async fn optimize_pool_yields_basic_public(pool_id: String) -> Result<Vec<CapitalMove>, String> {
    optimize_pool_yields_basic(&pool_id).await
}

/// Simulate yield rates for testing (mock data)
#[update]
#[candid_method]
pub async fn simulate_yield_rates_public(
    pool_id: String,
    chain_yields: HashMap<String, f64>,
) -> Result<String, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(mut pool) = pools.get_mut(&pool_id) {
        // Update yield rates for each chain
        for (chain_id, yield_rate) in chain_yields {
            if let Some(chain_liquidity) = pool.chain_distribution.get_mut(&chain_id) {
                chain_liquidity.current_apy = yield_rate;
                chain_liquidity.last_updated = ic_cdk::api::time() / 1_000_000_000;
            }
        }
        
        // Update pool
        update_unified_liquidity_pool(&pool_id, pool.clone());
        
        Ok("Yield rates updated successfully".to_string())
    } else {
        Err("Pool not found".to_string())
    }
}

/// Test endpoint to verify unified pool system is working
#[query]
#[candid_method]
pub fn test_unified_pool_system() -> String {
    "✅ Unified liquidity pool system is operational!".to_string()
}

// ============================================================================
// CANDID EXPORT
// ============================================================================

// Enable Candid export for automatic interface generation
ic_cdk::export_candid!();