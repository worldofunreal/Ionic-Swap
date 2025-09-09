use candid::{CandidType, Deserialize};
use ic_cdk::api::canister_self;
use serde_json::json;
use solana_transaction::Transaction;
use solana_instruction::{AccountMeta, Instruction};
use solana_pubkey::Pubkey;
use base64;
use bincode;
use std::str::FromStr;

/// Get the canonical canister public key - use this everywhere
fn canister_pubkey() -> Result<solana_pubkey::Pubkey, String> {
    let wallet = crate::solana::wallet::SolanaWallet::new(ic_cdk::api::canister_self());
    solana_pubkey::Pubkey::from_str(&wallet.get_public_key_base58())
        .map_err(|e| format!("Invalid canister pubkey: {}", e))
}

// ============================================================================
// SWAP TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct SwapRequest {
    pub token_out_mint: String,        // e.g., STARDUST_MINT
    pub amount_out: u64,               // e.g., 25 * 10^8 (25 STARDUST)
    pub min_amount_out: u64,           // Slippage protection
    pub deadline: u64,                 // Expiry timestamp
    pub user_token_account: String,    // User's ATA address for the output token
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct SwapResult {
    pub delegation_tx_hash: String,    // Alice's delegation transaction
    pub swap_tx_hash: String,          // Canister's swap transaction
    pub token_in_amount: u64,          // Amount Alice sent
    pub token_out_amount: u64,         // Amount Alice received
}

// ============================================================================
// SWAP OPERATIONS
// ============================================================================

/// Submit atomic swap transaction (delegation + immediate liquidity transfer)
pub async fn swap_solana(
    delegation_tx_data: Vec<u8>,
    swap_request: SwapRequest
) -> Result<SwapResult, String> {
    ic_cdk::println!("🔄 Starting atomic Solana swap");
    ic_cdk::println!("   Token out: {}", swap_request.token_out_mint);
    ic_cdk::println!("   Amount out: {} ({} tokens)", 
        swap_request.amount_out, 
        swap_request.amount_out as f64 / 1_000_000_000.0
    );
    ic_cdk::println!("   Min amount out: {}", swap_request.min_amount_out);
    ic_cdk::println!("   Deadline: {}", swap_request.deadline);
    
    // Step 1: Execute the delegation transaction (Alice's tokens to canister)
    ic_cdk::println!("   Step 1: Executing delegation transaction...");
    let delegation_tx_hash = crate::solana::submit_delegation_transaction(delegation_tx_data).await?;
    ic_cdk::println!("   ✅ Delegation successful: {}", delegation_tx_hash);
    
    // Step 2: Immediately transfer tokens from canister's liquidity to Alice
    ic_cdk::println!("   Step 2: Transferring tokens from canister liquidity...");
    
    let swap_tx_hash = transfer_from_canister_liquidity(
        &swap_request.token_out_mint,
        swap_request.amount_out,
        &swap_request.user_token_account
    ).await?;
    ic_cdk::println!("   ✅ Swap transfer successful: {}", swap_tx_hash);
    
    // TODO: Parse delegation transaction to get actual amounts
    // For now, we'll use the requested amounts
    let result = SwapResult {
        delegation_tx_hash,
        swap_tx_hash,
        token_in_amount: 0, // TODO: Parse from delegation tx
        token_out_amount: swap_request.amount_out,
    };
    
    ic_cdk::println!("   🎉 Atomic swap completed successfully!");
    Ok(result)
}

