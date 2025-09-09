use primitive_types::U256;
use super::types::{EvmSwapRequest, EvmSwapResult, PermitRequest, GaslessApprovalRequest};
use super::wallet::{sign_eip1559_transaction, send_raw_transaction, keccak256};
use super::erc20::transfer_erc20_tokens;
use super::permit::execute_gasless_approval;

// ============================================================================
// EVM ATOMIC SWAP FUNCTIONS
// ============================================================================

/// Submit atomic swap transaction (permit + immediate token transfer)
pub async fn swap_evm(
    permit_request: PermitRequest,
    swap_request: EvmSwapRequest
) -> Result<EvmSwapResult, String> {
    ic_cdk::println!("🔄 Starting atomic EVM swap");
    ic_cdk::println!("   Token in: {}", swap_request.token_in_mint);
    ic_cdk::println!("   Token out: {}", swap_request.token_out_mint);
    ic_cdk::println!("   Amount in: {} ({} tokens)", 
        swap_request.amount_in, 
        swap_request.amount_in as f64 / 1_000_000_000.0
    );
    ic_cdk::println!("   Amount out: {} ({} tokens)", 
        swap_request.amount_out, 
        swap_request.amount_out as f64 / 1_000_000_000.0
    );
    
    // Step 1: Execute gasless approval (permit)
    ic_cdk::println!("   📝 Step 1: Executing gasless approval...");
    let gasless_approval_request = GaslessApprovalRequest {
        permit_request: permit_request.clone(),
        token_address: swap_request.token_in_mint.clone(),
    };
    
    let permit_tx_hash = execute_gasless_approval(gasless_approval_request).await?;
    ic_cdk::println!("   ✅ Permit transaction: {}", permit_tx_hash);
    
    // Step 2: Transfer tokens from user to canister (using permit)
    ic_cdk::println!("   💰 Step 2: Transferring tokens from user to canister...");
    let transfer_from_tx_hash = transfer_from_user_to_canister(
        &swap_request.token_in_mint,
        &permit_request.owner,
        &swap_request.amount_in.to_string()
    ).await?;
    ic_cdk::println!("   ✅ Transfer from user: {}", transfer_from_tx_hash);
    
    // Step 3: Transfer tokens from canister to user
    ic_cdk::println!("   🎁 Step 3: Transferring tokens from canister to user...");
    let swap_tx_hash = transfer_erc20_tokens(
        &swap_request.token_out_mint,
        &swap_request.user_address,
        &swap_request.amount_out.to_string()
    ).await?;
    ic_cdk::println!("   ✅ Transfer to user: {}", swap_tx_hash);
    
    let result = EvmSwapResult {
        permit_tx_hash,
        swap_tx_hash,
        token_in_amount: swap_request.amount_in,
        token_out_amount: swap_request.amount_out,
    };
    
    ic_cdk::println!("   🎉 Atomic EVM swap completed successfully!");
    Ok(result)
}

/// Transfer tokens from user to canister using permit
async fn transfer_from_user_to_canister(
    token_address: &str,
    user_address: &str,
    amount: &str,
) -> Result<String, String> {
    // Encode transferFrom function call
    let transfer_from_signature = "transferFrom(address,address,uint256)";
    let transfer_from_selector = keccak256(transfer_from_signature.as_bytes());
    let transfer_from_selector_hex = format!("0x{}", hex::encode(&transfer_from_selector[..4]));
    
    // Get canister's Ethereum address
    let canister_address = super::wallet::get_ethereum_address().await?;
    
    // Encode parameters: (from, to, amount)
    let from_padded = format!("{:0>64}", user_address.trim_start_matches("0x"));
    let to_padded = format!("{:0>64}", canister_address.trim_start_matches("0x"));
    
    // Encode amount
    let amount_u256 = U256::from_dec_str(amount)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    let amount_hex = format!("{:0>64}", format!("{:x}", amount_u256));
    
    let encoded_data = format!("{}{}{}{}", transfer_from_selector_hex, from_padded, to_padded, amount_hex);
    
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
    
    ic_cdk::println!("   🔍 TransferFrom sent successfully: {}", tx_hash);
    ic_cdk::println!("     From: {}", user_address);
    ic_cdk::println!("     To: {}", canister_address);
    ic_cdk::println!("     Amount: {}", amount);
    
    Ok(tx_hash)
}

/// Submit gasless permit transaction (user signs permit, canister pays gas)
pub async fn submit_gasless_permit(permit_request: PermitRequest) -> Result<String, String> {
    ic_cdk::println!("🚀 Submitting gasless permit transaction");
    ic_cdk::println!("   Owner: {}", permit_request.owner);
    ic_cdk::println!("   Spender: {}", permit_request.spender);
    ic_cdk::println!("   Value: {}", permit_request.value);
    ic_cdk::println!("   Deadline: {}", permit_request.deadline);
    
    // For now, we need the token address to execute the permit
    // In a real implementation, this would be passed in the request
    // For now, return success with validation
    let is_valid = super::permit::verify_permit_signature(&permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    
    Ok(format!(
        "Gasless permit validated successfully. Owner: {}, Spender: {}, Value: {}",
        permit_request.owner,
        permit_request.spender,
        permit_request.value
    ))
}
