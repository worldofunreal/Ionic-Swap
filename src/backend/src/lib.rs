pub mod http_client;
pub mod solana_wallet;
pub mod spl;
pub mod types;

use candid::{CandidType, Deserialize};
use ic_cdk::{init, post_upgrade, update};
use serde_json::json;
use std::sync::OnceLock;

// ============================================================================
// SOLANA LIBRARIES - Use these instead of custom serialization!
// ============================================================================
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

// Global state - using OnceLock for thread-safe initialization
static SOLANA_NETWORK: OnceLock<SolanaNetwork> = OnceLock::new();

fn get_solana_network() -> SolanaNetwork {
    SOLANA_NETWORK.get().cloned().unwrap_or_default()
}

fn set_solana_network(network: SolanaNetwork) {
    let _ = SOLANA_NETWORK.set(network);
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

// Removed unused types: CreateEscrowWithPermitArgs, PermitResult

// ============================================================================
// SOLANA OPERATIONS
// ============================================================================

// Removed unused functions: solana_account(), get_public_key()

/// Get the canister's own public key (always returns canister's wallet)
#[update]
pub async fn get_canister_public_key() -> String {
    let canister_principal = ic_cdk::api::id();
    let wallet = solana_wallet::SolanaWallet::new(canister_principal);
    wallet.get_public_key_base58()
}

/// Get SPL token balance for a specific token account
#[update]
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    http_client::get_spl_token_balance(token_account).await
}

/// Get all SPL token accounts owned by the canister
#[update]
pub async fn get_canister_token_accounts() -> Result<String, String> {
    let canister_principal = ic_cdk::api::id();
    let wallet = solana_wallet::SolanaWallet::new(canister_principal);
    let canister_address = wallet.get_solana_address();
    
    let result = http_client::get_token_accounts_by_owner(canister_address, None).await?;
    
    // Format the result nicely
    let formatted = serde_json::to_string_pretty(&result)
        .map_err(|e| format!("Failed to format result: {}", e))?;
    
    Ok(formatted)
}

/// Get comprehensive token balances for all known tokens
#[update]
pub async fn get_canister_all_token_balances() -> Result<String, String> {
    let canister_principal = ic_cdk::api::id();
    let _wallet = solana_wallet::SolanaWallet::new(canister_principal);
    let _canister_address = _wallet.get_solana_address();
    
    // Known token accounts (add new ones here as they are discovered)
    let known_token_accounts = vec![
        ("SPIRAL", "fx7pDTJ5ryDDQBm3xaT4x6CMfcCrPwDrcgcMNpY9HYj"),
        ("Stardust", "5Daea8aXHUzkCXmhsQT8DpZbKmLtT3a8QKRmrWDDbwMT"),
        // Add more token accounts here as they are discovered/used
    ];
    
    let mut balances = Vec::new();
    
    for (token_name, token_account) in known_token_accounts {
        // Check the balance directly using the known token account address
        match http_client::get_spl_token_balance(token_account.to_string()).await {
            Ok(balance_str) => {
                if let Ok(balance) = balance_str.parse::<u64>() {
                    // Always show the balance, even if 0, for debugging
                    let token_amount = balance as f64 / 1_000_000_000.0; // Assuming 9 decimals
                    balances.push(format!(
                        "{}: {} {} (Raw: {}, Account: {})",
                        token_name,
                        token_amount,
                        token_name,
                        balance,
                        token_account
                    ));
                }
            },
            Err(e) => {
                balances.push(format!(
                    "{}: ERROR - {} (Account: {})",
                    token_name,
                    e,
                    token_account
                ));
            }
        }
    }
    
    let result = format!(
        "Canister Token Balances:\n{}\n\nTotal tokens checked: {}",
        balances.join("\n"),
        balances.len()
    );
    Ok(result)
}

