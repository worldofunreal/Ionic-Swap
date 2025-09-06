use crate::{
    client, solana_wallet::SolanaWallet, validate_caller_not_anonymous,
};
use sol_rpc_types::GetAccountInfoEncoding;
use solana_instruction::{AccountMeta, Instruction};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::{
    address::get_associated_token_address_with_program_id,
};
use std::str::FromStr;

// HTLC Program ID (deployed to Solana devnet)
const HTLC_PROGRAM_ID: &str = "DZ5Fbg7jrXKP6gghrmsgswzakrhw3PRsao5USHuWnNPN";

// Solana program IDs
const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SYSTEM_PROGRAM_ID: &str = "11111111111111111111111111111111";

/// Create a Solana HTLC using the deployed HTLC program
pub async fn create_solana_htlc_program(
    order_id: &str,
    token_mint: &str,
    amount: u64,
    hashlock: &str,
    timelock: i64,
    recipient: &str,
) -> Result<String, String> {
    let client = client();
    let caller = validate_caller_not_anonymous();
    let wallet = SolanaWallet::new(caller).await;

    let sender = wallet.solana_account();
    let recipient_pubkey = Pubkey::from_str(recipient)
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    let mint_pubkey = Pubkey::from_str(token_mint)
        .map_err(|e| format!("Invalid mint address: {}", e))?;
    let program_id = Pubkey::from_str(HTLC_PROGRAM_ID)
        .map_err(|e| format!("Invalid program ID: {}", e))?;

    // Create HTLC PDA
    let (htlc_pda, _bump) = Pubkey::find_program_address(
        &[b"htlc", order_id.as_bytes()],
        &program_id,
    );

    // Get associated token accounts
    let sender_token_account = get_associated_token_address_with_program_id(
        sender.as_ref(),
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    let htlc_token_account = get_associated_token_address_with_program_id(
        &htlc_pda,
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    // Parse hashlock from hex string
    let hashlock_bytes = hex::decode(hashlock.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid hashlock format: {}", e))?;
    
    if hashlock_bytes.len() != 32 {
        return Err("Hashlock must be 32 bytes".to_string());
    }
    let mut hashlock_array = [0u8; 32];
    hashlock_array.copy_from_slice(&hashlock_bytes);

    // Create HTLC instruction
    let mut instruction_data = Vec::new();
    instruction_data.extend_from_slice(&[0x01, 0x00, 0x00, 0x00]); // create_htlc discriminator
    instruction_data.extend_from_slice(&amount.to_le_bytes()); // amount
    instruction_data.extend_from_slice(&hashlock_array); // hashlock
    instruction_data.extend_from_slice(&timelock.to_le_bytes()); // timelock
    instruction_data.extend_from_slice(order_id.as_bytes()); // order_id

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(htlc_pda, false),
            AccountMeta::new_readonly(*sender.as_ref(), true),
            AccountMeta::new_readonly(recipient_pubkey, false),
            AccountMeta::new(sender_token_account, false),
            AccountMeta::new(htlc_token_account, false),
            AccountMeta::new_readonly(mint_pubkey, false),
            AccountMeta::new_readonly(Pubkey::from_str(TOKEN_PROGRAM_ID).unwrap(), false),
            AccountMeta::new_readonly(Pubkey::from_str(SYSTEM_PROGRAM_ID).unwrap(), false),
        ],
        data: instruction_data,
    };

    // Create and send transaction
    let message = Message::new_with_blockhash(
        &[instruction],
        Some(sender.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![sender.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    let signature = client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed");

    ic_cdk::println!("✅ Solana HTLC created: {}", signature);
    Ok(signature.to_string())
}

/// Claim a Solana HTLC using the secret
pub async fn claim_solana_htlc_program(
    order_id: &str,
    secret: &str,
    recipient: &str,
) -> Result<String, String> {
    let client = client();
    let caller = validate_caller_not_anonymous();
    let wallet = SolanaWallet::new(caller).await;

    let recipient_wallet = wallet.solana_account();
    let recipient_pubkey = Pubkey::from_str(recipient)
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    let program_id = Pubkey::from_str(HTLC_PROGRAM_ID)
        .map_err(|e| format!("Invalid program ID: {}", e))?;

    // Create HTLC PDA
    let (htlc_pda, _bump) = Pubkey::find_program_address(
        &[b"htlc", order_id.as_bytes()],
        &program_id,
    );

    // Get HTLC account to determine token mint
    let htlc_account = client
        .get_account_info(htlc_pda)
        .with_encoding(GetAccountInfoEncoding::Base64)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getAccountInfo` failed")
        .ok_or("HTLC account not found")?;

    // Parse HTLC data to get token mint (simplified - in real implementation you'd deserialize the account data)
    // For now, we'll assume we know the token mint from the order
    let mint_pubkey = Pubkey::from_str("So11111111111111111111111111111111111111112") // Wrapped SOL
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    // Get associated token accounts
    let htlc_token_account = get_associated_token_address_with_program_id(
        &htlc_pda,
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    let recipient_token_account = get_associated_token_address_with_program_id(
        &recipient_pubkey,
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    // Parse secret from hex string
    let secret_bytes = hex::decode(secret.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid secret format: {}", e))?;
    
    if secret_bytes.len() != 32 {
        return Err("Secret must be 32 bytes".to_string());
    }
    let mut secret_array = [0u8; 32];
    secret_array.copy_from_slice(&secret_bytes);

    // Create claim instruction
    let mut instruction_data = Vec::new();
    instruction_data.extend_from_slice(&[0x02, 0x00, 0x00, 0x00]); // claim_htlc discriminator
    instruction_data.extend_from_slice(&secret_array); // secret

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(htlc_pda, false),
            AccountMeta::new_readonly(*recipient_wallet.as_ref(), true),
            AccountMeta::new(htlc_token_account, false),
            AccountMeta::new(recipient_token_account, false),
            AccountMeta::new_readonly(mint_pubkey, false),
            AccountMeta::new_readonly(Pubkey::from_str(TOKEN_PROGRAM_ID).unwrap(), false),
        ],
        data: instruction_data,
    };

    // Create and send transaction
    let message = Message::new_with_blockhash(
        &[instruction],
        Some(recipient_wallet.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![recipient_wallet.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    let signature = client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed");

    ic_cdk::println!("✅ Solana HTLC claimed: {}", signature);
    Ok(signature.to_string())
}

/// Refund an expired Solana HTLC
pub async fn refund_solana_htlc_program(
    order_id: &str,
    sender: &str,
) -> Result<String, String> {
    let client = client();
    let caller = validate_caller_not_anonymous();
    let wallet = SolanaWallet::new(caller).await;

    let sender_wallet = wallet.solana_account();
    let sender_pubkey = Pubkey::from_str(sender)
        .map_err(|e| format!("Invalid sender address: {}", e))?;
    let program_id = Pubkey::from_str(HTLC_PROGRAM_ID)
        .map_err(|e| format!("Invalid program ID: {}", e))?;

    // Create HTLC PDA
    let (htlc_pda, _bump) = Pubkey::find_program_address(
        &[b"htlc", order_id.as_bytes()],
        &program_id,
    );

    // Get HTLC account to determine token mint (simplified)
    let mint_pubkey = Pubkey::from_str("So11111111111111111111111111111111111111112") // Wrapped SOL
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    // Get associated token accounts
    let htlc_token_account = get_associated_token_address_with_program_id(
        &htlc_pda,
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    let sender_token_account = get_associated_token_address_with_program_id(
        &sender_pubkey,
        &mint_pubkey,
        &get_account_owner(&mint_pubkey).await,
    );

    // Create refund instruction
    let instruction_data = vec![0x03, 0x00, 0x00, 0x00]; // refund_htlc discriminator

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(htlc_pda, false),
            AccountMeta::new_readonly(*sender_wallet.as_ref(), true),
            AccountMeta::new(htlc_token_account, false),
            AccountMeta::new(sender_token_account, false),
            AccountMeta::new_readonly(mint_pubkey, false),
            AccountMeta::new_readonly(Pubkey::from_str(TOKEN_PROGRAM_ID).unwrap(), false),
        ],
        data: instruction_data,
    };

    // Create and send transaction
    let message = Message::new_with_blockhash(
        &[instruction],
        Some(sender_wallet.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![sender_wallet.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    let signature = client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed");

    ic_cdk::println!("✅ Solana HTLC refunded: {}", signature);
    Ok(signature.to_string())
}

async fn get_account_owner(account: &Pubkey) -> Pubkey {
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
