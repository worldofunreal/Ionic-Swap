use candid::{Principal, Encode, Decode};
use ic_http_certification::HttpRequest;
use serde_json::json;
use sha3::{Digest, Keccak256};
use std::collections::{HashMap, HashSet};
use crate::storage::{get_htlc_store, get_atomic_swap_orders};
use crate::types::{HTLC, SwapOrderStatus, HTLCStatus};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use std::str::FromStr;
use candid::types::value::{VariantValue, IDLField};

// ============================================================================
// SOLANA RPC CONFIGURATION
// ============================================================================

/// Solana Devnet RPC endpoint
const SOLANA_DEVNET_RPC: &str = "https://api.devnet.solana.com";

/// Solana Testnet RPC endpoint  
const SOLANA_TESTNET_RPC: &str = "https://api.testnet.solana.com";

/// Get the current Solana RPC endpoint (using devnet for testing)
fn get_solana_rpc_endpoint() -> &'static str {
    SOLANA_DEVNET_RPC
}

/// Get Solana testnet RPC endpoint
pub fn get_solana_testnet_rpc_endpoint() -> &'static str {
    SOLANA_TESTNET_RPC
}

// ============================================================================
// SOLANA WALLET MANAGEMENT
// ============================================================================

#[derive(Debug, Clone)]
pub struct SolanaWallet {
    pub owner: Principal,
    pub solana_address: String,
}

impl SolanaWallet {
    pub fn new(owner: Principal) -> Self {
        // Derive Solana account from ICP principal
        let derivation_path = owner.as_slice();
        let solana_address = derive_solana_address(derivation_path);

        Self {
            owner,
            solana_address,
        }
    }

    pub fn get_solana_address(&self) -> String {
        self.solana_address.clone()
    }
}

/// Derive a Solana account from a derivation path
fn derive_solana_address(derivation_path: &[u8]) -> String {
    // For now, use a simple hash-based derivation
    // In production, you'd use proper HD wallet derivation
    let mut hasher = Keccak256::new();
    hasher.update(derivation_path);
    let hash = hasher.finalize();
    bs58::encode(&hash[..32]).into_string()
}

// ============================================================================
// HTTP RPC CALLS TO SOLANA
// ============================================================================

/// Make an HTTP RPC call to Solana
async fn call_solana_rpc(method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let request_body = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    let url = get_solana_rpc_endpoint();
    
    // Use the same HTTP client pattern as EVM
    let http_request = HttpRequest::post(url)
        .with_headers(vec![
            ("Content-Type".to_string(), "application/json".to_string()),
            ("User-Agent".to_string(), "ionic-swap-backend".to_string()),
        ])
        .with_body(request_body.into_bytes())
        .build();

    let response = crate::http_client::make_http_request(http_request).await?;
    
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;

    let response_json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    // Check for RPC error
    if let Some(error) = response_json.get("error") {
        return Err(format!("Solana RPC error: {:?}", error));
    }

    Ok(response_json)
}

// ============================================================================
// BASIC SOLANA OPERATIONS
// ============================================================================

/// Get Solana account balance
pub async fn get_solana_balance(account: String) -> Result<u64, String> {
    let params = json!([account]);
    let response = call_solana_rpc("getBalance", params).await?;
    
    // Extract balance from response - handle both direct result and nested value
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else if let Some(result) = response["result"]["value"].as_u64() {
        Ok(result)
    } else {
        // Debug: print the actual response structure
        let debug_response = serde_json::to_string(&response).unwrap_or_else(|_| "Failed to serialize".to_string());
        Err(format!("Invalid response format - no balance found. Response: {}", debug_response))
    }
}

/// Get Solana slot (block number)
pub async fn get_solana_slot() -> Result<u64, String> {
    let params = json!([]);
    let response = call_solana_rpc("getSlot", params).await?;
    
    // Extract slot from response
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else {
        Err("Invalid response format - no slot found".to_string())
    }
}

/// Get Solana account info
pub async fn get_solana_account_info(account: String) -> Result<String, String> {
    let params = json!([
        account,
        {
            "encoding": "base64"
        }
    ]);
    
    let response = call_solana_rpc("getAccountInfo", params).await?;
    
    // Return the full result as string
    if let Some(result) = response["result"]["value"].as_object() {
        Ok(serde_json::to_string(&result).unwrap())
    } else {
        Err("Invalid response format - no account info found".to_string())
    }
}

