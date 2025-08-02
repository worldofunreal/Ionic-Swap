use candid::Principal;
use ethers_core::types::Eip1559TransactionRequest;
use ethers_core::types::transaction::eip2930::AccessList;
use ethabi::{Function, Token, ParamType, Address};
use ethers_core::types::U256 as EthU256;
use primitive_types::U256;
use std::str::FromStr;
use sha3::Digest;
use crate::constants::{HTLC_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID};
use crate::http_client::{get_transaction_count, get_gas_price, get_latest_block, make_json_rpc_call, get_transaction_receipt};

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
    ic_cdk::println!("Debug - Parsing to address: {}", to);
    let to_address = ethers_core::types::Address::from_str(to)
        .map_err(|e| format!("Invalid to address: {}", e))?;
    ic_cdk::println!("Debug - Parsed to address: {:?}", to_address);
    ic_cdk::println!("Debug - To address bytes: {:?}", to_address.as_bytes());
    
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
    
    // Debug logging
    ic_cdk::println!("🔧 Proper ABI Encoding Debug:");
    ic_cdk::println!("  Function: createHTLCERC20");
    ic_cdk::println!("  Recipient: {}", recipient_addr);
    ic_cdk::println!("  Token: {}", token_addr);
    ic_cdk::println!("  Amount: {} (0x{:x})", amount_u256, amount_u256);
    ic_cdk::println!("  Hashlock: 0x{}", hex::encode(&hashlock_bytes));
    ic_cdk::println!("  Timelock: {}", timelock);
    ic_cdk::println!("  Source Chain: {}", source_chain);
    ic_cdk::println!("  Target Chain: {}", target_chain);
    ic_cdk::println!("  Is Cross Chain: {}", is_cross_chain);
    ic_cdk::println!("  Order Hash: '{}'", order_hash);
    ic_cdk::println!("  Owner: {}", user_addr);
    ic_cdk::println!("  Encoded Data: {}", encoded_hex);
    
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
    
    // Debug logging
    ic_cdk::println!("🔧 Claim HTLC By ICP ABI Encoding Debug:");
    ic_cdk::println!("  Function: claimHTLCByICP");
    ic_cdk::println!("  HTLC ID: 0x{}", hex::encode(&htlc_id_bytes));
    ic_cdk::println!("  Secret: '{}'", secret);
    ic_cdk::println!("  Recipient: {}", recipient_addr);
    ic_cdk::println!("  Encoded Data: {}", encoded_hex);
    
    Ok(encoded_hex)
}

/// Get HTLC ID from transaction receipt by parsing the HTLCCreated event
pub async fn get_htlc_id_from_receipt(tx_hash: &str) -> Result<String, String> {
    // Wait a bit for transaction to be mined
    ic_cdk::println!("⏳ Waiting for transaction to be mined...");
    
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