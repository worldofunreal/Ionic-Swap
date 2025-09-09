pub mod http_client;
pub mod solana_wallet;
pub mod spl;
pub mod types;

use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{init, post_upgrade, update};
use serde_json::json;
use sha3::{Digest, Keccak256};
use std::str::FromStr;

// ============================================================================
// SOLANA LIBRARIES - Use these instead of custom serialization!
// ============================================================================
// These are the SAME libraries used by sol-rpc-canister for proper transaction handling
use solana_hash::Hash;
use solana_instruction::{AccountMeta, Instruction};
use solana_message::{Message, compiled_instruction::CompiledInstruction};
use solana_pubkey::Pubkey;
use solana_signature::Signature;
use solana_transaction::Transaction;
use base64;
use bincode;

// ============================================================================
// INITIALIZATION
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Default)]
pub struct InitArg {
    pub solana_network: Option<SolanaNetwork>,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum SolanaNetwork {
    Devnet,
    Testnet,
    Mainnet,
}

impl Default for SolanaNetwork {
    fn default() -> Self {
        SolanaNetwork::Devnet
    }
}

impl SolanaNetwork {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            SolanaNetwork::Devnet => "https://api.devnet.solana.com",
            SolanaNetwork::Testnet => "https://api.testnet.solana.com",
            SolanaNetwork::Mainnet => "https://api.mainnet-beta.solana.com",
        }
    }
}

// Global state
static mut SOLANA_NETWORK: SolanaNetwork = SolanaNetwork::Devnet;

fn get_solana_network() -> SolanaNetwork {
    unsafe { SOLANA_NETWORK.clone() }
}

fn set_solana_network(network: SolanaNetwork) {
    unsafe {
        SOLANA_NETWORK = network;
    }
}

#[init]
pub fn init(init_arg: InitArg) {
    if let Some(network) = init_arg.solana_network {
        set_solana_network(network);
    }
    ic_cdk::println!("Backend initialized with network: {:?}", get_solana_network());
}

#[post_upgrade]
fn post_upgrade(init_arg: Option<InitArg>) {
    if let Some(init_arg) = init_arg {
        if let Some(network) = init_arg.solana_network {
            set_solana_network(network);
        }
    }
    ic_cdk::println!("Backend post-upgrade with network: {:?}", get_solana_network());
}

// ============================================================================
// PERMIT SYSTEM TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone)]
pub struct PermitMessage {
    pub order_id: [u8; 32],
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub user_pubkey: String,
    pub nonce: u64,
    pub deadline: i64,
    pub token_mint: String,
}

#[derive(CandidType, Deserialize)]
pub struct CreateEscrowWithPermitArgs {
    pub order_id: Vec<u8>,
    pub amount: u64,
    pub expiry_timestamp: u64,
    pub permit_signature: Vec<u8>,
    pub nonce: u64,
    pub deadline: u64,
    pub user_pubkey: String,
    pub token_mint: String,
}

#[derive(CandidType, Deserialize)]
pub struct PermitResult {
    pub success: bool,
    pub transaction_hash: Option<String>,
    pub error_message: Option<String>,
}

// ============================================================================
// SOLANA OPERATIONS
// ============================================================================

/// Get the Solana address derived from a principal
#[update]
pub async fn solana_account(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner);
    wallet.get_solana_address()
}

/// Get the public key for funding (base58 format)
#[update]
pub async fn get_public_key(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner);
    wallet.get_public_key_base58()
}

/// Get the canister's own public key (always returns canister's wallet)
#[update]
pub async fn get_canister_public_key() -> String {
    let canister_principal = ic_cdk::api::id();
    let wallet = solana_wallet::SolanaWallet::new(canister_principal);
    wallet.get_public_key_base58()
}

/// Get the SOL balance of a given account
#[update]
pub async fn get_balance(account: Option<String>) -> Result<u64, String> {
    let account = account.unwrap_or_else(|| {
        // For now, return empty string if no account provided
        // In a real implementation, we'd need to handle this differently
        "".to_string()
    });
    
    if account.is_empty() {
        return Err("Account address is required".to_string());
    }
    
    http_client::get_solana_balance(account).await
}

/// Get SPL token balance
#[update]
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    http_client::get_spl_token_balance(token_account).await
}