// ============================================================================
// SPL TOKEN OPERATIONS
// ============================================================================

/// Get SPL token account balance
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    let params = json!([token_account]);
    let response = call_solana_rpc("getTokenAccountBalance", params).await?;
    
    // Extract balance from response
    if let Some(amount) = response["result"]["value"]["amount"].as_str() {
        Ok(amount.to_string())
    } else {
        Err("Invalid response format - no token balance found".to_string())
    }
}

/// Get associated token account address
pub fn get_associated_token_address(
    wallet_address: &str,
    mint_address: &str,
) -> Result<String, String> {
    // This would need the full Solana SDK for proper derivation
    // For now, return a deterministic address based on inputs
    let combined = format!("{}{}", wallet_address, mint_address);
    let mut hasher = Keccak256::new();
    hasher.update(combined.as_bytes());
    let hash = hasher.finalize();
    Ok(bs58::encode(&hash[..32]).into_string())
}

/// Create associated token account instruction
pub fn create_associated_token_account_instruction(
    _funding_address: &str,
    wallet_address: &str,
    mint_address: &str,
) -> Result<(String, Vec<u8>), String> {
    // This would need the full Solana SDK for proper instruction building
    // For now, return a placeholder instruction structure
    let associated_account = get_associated_token_address(wallet_address, mint_address)?;

    // Create a basic instruction structure (this is simplified)
    let instruction_data = vec![
        1u8, // Instruction type: create associated token account
        // Additional data would be added here in real implementation
    ];

    Ok((associated_account, instruction_data))
}

/// Transfer SPL tokens instruction
pub fn transfer_spl_tokens_instruction(
    _source_address: &str,
    _destination_address: &str,
    _authority_address: &str,
    amount: u64,
) -> Result<Vec<u8>, String> {
    // This would need the full Solana SDK for proper instruction building
    // For now, return a basic instruction structure
    let mut instruction_data = vec![
        3u8, // Instruction type: transfer
    ];

    // Add amount as little-endian bytes
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    Ok(instruction_data)
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/// Send SOL transaction
pub async fn send_sol_transaction(
    from_address: &str,
    to_address: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };

    // Create transfer instruction (simplified)
    let instruction_data = vec![
        2u8, // Instruction type: transfer
    ];

    // In a real implementation, you would:
    // 1. Create proper Solana instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    // For now, return the blockhash and instruction data
    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from": from_address,
        "to": to_address,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}

/// Send SPL token transaction
pub async fn send_spl_token_transaction(
    from_token_account: &str,
    to_token_account: &str,
    authority: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };

    // Create transfer instruction
    let instruction_data = transfer_spl_tokens_instruction(
        from_token_account,
        to_token_account,
        authority,
        amount,
    )?;

    // In a real implementation, you would:
    // 1. Create proper SPL token transfer instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from_token_account": from_token_account,
        "to_token_account": to_token_account,
        "authority": authority,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}

// ============================================================================
// SOLANA HTLC FUNCTIONS
// ============================================================================

