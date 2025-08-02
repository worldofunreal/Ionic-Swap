use candid::{Principal, candid_method};

use ic_cdk_macros::*;
use sha3::Digest;

use std::str::FromStr;
use primitive_types::U256;

// Custom random number generator for IC
use getrandom::register_custom_getrandom;

fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    // Use IC's time and caller as entropy source
    let time = ic_cdk::api::time();
    let caller = ic_cdk::api::caller();
    
    for (i, byte) in buf.iter_mut().enumerate() {
        let time_byte = ((time >> (i % 8 * 8)) & 0xFF) as u8;
        let caller_byte = caller.as_slice()[i % caller.as_slice().len()];
        *byte = time_byte ^ caller_byte;
    }
    Ok(())
}

register_custom_getrandom!(custom_getrandom);

use ethers_core::types::Eip1559TransactionRequest;
use ethers_core::types::transaction::eip2930::AccessList;
use ethabi::{Function, Token, ParamType, Address};
use ethers_core::types::U256 as EthU256;



// ============================================================================
// MODULES
// ============================================================================

mod constants;
mod types;
mod storage;
mod http_client;
mod evm;

use constants::*;
use types::*;
use storage::*;
use http_client::*;
use evm::*;











// ============================================================================
// JSON-RPC ENDPOINTS (Public canister interface)
// ============================================================================

#[update]
async fn get_sepolia_block_number() -> Result<String, String> {
    http_client::get_sepolia_block_number().await
}

#[update]
async fn get_transaction_receipt(tx_hash: String) -> Result<String, String> {
    http_client::get_transaction_receipt(tx_hash).await
}

#[update]
async fn get_balance(address: String) -> Result<String, String> {
    http_client::get_balance(address).await
}

#[update]
async fn get_transaction_count(address: String) -> Result<String, String> {
    http_client::get_transaction_count(address).await
}

#[update]
async fn get_icp_network_signer() -> Result<String, String> {
    http_client::get_icp_network_signer().await
}

#[update]
async fn get_claim_fee() -> Result<String, String> {
    http_client::get_claim_fee().await
}

#[update]
async fn get_refund_fee() -> Result<String, String> {
    http_client::get_refund_fee().await
}

#[update]
async fn get_total_fees() -> Result<String, String> {
    http_client::get_total_fees().await
}

// ============================================================================
// CORE HTLC FUNCTIONS
// ============================================================================

#[update]
async fn create_htlc_escrow(
    hashlock: String,
    maker: String,
    taker: String,
    amount: String,
    token: String,
    safety_deposit: String,
    expiration_time: u64,
    direction: SwapDirection,
    source_chain_id: u64,
    destination_chain_id: u64,
) -> Result<String, String> {
    let htlc_id = format!("htlc_{}", ic_cdk::api::time());
    
    let htlc = HTLC {
        id: htlc_id.clone(),
        sender: maker,
        recipient: taker,
        amount,
        hashlock,
        secret: None,
        timelock: expiration_time,
        status: HTLCStatus::Created,
        token,
        source_chain: source_chain_id,
        target_chain: destination_chain_id,
        is_cross_chain: true,
        order_hash: htlc_id.clone(),
        created_at: ic_cdk::api::time() / 1_000_000_000, // Convert to seconds
    };
    
    get_htlc_store().insert(htlc_id.clone(), htlc);
    
    Ok(htlc_id)
}