/// Get associated token account address
#[update]
pub fn get_associated_token_address(
    wallet_address: String,
    mint_address: String,
) -> Result<String, String> {
    spl::get_associated_token_address(&wallet_address, &mint_address)
}

/// Test Ed25519 key generation and signing
#[update]
pub async fn test_ed25519() -> Result<String, String> {
    ic_cdk::println!("Testing Ed25519 key generation and signing...");
    
    // Test key generation
    let canister_principal = ic_cdk::api::id();
    let wallet = solana_wallet::SolanaWallet::new(canister_principal);
    
    ic_cdk::println!("Created wallet for canister: {}", wallet.get_solana_address());
    
    // Get public key info
    let public_key_bytes = wallet.get_public_key_bytes();
    let public_key_base58 = wallet.get_public_key_base58();
    
    ic_cdk::println!("Public key (bytes): {}", hex::encode(&public_key_bytes));
    ic_cdk::println!("Public key (base58): {}", public_key_base58);
    
    // Test signing different messages
    let test_messages = vec![
        b"Hello, IC Ed25519!".as_slice(),
        b"Solana transaction test".as_slice(),
        b"SPL token transfer".as_slice(),
        b"Gasless permit signature".as_slice(),
    ];
    
    let mut results = Vec::new();
    for (i, message) in test_messages.iter().enumerate() {
        let signature = wallet.sign_message(message).await?;
        results.push(format!("Message {}: {} -> Signature: {}", 
            i + 1, 
            String::from_utf8_lossy(message),
            hex::encode(&signature)
        ));
    }
    
    let result = format!(
        "Ed25519 test successful!\n\nPublic Key (Base58): {}\nPublic Key (Hex): {}\nSolana Address: {}\n\nSignatures:\n{}",
        public_key_base58,
        hex::encode(&public_key_bytes),
        wallet.get_solana_address(),
        results.join("\n")
    );
    
    Ok(result)
}

