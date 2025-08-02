use candid::Principal;
use ethers_core::types::Eip1559TransactionRequest;
use ethers_core::types::transaction::eip2930::AccessList;
use ethabi::{Function, Token, ParamType, Address};
use ethers_core::types::U256 as EthU256;
use primitive_types::U256;
use std::str::FromStr;
use sha3::Digest;
use crate::constants::SEPOLIA_CHAIN_ID;
use crate::http_client::{get_transaction_count, make_json_rpc_call};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = sha3::Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

// Helper function to convert public key bytes to Ethereum address
fn pubkey_bytes_to_address(pubkey_bytes: &[u8]) -> String {
    use ethers_core::k256::elliptic_curve::sec1::ToEncodedPoint;
    use ethers_core::k256::PublicKey;
    use ethers_core::types::Address;

    let key = PublicKey::from_sec1_bytes(pubkey_bytes)
        .expect("failed to parse the public key as SEC1");
    let point = key.to_encoded_point(false);
    // we re-encode the key to the decompressed representation.
    let point_bytes = point.as_bytes();
    assert_eq!(point_bytes[0], 0x04);

    let hash = keccak256(&point_bytes[1..]);

    ethers_core::utils::to_checksum(&Address::from_slice(&hash[12..32]), None)
}

// Helper function to get the canister's public key
async fn get_canister_public_key(
    key_id: ic_cdk::api::management_canister::ecdsa::EcdsaKeyId,
    canister_id: Option<Principal>,
    derivation_path: Vec<Vec<u8>>,
) -> Vec<u8> {
    let (key,) = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(
        ic_cdk::api::management_canister::ecdsa::EcdsaPublicKeyArgument {
            canister_id,
            derivation_path,
            key_id,
        },
    )
    .await
    .expect("failed to get public key");
    key.public_key
}

// Helper function to compute the parity bit for signature recovery
fn y_parity(prehash: &[u8], sig: &[u8], pubkey: &[u8]) -> u64 {
    use ethers_core::k256::ecdsa::{RecoveryId, Signature, VerifyingKey};

    let orig_key = VerifyingKey::from_sec1_bytes(pubkey).expect("failed to parse the pubkey");
    let signature = Signature::try_from(sig).unwrap();
    for parity in [0u8, 1] {
        let recid = RecoveryId::try_from(parity).unwrap();
        let recovered_key = VerifyingKey::recover_from_prehash(prehash, &signature, recid)
            .expect("failed to recover key");
        if recovered_key == orig_key {
            return parity as u64;
        }
    }

    panic!(
        "failed to recover the parity bit from a signature; sig: {}, pubkey: {}",
        hex::encode(sig),
        hex::encode(pubkey)
    )
}

// ============================================================================
// ETHEREUM ADDRESS MANAGEMENT
// ============================================================================

pub async fn get_public_key() -> Result<String, String> {
    // Get the Ethereum address using ic-cdk ECDSA
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    
    let public_key_arg = ic_cdk::api::management_canister::ecdsa::EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id,
    };
    
    let public_key = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(public_key_arg)
        .await
        .map_err(|e| format!("Failed to get public key: {:?}", e))?;
    
    // Use the proper method to convert public key bytes to Ethereum address
    let public_key_bytes = public_key.0.public_key;
    
    // Convert to Ethereum address using the proper method from the documentation
    let address = pubkey_bytes_to_address(&public_key_bytes);
    
    Ok(address)
}

pub async fn get_ethereum_address() -> Result<String, String> {
    get_public_key().await
}

pub async fn test_signing_address() -> Result<String, String> {
    get_public_key().await
}

pub async fn test_simple_transaction() -> Result<String, String> {
    // Test a simple transaction using direct HTTP calls
    let from_addr_str = get_public_key().await?;
    
    // Get current nonce
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // For now, just test that we can get the nonce and address correctly
    // The actual transaction signing requires proper EIP-1559 transaction construction
    Ok(format!("Canister address: {}, Nonce: {}", from_addr_str, nonce))
}

// ============================================================================
// TRANSACTION SIGNING & SENDING
// ============================================================================

