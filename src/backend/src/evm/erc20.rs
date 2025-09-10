use alloy::primitives::{Address, U256, keccak256};
use alloy::rpc::types::TransactionRequest;
use alloy::network::TransactionBuilder;
use super::wallet::{sign_eip1559_transaction_legacy, send_raw_transaction, send_transaction};

// ============================================================================
// ERC-20 TOKEN OPERATIONS (Using Alloy primitives)
// ============================================================================

/// Transfer ERC20 tokens from canister to recipient
pub async fn transfer_erc20_tokens(
    token_address: &str,
    recipient: &str,
    amount: &str,
) -> Result<String, String> {
    // Parse addresses
    let _token_addr = token_address.parse::<Address>()
        .map_err(|e| format!("Invalid token address: {}", e))?;
    let recipient_addr = recipient.parse::<Address>()
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    
    // Parse amount
    let amount_u256 = U256::from_str_radix(amount, 10)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    // Get canister's Ethereum address
    let canister_address = super::wallet::get_ethereum_address().await?;
    
    // Get current nonce
    let nonce_response = crate::http_client::get_transaction_count(canister_address.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // Get current gas price
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Encode transfer function call manually
    let transfer_data = encode_transfer_call(recipient_addr, amount_u256)?;
    
    // Sign and send transaction
    let signed_tx = sign_eip1559_transaction_legacy(
        &canister_address,
        token_address,
        nonce,
        gas_price,
        &base_fee_per_gas.to_string(),
        &format!("0x{}", hex::encode(transfer_data)),
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    ic_cdk::println!("🔍 Token transfer sent successfully: {}", tx_hash);
    ic_cdk::println!("  Token: {}", token_address);
    ic_cdk::println!("  Recipient: {}", recipient);
    ic_cdk::println!("  Amount: {}", amount);
    
    Ok(tx_hash)
}

/// Transfer ERC20 tokens using Provider pattern (real blockchain interaction)
pub async fn transfer_erc20_tokens_provider(
    token_address: &str,
    recipient: &str,
    amount: &str,
) -> Result<String, String> {
    // Parse addresses
    let token_addr = token_address.parse::<Address>()
        .map_err(|e| format!("Invalid token address: {}", e))?;
    let recipient_addr = recipient.parse::<Address>()
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    
    // Parse amount
    let amount_u256 = U256::from_str_radix(amount, 10)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    // Encode transfer function call
    let transfer_data = encode_transfer_call(recipient_addr, amount_u256)?;
    
    // Get canister's Ethereum address
    let canister_address = super::wallet::get_ethereum_address().await?;
    let from_addr = canister_address.parse::<Address>()
        .map_err(|e| format!("Invalid canister address: {}", e))?;
    
    // Create transaction request using Provider pattern
    let tx = TransactionRequest::default()
        .with_to(token_addr)
        .with_from(from_addr)
        .with_input(transfer_data)
        .with_gas_limit(100_000) // Standard gas limit for ERC-20 transfers
        .with_max_priority_fee_per_gas(1_000_000_000) // 1 gwei
        .with_max_fee_per_gas(20_000_000_000); // 20 gwei
    
    // Send transaction using Provider pattern
    let tx_hash = send_transaction(tx).await?;
    
    ic_cdk::println!("🔍 Token transfer sent successfully: {}", tx_hash);
    ic_cdk::println!("  Token: {}", token_address);
    ic_cdk::println!("  Recipient: {}", recipient);
    ic_cdk::println!("  Amount: {}", amount);
    
    Ok(tx_hash)
}

/// Get ERC-20 token balance for an address
pub async fn get_token_balance(token_address: &str, owner_address: &str) -> Result<String, String> {
    // Parse addresses
    let _token_addr = token_address.parse::<Address>()
        .map_err(|e| format!("Invalid token address: {}", e))?;
    let owner_addr = owner_address.parse::<Address>()
        .map_err(|e| format!("Invalid owner address: {}", e))?;
    
    // Encode balanceOf function call
    let balance_data = encode_balance_of_call(owner_addr)?;
    
    // Make eth_call to get balance
    let params = format!(
        r#"{{"to": "{}", "data": "0x{}"}}"#,
        token_address,
        hex::encode(balance_data)
    );
    
    let response = crate::http_client::make_json_rpc_call("eth_call", &format!("[{}, \"latest\"]", params)).await?;
    
    let response_json: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    if let Some(error) = response_json.get("error") {
        return Err(format!("RPC error: {}", error));
    }
    
    let balance_hex = response_json["result"]
        .as_str()
        .ok_or("No balance in response")?;
    
    // Convert hex to decimal
    let balance_u256 = U256::from_str_radix(balance_hex.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid balance hex: {}", e))?;
    
    Ok(balance_u256.to_string())
}

/// Encode transfer(address,uint256) function call
fn encode_transfer_call(recipient: Address, amount: U256) -> Result<Vec<u8>, String> {
    // Function selector for transfer(address,uint256)
    let transfer_selector = keccak256(b"transfer(address,uint256)");
    let mut data = transfer_selector[..4].to_vec();
    
    // Encode recipient address (32 bytes, padded)
    let recipient_bytes = recipient.as_slice();
    let mut recipient_padded = vec![0u8; 12]; // 12 bytes of padding
    recipient_padded.extend_from_slice(recipient_bytes); // 20 bytes address
    data.extend_from_slice(&recipient_padded);
    
    // Encode amount (32 bytes)
    let mut amount_bytes = [0u8; 32];
    amount.to_be_bytes_trimmed_vec().iter().rev().enumerate().for_each(|(i, &byte)| {
        if i < 32 {
            amount_bytes[31 - i] = byte;
        }
    });
    data.extend_from_slice(&amount_bytes);
    
    Ok(data)
}

/// Encode balanceOf(address) function call
fn encode_balance_of_call(owner: Address) -> Result<Vec<u8>, String> {
    // Function selector for balanceOf(address)
    let balance_of_selector = keccak256(b"balanceOf(address)");
    let mut data = balance_of_selector[..4].to_vec();
    
    // Encode owner address (32 bytes, padded)
    let owner_bytes = owner.as_slice();
    let mut owner_padded = vec![0u8; 12]; // 12 bytes of padding
    owner_padded.extend_from_slice(owner_bytes); // 20 bytes address
    data.extend_from_slice(&owner_padded);
    
    Ok(data)
}

/// Encode transferFrom(address,address,uint256) function call
pub fn encode_transfer_from_call(from: Address, to: Address, amount: U256) -> Result<Vec<u8>, String> {
    // Function selector for transferFrom(address,address,uint256)
    let transfer_from_selector = keccak256(b"transferFrom(address,address,uint256)");
    let mut data = transfer_from_selector[..4].to_vec();
    
    // Encode from address (32 bytes, padded)
    let from_bytes = from.as_slice();
    let mut from_padded = vec![0u8; 12]; // 12 bytes of padding
    from_padded.extend_from_slice(from_bytes); // 20 bytes address
    data.extend_from_slice(&from_padded);
    
    // Encode to address (32 bytes, padded)
    let to_bytes = to.as_slice();
    let mut to_padded = vec![0u8; 12]; // 12 bytes of padding
    to_padded.extend_from_slice(to_bytes); // 20 bytes address
    data.extend_from_slice(&to_padded);
    
    // Encode amount (32 bytes)
    let mut amount_bytes = [0u8; 32];
    amount.to_be_bytes_trimmed_vec().iter().rev().enumerate().for_each(|(i, &byte)| {
        if i < 32 {
            amount_bytes[31 - i] = byte;
        }
    });
    data.extend_from_slice(&amount_bytes);
    
    Ok(data)
}