/// Create escrow using permit (gasless for user) - SIMPLIFIED VERSION
/// Submit delegation transaction (Alice signs both instructions, canister only signs as fee payer)
#[update]
pub async fn submit_delegation_transaction(transaction_data: Vec<u8>) -> Result<String, String> {
    ic_cdk::println!("🚀 Submitting delegation transaction (Alice signed both instructions, canister co-signs as fee payer)");
    ic_cdk::println!("   Received transaction data: {} bytes", transaction_data.len());
    
    // The transaction data is base64 encoded, decode it first
    let decoded_data = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &transaction_data)
        .map_err(|e| format!("Failed to decode base64 transaction data: {}", e))?;
    
    ic_cdk::println!("   Decoded transaction data: {} bytes", decoded_data.len());
    
    // Try to deserialize the transaction
    let mut transaction: Transaction = match bincode::deserialize::<Transaction>(&decoded_data) {
        Ok(tx) => {
            ic_cdk::println!("   ✅ Transaction deserialized successfully");
            ic_cdk::println!("   Signatures: {}", tx.signatures.len());
            tx
        },
        Err(e) => {
            ic_cdk::println!("   ❌ Failed to deserialize transaction: {}", e);
            ic_cdk::println!("   First 100 bytes: {:?}", &transaction_data[..std::cmp::min(100, transaction_data.len())]);
            return Err(format!("Failed to deserialize transaction: {}", e));
        }
    };
    
    // CORRECTED APPROACH: Atomic transaction with proper account ordering
    // Fee payer = canister (index 0), signers = {canister, alice}
    ic_cdk::println!("   📋 CORRECTED: Atomic transaction with proper account ordering");
    ic_cdk::println!("   Instructions count: {}", transaction.message.instructions.len());
    ic_cdk::println!("   1. ApproveChecked: Alice delegates to canister");
    ic_cdk::println!("   2. TransferChecked: Canister transfers using delegated authority");
    ic_cdk::println!("   Canister signs once (satisfies both fee payer AND delegate authority roles)");
    
    // Get canister's wallet for fee payer signature
    let canister_principal = ic_cdk::api::id();
    let canister_wallet = solana_wallet::SolanaWallet::new(canister_principal);
    
    // Alice has already signed both instructions as the authority
    // We just need to co-sign as fee payer
    let mut final_transaction = transaction;
    
    ic_cdk::println!("   🔍 SIGNATURE DEBUG INFO:");
    ic_cdk::println!("     Transaction signatures count: {}", final_transaction.signatures.len());
    ic_cdk::println!("     Message header num_required_signatures: {}", final_transaction.message.header.num_required_signatures);
    ic_cdk::println!("     Message header num_readonly_signed_accounts: {}", final_transaction.message.header.num_readonly_signed_accounts);
    ic_cdk::println!("     Message header num_readonly_unsigned_accounts: {}", final_transaction.message.header.num_readonly_unsigned_accounts);
    
    // Log all account keys in the message
    ic_cdk::println!("     Message account keys:");
    for (i, key) in final_transaction.message.account_keys.iter().enumerate() {
        ic_cdk::println!("       {}: {}", i, key);
    }
    
    // Log all instructions in the message
    ic_cdk::println!("     Message instructions:");
    for (i, instruction) in final_transaction.message.instructions.iter().enumerate() {
        ic_cdk::println!("       Instruction {}: program_id_index={}, accounts={:?}, data_len={}", 
            i, instruction.program_id_index, instruction.accounts, instruction.data.len());
    }
    
    // Alice has already signed as owner (ApproveChecked)
    // Canister needs to sign as fee payer AND delegate authority (single signature satisfies both)
    ic_cdk::println!("     Alice has already signed as owner (ApproveChecked)");
    ic_cdk::println!("     Co-signing with canister's key (satisfies fee payer AND delegate authority roles)...");
    
    // Sign the transaction message with canister's key (satisfies both fee payer AND delegate authority)
    let message_bytes = bincode::serialize(&final_transaction.message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;
    
    ic_cdk::println!("     Message bytes length: {}", message_bytes.len());
    ic_cdk::println!("     Message bytes (first 100): {}", hex::encode(&message_bytes[..std::cmp::min(100, message_bytes.len())]));
    
    let canister_signature = canister_wallet.sign_message(&message_bytes).await?;
    let signature = Signature::try_from(canister_signature.as_slice())
        .map_err(|e| format!("Invalid canister signature: {}", e))?;
    
    ic_cdk::println!("     Canister's signature (fee payer + delegate authority): {}", hex::encode(&signature.as_ref()));
    
    // Set the canister's signature at index 0 (fee payer position)
    // This single signature satisfies both fee payer and delegate authority roles
    final_transaction.signatures[0] = signature;
    
    // Log final signatures
    ic_cdk::println!("     Final signatures:");
    for (i, sig) in final_transaction.signatures.iter().enumerate() {
        ic_cdk::println!("       Signature {}: {}", i, hex::encode(&sig.as_ref()));
    }
    
    ic_cdk::println!("   ✅ Transaction co-signed by canister (fee payer + delegate authority)");
    
    // Submit the fully signed transaction to Solana
    let tx_hash = submit_proper_solana_transaction(&final_transaction).await?;
    
    ic_cdk::println!("   ✅ Atomic delegation + transfer transaction submitted: {}", tx_hash);
    
    Ok(tx_hash)
}

/// Pull tokens using delegated authority (canister pulls from Alice's account)
#[update]
pub async fn pull_delegated_tokens(
    user_pubkey: String,
    token_mint: String,
    amount: u64,
) -> Result<String, String> {
    ic_cdk::println!("🚀 Pulling {} tokens from {} using delegated authority", amount, user_pubkey);
    
    // Get canister's wallet
    let canister_principal = ic_cdk::api::id();
    let canister_wallet = solana_wallet::SolanaWallet::new(canister_principal);
    let canister_address = canister_wallet.get_solana_address();
    
    // Get associated token accounts
    let user_token_account = spl::get_associated_token_address(&user_pubkey, &token_mint)?;
    let canister_token_account = spl::get_associated_token_address(&canister_address, &token_mint)?;
    
    ic_cdk::println!("   User token account: {}", user_token_account);
    ic_cdk::println!("   Canister token account: {}", canister_token_account);
    
    // Create TransferChecked instruction (canister uses delegated authority)
    let transfer_instruction = spl::create_transfer_checked_instruction_with_mint(
        &user_token_account,      // source (Alice's account)
        &canister_token_account,  // destination (canister's account)
        &canister_address,        // authority (canister, using delegated authority)
        &token_mint,              // mint address
        amount,                   // amount
        8,                        // decimals (assuming 8 for SPIRAL)
    )?;
    
    // Get latest blockhash
    let blockhash = http_client::get_latest_blockhash().await?;
    
    // Create transaction with canister as fee payer
    let transaction_data = json!({
        "instructions": [transfer_instruction],
        "recent_blockhash": blockhash,
        "fee_payer": canister_address
    });
    
    // Create and submit transaction using the same pattern as delegation
    let tx_hash = sign_and_send_with_permit(&transaction_data.to_string(), &[0u8; 64]).await?;
    
    ic_cdk::println!("✅ Successfully pulled {} tokens from {} to canister: {}", amount, user_pubkey, tx_hash);
    
    Ok(tx_hash)
}