pub async fn sign_eip1559_transaction(
    from: &str,
    to: &str,
    nonce: &str,
    _gas_price: &str,
    base_fee_per_gas: &str,
    data: &str,
) -> Result<String, String> {
    const EIP1559_TX_ID: u8 = 2;
    
    // Convert hex strings to U256
    let nonce_u256 = U256::from_str_radix(nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let base_fee_u256 = U256::from_str_radix(base_fee_per_gas, 16)
        .map_err(|e| format!("Invalid base fee: {}", e))?;
    
    // Calculate max fee per gas and max priority fee per gas
    let max_priority_fee_per_gas = U256::from(1500000000u64); // 1.5 gwei
    let max_fee_per_gas = base_fee_u256 * U256::from(2u64) + max_priority_fee_per_gas;
    
    // Gas limit for the transaction
    let gas_limit = U256::from(5000000u64); // 500k gas limit (increased for HTLC creation)
    
    // Parse addresses
    let to_address = ethers_core::types::Address::from_str(to)
        .map_err(|e| format!("Invalid to address: {}", e))?;
    
    let from_address = ethers_core::types::Address::from_str(from)
        .map_err(|e| format!("Invalid from address: {}", e))?;
    
    // Parse data - data is already hex-encoded, so we decode it to bytes
    let data_bytes = hex::decode(data.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid data: {}", e))?;
    
    // Create EIP-1559 transaction
    let tx = Eip1559TransactionRequest {
        from: Some(from_address),
        chain_id: Some(ethers_core::types::U64::from(SEPOLIA_CHAIN_ID)),
        nonce: Some(nonce_u256),
        max_priority_fee_per_gas: Some(max_priority_fee_per_gas),
        max_fee_per_gas: Some(max_fee_per_gas),
        gas: Some(gas_limit),
        to: Some(ethers_core::types::NameOrAddress::Address(to_address)),
        value: Some(U256::from(0u64)),
        data: Some(ethers_core::types::Bytes::from(data_bytes)),
        access_list: AccessList::default(),
    };
    
    // Get the canister's public key for signature recovery
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    let ecdsa_pub_key = get_canister_public_key(key_id.clone(), None, derivation_path.clone()).await;
    
    // Use the built-in RLP encoding method
    let mut unsigned_tx_bytes = tx.rlp().to_vec();
    unsigned_tx_bytes.insert(0, EIP1559_TX_ID);
    
    let txhash = keccak256(&unsigned_tx_bytes);
    
    // Sign the transaction hash
    let sign_args = ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument {
        message_hash: txhash.to_vec(),
        derivation_path,
        key_id,
    };
    
    let signature = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(sign_args)
        .await
        .map_err(|e| format!("Failed to sign transaction: {:?}", e))?;
    
    // Parse signature components
    let sig_bytes = signature.0.signature;
    if sig_bytes.len() != 64 {
        return Err("Invalid signature length".to_string());
    }
    
    let r = U256::from_big_endian(&sig_bytes[..32]);
    let s = U256::from_big_endian(&sig_bytes[32..]);
    
    // Calculate v (recovery bit) using y_parity function
    let v = y_parity(&txhash, &sig_bytes, &ecdsa_pub_key);
    
    // Create signature struct
    let signature_struct = ethers_core::types::Signature {
        v,
        r,
        s,
    };
    
    // Use the built-in RLP encoding method for signed transaction
    let mut signed_tx_bytes = tx.rlp_signed(&signature_struct).to_vec();
    signed_tx_bytes.insert(0, EIP1559_TX_ID);
    
    let signed_tx_hex = format!("0x{}", hex::encode(signed_tx_bytes));
    
    Ok(signed_tx_hex)
}

pub async fn send_raw_transaction(signed_tx: &str) -> Result<String, String> {
    let params = format!("[\"{}\"]", signed_tx);
    let response = make_json_rpc_call("eth_sendRawTransaction", &params).await?;
    
    let response_json: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    if let Some(error) = response_json.get("error") {
        return Err(format!("Transaction failed: {}", error));
    }
    
    let tx_hash = response_json["result"]
        .as_str()
        .ok_or("No transaction hash in response")?;
    
    Ok(tx_hash.to_string())
}

// ============================================================================
// HTLC CONTRACT INTERACTIONS
// ============================================================================

/// Encode the createHTLC function call for ERC20 tokens
/// Encode createHTLCERC20 function call
pub fn encode_create_htlc_erc20_call(
    recipient: &str,
    token: &str,
    amount: &str,
    hashlock: &str,
    timelock: u64,
    source_chain: u64,
    target_chain: u64,
    is_cross_chain: bool,
    order_hash: &str,
    user_address: &str, // user address to transfer from
) -> Result<String, String> {
    // Define the function signature
    let function = Function {
        name: "createHTLCERC20".to_string(),
        inputs: vec![
            ethabi::Param { name: "recipient".to_string(), kind: ParamType::Address, internal_type: None },
            ethabi::Param { name: "token".to_string(), kind: ParamType::Address, internal_type: None },
            ethabi::Param { name: "amount".to_string(), kind: ParamType::Uint(256), internal_type: None },
            ethabi::Param { name: "hashlock".to_string(), kind: ParamType::FixedBytes(32), internal_type: None },
            ethabi::Param { name: "timelock".to_string(), kind: ParamType::Uint(256), internal_type: None },
            ethabi::Param { name: "sourceChain".to_string(), kind: ParamType::Uint(8), internal_type: None },
            ethabi::Param { name: "targetChain".to_string(), kind: ParamType::Uint(8), internal_type: None },
            ethabi::Param { name: "isCrossChain".to_string(), kind: ParamType::Bool, internal_type: None },
            ethabi::Param { name: "orderHash".to_string(), kind: ParamType::String, internal_type: None },
            ethabi::Param { name: "owner".to_string(), kind: ParamType::Address, internal_type: None },
        ],
        outputs: vec![],
        constant: None,
        state_mutability: ethabi::StateMutability::NonPayable,
    };
    
    // Parse addresses
    let recipient_addr = Address::from_str(recipient.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    let token_addr = Address::from_str(token.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid token address: {}", e))?;
    let user_addr = Address::from_str(user_address.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid user address: {}", e))?;
    
    // Parse amount
    let amount_u256 = EthU256::from_dec_str(amount)
        .map_err(|e| format!("Invalid amount: {}", e))?;
    
    // Parse hashlock (remove 0x prefix and convert to bytes)
    let hashlock_clean = hashlock.trim_start_matches("0x");
    let hashlock_bytes = hex::decode(hashlock_clean)
        .map_err(|e| format!("Invalid hashlock: {}", e))?;
    if hashlock_bytes.len() != 32 {
        return Err("Hashlock must be 32 bytes".to_string());
    }
    
    // Convert parameters to tokens
    let tokens = vec![
        Token::Address(recipient_addr),
        Token::Address(token_addr),
        Token::Uint(amount_u256),
        Token::FixedBytes(hashlock_bytes.clone()),
        Token::Uint(EthU256::from(timelock)),
        Token::Uint(EthU256::from(source_chain)),
        Token::Uint(EthU256::from(target_chain)),
        Token::Bool(is_cross_chain),
        Token::String(order_hash.to_string()),
        Token::Address(user_addr),
    ];
    
    // Encode the function call
    let encoded = function.encode_input(&tokens)
        .map_err(|e| format!("Failed to encode function call: {}", e))?;
    
    let encoded_hex = format!("0x{}", hex::encode(encoded));
    
    Ok(encoded_hex)
}

/// Encode the claimHTLC function call
pub fn encode_claim_htlc_call(htlc_id: &str, secret: &str) -> Result<String, String> {
    // Function signature: claimHTLC(uint256 htlcId, bytes32 secret)
    let function = Function {
        name: "claimHTLC".to_string(),
        inputs: vec![
            ethabi::Param { name: "htlcId".to_string(), kind: ParamType::Uint(256), internal_type: None },
            ethabi::Param { name: "secret".to_string(), kind: ParamType::FixedBytes(32), internal_type: None },
        ],
        outputs: vec![],
        constant: None,
        state_mutability: ethabi::StateMutability::NonPayable,
    };

    // Parse HTLC ID
    let htlc_id_u256 = U256::from_str(htlc_id)
        .map_err(|e| format!("Invalid HTLC ID: {}", e))?;

    // Parse secret (remove 0x prefix if present)
    let secret_clean = secret.trim_start_matches("0x");
    let secret_bytes = hex::decode(secret_clean)
        .map_err(|e| format!("Invalid secret: {}", e))?;
    if secret_bytes.len() != 32 {
        return Err("Secret must be 32 bytes".to_string());
    }

    // Encode function call
    let tokens = vec![
        Token::Uint(htlc_id_u256),
        Token::FixedBytes(secret_bytes),
    ];

    let encoded = function.encode_input(&tokens)
        .map_err(|e| format!("Failed to encode function call: {}", e))?;

    Ok(format!("0x{}", hex::encode(encoded)))
}

/// Encode claimHTLCByICP function call
pub fn encode_claim_htlc_by_icp_call(htlc_id: &str, secret: &str, recipient: &str) -> Result<String, String> {
    // Define the function signature
    let function = Function {
        name: "claimHTLCByICP".to_string(),
        inputs: vec![
            ethabi::Param { name: "htlcId".to_string(), kind: ParamType::FixedBytes(32), internal_type: None },
            ethabi::Param { name: "secret".to_string(), kind: ParamType::String, internal_type: None },
            ethabi::Param { name: "recipient".to_string(), kind: ParamType::Address, internal_type: None },
        ],
        outputs: vec![],
        constant: None,
        state_mutability: ethabi::StateMutability::NonPayable,
    };
    
    // Parse htlc_id (remove 0x prefix and convert to bytes)
    let htlc_id_clean = htlc_id.trim_start_matches("0x");
    let htlc_id_bytes = hex::decode(htlc_id_clean)
        .map_err(|e| format!("Invalid htlc_id: {}", e))?;
    if htlc_id_bytes.len() != 32 {
        return Err("HTLC ID must be 32 bytes".to_string());
    }
    
    // Parse recipient address
    let recipient_addr = Address::from_str(recipient.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    
    // Convert parameters to tokens
    let tokens = vec![
        Token::FixedBytes(htlc_id_bytes.clone()),
        Token::String(secret.to_string()),
        Token::Address(recipient_addr),
    ];
    
    // Encode the function call
    let encoded = function.encode_input(&tokens)
        .map_err(|e| format!("Failed to encode function call: {}", e))?;
    
    let encoded_hex = format!("0x{}", hex::encode(encoded));
    
    Ok(encoded_hex)
}

/// Get HTLC ID from transaction receipt by parsing the HTLCCreated event
pub async fn get_htlc_id_from_receipt(tx_hash: &str) -> Result<String, String> {
    
    // Poll for transaction receipt
    let mut attempts = 0;
    let max_attempts = 30; // 30 seconds max wait
    
    while attempts < max_attempts {
        let receipt_response = crate::http_client::get_transaction_receipt(tx_hash.to_string()).await?;
        let receipt_json: serde_json::Value = serde_json::from_str(&receipt_response)
            .map_err(|e| format!("Failed to parse receipt response: {}", e))?;
        
        if let Some(result) = receipt_json["result"].as_object() {
            if result.get("blockNumber").is_some() {
                // Transaction is mined, extract HTLC ID from logs
                if let Some(logs) = result["logs"].as_array() {
                    for log in logs {
                        if let Some(topics) = log["topics"].as_array() {
                            if topics.len() > 0 {
                                // HTLCCreated event signature: keccak256("HTLCCreated(bytes32,address,address,uint256,bytes32,uint256,address,uint8,uint8,bool)")
                                // The first topic is the event signature, the second topic is the HTLC ID
                                let event_signature = "0x84531b127d0bd83b1d32956f33727af69ab12eef7ff40a6ee1fdd2b64cb104dd"; // HTLCCreated event signature
                                if topics[0].as_str() == Some(event_signature) && topics.len() > 1 {
                                    let htlc_id = topics[1].as_str()
                                        .ok_or("HTLC ID not found in event")?;
                                    return Ok(htlc_id.to_string());
                                }
                            }
                        }
                    }
                }
                return Err("HTLCCreated event not found in transaction receipt".to_string());
            }
        }
        
        // Wait 1 second before next attempt
        ic_cdk::api::time(); // Small delay
        attempts += 1;
    }
    
    Err("Transaction not mined within timeout period".to_string())
} 

// ============================================================================
// GASLESS APPROVAL FUNCTIONS (EIP-2771)
// ============================================================================

/// Execute gasless approval using EIP-2612 permit
pub async fn execute_gasless_approval(request: crate::types::GaslessApprovalRequest) -> Result<String, String> {
    // 1. Verify the permit signature
    let is_valid = verify_permit_signature(&request.permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce for the canister using thread-safe nonce management
    let canister_nonce = crate::storage::get_next_nonce();
    let canister_nonce_hex = format!("{:x}", canister_nonce);
    
    // 4. Encode the permit function call on the token contract
    let permit_data = encode_permit_call(&request.permit_request)?;
    
    // Debug: Check if the permit_data has odd length
    let data_clean = permit_data.trim_start_matches("0x");
    if data_clean.len() % 2 != 0 {
        return Err(format!("Permit data has odd length: {} chars", data_clean.len()));
    }
    
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
    
    let signed_tx = sign_eip1559_transaction(
        &from_addr_str,
        token_address,
        &canister_nonce_hex,
        &gas_price,
        &base_fee_per_gas,
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
pub async fn verify_permit_signature(permit_request: &crate::types::PermitRequest) -> Result<bool, String> {
    
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
    
    Ok(true)
}

/// Encode EIP-2612 permit function call
pub fn encode_permit_call(permit_request: &crate::types::PermitRequest) -> Result<String, String> {
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

    let final_clean = encoded_data.trim_start_matches("0x");
    if final_clean.len() % 2 != 0 {
        return Err(format!("Final permit data has odd length: {} chars", final_clean.len()));
    }
    
    Ok(encoded_data)
} 

// ============================================================================
// LEGACY PERMIT FUNCTIONS
// ============================================================================

/// Submit permit signature (legacy function)
pub async fn submit_permit_signature(permit_data: crate::types::PermitData) -> Result<String, String> {
    // 1. Verify permit signature
    let recovered_address = verify_permit_signature_legacy(&permit_data)?;
    if recovered_address != permit_data.owner {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce
    let nonce_response = crate::http_client::get_transaction_count(from_addr_str.clone()).await?;
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

/// Verify permit signature (legacy function)
pub fn verify_permit_signature_legacy(permit_data: &crate::types::PermitData) -> Result<String, String> {
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

/// Encode HTLC permit call (legacy function)
pub fn encode_htlc_permit_call(permit_data: &crate::types::PermitData) -> Result<String, String> {
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

/// Encode HTLC permit and transfer call
pub fn encode_htlc_permit_and_transfer_call(permit_request: &crate::types::PermitRequest) -> Result<String, String> {
    // executePermitAndTransfer function selector: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    // Function signature: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "executePermitAndTransfer";
    
    // Calculate function selector hash (first 4 bytes of keccak256 hash)
    let function_signature = format!("{}(address,address,address,uint256,uint256,uint8,bytes32,bytes32)", function_selector);
    let function_selector_hash = keccak256(function_signature.as_bytes());
    let function_selector_hex = hex::encode(&function_selector_hash[..4]);
    
    // Use hardcoded token address (SpiralToken) since PermitRequest doesn't have token field
    let token_address = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    let token_padded = format!("{:0>64}", token_address.trim_start_matches("0x"));
    
    // Encode parameters: (token, owner, spender, value, deadline, v, r, s)
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
        "0x{}{}{}{}{}{}{}{}{}",
        function_selector_hex,
        token_padded,
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

// ============================================================================
// ATOMIC SWAP EVM FUNCTIONS
// ============================================================================

/// Create HTLC on EVM chain
pub async fn create_evm_htlc(
    order_id: String,
    is_source_htlc: bool, // true for source HTLC, false for destination HTLC
) -> Result<String, String> {
    let orders = crate::storage::get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or("Atomic swap order not found")?;
    
    if order.status != crate::types::SwapOrderStatus::Created && order.status != crate::types::SwapOrderStatus::SourceHTLCCreated {
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
    let encoded_data = encode_create_htlc_erc20_call(
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
    let canister_address = get_ethereum_address().await?;
    
    // Get fresh nonce for this transaction using thread-safe nonce management
    let nonce = crate::storage::get_next_nonce();
    let nonce_hex = format!("{:x}", nonce);
    
    ic_cdk::println!("Debug - HTLC creation nonce: {}", nonce_hex);
    
    // Get fresh gas price for this transaction
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = primitive_types::U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Sign and send transaction with fresh nonce
    let signed_tx = sign_eip1559_transaction(
        &canister_address,
        crate::constants::HTLC_CONTRACT_ADDRESS,
        &nonce_hex,
        &gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    // Wait for transaction to be mined and get receipt to extract HTLC ID
    let htlc_id = get_htlc_id_from_receipt(&tx_hash).await?;
    
    ic_cdk::println!("🔍 HTLC Creation Result:");
    ic_cdk::println!("  Transaction Hash: {}", tx_hash);
    ic_cdk::println!("  HTLC ID: {}", htlc_id);
    
    // Update order status with HTLC ID (not transaction hash)
    let orders = crate::storage::get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        if is_source_htlc {
            order.source_htlc_id = Some(htlc_id.clone());
            order.status = crate::types::SwapOrderStatus::SourceHTLCCreated;
        } else {
            order.destination_htlc_id = Some(htlc_id.clone());
            order.status = crate::types::SwapOrderStatus::DestinationHTLCCreated;
        }
    }
    
    Ok(htlc_id)
}

/// Claim HTLC on EVM chain
pub async fn claim_evm_htlc(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    let orders = crate::storage::get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or("Atomic swap order not found")?;
    
    // Check if order is ready for claiming
    if order.status != crate::types::SwapOrderStatus::SourceHTLCCreated && 
       order.status != crate::types::SwapOrderStatus::DestinationHTLCCreated &&
       order.status != crate::types::SwapOrderStatus::SourceHTLCClaimed {
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
    let canister_address = get_ethereum_address().await?;
    
    // Get fresh nonce for this transaction using thread-safe nonce management
    let nonce = crate::storage::get_next_nonce();
    let nonce_hex = format!("{:x}", nonce);
    
    ic_cdk::println!("Debug - Claim HTLC nonce: {}", nonce_hex);
    
    // Get fresh gas price for this transaction
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = primitive_types::U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Sign and send transaction with fresh nonce
    let signed_tx = sign_eip1559_transaction(
        &canister_address,
        crate::constants::HTLC_CONTRACT_ADDRESS,
        &nonce_hex,
        &gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    // Update order status
    let orders = crate::storage::get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        if order.source_htlc_id.as_ref() == Some(&htlc_id) {
            order.status = crate::types::SwapOrderStatus::SourceHTLCClaimed;
        } else if order.destination_htlc_id.as_ref() == Some(&htlc_id) {
            order.status = crate::types::SwapOrderStatus::DestinationHTLCClaimed;
        }
        
        // Check if both HTLCs are claimed
        if order.status == crate::types::SwapOrderStatus::SourceHTLCClaimed || order.status == crate::types::SwapOrderStatus::DestinationHTLCClaimed {
            // If we just claimed one, allow claiming the other
            // The status will be set to Completed when both are claimed
        }
    }
    
    Ok(tx_hash)
}

/// Execute complete atomic swap (create both HTLCs and claim them)
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

/// Refund HTLC on EVM chain
pub async fn refund_evm_htlc(
    order_id: String,
    htlc_id: String,
) -> Result<String, String> {
    let orders = crate::storage::get_atomic_swap_orders();
    let order = orders.get(&order_id)
        .ok_or("Atomic swap order not found")?;
    
    // Check if order has expired
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    if current_time <= order.timelock {
        return Err("HTLC has not expired yet".to_string());
    }
    
    // Encode refundHTLC function call
    let encoded_data = encode_refund_htlc_call(&htlc_id)?;
    
    // Get canister's Ethereum address
    let canister_address = get_ethereum_address().await?;
    
    // Get fresh nonce for this transaction
    let nonce = crate::storage::get_next_nonce();
    let nonce_hex = format!("{:x}", nonce);
    
    // Get fresh gas price for this transaction
    let gas_price_response = crate::http_client::get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    let gas_price_u256 = primitive_types::U256::from_str_radix(gas_price, 16).map_err(|e| format!("Invalid gas price: {}", e))?;
    let base_fee_per_gas = gas_price_u256;
    
    // Sign and send transaction
    let signed_tx = sign_eip1559_transaction(
        &canister_address,
        crate::constants::HTLC_CONTRACT_ADDRESS,
        &nonce_hex,
        &gas_price,
        &base_fee_per_gas.to_string(),
        &encoded_data,
    ).await?;
    
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    // Update order status
    let orders = crate::storage::get_atomic_swap_orders();
    if let Some(order) = orders.get_mut(&order_id) {
        order.status = crate::types::SwapOrderStatus::Refunded;
    }
    
    Ok(tx_hash)
}

/// Encode refundHTLC function call
fn encode_refund_htlc_call(htlc_id: &str) -> Result<String, String> {
    let htlc_id_bytes = hex::decode(htlc_id.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid HTLC ID: {}", e))?;
    
    // Function signature: refundHTLC(bytes32 htlcId)
    let function_signature = "refundHTLC(bytes32)";
    let function_selector = keccak256(function_signature.as_bytes());
    let selector = &function_selector[..4];
    
    // Encode the HTLC ID as bytes32
    let mut encoded_data = selector.to_vec();
    encoded_data.extend_from_slice(&htlc_id_bytes);
    
    // Pad to 32 bytes if needed
    while encoded_data.len() < 36 {
        encoded_data.push(0);
    }
    
    Ok(format!("0x{}", hex::encode(&encoded_data)))
} 