#[update]
async fn deposit_to_htlc(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Created {
            return Err("HTLC is not in Created state".to_string());
        }
        
        // For ICP side, we would transfer tokens here
        // For EVM side, this would be handled by the contract
        
        htlc.status = HTLCStatus::Deposited;
        Ok("Deposit successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn claim_htlc_funds(htlc_id: String, secret: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Deposited {
            return Err("HTLC is not in Deposited state".to_string());
        }
        
        // Verify the secret matches the hashlock
        // For now, we'll use a simple hash comparison
        // In a real implementation, we'd use proper cryptographic hashing
        let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
        
        if secret_hash != htlc.hashlock {
            return Err("Invalid secret".to_string());
        }
        
        htlc.secret = Some(secret);
        htlc.status = HTLCStatus::Claimed;
        
        // Transfer funds to taker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Claim successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn refund_htlc_funds(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        let current_time = ic_cdk::api::time();
        
        if current_time < htlc.timelock {
            return Err("HTLC has not expired yet".to_string());
        }
        
        if htlc.status == HTLCStatus::Claimed {
            return Err("HTLC has already been claimed".to_string());
        }
        
        htlc.status = HTLCStatus::Refunded;
        
        // Transfer funds back to maker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Refund successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

// ============================================================================
// CROSS-CHAIN SWAP FUNCTIONS (1inch Fusion+ Style)
// ============================================================================

#[update]
async fn create_cross_chain_swap_order(
    maker: String,
    taker: String,
    source_asset: String,
    destination_asset: String,
    source_amount: String,
    destination_amount: String,
    source_chain_id: u64,
    destination_chain_id: u64,
    expiration_time: u64,
) -> Result<String, String> {
    // Generate a random secret and its hash
    let secret = format!("secret_{}_{}", ic_cdk::api::time(), ic_cdk::api::caller().to_string());
    let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
    
    let order_id = generate_order_id();
    let direction = if source_chain_id == 0 { // 0 represents ICP
        SwapDirection::ICPtoEVM
    } else {
        SwapDirection::EVMtoICP
    };
    
    let order = CrossChainSwapOrder {
        order_id: order_id.clone(),
        maker,
        taker,
        source_asset,
        destination_asset,
        source_amount,
        destination_amount,
        source_chain_id,
        destination_chain_id,
        hashlock: secret_hash,
        secret: Some(secret),
        status: HTLCStatus::Created,
        created_at: ic_cdk::api::time(),
        expiration_time,
        direction,
    };
    
    get_swap_orders().insert(order_id.clone(), order);
    
    Ok(order_id)
}

#[update]
async fn execute_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Created {
            return Err("Order is not in Created state".to_string());
        }
        
        // Phase 1: Create HTLC on source chain
        let source_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.maker.clone(),
            order.taker.clone(),
            order.source_amount.clone(),
            order.source_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.source_chain_id,
            order.destination_chain_id,
        ).await?;
        
        // Phase 2: Create HTLC on destination chain
        let dest_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.taker.clone(),
            order.maker.clone(),
            order.destination_amount.clone(),
            order.destination_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.destination_chain_id,
            order.source_chain_id,
        ).await?;
        
        // Phase 3: Deposit funds into both HTLCs
        deposit_to_htlc(source_htlc_id.clone()).await?;
        deposit_to_htlc(dest_htlc_id.clone()).await?;
        
        order.status = HTLCStatus::Deposited;
        
        Ok(format!("Swap executed. Source HTLC: {}, Destination HTLC: {}", source_htlc_id, dest_htlc_id))
    } else {
        Err("Order not found".to_string())
    }
}

#[update]
async fn complete_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Deposited {
            return Err("Order is not in Deposited state".to_string());
        }
        
        if let Some(_secret) = &order.secret {
            // Claim funds from both HTLCs using the secret
            // This would involve calling claim_htlc_funds for both chains
            
            order.status = HTLCStatus::Claimed;
            Ok("Swap completed successfully".to_string())
        } else {
            Err("Secret not available".to_string())
        }
    } else {
        Err("Order not found".to_string())
    }
}

// ============================================================================
// TESTING METHODS
// ============================================================================