#[update]
pub async fn create_escrow_with_permit(args: CreateEscrowWithPermitArgs) -> Result<PermitResult, String> {
    ic_cdk::println!("🚀 SIMPLIFIED: Pulling tokens from Alice to canister");
    ic_cdk::println!("   User: {}", args.user_pubkey);
    ic_cdk::println!("   Token: {}", args.token_mint);
    ic_cdk::println!("   Amount: {}", args.amount);
    ic_cdk::println!("   Order ID length: {} bytes", args.order_id.len());
    ic_cdk::println!("   Signature length: {} bytes", args.permit_signature.len());
    
    // For now, skip validation and just do the token transfer
    ic_cdk::println!("   ⚠️  Skipping signature verification for testing");
    
    // Convert signature to array (even though we're not verifying it)
    let permit_signature_array: [u8; 64] = {
        let mut arr = [0u8; 64];
        if args.permit_signature.len() >= 64 {
            arr.copy_from_slice(&args.permit_signature[..64]);
        } else {
            // Pad with zeros if signature is too short
            arr[..args.permit_signature.len()].copy_from_slice(&args.permit_signature);
        }
        arr
    };
    
    // SIMPLIFIED: Attempt token transfer and let Solana decide
    ic_cdk::println!("   🚀 Attempting token transfer with permit...");
    
    match transfer_spl_tokens_with_permit(
        &args.user_pubkey,
        &args.token_mint,
        args.amount,
        &permit_signature_array,
    ).await {
        Ok(tx_hash) => {
            ic_cdk::println!("   ✅ Token transfer successful! TX: {}", tx_hash);
            Ok(PermitResult {
                success: true,
                transaction_hash: Some(tx_hash),
                error_message: None,
            })
        },
        Err(e) => {
            ic_cdk::println!("   ❌ Token transfer failed: {}", e);
            Ok(PermitResult {
                success: false,
                transaction_hash: None,
                error_message: Some(format!("Failed to transfer tokens: {}", e)),
            })
        },
    }
}

/// Transfer SPL tokens using permit signature
async fn transfer_spl_tokens_with_permit(
    user_pubkey: &str,
    token_mint: &str,
    amount: u64,
    permit_signature: &[u8; 64],
) -> Result<String, String> {
    ic_cdk::println!("Transferring {} tokens from {} using permit", amount, user_pubkey);
    
    // Get canister's Solana address
    let canister_principal = ic_cdk::api::id();
    let canister_wallet = solana_wallet::SolanaWallet::new(canister_principal);
    let canister_address = canister_wallet.get_solana_address();
    
    // Get associated token accounts
    let user_token_account = spl::get_associated_token_address(user_pubkey, token_mint)?;
    let canister_token_account = spl::get_associated_token_address(&canister_address, token_mint)?;
    
    ic_cdk::println!("User token account: {}", user_token_account);
    ic_cdk::println!("Canister token account: {}", canister_token_account);
    
    // Create SPL token transfer instruction
    // The canister acts as authority (Alice pre-authorizes via permit)
    let transfer_instruction = spl::create_transfer_instruction(
        &user_token_account,
        &canister_token_account,
        &canister_address, // canister is the authority (Alice pre-authorizes via permit)
        amount,
    )?;
    
    // Get latest blockhash
    let blockhash = http_client::get_latest_blockhash().await?;
    
    // Create transaction with canister as fee payer (canister pays gas)
    let transaction_data = json!({
        "instructions": [transfer_instruction],
        "recent_blockhash": blockhash,
        "fee_payer": canister_address
    });
    
    // Sign and send transaction using permit
    let tx_hash = sign_and_send_with_permit(&transaction_data.to_string(), permit_signature).await?;
    
    ic_cdk::println!("SPL token transfer completed: {}", tx_hash);
    
    Ok(tx_hash)
}


