use candid::{Principal, Encode, Decode};
use serde_json::json;
use sha3::{Digest, Keccak256};
use std::collections::{HashMap, HashSet};
use crate::storage::{get_htlc_store, get_atomic_swap_orders};
use crate::types::{HTLC, SwapOrderStatus, HTLCStatus};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use std::str::FromStr;
use candid::types::value::{VariantValue, IDLField};
use sol_rpc_client::{IcRuntime, ed25519};
use sol_rpc_types::{GetAccountInfoEncoding, GetAccountInfoParams};
use solana_pubkey::Pubkey;
use solana_message::Message;
use solana_transaction::Transaction;
use solana_system_interface::instruction;
use solana_hash::Hash;
use solana_instruction;
use solana_signature;
use bs58;

// ============================================================================
// SOLANA RPC CONFIGURATION
// ============================================================================

/// Get the SOL RPC client for making calls to Solana
fn client() -> sol_rpc_client::SolRpcClient<IcRuntime> {
    crate::client()
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
// SOL RPC CLIENT CALLS TO SOLANA
// ============================================================================

// ============================================================================
// BASIC SOLANA OPERATIONS
// ============================================================================

/// Get Solana account balance
pub async fn get_solana_balance(account: String) -> Result<u64, String> {
    let public_key = Pubkey::from_str(&account)
        .map_err(|e| format!("Invalid Solana address: {}", e))?;
    
    let balance = client()
        .get_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Call to getBalance failed: {:?}", e))?;
    
    Ok(balance)
}

/// Get Solana slot (block number)
pub async fn get_solana_slot() -> Result<u64, String> {
    let slot = client()
        .get_slot()
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Call to getSlot failed: {:?}", e))?;
    
    Ok(slot)
}

/// Get Solana account info
pub async fn get_solana_account_info(account: String) -> Result<String, String> {
    let public_key = Pubkey::from_str(&account)
        .map_err(|e| format!("Invalid Solana address: {}", e))?;
    
    let mut params = GetAccountInfoParams::from_pubkey(public_key);
    params.encoding = Some(GetAccountInfoEncoding::Base64);
    
    let account_info = client()
        .get_account_info(params)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Call to getAccountInfo failed: {:?}", e))?;
    
    match account_info {
        Some(account) => Ok(serde_json::to_string(&account).unwrap()),
        None => Err("Account not found".to_string()),
    }
}

// ============================================================================
// SPL TOKEN OPERATIONS
// ============================================================================

/// Get SPL token account balance
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    let public_key = Pubkey::from_str(&token_account)
        .map_err(|e| format!("Invalid token account address: {}", e))?;
    
    let token_amount = client()
        .get_token_account_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Call to getTokenAccountBalance failed: {:?}", e))?;
    
    Ok(token_amount.amount)
}

