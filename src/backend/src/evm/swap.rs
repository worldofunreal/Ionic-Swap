use alloy::primitives::{U256, keccak256};
use super::types::{EvmSwapRequest, EvmSwapResult, PermitRequest, GaslessApprovalRequest};
use super::wallet::{sign_eip1559_transaction_legacy, send_raw_transaction};
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
    let _transfer_from_selector_hex = format!("0x{}", hex::encode(&transfer_from_selector[..4]));
    
    // Get canister's Ethereum address
    let canister_address = super::wallet::get_ethereum_address().await?;
    
    // Parse addresses
    let from_addr = user_address.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid user address: {}", e))?;
    let to_addr = canister_address.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid canister address: {}", e))?;
    
    // Parse amount
    let amount_u256 = U256::from_str_radix(amount, 10)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    // Encode transferFrom call
    let encoded_data = super::erc20::encode_transfer_from_call(from_addr, to_addr, amount_u256)?;
    
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
    let signed_tx = sign_eip1559_transaction_legacy(
        &canister_address,
        token_address,
        nonce,
        gas_price,
        &base_fee_per_gas.to_string(),
        &format!("0x{}", hex::encode(&encoded_data)),
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    ic_cdk::println!("   🔍 TransferFrom sent successfully: {}", tx_hash);
    ic_cdk::println!("     From: {}", user_address);
    ic_cdk::println!("     To: {}", canister_address);
    ic_cdk::println!("     Amount: {}", amount);
    
    Ok(tx_hash)
}