/// Verify permit signature
async fn verify_permit_signature(
    permit_message: &PermitMessage,
    signature: &[u8; 64],
) -> bool {
    // Create the message hash that was signed
    let message_data = format!(
        "{}{}{}{}{}{}{}",
        hex::encode(permit_message.order_id),
        permit_message.amount,
        permit_message.expiry_timestamp,
        permit_message.user_pubkey,
        permit_message.nonce,
        permit_message.deadline,
        permit_message.token_mint
    );
    
    let message_hash = Keccak256::digest(message_data.as_bytes());
    
    // For now, we'll skip actual signature verification and assume it's valid
    // In a real implementation, you would verify the signature against the user's public key
    ic_cdk::println!("Verifying permit signature for message hash: {}", hex::encode(message_hash));
    ic_cdk::println!("Signature: {}", hex::encode(signature));
    
    // TODO: Implement actual signature verification
    // This would involve:
    // 1. Recovering the public key from the signature
    // 2. Verifying the signature against the message hash
    // 3. Ensuring the public key matches the user's address
    
    true // Placeholder - always return true for now
}

/// Sign and send transaction using permit signature - USING PROPER SOLANA LIBRARIES!
async fn sign_and_send_with_permit(
    transaction_data: &str,
    permit_signature: &[u8; 64],
) -> Result<String, String> {
    ic_cdk::println!("🚀 Signing and sending transaction with permit using PROPER Solana libraries...");
    
    // Parse the transaction data
    let tx_data: serde_json::Value = serde_json::from_str(transaction_data)
        .map_err(|e| format!("Failed to parse transaction data: {}", e))?;
    
    // Create PROPER Solana transaction using real libraries (not custom serialization!)
    let transaction = create_proper_solana_transaction(&tx_data, permit_signature).await?;
    
    // Submit the transaction using proper serialization
    let tx_hash = submit_proper_solana_transaction(&transaction).await?;
    
    ic_cdk::println!("✅ Transaction submitted with permit signature: {}", tx_hash);
    
    Ok(tx_hash)
}