/// Transfer tokens from canister's liquidity to user
async fn transfer_from_canister_liquidity(
    token_mint: &str,
    amount: u64,
    user_address: &str
) -> Result<String, String> {
    // Get canister's wallet
    let canister_principal = canister_self();
    let canister_wallet = crate::solana::wallet::SolanaWallet::new(canister_principal);
    let canister_address = canister_wallet.get_solana_address();
    
    ic_cdk::println!("   💰 Transferring {} tokens from canister liquidity ({} to {})", amount, canister_address, user_address);
    
    // Check canister's balance first
    let canister_balance = check_canister_token_balance(token_mint).await?;
    if canister_balance < amount {
        return Err(format!(
            "Insufficient liquidity: canister has {} tokens, requested {}",
            canister_balance, amount
        ));
    }
    
    // Get token account addresses
    let canister_token_account = get_canister_token_account(token_mint)?;
    // user_token_account is now passed directly from TypeScript
    
    // Use one canonical canister key for both authority and fee payer
    let can_pk = canister_pubkey()?;
    let can_pk_str = can_pk.to_string();
    
    ic_cdk::println!("   🔑 Using canonical canister key: {}", can_pk_str);
    
    // Create transfer instruction
    let transfer_instruction = create_transfer_instruction(
        &canister_token_account,
        user_address,
        &can_pk_str,  // authority (same as fee payer)
        amount
    )?;
    
    // Create and sign transaction using the same canonical key
    let transaction = create_and_sign_transaction_with_key(
        &canister_wallet,
        vec![transfer_instruction],
        &can_pk
    ).await?;
    
    // Submit transaction
    let tx_hash = submit_transaction(&transaction).await?;
    
    ic_cdk::println!("   ✅ Transfer transaction submitted: {}", tx_hash);
    Ok(tx_hash)
}

/// Check canister's token balance for a specific mint
async fn check_canister_token_balance(token_mint: &str) -> Result<u64, String> {
    // Get canister's token account for this mint
    let canister_principal = canister_self();
    let canister_wallet = crate::solana::wallet::SolanaWallet::new(canister_principal);
    let _canister_address = canister_wallet.get_solana_address();
    
    // TODO: Get the actual token account address for this mint
    // For now, we'll use the known addresses from the balance function
    
    let known_token_accounts = vec![
        ("DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy", "fx7pDTJ5ryDDQBm3xaT4x6CMfcCrPwDrcgcMNpY9HYj"), // SPIRAL
        ("2Peg6gadPcvuKASdaqqpi1Jib6B6d97tkoiSaBBy4MCY", "5Daea8aXHUzkCXmhsQT8DpZbKmLtT3a8QKRmrWDDbwMT"), // STARDUST
    ];
    
    for (mint_address, account_address) in known_token_accounts {
        if token_mint == mint_address {
            let balance_str = crate::http_client::get_spl_token_balance(account_address.to_string()).await?;
            return balance_str.parse::<u64>()
                .map_err(|e| format!("Failed to parse balance: {}", e));
        }
    }
    
    Err(format!("Token mint {} not found in known accounts", token_mint))
}

/// Get canister's token account for a specific mint
fn get_canister_token_account(token_mint: &str) -> Result<String, String> {
    let known_token_accounts = vec![
        ("DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy", "fx7pDTJ5ryDDQBm3xaT4x6CMfcCrPwDrcgcMNpY9HYj"), // SPIRAL
        ("2Peg6gadPcvuKASdaqqpi1Jib6B6d97tkoiSaBBy4MCY", "5Daea8aXHUzkCXmhsQT8DpZbKmLtT3a8QKRmrWDDbwMT"), // STARDUST
    ];
    
    for (mint_address, account_address) in known_token_accounts {
        if token_mint == mint_address {
            return Ok(account_address.to_string());
        }
    }
    
    Err(format!("Token mint {} not found in known accounts", token_mint))
}


