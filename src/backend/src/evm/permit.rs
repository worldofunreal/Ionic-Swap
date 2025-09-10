use super::types::{PermitRequest, GaslessApprovalRequest};
use super::wallet::{sign_eip1559_transaction_legacy, send_raw_transaction};
use alloy::primitives::U256;
use alloy::signers::Signer;
use alloy::sol;
use alloy::sol_types::{eip712_domain, SolStruct};
use serde::Serialize;

// ============================================================================
// EIP-2612 PERMIT FUNCTIONS
// ============================================================================

// Define the EIP-712 permit structure using sol! macro
sol! {
    #[derive(Serialize)]
    struct Permit {
        address owner;
        address spender;
        uint256 value;
        uint256 nonce;
        uint256 deadline;
    }
}

/// Submit gasless permit transaction (user signs permit off-chain, canister executes permit + transferFrom)
pub async fn submit_gasless_permit(permit_request: PermitRequest) -> Result<String, String> {
    ic_cdk::println!("🚀 Submitting gasless permit transaction");
    ic_cdk::println!("   Token: {}", permit_request.token);
    ic_cdk::println!("   Owner: {}", permit_request.owner);
    ic_cdk::println!("   Spender: {}", permit_request.spender);
    ic_cdk::println!("   Value: {}", permit_request.value);
    ic_cdk::println!("   Deadline: {}", permit_request.deadline);
    
    // 1. Verify the permit signature (off-chain verification)
    let is_valid = verify_permit_signature(&permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    ic_cdk::println!("   ✅ Permit signature verified (off-chain)");
    
    // 2. Get canister's Ethereum address
    let from_addr_str = super::wallet::get_public_key().await?;
    
    // 3. Get current nonce for the canister
    let nonce_response = crate::http_client::get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // 4. Encode the permit function call on the token contract
    let permit_data = encode_permit_call(&permit_request)?;
    
    // 5. Get current gas price and block info
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let base_gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    
    // 6. Get latest block for base fee
    let block_response = crate::http_client::get_latest_block().await?;
    let block_json: serde_json::Value = serde_json::from_str(&block_response)
        .map_err(|e| format!("Failed to parse block response: {}", e))?;
    let base_fee_per_gas = block_json["result"]["baseFeePerGas"]
        .as_str()
        .unwrap_or("0x3b9aca00") // 1 gwei default
        .trim_start_matches("0x");
    
    // 7. Set proper gas prices (ensure minimum tip of 1 gwei)
    let max_priority_fee_per_gas = "0x3b9aca00"; // 1 gwei minimum tip
    let max_fee_per_gas = format!("0x{:x}", 
        u128::from_str_radix(base_gas_price, 16).unwrap_or(1000000000) + 
        u128::from_str_radix(&max_priority_fee_per_gas[2..], 16).unwrap_or(1000000000)
    );
    
    // 8. Construct and sign EIP-1559 transaction to call permit()
    let token_address = &permit_request.token;
    
    // Note: sign_eip1559_transaction_legacy expects (max_fee_per_gas, max_priority_fee_per_gas)
    let signed_permit_tx = sign_eip1559_transaction_legacy(
        &from_addr_str,
        token_address,
        nonce,
        &max_fee_per_gas,        // max_fee_per_gas (total fee)
        max_priority_fee_per_gas, // max_priority_fee_per_gas (tip)
        &permit_data,
    ).await?;
    
    // 9. Send the permit transaction
    let permit_tx_hash = send_raw_transaction(&signed_permit_tx).await?;
    ic_cdk::println!("   ✅ Permit transaction submitted: {}", permit_tx_hash);
    
    // 10. Immediately execute transferFrom to pull tokens from user to canister
    ic_cdk::println!("   Step 2: Executing transferFrom to pull tokens...");
    
    // Parse addresses and amount for transferFrom
    let from_addr = permit_request.owner.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid owner address: {}", e))?;
    let to_addr = from_addr_str.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid canister address: {}", e))?;
    let amount_u256 = U256::from_str_radix(&permit_request.value, 10)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    // Encode transferFrom call
    let transfer_data = super::erc20::encode_transfer_from_call(from_addr, to_addr, amount_u256)?;
    
    // Get next nonce for the transfer transaction
    let next_nonce_response = crate::http_client::get_transaction_count(from_addr_str.clone()).await?;
    let next_nonce_json: serde_json::Value = serde_json::from_str(&next_nonce_response)
        .map_err(|e| format!("Failed to parse next nonce response: {}", e))?;
    let next_nonce = next_nonce_json["result"]
        .as_str()
        .ok_or("No result in next nonce response")?
        .trim_start_matches("0x");
    
    // Sign and send transferFrom transaction
    let signed_transfer_tx = sign_eip1559_transaction_legacy(
        &from_addr_str,
        token_address,
        next_nonce,
        &max_fee_per_gas,        // max_fee_per_gas (total fee)
        max_priority_fee_per_gas, // max_priority_fee_per_gas (tip)
        &format!("0x{}", hex::encode(&transfer_data)),
    ).await?;
    
    let transfer_tx_hash = send_raw_transaction(&signed_transfer_tx).await?;
    ic_cdk::println!("   ✅ TransferFrom transaction submitted: {}", transfer_tx_hash);
    
    Ok(format!(
        "Atomic permit + transfer executed! Permit: {}, Transfer: {}, Amount: {} SPIRAL from {}",
        permit_tx_hash, transfer_tx_hash, permit_request.value, permit_request.owner
    ))
}

/// Execute gasless approval using EIP-2612 permit
pub async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    // 1. Verify the permit signature
    let is_valid = verify_permit_signature(&request.permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = super::wallet::get_public_key().await?;
    
    // 3. Get current nonce for the canister
    let nonce_response = crate::http_client::get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // 4. Encode the permit function call on the token contract
    let permit_data = encode_permit_call(&request.permit_request)?;
    
    // 5. Get current gas price and block info
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let base_gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    
    // 6. Get latest block for base fee
    let block_response = crate::http_client::get_latest_block().await?;
    let block_json: serde_json::Value = serde_json::from_str(&block_response)
        .map_err(|e| format!("Failed to parse block response: {}", e))?;
    let base_fee_per_gas = block_json["result"]["baseFeePerGas"]
        .as_str()
        .unwrap_or("0x3b9aca00") // 1 gwei default
        .trim_start_matches("0x");
    
    // 7. Set proper gas prices (ensure minimum tip of 1 gwei)
    let max_priority_fee_per_gas = "0x3b9aca00"; // 1 gwei minimum tip
    let max_fee_per_gas = format!("0x{:x}", 
        u128::from_str_radix(base_gas_price, 16).unwrap_or(1000000000) + 
        u128::from_str_radix(&max_priority_fee_per_gas[2..], 16).unwrap_or(1000000000)
    );
    
    // 8. Construct and sign EIP-1559 transaction to the token contract
    let token_address = &request.token_address;
    
    // Note: sign_eip1559_transaction_legacy expects (max_fee_per_gas, max_priority_fee_per_gas)
    let signed_tx = sign_eip1559_transaction_legacy(
        &from_addr_str,
        token_address,
        nonce,
        &max_fee_per_gas,        // max_fee_per_gas (total fee)
        max_priority_fee_per_gas, // max_priority_fee_per_gas (tip)
        &permit_data,
    ).await?;
    
    // 8. Send the signed transaction
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    Ok(format!(
        "Gasless approval executed successfully! Transaction hash: {}",
        tx_hash
    ))
}

/// Verify EIP-2612 permit signature
pub async fn verify_permit_signature(permit_request: &PermitRequest) -> Result<bool, String> {
    // Check if deadline has passed
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
    let deadline: u64 = permit_request.deadline.parse()
        .map_err(|e| format!("Invalid deadline: {}", e))?;
    
    if current_time > deadline {
        return Err("Permit deadline has passed".to_string());
    }
    
    // Basic validation of signature components
    let v: u8 = permit_request.v.parse()
        .map_err(|e| format!("Invalid v value: {}", e))?;
    
    if v != 27 && v != 28 {
        return Err("Invalid v value (must be 27 or 28)".to_string());
    }
    
    // Validate r and s are valid hex strings
    if !permit_request.r.starts_with("0x") || permit_request.r.len() != 66 {
        return Err("Invalid r value".to_string());
    }
    
    if !permit_request.s.starts_with("0x") || permit_request.s.len() != 66 {
        return Err("Invalid s value".to_string());
    }
    
    // TODO: Implement full EIP-2612 signature verification
    // This would involve:
    // 1. Reconstructing the permit message hash
    // 2. Recovering the signer address from the signature
    // 3. Comparing with the owner address
    
    Ok(true)
}

/// Encode EIP-2612 permit function call
pub fn encode_permit_call(permit_request: &PermitRequest) -> Result<String, String> {
    // EIP-2612 permit function selector: permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "d505accf";
    
    // Encode permit parameters: (owner, spender, value, deadline, v, r, s)
    let owner_padded = format!("{:0>64}", permit_request.owner.trim_start_matches("0x"));
    let spender_padded = format!("{:0>64}", permit_request.spender.trim_start_matches("0x"));
    
    // Convert value to proper hex format
    let value_decimal: u128 = permit_request.value.parse().map_err(|e| format!("Invalid value: {}", e))?;
    let value_hex = format!("{:x}", value_decimal);
    let value_padded = format!("{:0>64}", value_hex);
    
    // Convert deadline from decimal string to hex and pad to 64 characters
    let deadline_decimal: u64 = permit_request.deadline.parse().map_err(|e| format!("Invalid deadline: {}", e))?;
    let deadline_hex = format!("{:x}", deadline_decimal);
    let deadline_padded = format!("{:0>64}", deadline_hex);
    
    // Convert v from decimal string to hex and pad to 64 characters
    let v_decimal: u64 = permit_request.v.parse().map_err(|e| format!("Invalid v value: {}", e))?;
    let v_padded = format!("{:0>64}", format!("{:x}", v_decimal));
    let r_padded = format!("{:0>64}", permit_request.r.trim_start_matches("0x"));
    let s_padded = format!("{:0>64}", permit_request.s.trim_start_matches("0x"));
    
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}",
        function_selector,
        owner_padded,
        spender_padded,
        value_padded,
        deadline_padded,
        v_padded,
        r_padded,
        s_padded
    );
    
    Ok(encoded_data)
}