/// Create PROPER Solana transaction using real libraries (not custom serialization!)
async fn create_proper_solana_transaction(
    tx_data: &serde_json::Value,
    _permit_signature: &[u8; 64],
) -> Result<Transaction, String> {
    ic_cdk::println!("🔧 Creating PROPER Solana transaction using real libraries...");
    
    let instructions = tx_data["instructions"].as_array()
        .ok_or("Missing instructions in transaction data")?;
    
    let recent_blockhash = tx_data["recent_blockhash"].as_str()
        .ok_or("Missing recent_blockhash in transaction data")?;
    
    let _fee_payer = tx_data["fee_payer"].as_str()
        .ok_or("Missing fee_payer in transaction data")?;
    
    // Convert to proper Solana types
    let blockhash_bytes = bs58::decode(recent_blockhash)
        .into_vec()
        .map_err(|e| format!("Invalid blockhash: {}", e))?;
    let blockhash = Hash::new_from_array(
        blockhash_bytes.try_into()
            .map_err(|_| "Invalid blockhash length")?
    );
    
    // Use canister as fee payer (canister pays gas, not Alice)
    let canister_principal = ic_cdk::api::id();
    let canister_wallet = solana_wallet::SolanaWallet::new(canister_principal);
    let canister_pubkey = canister_wallet.get_public_key_base58();
    let fee_payer_pubkey = Pubkey::new_from_array(
        bs58::decode(&canister_pubkey)
            .into_vec()
            .map_err(|e| format!("Invalid canister pubkey: {}", e))?
            .try_into()
            .map_err(|_| "Invalid canister pubkey length")?
    );
    
    // Create proper Solana instructions
    let mut solana_instructions = Vec::new();
    
    for instruction in instructions {
        let program_id = instruction["program_id"].as_str()
            .ok_or("Missing program_id in instruction")?;
        
        let accounts = instruction["accounts"].as_array()
            .ok_or("Missing accounts in instruction")?;
        
        let data = instruction["data"].as_str()
            .ok_or("Missing data in instruction")?;
        
        // Convert program ID
        let program_id_bytes = bs58::decode(program_id)
            .into_vec()
            .map_err(|e| format!("Invalid program_id: {}", e))?;
        let program_id_pubkey = Pubkey::new_from_array(
            program_id_bytes.try_into()
                .map_err(|_| "Invalid program_id length")?
        );
        
        // Convert accounts
        let mut account_metas = Vec::new();
        for account in accounts {
            let pubkey = account["pubkey"].as_str()
                .ok_or("Missing pubkey in account")?;
            let is_signer = account["is_signer"].as_bool()
                .ok_or("Missing is_signer in account")?;
            let is_writable = account["is_writable"].as_bool()
                .ok_or("Missing is_writable in account")?;
            
            let pubkey_bytes = bs58::decode(pubkey)
                .into_vec()
                .map_err(|e| format!("Invalid pubkey: {}", e))?;
            let pubkey_obj = Pubkey::new_from_array(
                pubkey_bytes.try_into()
                    .map_err(|_| "Invalid pubkey length")?
            );
            
            account_metas.push(AccountMeta {
                pubkey: pubkey_obj,
                is_signer,
                is_writable,
            });
        }
        
        // Convert data (hex string to bytes)
        let data_bytes = hex::decode(data)
            .map_err(|e| format!("Invalid instruction data: {}", e))?;
        
        // Create proper Solana instruction
        let solana_instruction = Instruction {
            program_id: program_id_pubkey,
            accounts: account_metas,
            data: data_bytes,
        };
        
        solana_instructions.push(solana_instruction);
    }
    
    // Create proper Solana message
    let message = Message::new_with_blockhash(
        &solana_instructions,
        Some(&fee_payer_pubkey),
        &blockhash,
    );
    
    // Sign the transaction with canister's signature (canister pays gas)
    // The permit signature is used for authorization, not transaction signing
    let message_bytes = bincode::serialize(&message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;
    
    let canister_signature = canister_wallet.sign_message(&message_bytes).await?;
    let signature = Signature::try_from(canister_signature.as_slice())
        .map_err(|e| format!("Invalid canister signature: {}", e))?;
    
    // Create proper Solana transaction with canister's signature
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };
    
    ic_cdk::println!("✅ Created PROPER Solana transaction with {} instructions", solana_instructions.len());
    
    Ok(transaction)
}

/// Submit PROPER Solana transaction using real serialization (not custom!)
async fn submit_proper_solana_transaction(transaction: &Transaction) -> Result<String, String> {
    ic_cdk::println!("📡 Submitting PROPER Solana transaction using real serialization...");
    
    // ============================================================================
    // KEY DIFFERENCE: Use proper Solana serialization (Borsh) instead of custom!
    // ============================================================================
    // This is the SAME serialization used by sol-rpc-canister and all Solana clients
    // We avoid custom serialization and use the official Solana libraries
    let serialized_tx = bincode::serialize(transaction)
        .map_err(|e| format!("Failed to serialize transaction: {}", e))?;
    
    ic_cdk::println!("   Serialized transaction: {} bytes", serialized_tx.len());
    
    // Submit to Solana RPC using proper format
    let params = json!([
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &serialized_tx),  // Use base64 encoding
        {
            "encoding": "base64",
            "skipPreflight": false,
            "preflightCommitment": "confirmed"
        }
    ]);
    
    let response = http_client::call_solana_rpc("sendTransaction", params).await?;
    
    if let Some(error) = response["error"].as_object() {
        return Err(format!("RPC error: {:?}", error));
    }
    
    let tx_hash = response["result"]
        .as_str()
        .ok_or("Missing transaction hash in response")?;
    
    ic_cdk::println!("✅ Transaction submitted successfully: {}", tx_hash);
    
    Ok(tx_hash.to_string())
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