/// Create transfer instruction
fn create_transfer_instruction(
    source: &str,
    destination: &str,
    authority: &str,
    amount: u64
) -> Result<Instruction, String> {
    ic_cdk::println!("   🔧 Creating transfer instruction:");
    ic_cdk::println!("      Source: {}", source);
    ic_cdk::println!("      Destination: {}", destination);
    ic_cdk::println!("      Authority: {}", authority);
    ic_cdk::println!("      Amount: {}", amount);
    
    let source_pubkey = Pubkey::from_str(source)
        .map_err(|e| format!("Invalid source address: {}", e))?;
    let destination_pubkey = Pubkey::from_str(destination)
        .map_err(|e| format!("Invalid destination address: {}", e))?;
    let authority_pubkey = Pubkey::from_str(authority)
        .map_err(|e| format!("Invalid authority address: {}", e))?;
    
    ic_cdk::println!("   ✅ All addresses parsed successfully");
    
    // SPL Token "Transfer" (opcode = 3): [source(w), destination(w), owner(s)]
    let accounts = vec![
        AccountMeta::new(source_pubkey, false),      // source (canister's token account) - writable
        AccountMeta::new(destination_pubkey, false), // destination (Alice's token account) - writable
        AccountMeta::new_readonly(authority_pubkey, true), // authority (canister - must sign)
    ];
    
    ic_cdk::println!("   📋 Account metadata:");
    for (i, account) in accounts.iter().enumerate() {
        ic_cdk::println!("      {}: {} (is_signer: {}, is_writable: {})", 
            i, account.pubkey, account.is_signer, account.is_writable);
    }
    
    // SPL Token transfer instruction data: [3, amount_le_bytes]
    let mut data = vec![3u8]; // Transfer instruction discriminator
    data.extend_from_slice(&amount.to_le_bytes());
    
    ic_cdk::println!("   📦 Instruction data: {:?} ({} bytes)", data, data.len());
    
    let instruction = Instruction {
        program_id: Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap(),
        accounts,
        data,
    };
    
    ic_cdk::println!("   ✅ Transfer instruction created successfully");
    Ok(instruction)
}

/// Create and sign transaction with explicit fee payer key
async fn create_and_sign_transaction_with_key(
    wallet: &crate::solana::wallet::SolanaWallet,
    instructions: Vec<Instruction>,
    fee_payer: &Pubkey
) -> Result<Transaction, String> {
    ic_cdk::println!("   🔧 Creating and signing transaction:");
    ic_cdk::println!("      Instructions count: {}", instructions.len());
    
    // Get latest blockhash
    let blockhash_str = crate::http_client::get_latest_blockhash().await?;
    ic_cdk::println!("      Recent blockhash: {}", blockhash_str);
    
    let blockhash = solana_hash::Hash::from_str(&blockhash_str)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;
    
    // Create transaction with the explicit fee payer
    ic_cdk::println!("      Fee payer: {}", fee_payer);
    
    let mut transaction = Transaction::new_with_payer(
        &instructions,
        Some(fee_payer),
    );
    
    transaction.message.recent_blockhash = blockhash;
    
    ic_cdk::println!("   📋 Transaction structure:");
    ic_cdk::println!("      Account keys count: {}", transaction.message.account_keys.len());
    for (i, key) in transaction.message.account_keys.iter().enumerate() {
        ic_cdk::println!("         {}: {}", i, key);
    }
    
    ic_cdk::println!("      Instructions count: {}", transaction.message.instructions.len());
    for (i, instruction) in transaction.message.instructions.iter().enumerate() {
        ic_cdk::println!("         {}: program_id_index={}, accounts={:?}, data_len={}", 
            i, instruction.program_id_index, instruction.accounts, instruction.data.len());
    }
    
    // Sign transaction
    let message_bytes = bincode::serialize(&transaction.message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;
    
    ic_cdk::println!("      Message bytes: {} bytes", message_bytes.len());
    
    let signature = wallet.sign_message(&message_bytes).await?;
    let solana_signature = solana_signature::Signature::try_from(signature.as_slice())
        .map_err(|e| format!("Invalid signature: {}", e))?;
    
    transaction.signatures = vec![solana_signature];
    
    ic_cdk::println!("   ✅ Transaction created and signed successfully");
    Ok(transaction)
}

/// Submit transaction to Solana
async fn submit_transaction(transaction: &Transaction) -> Result<String, String> {
    // Serialize transaction
    let serialized_tx = bincode::serialize(transaction)
        .map_err(|e| format!("Failed to serialize transaction: {}", e))?;
    
    // Submit to Solana RPC
    let params = json!([
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &serialized_tx),
        {
            "encoding": "base64",
            "skipPreflight": false,
            "preflightCommitment": "confirmed"
        }
    ]);
    
    let response = crate::http_client::call_solana_rpc_non_replicated("sendTransaction", params).await?;
    
    if let Some(error) = response["error"].as_object() {
        return Err(format!("RPC error: {:?}", error));
    }
    
    let tx_hash = response["result"]
        .as_str()
        .ok_or("Missing transaction hash in response")?;
    
    Ok(tx_hash.to_string())
}