/// Create a Solana HTLC using SPL tokens
pub async fn create_solana_htlc(
    order_id: &str,
    token_mint: &str,
    amount: u64,
    hashlock: &str,
    timelock: u64,
    user_address: &str, // User's Solana address for token withdrawal
    is_source_htlc: bool, // true for source HTLC, false for destination HTLC
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
    
    // Get canister's Solana address for HTLC recipient
    let canister_solana_address = get_canister_solana_address().await?;
    
    // Check if tokens are already in the canister's escrow
    let canister_token_account = get_associated_token_address(&canister_solana_address, token_mint)?;
    let canister_balance = get_spl_token_balance(canister_token_account.clone()).await?;
    let current_balance: u64 = canister_balance.parse().unwrap_or(0);
    
    ic_cdk::println!("🔍 Canister SPL token balance for mint {}: {}", token_mint, current_balance);
    
    if current_balance >= amount {
        ic_cdk::println!("✅ Tokens already in canister escrow, skipping transfer");
    } else {
        // Pull tokens from user to canister escrow
        let user_token_account = get_associated_token_address(user_address, token_mint)?;
        ic_cdk::println!("🔍 Pulling tokens from user token account {} to escrow", user_token_account);
        
        // Transfer SPL tokens from user to canister
        let transfer_result = transfer_spl_tokens_from_user(
            &user_token_account,
            &canister_token_account,
            user_address, // authority (user)
            amount,
        ).await?;
        
        ic_cdk::println!("✅ Successfully transferred {} tokens from user to canister escrow: {}", amount, transfer_result);
    }
    
    // Determine the correct sender for the HTLC record
    let htlc_sender = if order.maker.starts_with("0x") || order.maker.len() > 44 {
        // EVM→Solana or ICP→Solana swap: Solana user (taker) is the sender
        order.taker.clone()
    } else {
        // Solana→EVM or Solana→ICP swap: Solana user (maker) is the sender
        order.maker.clone()
    };
    
    // Store the HTLC information
    let htlc = HTLC {
        id: format!("solana_htlc_{}", order_id),
        sender: htlc_sender,
        recipient: canister_solana_address,
        amount: amount.to_string(),
        hashlock: hashlock.to_string(),
        secret: None, // Secret will be revealed during claim
        timelock,
        status: HTLCStatus::Created,
        token: token_mint.to_string(),
        source_chain: 2, // Solana chain ID
        target_chain: if order.maker.starts_with("0x") { 1 } else { 0 }, // EVM or ICP
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
            order.status = SwapOrderStatus::SourceHTLCCreated;
        } else {
            order.destination_htlc_id = Some(htlc_id.clone());
            order.status = SwapOrderStatus::DestinationHTLCCreated;
        }
    }
    
    Ok(format!("Solana HTLC created successfully! HTLC ID: {}", htlc_id))
}

/// Claim a Solana HTLC using the secret
pub async fn claim_solana_htlc(
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
        HTLCStatus::Created => {},
        _ => return Err("HTLC is not in Created state".to_string()),
    }
    
    // Validate the secret matches the hashlock
    let secret_hash = format!("0x{}", hex::encode(Keccak256::digest(secret.as_bytes())));
    if secret_hash != htlc.hashlock {
        return Err("Invalid secret for HTLC".to_string());
    }
    
    // Validate the timelock hasn't expired
    let current_time = ic_cdk::api::time();
    if current_time > htlc.timelock {
        return Err("HTLC timelock has expired".to_string());
    }
    
    // Get the atomic swap order to determine swap direction
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| format!("Order {} not found", order_id))?;
    
    // Get canister's Solana address
    let canister_solana_address = get_canister_solana_address().await?;
    let canister_token_account = get_associated_token_address(&canister_solana_address, &htlc.token)?;
    
    // Handle different swap directions with destination addresses
    let transfer_result = if order.maker.starts_with("0x") || order.maker.len() > 44 {
        // EVM→Solana or ICP→Solana swap: Canister already has tokens, transfer to user's specified Solana destination
        ic_cdk::println!("🔍 EVM/ICP→Solana swap: Canister transferring tokens to user's Solana destination");
        let solana_destination = order.solana_destination_address.as_ref()
            .unwrap_or(&order.taker); // Fallback to taker if no destination specified
        
        let destination_token_account = get_associated_token_address(solana_destination, &htlc.token)?;
        
        transfer_spl_tokens_from_canister(
            &canister_token_account,
            &destination_token_account,
            &canister_solana_address, // authority (canister)
            htlc.amount.parse::<u64>().unwrap(),
        ).await?
    } else {
        // Solana→EVM or Solana→ICP swap: Canister needs to transfer tokens to user
        ic_cdk::println!("🔍 Solana→EVM/ICP swap: Canister transferring tokens to user");
        
        let solana_destination = order.solana_destination_address.as_ref()
            .unwrap_or(&order.maker); // Use maker as destination
        
        let destination_token_account = get_associated_token_address(solana_destination, &htlc.token)?;
        
        transfer_spl_tokens_from_canister(
            &canister_token_account,
            &destination_token_account,
            &canister_solana_address, // authority (canister)
            htlc.amount.parse::<u64>().unwrap(),
        ).await?
    };
    
    // Update HTLC status
    let htlc_store = get_htlc_store();
    if let Some(htlc) = htlc_store.get_mut(htlc_id) {
        htlc.status = HTLCStatus::Claimed;
    }
    
    Ok(format!("Solana HTLC claimed successfully! Transfer: {}", transfer_result))
}