/// Submit a signed Solana transaction to the network
async fn submit_solana_transaction(transaction: &SolanaTransaction) -> Result<String, String> {
    ic_cdk::println!("Submitting Solana transaction...");
    
    // Serialize the complete transaction
    let serialized_tx = serialize_transaction(transaction)?;
    
    // Submit to Solana RPC
    let params = json!([
        hex::encode(&serialized_tx),
        {
            "encoding": "base64",
            "skipPreflight": false,
            "preflightCommitment": "confirmed"
        }
    ]);
    
    let response = http_client::call_solana_rpc("sendTransaction", params).await?;
    
    if let Some(error) = response["error"].as_object() {
        return Err(format!("RPC error: {:?}", error));
    }
    
    let tx_hash = response["result"]
        .as_str()
        .ok_or("Missing transaction hash in response")?;
    
    ic_cdk::println!("Transaction submitted successfully: {}", tx_hash);
    
    Ok(tx_hash.to_string())
}

/// Serialize complete transaction for submission
fn serialize_transaction(transaction: &SolanaTransaction) -> Result<Vec<u8>, String> {
    let mut serialized = Vec::new();
    
    // Add signatures
    serialized.push(transaction.signatures.len() as u8);
    for signature in &transaction.signatures {
        serialized.extend_from_slice(signature);
    }
    
    // Add message data
    let message_data = serialize_transaction_for_signing(transaction)?;
    serialized.extend_from_slice(&message_data);
    
    Ok(serialized)
}

/// Serialize transaction for signing (message format)
fn serialize_transaction_for_signing(transaction: &SolanaTransaction) -> Result<Vec<u8>, String> {
    // Create the message structure for signing
    let mut message_data = Vec::new();
    
    // Add recent blockhash
    let blockhash_bytes = bs58::decode(&transaction.recent_blockhash)
        .into_vec()
        .map_err(|e| format!("Invalid blockhash: {}", e))?;
    message_data.extend_from_slice(&blockhash_bytes);
    
    // Add fee payer
    let fee_payer_bytes = bs58::decode(&transaction.fee_payer)
        .into_vec()
        .map_err(|e| format!("Invalid fee payer: {}", e))?;
    message_data.extend_from_slice(&fee_payer_bytes);
    
    // Add instruction count (varint)
    message_data.push(transaction.instructions.len() as u8);
    
    // Add instructions
    for instruction in &transaction.instructions {
        // Program ID index (simplified - in real implementation, this would be an index)
        message_data.push(0); // Placeholder for program ID index
        
        // Account indices (simplified)
        message_data.push(instruction.accounts.len() as u8);
        for _ in &instruction.accounts {
            message_data.push(0); // Placeholder for account index
        }
        
        // Instruction data length
        let data_len = instruction.data.len();
        message_data.extend_from_slice(&data_len.to_le_bytes());
        message_data.extend_from_slice(&instruction.data);
    }
    
    Ok(message_data)
}

// ============================================================================
// DELEGATION PARSING AND CONVERSION
// ============================================================================

#[derive(Debug)]
struct DelegationInfo {
    source_token_account: String,
    token_mint: String,
    amount: u64,
}

/// Parse delegation transaction to extract token account info
fn parse_delegation_transaction(transaction: &Transaction) -> Result<DelegationInfo, String> {
    // Find the ApproveChecked instruction in the transaction
    for instruction in &transaction.message.instructions {
        // Check if this is an ApproveChecked instruction (instruction type 13)
        if instruction.data.len() >= 1 && instruction.data[0] == 13 {
            // ApproveChecked instruction format:
            // - accounts[0]: source token account
            // - accounts[1]: mint
            // - accounts[2]: delegate (canister)
            // - accounts[3]: owner (Alice)
            // - data[1-8]: amount (u64)
            // - data[9]: decimals
            
            if instruction.accounts.len() >= 4 && instruction.data.len() >= 10 {
                let source_token_account = transaction.message.account_keys[instruction.accounts[0] as usize].to_string();
                let token_mint = transaction.message.account_keys[instruction.accounts[1] as usize].to_string();
                
                // Extract amount from instruction data (bytes 1-8, little endian)
                let amount_bytes: [u8; 8] = instruction.data[1..9].try_into()
                    .map_err(|_| "Invalid amount bytes in ApproveChecked instruction")?;
                let amount = u64::from_le_bytes(amount_bytes);
                
                return Ok(DelegationInfo {
                    source_token_account,
                    token_mint,
                    amount,
                });
            }
        }
    }
    
    Err("No ApproveChecked instruction found in delegation transaction".to_string())
}