/// Test Ed25519 key generation and signing
#[update]
pub async fn test_ed25519() -> Result<String, String> {
    ic_cdk::println!("Testing Ed25519 key generation and signing...");
    
    let canister_principal = ic_cdk::api::id();
    let wallet = solana_wallet::SolanaWallet::new(canister_principal);
    
    ic_cdk::println!("Created wallet for canister: {}", wallet.get_solana_address());
    
    let public_key_bytes = wallet.get_public_key_bytes();
    let public_key_base58 = wallet.get_public_key_base58();
    
    ic_cdk::println!("Public key (bytes): {}", hex::encode(&public_key_bytes));
    ic_cdk::println!("Public key (base58): {}", public_key_base58);
    
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

/// Submit atomic delegation + transfer transaction (gasless for user)
#[update]
pub async fn submit_delegation_transaction(transaction_data: Vec<u8>) -> Result<String, String> {
    ic_cdk::println!("🚀 Submitting atomic delegation + transfer transaction");
    ic_cdk::println!("   Received transaction data: {} bytes", transaction_data.len());
    
    // Decode base64 transaction data
    let decoded_data = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &transaction_data)
        .map_err(|e| format!("Failed to decode base64 transaction data: {}", e))?;
    
    ic_cdk::println!("   Decoded transaction data: {} bytes", decoded_data.len());
    
    // Deserialize the transaction
    let transaction: Transaction = match bincode::deserialize::<Transaction>(&decoded_data) {
        Ok(tx) => {
            ic_cdk::println!("   ✅ Transaction deserialized successfully");
            ic_cdk::println!("   Signatures: {}", tx.signatures.len());
            tx
        },
        Err(e) => {
            ic_cdk::println!("   ❌ Failed to deserialize transaction: {}", e);
            return Err(format!("Failed to deserialize transaction: {}", e));
        }
    };
    
    ic_cdk::println!("   📋 Atomic transaction with proper account ordering");
    ic_cdk::println!("   Instructions count: {}", transaction.message.instructions.len());
    ic_cdk::println!("   1. ApproveChecked: Alice delegates to canister");
    ic_cdk::println!("   2. Transfer: Canister transfers using delegated authority");
    ic_cdk::println!("   Canister signs once (satisfies both fee payer AND delegate authority roles)");
    
    // Get canister's wallet for signing
    let canister_principal = ic_cdk::api::id();
    let canister_wallet = solana_wallet::SolanaWallet::new(canister_principal);
    
    let mut final_transaction = transaction;
    
    // Sign the transaction message with canister's key
    let message_bytes = bincode::serialize(&final_transaction.message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;
    
    let canister_signature = canister_wallet.sign_message(&message_bytes).await?;
    let signature = Signature::try_from(canister_signature.as_slice())
        .map_err(|e| format!("Invalid canister signature: {}", e))?;
    
    // Set the canister's signature at index 0 (fee payer position)
    final_transaction.signatures[0] = signature;
    
    ic_cdk::println!("   ✅ Transaction co-signed by canister (fee payer + delegate authority)");
    
    // Submit the fully signed transaction to Solana
    let tx_hash = submit_proper_solana_transaction(&final_transaction).await?;
    
    ic_cdk::println!("   ✅ Atomic delegation + transfer transaction submitted: {}", tx_hash);
    
    Ok(tx_hash)
}

// Removed unused helper functions that were only used by create_escrow_with_permit()

/// Submit proper Solana transaction using real serialization
async fn submit_proper_solana_transaction(transaction: &Transaction) -> Result<String, String> {
    ic_cdk::println!("📡 Submitting proper Solana transaction...");
    
    // Use proper Solana serialization (Borsh)
    let serialized_tx = bincode::serialize(transaction)
        .map_err(|e| format!("Failed to serialize transaction: {}", e))?;
    
    ic_cdk::println!("   Serialized transaction: {} bytes", serialized_tx.len());
    
    // Submit to Solana RPC using proper format
    let params = json!([
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &serialized_tx),
        {
            "encoding": "base64",
            "skipPreflight": false,
            "preflightCommitment": "confirmed"
        }
    ]);
    
    // 🚀 Use non-replicated call for maximum speed (testing only!)
    let response = http_client::call_solana_rpc_non_replicated("sendTransaction", params).await?;
    
    if let Some(error) = response["error"].as_object() {
        return Err(format!("RPC error: {:?}", error));
    }
    
    let tx_hash = response["result"]
        .as_str()
        .ok_or("Missing transaction hash in response")?;
    
    ic_cdk::println!("✅ Transaction submitted successfully: {}", tx_hash);
    
    Ok(tx_hash.to_string())
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Removed unused function: validate_caller_not_anonymous()

// Enable Candid export
ic_cdk::export_candid!();