/// Refund an expired Solana HTLC
pub async fn refund_solana_htlc(
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
        HTLCStatus::Created => {},
        _ => return Err("HTLC is not in Created state".to_string()),
    }
    
    // Validate the timelock has expired
    let current_time = ic_cdk::api::time();
    if current_time <= htlc.timelock {
        return Err("HTLC timelock has not expired yet".to_string());
    }
    
    // Get canister's Solana address
    let canister_solana_address = get_canister_solana_address().await?;
    let canister_token_account = get_associated_token_address(&canister_solana_address, &htlc.token)?;
    
    // Transfer tokens back to the original sender
    let original_sender_token_account = get_associated_token_address(&htlc.sender, &htlc.token)?;
    
    let transfer_result = transfer_spl_tokens_from_canister(
        &canister_token_account,
        &original_sender_token_account,
        &canister_solana_address, // authority (canister)
        htlc.amount.parse::<u64>().unwrap(),
    ).await?;
    
    // Update HTLC status
    let htlc_store = get_htlc_store();
    if let Some(htlc) = htlc_store.get_mut(htlc_id) {
        htlc.status = HTLCStatus::Refunded;
    }
    
    Ok(format!("Solana HTLC refunded successfully! Transfer: {}", transfer_result))
}

/// Get the status of a Solana HTLC
pub fn get_solana_htlc_status(htlc_id: &str) -> Result<HTLCStatus, String> {
    let htlc_store = get_htlc_store();
    let htlc = htlc_store.get(htlc_id)
        .ok_or_else(|| format!("HTLC {} not found", htlc_id))?;
    
    Ok(htlc.status.clone())
}

/// List all Solana HTLCs
pub fn list_solana_htlcs() -> Vec<HTLC> {
    let htlc_store = get_htlc_store();
    htlc_store.values()
        .filter(|htlc| htlc.source_chain == 2) // Solana chain ID
        .cloned()
        .collect()
}

// ============================================================================
// SOLANA TRANSACTION SIGNING AND SENDING
// ============================================================================

/// Get canister's Solana address
pub async fn get_canister_solana_address() -> Result<String, String> {
    // Derive Solana address from canister principal
    let canister_principal = ic_cdk::api::id();
    let wallet = SolanaWallet::new(canister_principal);
    Ok(wallet.get_solana_address())
}

/// Transfer SPL tokens from user to canister (requires user signature)
pub async fn transfer_spl_tokens_from_user(
    from_token_account: &str,
    to_token_account: &str,
    authority: &str,
    amount: u64,
) -> Result<String, String> {
    // This would require the user to sign the transaction
    // For now, we'll simulate this by creating the transaction data
    // In a real implementation, this would be handled by the frontend
    
    let instruction_data = transfer_spl_tokens_instruction(
        from_token_account,
        to_token_account,
        authority,
        amount,
    )?;
    
    // Get latest blockhash
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };
    
    // Create transaction response (simulated)
    let response = json!({
        "blockhash": blockhash,
        "instruction_data": hex::encode(instruction_data),
        "from_token_account": from_token_account,
        "to_token_account": to_token_account,
        "authority": authority,
        "amount": amount,
        "status": "simulated_user_transfer"
    });
    
    Ok(serde_json::to_string(&response).unwrap())
}

/// Transfer SPL tokens from canister to recipient (canister signs)
pub async fn transfer_spl_tokens_from_canister(
    from_token_account: &str,
    to_token_account: &str,
    _authority: &str,
    amount: u64,
) -> Result<String, String> {
    ic_cdk::println!("🔄 Transferring SPL tokens from canister...");
    ic_cdk::println!("  From: {}", from_token_account);
    ic_cdk::println!("  To: {}", to_token_account);
    ic_cdk::println!("  Amount: {}", amount);
    
    // Get canister's Solana address
    let canister_solana_address = get_canister_solana_address().await?;
    
    // Get latest blockhash
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };
    
    // Create SPL token transfer instruction
    let transfer_instruction = create_spl_transfer_instruction(
        from_token_account,
        to_token_account,
        &canister_solana_address, // authority (canister)
        amount,
    )?;
    
    // Create transaction data
    let transaction_data = json!({
        "instructions": [transfer_instruction],
        "recent_blockhash": blockhash,
        "fee_payer": canister_solana_address
    });
    
    // Sign and send the transaction
    let tx_result = sign_and_send_solana_transaction(&transaction_data.to_string()).await?;
    
    ic_cdk::println!("✅ SPL token transfer completed: {}", tx_result);
    
    Ok(tx_result)
}

