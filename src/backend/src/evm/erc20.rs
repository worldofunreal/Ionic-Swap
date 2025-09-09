use primitive_types::U256;
use super::wallet::{keccak256, sign_eip1559_transaction, send_raw_transaction};

// ============================================================================
// ERC-20 TOKEN OPERATIONS
// ============================================================================

/// Transfer ERC20 tokens from canister to recipient
pub async fn transfer_erc20_tokens(
    token_address: &str,
    recipient: &str,
    amount: &str,
) -> Result<String, String> {
    // Encode ERC20 transfer function call
    let transfer_signature = "transfer(address,uint256)";
    let transfer_selector = keccak256(transfer_signature.as_bytes());
    let transfer_selector_hex = format!("0x{}", hex::encode(&transfer_selector[..4]));
    
    // Encode recipient address (padded to 32 bytes)
    let recipient_clean = recipient.trim_start_matches("0x");
    let recipient_padded = format!("{:0>64}", recipient_clean);
    
    // Encode amount (padded to 32 bytes)
    let amount_u256 = U256::from_dec_str(amount)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    let amount_hex = format!("{:0>64}", format!("{:x}", amount_u256));
    
    let encoded_data = format!("{}{}{}", transfer_selector_hex, recipient_padded, amount_hex);
    
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
    
    // Sign and send transaction
    let signed_tx = sign_eip1559_transaction(
        &canister_address,
        token_address,
        nonce,
        gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    ic_cdk::println!("🔍 Token transfer sent successfully: {}", tx_hash);
    ic_cdk::println!("  Token: {}", token_address);
    ic_cdk::println!("  Recipient: {}", recipient);
    ic_cdk::println!("  Amount: {}", amount);
    
    Ok(tx_hash)
}

/// Get ERC-20 token balance for an address
pub async fn get_token_balance(token_address: &str, owner_address: &str) -> Result<String, String> {
    // Encode balanceOf function call
    let balance_of_signature = "balanceOf(address)";
    let balance_of_selector = keccak256(balance_of_signature.as_bytes());
    let balance_of_selector_hex = format!("0x{}", hex::encode(&balance_of_selector[..4]));
    
    // Encode owner address (padded to 32 bytes)
    let owner_clean = owner_address.trim_start_matches("0x");
    let owner_padded = format!("{:0>64}", owner_clean);
    
    let encoded_data = format!("{}{}", balance_of_selector_hex, owner_padded);
    
    // Make eth_call to get balance
    let params = format!(
        r#"{{"to": "{}", "data": "{}"}}"#,
        token_address,
        encoded_data
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