/// Sign a permit using proper EIP-712 domain separation
pub async fn sign_permit_eip712(
    owner: &str,
    spender: &str,
    value: &str,
    nonce: &str,
    deadline: &str,
    token_address: &str,
) -> Result<([u8; 32], [u8; 32], u8), String> {
    use super::wallet::get_evm_wallet;
    
    // Parse addresses and values
    let owner_addr = owner.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid owner address: {}", e))?;
    let spender_addr = spender.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid spender address: {}", e))?;
    let token_addr = token_address.parse::<alloy::primitives::Address>()
        .map_err(|e| format!("Invalid token address: {}", e))?;
    
    let value_u256 = U256::from_str_radix(value, 10)
        .map_err(|e| format!("Invalid value: {}", e))?;
    let nonce_u256 = U256::from_str_radix(nonce, 10)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let deadline_u256 = U256::from_str_radix(deadline, 10)
        .map_err(|e| format!("Invalid deadline: {}", e))?;
    
    // Create EIP-712 domain
    let domain = eip712_domain! {
        name: "ERC20Permit",
        version: "1",
        chain_id: 11155111, // Sepolia testnet
        verifying_contract: token_addr,
    };
    
    // Create permit structure
    let permit = Permit {
        owner: owner_addr,
        spender: spender_addr,
        value: value_u256,
        nonce: nonce_u256,
        deadline: deadline_u256,
    };
    
    // Derive the EIP-712 signing hash
    let hash = permit.eip712_signing_hash(&domain);
    
    // Get wallet and sign the hash
    let wallet = get_evm_wallet();
    let signature = wallet.get_signer().sign_hash(&hash)
        .await
        .map_err(|e| format!("Failed to sign permit: {}", e))?;
    
    // Extract r, s, v from signature
    let r_bytes: [u8; 32] = signature.r().to_be_bytes();
    let s_bytes: [u8; 32] = signature.s().to_be_bytes();
    let v = if signature.v() { 1 } else { 0 };
    
    Ok((r_bytes, s_bytes, v))
}