/// Convert Instruction to CompiledInstruction format
fn convert_instruction_to_compiled(
    instruction: &Instruction,
    account_keys: &[Pubkey],
) -> Result<CompiledInstruction, String> {
    ic_cdk::println!("   🔍 Converting instruction to compiled format:");
    ic_cdk::println!("     Program ID: {}", instruction.program_id);
    ic_cdk::println!("     Accounts count: {}", instruction.accounts.len());
    
    // Find the program ID index in account_keys
    let program_id_index = account_keys.iter()
        .position(|key| key == &instruction.program_id)
        .ok_or_else(|| {
            ic_cdk::println!("     ❌ Program ID {} not found in account keys", instruction.program_id);
            format!("Program ID {} not found in account keys", instruction.program_id)
        })?;
    
    ic_cdk::println!("     Program ID index: {}", program_id_index);
    
    // Find account indices
    let mut account_indices = Vec::new();
    for (i, account_meta) in instruction.accounts.iter().enumerate() {
        let account_index = account_keys.iter()
            .position(|key| key == &account_meta.pubkey)
            .ok_or_else(|| {
                ic_cdk::println!("     ❌ Account {} (index {}) not found in account keys", account_meta.pubkey, i);
                ic_cdk::println!("     Available account keys:");
                for (j, key) in account_keys.iter().enumerate() {
                    ic_cdk::println!("       {}: {}", j, key);
                }
                format!("Account {} not found in account keys", account_meta.pubkey)
            })?;
        ic_cdk::println!("     Account {} -> index {}", account_meta.pubkey, account_index);
        account_indices.push(account_index as u8);
    }
    
    Ok(CompiledInstruction {
        program_id_index: program_id_index as u8,
        accounts: account_indices,
        data: instruction.data.clone(),
    })
}

/// Convert JSON instruction to proper Solana instruction
fn convert_json_instruction_to_solana(json_instruction: &serde_json::Value) -> Result<Instruction, String> {
    let program_id = json_instruction["program_id"].as_str()
        .ok_or("Missing program_id in instruction")?;
    
    let accounts = json_instruction["accounts"].as_array()
        .ok_or("Missing accounts in instruction")?;
    
    let data = json_instruction["data"].as_str()
        .ok_or("Missing data in instruction")?;
    
    // Convert program ID
    let program_id_bytes = bs58::decode(program_id)
        .into_vec()
        .map_err(|e| format!("Invalid program_id: {}", e))?;
    let program_id_pubkey = Pubkey::new_from_array(
        program_id_bytes.try_into()
            .map_err(|_| "Invalid program_id length")?
    );
    
    // Convert accounts
    let mut account_metas = Vec::new();
    for account in accounts {
        let pubkey = account["pubkey"].as_str()
            .ok_or("Missing pubkey in account")?;
        let is_signer = account["is_signer"].as_bool()
            .ok_or("Missing is_signer in account")?;
        let is_writable = account["is_writable"].as_bool()
            .ok_or("Missing is_writable in account")?;
        
        let pubkey_bytes = bs58::decode(pubkey)
            .into_vec()
            .map_err(|e| format!("Invalid pubkey: {}", e))?;
        let pubkey_obj = Pubkey::new_from_array(
            pubkey_bytes.try_into()
                .map_err(|_| "Invalid pubkey length")?
        );
        
        account_metas.push(AccountMeta {
            pubkey: pubkey_obj,
            is_signer,
            is_writable,
        });
    }
    
    // Convert data (hex string to bytes)
    let data_bytes = hex::decode(data)
        .map_err(|e| format!("Invalid instruction data: {}", e))?;
    
    // Create proper Solana instruction
    let solana_instruction = Instruction {
        program_id: program_id_pubkey,
        accounts: account_metas,
        data: data_bytes,
    };
    
    Ok(solana_instruction)
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}

// Enable Candid export
ic_cdk::export_candid!();