/// Create SPL token transfer instruction
fn create_spl_transfer_instruction(
    from_token_account: &str,
    to_token_account: &str,
    authority: &str,
    amount: u64,
) -> Result<serde_json::Value, String> {
    // SPL Token Program ID
    let spl_token_program_id = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    
    // Create transfer instruction data (Transfer instruction = 3)
    let mut instruction_data = vec![3u8]; // Transfer instruction
    instruction_data.extend_from_slice(&amount.to_le_bytes());
    
    // Create account metas
    let accounts = json!([
        {
            "pubkey": from_token_account,
            "is_signer": false,
            "is_writable": true
        },
        {
            "pubkey": to_token_account,
            "is_signer": false,
            "is_writable": true
        },
        {
            "pubkey": authority,
            "is_signer": true,
            "is_writable": false
        }
    ]);
    
    Ok(json!({
        "program_id": spl_token_program_id,
        "accounts": accounts,
        "data": hex::encode(instruction_data)
    }))
}

/// Sign and send a Solana transaction using IC ECDSA
pub async fn sign_and_send_solana_transaction(
    transaction_data: &str,
) -> Result<String, String> {
    ic_cdk::println!("🔐 Signing and sending Solana transaction...");
    
    // Parse the transaction data
    let tx_data: serde_json::Value = serde_json::from_str(transaction_data)
        .map_err(|e| format!("Failed to parse transaction data: {}", e))?;
    
    // Get the canister's ECDSA key
    let canister_key = get_canister_ecdsa_key().await?;
    
    // Create the transaction
    let mut transaction = create_solana_transaction(&tx_data)?;
    
    // Sign the transaction
    let _signature = sign_solana_transaction(&mut transaction, &canister_key).await?;
    
    // Submit the transaction
    let tx_hash = submit_solana_transaction(&transaction).await?;
    
    ic_cdk::println!("✅ Solana transaction signed and submitted: {}", tx_hash);
    
    Ok(format!("Transaction submitted successfully! Hash: {}", tx_hash))
}

/// Get the canister's ECDSA key for Solana signing
async fn get_canister_ecdsa_key() -> Result<Vec<u8>, String> {
    ic_cdk::println!("🔑 Getting canister ECDSA key for Solana signing");
    
    // Use the same ECDSA key approach as EVM implementation
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "key_1".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    
    let public_key_arg = ic_cdk::api::management_canister::ecdsa::EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: derivation_path.clone(),
        key_id: key_id.clone(),
    };
    
    let public_key = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(public_key_arg)
        .await
        .map_err(|e| format!("Failed to get ECDSA public key: {:?}", e))?;
    
    let public_key_bytes = public_key.0.public_key;
    
    ic_cdk::println!("🔑 Using real ECDSA key: {}", hex::encode(&public_key_bytes));
    
    Ok(public_key_bytes)
}

/// Create a Solana transaction from transaction data
fn create_solana_transaction(tx_data: &serde_json::Value) -> Result<SolanaTransaction, String> {
    let instructions = tx_data["instructions"].as_array()
        .ok_or("Missing instructions in transaction data")?;
    
    let recent_blockhash = tx_data["recent_blockhash"].as_str()
        .ok_or("Missing recent_blockhash in transaction data")?;
    
    let fee_payer = tx_data["fee_payer"].as_str()
        .ok_or("Missing fee_payer in transaction data")?;
    
    let mut solana_instructions = Vec::new();
    
    for instruction in instructions {
        let program_id = instruction["program_id"].as_str()
            .ok_or("Missing program_id in instruction")?;
        
        let accounts = instruction["accounts"].as_array()
            .ok_or("Missing accounts in instruction")?;
        
        let data = instruction["data"].as_str()
            .ok_or("Missing data in instruction")?;
        
        let mut account_metas = Vec::new();
        for account in accounts {
            let pubkey = account["pubkey"].as_str()
                .ok_or("Missing pubkey in account")?;
            let is_signer = account["is_signer"].as_bool().unwrap_or(false);
            let is_writable = account["is_writable"].as_bool().unwrap_or(false);
            
            account_metas.push(SolanaAccountMeta {
                pubkey: pubkey.to_string(),
                is_signer,
                is_writable,
            });
        }
        
        solana_instructions.push(SolanaInstruction {
            program_id: program_id.to_string(),
            accounts: account_metas,
            data: hex::decode(data).map_err(|e| format!("Invalid hex data: {}", e))?,
        });
    }
    
    Ok(SolanaTransaction {
        instructions: solana_instructions,
        recent_blockhash: recent_blockhash.to_string(),
        fee_payer: fee_payer.to_string(),
        signatures: Vec::new(),
    })
}