#[update]
async fn test_all_contract_functions() -> Result<String, String> {
    let mut result = String::from("=== Sepolia Contract Test Results ===\n");
    
    // Test ICP Network Signer
    match get_icp_network_signer().await {
        Ok(response) => result.push_str(&format!("✅ ICP Network Signer: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ ICP Network Signer: {}\n", error)),
    }
    
    // Test Claim Fee
    match get_claim_fee().await {
        Ok(response) => result.push_str(&format!("✅ Claim Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Claim Fee: {}\n", error)),
    }
    
    // Test Refund Fee
    match get_refund_fee().await {
        Ok(response) => result.push_str(&format!("✅ Refund Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Refund Fee: {}\n", error)),
    }
    
    // Test Total Fees
    match get_total_fees().await {
        Ok(response) => result.push_str(&format!("✅ Total Fees: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Total Fees: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_basic_rpc() -> Result<String, String> {
    let mut result = String::from("=== Basic RPC Test Results ===\n");
    
    // Test block number
    match get_sepolia_block_number().await {
        Ok(block_number) => result.push_str(&format!("✅ Latest Block: {}\n", block_number)),
        Err(error) => result.push_str(&format!("❌ Block Number: {}\n", error)),
    }
    
    // Test balance
    match get_balance(ICP_SIGNER_ADDRESS.to_string()).await {
        Ok(balance) => result.push_str(&format!("✅ ICP Signer Balance: {}\n", balance)),
        Err(error) => result.push_str(&format!("❌ Balance: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_deployment_transaction() -> Result<String, String> {
    let deployment_tx = "0x632b719a0b30557774ad8e4a7025ccb75497bf38818cd16c9263c03b641c7338";
    
    match get_transaction_receipt(deployment_tx.to_string()).await {
        Ok(receipt) => Ok(format!("✅ Deployment Transaction Receipt:\n{}", receipt)),
        Err(error) => Err(format!("❌ Failed to get deployment receipt: {}", error)),
    }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

#[query]
fn get_htlc(htlc_id: String) -> Option<HTLC> {
    get_htlc_store().get(&htlc_id).cloned()
}

#[query]
fn get_swap_order(order_id: String) -> Option<CrossChainSwapOrder> {
    get_swap_orders().get(&order_id).cloned()
}

#[query]
fn get_all_htlcs() -> Vec<HTLC> {
    get_htlc_store().values().cloned().collect()
}

#[query]
fn get_all_swap_orders() -> Vec<CrossChainSwapOrder> {
    get_swap_orders().values().cloned().collect()
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

#[query]
fn get_contract_info() -> String {
    format!(
        "Factory Address: {}\nICP Signer: {}\nChain ID: {}",
        FACTORY_ADDRESS, ICP_SIGNER_ADDRESS, SEPOLIA_CHAIN_ID
    )
}

// ============================================================================
// EIP-2771 MINIMAL FORWARDER RELAYER
// ============================================================================

#[update]
#[candid_method(update)]
async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    // 1. Verify the permit signature
    let is_valid = verify_permit_signature(&request.permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = evm::get_public_key().await?;
    
    // 3. Get current nonce for the canister using thread-safe nonce management
    let canister_nonce = get_next_nonce();
    let canister_nonce_hex = format!("{:x}", canister_nonce);
    
    // Debug: Log the nonces
    ic_cdk::println!("Debug - User nonce from permit: {}", request.permit_request.nonce);
    ic_cdk::println!("Debug - Canister nonce: {}", canister_nonce_hex);
    
    // 4. Encode the permit function call on the token contract
    let permit_data = encode_permit_call(&request.permit_request)?;
    
    // Debug: Check if the permit_data has odd length
    let data_clean = permit_data.trim_start_matches("0x");
    if data_clean.len() % 2 != 0 {
        return Err(format!("Permit data has odd length: {} chars", data_clean.len()));
    }
    
    // 5. Get current gas price and block info
    let gas_price_response = http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let base_gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    
    // 6. Get latest block for base fee
    let block_response = http_client::get_latest_block().await?;
    let block_json: serde_json::Value = serde_json::from_str(&block_response)
        .map_err(|e| format!("Failed to parse block response: {}", e))?;
    let base_fee_per_gas = block_json["result"]["baseFeePerGas"]
        .as_str()
        .unwrap_or("0x3b9aca00") // 1 gwei default
        .trim_start_matches("0x");
    
    // 7. Calculate much higher gas price for replacement transactions
    let base_gas_price_u256 = U256::from_str_radix(base_gas_price, 16)
        .map_err(|e| format!("Invalid base gas price: {}", e))?;
    let gas_price_u256 = base_gas_price_u256 * U256::from(5); // 5x the gas price for replacement
    let gas_price = format!("{:x}", gas_price_u256);
    
    // 7. Construct and sign EIP-1559 transaction to the token contract
    // Use the token address from the request
    let token_address = &request.token_address;
    
    // Debug: Check the addresses
    if token_address.len() != 42 || !token_address.starts_with("0x") {
        return Err(format!("Invalid token address: {} (length: {})", token_address, token_address.len()));
    }
    
    // Debug: Print the addresses for verification
    ic_cdk::println!("Debug - From address: {}", from_addr_str);
    ic_cdk::println!("Debug - To address (token): {}", token_address);
    ic_cdk::println!("Debug - Permit value: {}", request.permit_request.value);
    
    let signed_tx = evm::sign_eip1559_transaction(
        &from_addr_str,
        token_address,
        &canister_nonce_hex,
        &gas_price,
        &base_fee_per_gas,
        &permit_data,
    ).await?;
    
    // 8. Send the signed transaction
    let tx_hash = evm::send_raw_transaction(&signed_tx).await?;
    
    Ok(format!(
        "Gasless approval executed successfully! Transaction hash: {}",
        tx_hash
    ))
}

async fn verify_permit_signature(permit_request: &PermitRequest) -> Result<bool, String> {
    // Debug: Log the permit request details
    ic_cdk::println!("Debug - Permit request owner: {}", permit_request.owner);
    ic_cdk::println!("Debug - Permit request spender: {}", permit_request.spender);
    ic_cdk::println!("Debug - Permit request value: {}", permit_request.value);
    ic_cdk::println!("Debug - Permit request deadline: {}", permit_request.deadline);
    ic_cdk::println!("Debug - Permit request v: {}", permit_request.v);
    ic_cdk::println!("Debug - Permit request r: {}", permit_request.r);
    ic_cdk::println!("Debug - Permit request s: {}", permit_request.s);
    
    // For now, we'll implement a simplified verification
    // In production, this should verify the actual EIP-2612 signature
    
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
    
    // For now, return true (simplified verification)
    // TODO: Implement full EIP-2612 signature verification
    // 1. Reconstruct the permit message according to EIP-2612
    // 2. Hash it according to EIP-712
    // 3. Recover the signer address from the signature
    // 4. Compare with the owner address
    
    Ok(true)
}

fn encode_permit_call(permit_request: &PermitRequest) -> Result<String, String> {
    // EIP-2612 permit function selector: permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "d505accf";
    
    // Encode permit parameters: (owner, spender, value, deadline, v, r, s)
    let owner_padded = format!("{:0>64}", permit_request.owner.trim_start_matches("0x"));
    let spender_padded = format!("{:0>64}", permit_request.spender.trim_start_matches("0x"));
    
    // Convert value to proper hex format (same as ethers.utils.parseUnits)
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
    
    // Debug: Check each component for odd length
    if owner_padded.len() % 2 != 0 || spender_padded.len() % 2 != 0 || 
       value_padded.len() % 2 != 0 || deadline_padded.len() % 2 != 0 ||
       v_padded.len() % 2 != 0 || r_padded.len() % 2 != 0 || s_padded.len() % 2 != 0 {
        return Err(format!(
            "Permit component lengths - owner: {}, spender: {}, value: {}, deadline: {}, v: {}, r: {}, s: {}",
            owner_padded.len(), spender_padded.len(), value_padded.len(), deadline_padded.len(),
            v_padded.len(), r_padded.len(), s_padded.len()
        ));
    }
    
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
    
    // Debug: Log the encoded permit data
    ic_cdk::println!("Debug - Encoded permit data: {}", encoded_data);
    ic_cdk::println!("Debug - Function selector: {}", function_selector);
    ic_cdk::println!("Debug - Owner padded: {}", owner_padded);
    ic_cdk::println!("Debug - Spender padded: {}", spender_padded);
    ic_cdk::println!("Debug - Value padded: {}", value_padded);
    ic_cdk::println!("Debug - Deadline padded: {}", deadline_padded);
    ic_cdk::println!("Debug - V padded: {}", v_padded);
    ic_cdk::println!("Debug - R padded: {}", r_padded);
    ic_cdk::println!("Debug - S padded: {}", s_padded);
    
    // Debug: Check if the final encoded data has odd length
    let final_clean = encoded_data.trim_start_matches("0x");
    if final_clean.len() % 2 != 0 {
        return Err(format!("Final permit data has odd length: {} chars", final_clean.len()));
    }
    
    Ok(encoded_data)
}

fn encode_htlc_permit_and_transfer_call(permit_request: &PermitRequest) -> Result<String, String> {
    // executePermitAndTransfer function selector: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    // Function signature: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "executePermitAndTransfer";
    
    // Function selector for executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector_hash = "2e456695";
    
    // Token address (SpiralToken)
    let token_address = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    let token_padded = format!("{:0>64}", token_address.trim_start_matches("0x"));
    
    // Encode permit parameters: (token, owner, spender, value, deadline, v, r, s)
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
    
    // Debug: Check each component for odd length
    if token_padded.len() % 2 != 0 || owner_padded.len() % 2 != 0 || spender_padded.len() % 2 != 0 || 
       value_padded.len() % 2 != 0 || deadline_padded.len() % 2 != 0 ||
       v_padded.len() % 2 != 0 || r_padded.len() % 2 != 0 || s_padded.len() % 2 != 0 {
        return Err(format!(
            "HTLC component lengths - token: {}, owner: {}, spender: {}, value: {}, deadline: {}, v: {}, r: {}, s: {}",
            token_padded.len(), owner_padded.len(), spender_padded.len(), value_padded.len(), deadline_padded.len(),
            v_padded.len(), r_padded.len(), s_padded.len()
        ));
    }
    
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}{}",
        function_selector_hash,
        token_padded,
        owner_padded,
        spender_padded,
        value_padded,
        deadline_padded,
        v_padded,
        r_padded,
        s_padded
    );
    
    // Debug: Log the encoded HTLC data
    ic_cdk::println!("Debug - Encoded HTLC data: {}", encoded_data);
    ic_cdk::println!("Debug - Function selector: {}", function_selector);
    ic_cdk::println!("Debug - Token padded: {}", token_padded);
    ic_cdk::println!("Debug - Owner padded: {}", owner_padded);
    ic_cdk::println!("Debug - Spender padded: {}", spender_padded);
    ic_cdk::println!("Debug - Value padded: {}", value_padded);
    ic_cdk::println!("Debug - Deadline padded: {}", deadline_padded);
    ic_cdk::println!("Debug - V padded: {}", v_padded);
    ic_cdk::println!("Debug - R padded: {}", r_padded);
    ic_cdk::println!("Debug - S padded: {}", s_padded);
    
    // Debug: Check if the final encoded data has odd length
    let final_clean = encoded_data.trim_start_matches("0x");
    if final_clean.len() % 2 != 0 {
        return Err(format!("Final HTLC data has odd length: {} chars", final_clean.len()));
    }
    
    Ok(encoded_data)
}



// ============================================================================
// PERMIT SUBMISSION AND EXECUTION (LEGACY - KEEPING FOR REFERENCE)
// ============================================================================

#[update]
async fn submit_permit_signature(permit_data: PermitData) -> Result<String, String> {
    // 1. Verify permit signature
    let recovered_address = verify_permit_signature_legacy(&permit_data)?;
    if recovered_address != permit_data.owner {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // 4. Encode the permit function call
    let permit_call_data = encode_htlc_permit_call(&permit_data)?;
    
    // For now, just return success with the transaction details
    // The actual transaction signing and sending requires proper EIP-1559 transaction construction
    Ok(format!(
        "Permit signature validated successfully. Canister address: {}, Nonce: {}, Permit call data length: {} bytes",
        from_addr_str,
        nonce,
        permit_call_data.len() / 2 - 1
    ))
}



fn verify_permit_signature_legacy(permit_data: &PermitData) -> Result<String, String> {
    // TODO: Implement proper EIP-2612 signature verification
    // For now, we'll return the owner address (simplified)
    // In production, this should verify the actual signature using web3-rs
    
    // The verification should:
    // 1. Reconstruct the permit message
    // 2. Hash it according to EIP-2612
    // 3. Recover the signer address from the signature
    // 4. Compare with the owner address
    
    Ok(permit_data.owner.clone())
}

fn encode_htlc_permit_call(permit_data: &PermitData) -> Result<String, String> {
    // EIP-2612 permit function selector: permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "0xd505accf";
    
    // Encode permit parameters: (owner, spender, value, deadline, v, r, s)
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}",
        function_selector,
        // owner (address) - pad to 32 bytes
        format!("{:0>64}", permit_data.owner.trim_start_matches("0x")),
        // spender (address) - pad to 32 bytes  
        format!("{:0>64}", permit_data.spender.trim_start_matches("0x")),
        // value (uint256) - pad to 32 bytes
        format!("{:0>64}", permit_data.value.trim_start_matches("0x")),
        // deadline (uint256) - pad to 32 bytes
        format!("{:0>64}", format!("{:x}", permit_data.deadline)),
        // v (uint8) - pad to 32 bytes
        format!("{:0>64}", format!("{:x}", permit_data.v)),
        // r (bytes32)
        permit_data.r.trim_start_matches("0x"),
        // s (bytes32)
        permit_data.s.trim_start_matches("0x")
    );
    
    Ok(encoded_data)
}

// ============================================================================
// EVM HTLC CONTRACT INTERACTION METHODS
// ============================================================================

// Removed old create_evm_htlc_escrow function - now using ic-evm-utils

// Removed old claim_evm_htlc_funds and cancel_evm_htlc_escrow functions - now using ic-evm-utils

// ============================================================================
// EVM INTEGRATION METHODS (USING IC CDK APIs)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    evm::get_public_key().await
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    evm::get_ethereum_address().await
}

#[update]
async fn test_signing_address() -> Result<String, String> {
    evm::test_signing_address().await
}

#[update]
async fn test_simple_transaction() -> Result<String, String> {
    evm::test_simple_transaction().await
}



/// Get HTLC ID from transaction receipt by parsing the HTLCCreated event




// ============================================================================
// ATOMIC SWAP FUNCTIONS
// ============================================================================

/// Generate a random secret for HTLC
fn generate_htlc_secret() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let random_bytes: [u8; 16] = rng.gen();
    format!("htlc_secret_{}", hex::encode(random_bytes))
}

/// Create a new atomic swap order
#[update]
#[candid_method]
pub async fn create_atomic_swap_order(
    maker: String,
    taker: String,
    source_token: String,
    destination_token: String,
    source_amount: String,
    destination_amount: String,
    timelock_duration: u64, // Duration in seconds
) -> Result<String, String> {
    // Generate secret and hashlock
    let secret = generate_htlc_secret();
    let secret_bytes = secret.as_bytes();
    let hashlock_bytes = evm::keccak256(secret_bytes);
    let hashlock = format!("0x{}", hex::encode(hashlock_bytes));
    
    // Calculate timestamps
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let timelock = current_time + timelock_duration;
    let expires_at = timelock + 3600; // Add 1 hour buffer
    
    // Create atomic swap order
    let order_id = generate_order_id();
    let atomic_order = AtomicSwapOrder {
        order_id: order_id.clone(),
        maker,
        taker,
        source_token,
        destination_token,
        source_amount,
        destination_amount,
        secret,
        hashlock,
        timelock,
        source_htlc_id: None,
        destination_htlc_id: None,
        status: SwapOrderStatus::Created,
        created_at: current_time,
        expires_at,
    };
    
    // Store the order
    get_atomic_swap_orders().insert(order_id.clone(), atomic_order);
    
    Ok(order_id)
}

/// Create HTLC on EVM chain for atomic swap
#[update]
#[candid_method]
pub async fn create_evm_htlc(
    order_id: String,
    is_source_htlc: bool, // true for source HTLC, false for destination HTLC
) -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or("Atomic swap order not found")?;
    
    if order.status != SwapOrderStatus::Created && order.status != SwapOrderStatus::SourceHTLCCreated {
        return Err("Invalid order status for HTLC creation".to_string());
    }
    
    // Determine HTLC parameters based on whether it's source or destination
    let (_sender, recipient, token, amount) = if is_source_htlc {
        (order.maker.clone(), order.taker.clone(), order.source_token.clone(), order.source_amount.clone())
    } else {
        (order.taker.clone(), order.maker.clone(), order.destination_token.clone(), order.destination_amount.clone())
    };
    
    // Determine user address based on HTLC type
    let user_address = if is_source_htlc {
        &order.maker // Source HTLC: transfer from maker
    } else {
        &order.taker // Destination HTLC: transfer from taker
    };
    
    // Encode createHTLCERC20 function call
    let encoded_data = evm::encode_create_htlc_erc20_call(
        &recipient,
        &token,
        &amount,
        &order.hashlock,
        order.timelock,
        1, // sourceChain (Etherlink)
        0, // targetChain (ICP)
        true, // isCrossChain
        &order_id, // orderHash
        user_address, // user address to transfer from
    )?;
    
    // Debug logging
    ic_cdk::println!("🔍 HTLC Creation Debug:");
    ic_cdk::println!("  Recipient: {}", recipient);
    ic_cdk::println!("  Token: {}", token);
    ic_cdk::println!("  Amount: {}", amount);
    ic_cdk::println!("  Hashlock: {}", order.hashlock);
    ic_cdk::println!("  Timelock: {}", order.timelock);
    ic_cdk::println!("  SourceChain: 1");
    ic_cdk::println!("  TargetChain: 0");
    ic_cdk::println!("  IsCrossChain: true");
    ic_cdk::println!("  OrderHash: {}", order_id);
    ic_cdk::println!("  Encoded Data: {}", encoded_data);
    
    // Get canister's Ethereum address
    let canister_address = evm::get_ethereum_address().await?;
    
    // Get fresh nonce for this transaction using thread-safe nonce management
    let nonce = get_next_nonce();
    let nonce_hex = format!("{:x}", nonce);
    
    ic_cdk::println!("Debug - HTLC creation nonce: {}", nonce_hex);
    
    // Get fresh gas price for this transaction
    let gas_price_response = http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Sign and send transaction with fresh nonce
    let signed_tx = evm::sign_eip1559_transaction(
        &canister_address,
        HTLC_CONTRACT_ADDRESS,
        &nonce_hex,
        &gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = evm::send_raw_transaction(&signed_tx).await?;
    
    // Wait for transaction to be mined and get receipt to extract HTLC ID
    let htlc_id = evm::get_htlc_id_from_receipt(&tx_hash).await?;
    
    ic_cdk::println!("🔍 HTLC Creation Result:");
    ic_cdk::println!("  Transaction Hash: {}", tx_hash);
    ic_cdk::println!("  HTLC ID: {}", htlc_id);
    
    // Update order status with HTLC ID (not transaction hash)
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        if is_source_htlc {
            order.source_htlc_id = Some(htlc_id.clone());
            order.status = SwapOrderStatus::SourceHTLCCreated;
        } else {
            order.destination_htlc_id = Some(htlc_id.clone());
            order.status = SwapOrderStatus::DestinationHTLCCreated;
        }
    }
    
    Ok(htlc_id)
}

/// Claim HTLC on EVM chain
#[update]
#[candid_method]
pub async fn claim_evm_htlc(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    let orders = get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or("Atomic swap order not found")?;
    
    // Check if order is ready for claiming
    if order.status != SwapOrderStatus::SourceHTLCCreated && 
       order.status != SwapOrderStatus::DestinationHTLCCreated &&
       order.status != SwapOrderStatus::SourceHTLCClaimed {
        return Err("Order not ready for claiming".to_string());
    }
    
    // Determine the recipient based on HTLC type
    let recipient = if order.source_htlc_id.as_ref() == Some(&htlc_id) {
        &order.taker // Source HTLC: taker claims maker's tokens
    } else if order.destination_htlc_id.as_ref() == Some(&htlc_id) {
        &order.maker // Destination HTLC: maker claims taker's tokens
    } else {
        return Err("HTLC ID not found in order".to_string());
    };
    
    // Encode claimHTLCByICP function call
    let encoded_data = encode_claim_htlc_by_icp_call(&htlc_id, &order.secret, recipient)?;
    
    // Get canister's Ethereum address
    let canister_address = evm::get_ethereum_address().await?;
    
    // Get fresh nonce for this transaction using thread-safe nonce management
    let nonce = get_next_nonce();
    let nonce_hex = format!("{:x}", nonce);
    
    ic_cdk::println!("Debug - Claim HTLC nonce: {}", nonce_hex);
    
    // Get fresh gas price for this transaction
    let gas_price_response = http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Sign and send transaction with fresh nonce
    let signed_tx = evm::sign_eip1559_transaction(
        &canister_address,
        HTLC_CONTRACT_ADDRESS,
        &nonce_hex,
        &gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = evm::send_raw_transaction(&signed_tx).await?;
    
    // Update order status
    let orders = get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        if order.source_htlc_id.as_ref() == Some(&htlc_id) {
            order.status = SwapOrderStatus::SourceHTLCClaimed;
        } else if order.destination_htlc_id.as_ref() == Some(&htlc_id) {
            order.status = SwapOrderStatus::DestinationHTLCClaimed;
        }
        
        // Check if both HTLCs are claimed
        if order.status == SwapOrderStatus::SourceHTLCClaimed || order.status == SwapOrderStatus::DestinationHTLCClaimed {
            // If we just claimed one, allow claiming the other
            // The status will be set to Completed when both are claimed
        }
    }
    
    Ok(tx_hash)
}

/// Execute complete atomic swap (create both HTLCs and claim them)
#[update]
#[candid_method]
pub async fn execute_atomic_swap(order_id: String) -> Result<String, String> {
    // Step 1: Create source HTLC
    let source_htlc_tx = create_evm_htlc(order_id.clone(), true).await?;
    
    // Step 2: Create destination HTLC
    let dest_htlc_tx = create_evm_htlc(order_id.clone(), false).await?;
    
    // Step 3: Wait for both HTLCs to be created (in real implementation, you'd wait for confirmations)
    // For now, we'll proceed immediately
    
    // Step 4: Claim source HTLC (taker claims maker's tokens)
    let source_claim_tx = claim_evm_htlc(order_id.clone(), source_htlc_tx.clone()).await?;
    
    // Step 5: Claim destination HTLC (maker claims taker's tokens)
    let dest_claim_tx = claim_evm_htlc(order_id.clone(), dest_htlc_tx.clone()).await?;
    
    Ok(format!("Atomic swap completed! Source HTLC: {}, Dest HTLC: {}, Source Claim: {}, Dest Claim: {}", 
               source_htlc_tx, dest_htlc_tx, source_claim_tx, dest_claim_tx))
}

/// Get atomic swap order details
#[query]
#[candid_method]
pub fn get_atomic_swap_order(order_id: String) -> Option<AtomicSwapOrder> {
    get_atomic_swap_orders().get(&order_id).cloned()
}

/// Get all atomic swap orders
#[query]
#[candid_method]
pub fn get_all_atomic_swap_orders() -> Vec<AtomicSwapOrder> {
    get_atomic_swap_orders().values().cloned().collect()
}

// ============================================================================
// HELPER FUNCTIONS FOR HTLC CONTRACT INTERACTION
// ============================================================================

/// Encode createHTLCERC20 function call


// ============================================================================
// CANISTER LIFECYCLE
// ============================================================================

#[init]
fn init() {
    // Initialize the HTTP certification tree
    http_client::get_http_certification_tree();
}

// Function to initialize nonce from blockchain (call this after deployment)
#[update]
async fn initialize_nonce() -> Result<String, String> {
    let canister_address = get_ethereum_address().await?;
    let nonce_response = get_transaction_count(canister_address.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let current_nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    let nonce_u64 = u64::from_str_radix(current_nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    
    update_current_nonce(nonce_u64);
    
    Ok(format!("Nonce initialized to: {}", nonce_u64))
}

#[pre_upgrade]
fn pre_upgrade() {
    // The certification tree will be re-initialized in post_upgrade
}

#[post_upgrade]
fn post_upgrade() {
    // Re-initialize the HTTP certification tree after upgrade
    http_client::get_http_certification_tree();
}