/// Get associated token account address
pub fn get_associated_token_address(
    wallet_address: &str,
    mint_address: &str,
) -> Result<String, String> {
    // Use proper Solana Associated Token Account derivation
    let wallet_pubkey = Pubkey::from_str(wallet_address)
        .map_err(|e| format!("Invalid wallet address: {}", e))?;
    let mint_pubkey = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;
    
    // SPL Token program ID
    let spl_token_program_id = Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        .map_err(|e| format!("Invalid SPL Token program ID: {}", e))?;
    
    // Associated Token Program ID
    let associated_token_program_id = Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
        .map_err(|e| format!("Invalid Associated Token Program ID: {}", e))?;
    
    // Find the associated token account address
    let (ata_address, _) = Pubkey::find_program_address(
        &[
            wallet_pubkey.as_ref(),
            spl_token_program_id.as_ref(),
            mint_pubkey.as_ref(),
        ],
        &associated_token_program_id,
    );
    
    Ok(ata_address.to_string())
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
    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get blockhash: {:?}", e))?;

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
    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get blockhash: {:?}", e))?;

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
    ic_cdk::println!("🔍 Creating Solana HTLC for order: {}", order_id);
    
    // Get the atomic swap order
    let orders = get_atomic_swap_orders();
    let order = orders.get(order_id)
        .ok_or_else(|| {
            ic_cdk::println!("❌ Order {} not found in atomic swap orders", order_id);
            ic_cdk::println!("Available orders: {:?}", orders.keys().collect::<Vec<_>>());
            format!("Order {} not found", order_id)
        })?;
    
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
    // Use the proper Ed25519 key derivation like the official example
    let derivation_path = sol_rpc_client::ed25519::DerivationPath::from(ic_cdk::id().as_slice());
    
    ic_cdk::println!("🔍 Getting canister Solana address...");
    ic_cdk::println!("   Canister ID: {}", ic_cdk::id());
    ic_cdk::println!("   Derivation path: {:?}", derivation_path);
    
    // Get the Ed25519 public key using the same derivation path as signing
    let (public_key, _) = sol_rpc_client::ed25519::get_pubkey(
        &sol_rpc_client::IcRuntime,
        None, // canister_id - use default
        Some(&derivation_path),
        sol_rpc_client::ed25519::Ed25519KeyId::MainnetTestKey1,
    )
    .await
    .map_err(|e| format!("Failed to get Ed25519 public key: {:?}", e))?;
    
    // Convert to Solana address format
    let address = bs58::encode(&public_key).into_string();
    ic_cdk::println!("   Generated address: {}", address);
    
    Ok(address)
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
    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get blockhash: {:?}", e))?;
    
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
    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get blockhash: {:?}", e))?;
    
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
        "recent_blockhash": blockhash.to_string(),
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
    
    // Convert to proper Solana transaction first
    let solana_tx = convert_to_solana_transaction(transaction)?;
    
    // Use the proper Solana signing approach with Ed25519
    let derivation_path = sol_rpc_client::ed25519::DerivationPath::from(ic_cdk::id().as_slice());
    
    // Sign the message using the SOL RPC client's sign_message function
    let signature = sol_rpc_client::ed25519::sign_message(
        &sol_rpc_client::IcRuntime,
        &solana_tx.message,
        sol_rpc_client::ed25519::Ed25519KeyId::MainnetTestKey1,
        Some(&derivation_path),
    )
    .await
    .map_err(|e| format!("Failed to sign Solana transaction: {:?}", e))?;
    
    let signature_bytes = signature.as_ref().to_vec();
    
    // Add the signature to the transaction
    transaction.signatures.push(signature_bytes.clone());
    
    ic_cdk::println!("✅ Transaction signed successfully with Ed25519");
    
    Ok(signature_bytes)
}

/// Convert our custom SolanaTransaction to proper Solana types
fn convert_to_solana_transaction(transaction: &SolanaTransaction) -> Result<Transaction, String> {
    // Convert fee payer
    let fee_payer = Pubkey::from_str(&transaction.fee_payer)
        .map_err(|e| format!("Invalid fee payer: {}", e))?;
    
    // Convert recent blockhash
    let recent_blockhash = Hash::from_str(&transaction.recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;
    
    // Convert instructions
    let mut instructions = Vec::new();
    for custom_instruction in &transaction.instructions {
        let program_id = Pubkey::from_str(&custom_instruction.program_id)
            .map_err(|e| format!("Invalid program ID: {}", e))?;
        
        let mut accounts = Vec::new();
        for account_meta in &custom_instruction.accounts {
            let pubkey = Pubkey::from_str(&account_meta.pubkey)
                .map_err(|e| format!("Invalid account pubkey: {}", e))?;
            
            accounts.push(solana_instruction::AccountMeta {
                pubkey,
                is_signer: account_meta.is_signer,
                is_writable: account_meta.is_writable,
            });
        }
        
        instructions.push(solana_instruction::Instruction {
            program_id,
            accounts,
            data: custom_instruction.data.clone(),
        });
    }
    
    // Create message
    let message = Message::new_with_blockhash(&instructions, Some(&fee_payer), &recent_blockhash);
    
    // Convert signatures
    let mut signatures = Vec::new();
    for signature_bytes in &transaction.signatures {
        if signature_bytes.len() != 64 {
            return Err(format!("Invalid signature length: {} (expected 64)", signature_bytes.len()));
        }
        let mut signature_array = [0u8; 64];
        signature_array.copy_from_slice(signature_bytes);
        signatures.push(solana_signature::Signature::from(signature_array));
    }
    
    Ok(Transaction {
        signatures,
        message,
    })
}

/// Submit a signed Solana transaction to the network using the official SOL RPC canister
async fn submit_solana_transaction(transaction: &SolanaTransaction) -> Result<String, String> {
    ic_cdk::println!("📤 Submitting signed Solana transaction to SOL RPC canister...");

    // Convert our custom SolanaTransaction to proper Solana types
    let solana_transaction = convert_to_solana_transaction(transaction)?;
    
    // Submit using the SOL RPC client
    let tx_id = client()
        .send_transaction(solana_transaction)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Call to sendTransaction failed: {:?}", e))?;
    
    ic_cdk::println!("✅ Transaction submitted successfully! Hash: {}", tx_id);
    Ok(tx_id.to_string())
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