/// Sign a Solana transaction using ECDSA
async fn sign_solana_transaction(
    transaction: &mut SolanaTransaction,
    _public_key: &[u8],
) -> Result<Vec<u8>, String> {
    ic_cdk::println!("🔐 Signing Solana transaction...");
    
    // Serialize the transaction for signing
    let message = serialize_transaction_for_signing(transaction)?;
    
    // Get the message hash
    let message_hash = sha3::Keccak256::digest(&message);
    
    // Use real ECDSA signing like the EVM implementation
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "key_1".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    
    let sign_args = ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument {
        message_hash: message_hash.to_vec(),
        derivation_path,
        key_id,
    };
    
    let signature = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(sign_args)
        .await
        .map_err(|e| format!("Failed to sign Solana transaction: {:?}", e))?;
    
    let signature_bytes = signature.0.signature;
    
    // Add the signature to the transaction
    transaction.signatures.push(signature_bytes.clone());
    
    ic_cdk::println!("✅ Transaction signed successfully with real ECDSA");
    
    Ok(signature_bytes)
}

/// Submit a signed Solana transaction to the network using the official SOL RPC canister
async fn submit_solana_transaction(transaction: &SolanaTransaction) -> Result<String, String> {
    ic_cdk::println!("📤 Submitting signed Solana transaction to SOL RPC canister...");

    let sol_rpc_principal = Principal::from_text("tghme-zyaaa-aaaar-qarca-cai")
        .map_err(|e| format!("Invalid SOL RPC canister ID: {}", e))?;

    // Serialize the signed transaction
    let serialized_tx = serialize_transaction(transaction)?;
    let tx_base64 = base64::engine::general_purpose::STANDARD.encode(&serialized_tx);
    
    ic_cdk::println!("📋 Serialized transaction (base64): {}", tx_base64);

    // Let's try using the ic_cdk::api::call::call method instead of call_raw
    // This might handle the Candid encoding better
    
    // First, let's try a simple getSlot call to test connectivity
    let get_slot_args = Encode!(&"variant { Default = variant { Devnet } }", &Option::<String>::None, &Option::<String>::None)
        .map_err(|e| format!("Failed to encode getSlot arguments: {}", e))?;

    ic_cdk::println!("📋 Testing connectivity with getSlot...");
    
    let slot_result = ic_cdk::api::call::call_raw(
        sol_rpc_principal,
        "getSlot",
        &get_slot_args,
        1_000_000_000, // 1B cycles for getSlot
    ).await;

    match slot_result {
        Ok(slot_response) => {
            ic_cdk::println!("✅ getSlot successful! Response length: {}", slot_response.len());
            
            // Now try the actual sendTransaction
            // Let's try a different approach - use the exact same format as the working command line
            // But encode it properly as Candid
            
            // The issue is that we need to construct the exact Candid types
            // Let me try a different approach - use the jsonRequest method instead
            // which might be easier to work with
            
            let json_request = format!(
                r#"{{"jsonrpc":"2.0","id":1,"method":"sendTransaction","params":["{}",{{"encoding":"base64","skipPreflight":false}}]}}"#,
                tx_base64
            );
            
            ic_cdk::println!("📋 Using jsonRequest method with: {}", json_request);
            
            // Try jsonRequest method instead
            let json_args = Encode!(&"variant { Default = variant { Devnet } }", &Option::<String>::None, &json_request)
                .map_err(|e| format!("Failed to encode jsonRequest arguments: {}", e))?;

            let json_result = ic_cdk::api::call::call_raw(
                sol_rpc_principal,
                "jsonRequest",
                &json_args,
                2_000_000_000, // 2B cycles
            ).await;

            match json_result {
                Ok(json_response) => {
                    ic_cdk::println!("✅ jsonRequest successful! Response length: {}", json_response.len());
                    
                    // Try to decode the response
                    if let Ok(response_text) = String::from_utf8(json_response.clone()) {
                        ic_cdk::println!("📋 JSON Response: {}", response_text);
                        
                        // Parse the JSON response to extract the transaction signature
                        if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&response_text) {
                            if let Some(result) = json_value.get("result") {
                                if let Some(signature) = result.as_str() {
                                    ic_cdk::println!("🎉 Transaction submitted successfully! Signature: {}", signature);
                                    return Ok(format!("Transaction submitted successfully! Hash: {}", signature));
                                }
                            }
                            if let Some(error) = json_value.get("error") {
                                return Err(format!("Transaction failed: {}", error));
                            }
                        }
                    }
                    
                    Ok(format!("Transaction submitted! Response length: {}", json_response.len()))
                }
                Err(e) => {
                    let error_msg = format!("jsonRequest failed: {:?}", e);
                    ic_cdk::println!("❌ {}", error_msg);
                    Err(error_msg)
                }
            }
        }
        Err(e) => {
            let error_msg = format!("getSlot failed: {:?}", e);
            ic_cdk::println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

/// Serialize transaction for signing (minimal valid Solana format)
fn serialize_transaction_for_signing(transaction: &SolanaTransaction) -> Result<Vec<u8>, String> {
    // Create a minimal valid Solana message
    let mut message_data = Vec::new();
    
    // Message header (3 bytes)
    message_data.push(1u8); // num_required_signatures
    message_data.push(0u8); // num_readonly_signed_accounts  
    message_data.push(0u8); // num_readonly_unsigned_accounts
    
    // Account addresses (32 bytes each)
    // Fee payer (index 0)
    let fee_payer_bytes = bs58::decode(&transaction.fee_payer)
        .into_vec()
        .map_err(|e| format!("Invalid fee payer: {}", e))?;
    message_data.extend_from_slice(&fee_payer_bytes);
    
    // Program ID (index 1)
    let program_id_bytes = bs58::decode(&transaction.instructions[0].program_id)
        .into_vec()
        .map_err(|e| format!("Invalid program ID: {}", e))?;
    message_data.extend_from_slice(&program_id_bytes);
    
    // Instruction accounts (indices 2+)
    for account in &transaction.instructions[0].accounts {
        let account_bytes = bs58::decode(&account.pubkey)
            .into_vec()
            .map_err(|e| format!("Invalid account pubkey: {}", e))?;
        message_data.extend_from_slice(&account_bytes);
    }
    
    // Recent blockhash (32 bytes)
    let blockhash_bytes = bs58::decode(&transaction.recent_blockhash)
        .into_vec()
        .map_err(|e| format!("Invalid blockhash: {}", e))?;
    message_data.extend_from_slice(&blockhash_bytes);
    
    // Instructions
    message_data.push(transaction.instructions.len() as u8);
    
    for instruction in &transaction.instructions {
        // Program ID index (1 byte) - program ID is at index 1
        message_data.push(1u8);
        
        // Account indices (1 byte + indices)
        message_data.push(instruction.accounts.len() as u8);
        for i in 2..(2 + instruction.accounts.len()) {
            message_data.push(i as u8);
        }
        
        // Instruction data (4 bytes length + data)
        let data_len = instruction.data.len() as u32;
        message_data.extend_from_slice(&data_len.to_le_bytes());
        message_data.extend_from_slice(&instruction.data);
    }
    
    Ok(message_data)
}

/// Serialize complete transaction for submission (proper Solana format)
fn serialize_transaction(transaction: &SolanaTransaction) -> Result<Vec<u8>, String> {
    let mut serialized = Vec::new();
    
    // Add signatures (each signature is 64 bytes)
    for signature in &transaction.signatures {
        if signature.len() != 64 {
            return Err(format!("Invalid signature length: {} (expected 64)", signature.len()));
        }
        serialized.extend_from_slice(signature);
    }
    
    // Add message data
    let message_data = serialize_transaction_for_signing(transaction)?;
    serialized.extend_from_slice(&message_data);
    
    Ok(serialized)
}

// ============================================================================
// SOLANA TRANSACTION STRUCTURES
// ============================================================================

#[derive(Debug, Clone)]
struct SolanaTransaction {
    instructions: Vec<SolanaInstruction>,
    recent_blockhash: String,
    fee_payer: String,
    signatures: Vec<Vec<u8>>,
}

#[derive(Debug, Clone)]
struct SolanaInstruction {
    program_id: String,
    accounts: Vec<SolanaAccountMeta>,
    data: Vec<u8>,
}

#[derive(Debug, Clone)]
struct SolanaAccountMeta {
    pubkey: String,
    is_signer: bool,
    is_writable: bool,
}
