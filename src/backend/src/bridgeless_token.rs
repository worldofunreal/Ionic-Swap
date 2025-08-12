use candid::{CandidType, Deserialize, Principal};
use ethers_core::types::{Address, U256};
use sha3::{Digest, Keccak256};
use std::collections::HashMap;
use std::str::FromStr;

// ============================================================================
// TYPES
// ============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChainLedger {
    pub chain_id: String,
    pub chain_type: String, // "EVM", "ICP", "COSMOS", etc.
    pub ledger_address: String,
    pub is_active: bool,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CrossChainTransfer {
    pub transfer_id: String,
    pub source_chain: String,
    pub target_chain: String,
    pub amount: String,
    pub recipient: String,
    pub status: TransferStatus,
    pub created_at: u64,
    pub processed_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferStatus {
    Pending,
    Authorized,
    Completed,
    Failed,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChainInitData {
    pub chain_type: String,
    pub init_params: Vec<u8>,
    pub ledger_address: String,
}

// ============================================================================
// STORAGE
// ============================================================================

thread_local! {
    static CHAIN_LEDGERS: std::cell::RefCell<HashMap<String, ChainLedger>> = std::cell::RefCell::new(HashMap::new());
    static CROSS_CHAIN_TRANSFERS: std::cell::RefCell<HashMap<String, CrossChainTransfer>> = std::cell::RefCell::new(HashMap::new());
    static ROOT_CONTRACT_ADDRESS: std::cell::RefCell<Option<String>> = std::cell::RefCell::new(None);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/// Initialize the bridgeless token system
pub async fn initialize_bridgeless_token(
    root_contract_address: String,
    token_name: String,
    token_symbol: String,
) -> Result<String, String> {
    // Validate the root contract address
    if !root_contract_address.starts_with("0x") || root_contract_address.len() != 42 {
        return Err("Invalid root contract address".to_string());
    }

    // Store the root contract address
    ROOT_CONTRACT_ADDRESS.with(|addr| {
        *addr.borrow_mut() = Some(root_contract_address.clone());
    });

    // Initialize the EVM chain ledger (the root contract itself)
    let evm_ledger = ChainLedger {
        chain_id: "EVM".to_string(),
        chain_type: "EVM".to_string(),
        ledger_address: root_contract_address.clone(),
        is_active: true,
        created_at: ic_cdk::api::time() / 1_000_000_000,
    };

    CHAIN_LEDGERS.with(|ledgers| {
        ledgers.borrow_mut().insert("EVM".to_string(), evm_ledger);
    });

    ic_cdk::println!("✅ Bridgeless token system initialized");
    ic_cdk::println!("  Root contract: {}", root_contract_address);
    ic_cdk::println!("  Token: {} ({})", token_name, token_symbol);

    Ok(format!("Bridgeless token system initialized with root contract: {}", root_contract_address))
}

/// Create a new chain ledger
pub async fn create_chain_ledger(
    chain_id: String,
    init_data: ChainInitData,
) -> Result<String, String> {
    // Validate inputs
    if chain_id.is_empty() {
        return Err("Chain ID cannot be empty".to_string());
    }

    if init_data.ledger_address.is_empty() {
        return Err("Ledger address cannot be empty".to_string());
    }

    // Check if chain already exists
    CHAIN_LEDGERS.with(|ledgers| {
        if ledgers.borrow().contains_key(&chain_id) {
            return Err("Chain already exists".to_string());
        }
        Ok(())
    })?;

    // Get the root contract address
    let root_contract = ROOT_CONTRACT_ADDRESS.with(|addr| {
        addr.borrow().clone().ok_or("Root contract not initialized".to_string())
    })?;

    // Create the chain ledger record
    let ledger = ChainLedger {
        chain_id: chain_id.clone(),
        chain_type: init_data.chain_type.clone(),
        ledger_address: init_data.ledger_address.clone(),
        is_active: true,
        created_at: ic_cdk::api::time() / 1_000_000_000,
    };

    // Store the ledger
    CHAIN_LEDGERS.with(|ledgers| {
        ledgers.borrow_mut().insert(chain_id.clone(), ledger);
    });

    // Call the root contract to register the new chain
    let result = call_root_contract_create_chain(&chain_id, &init_data).await?;

    ic_cdk::println!("✅ Chain ledger created: {}", chain_id);
    ic_cdk::println!("  Type: {}", init_data.chain_type);
    ic_cdk::println!("  Address: {}", init_data.ledger_address);
    ic_cdk::println!("  Root contract result: {}", result);

    Ok(format!("Chain ledger created successfully: {}", chain_id))
}

/// Authorize a cross-chain transfer
pub async fn authorize_cross_chain_transfer(
    transfer_id: String,
    amount: String,
    target_chain: String,
    recipient: String,
) -> Result<String, String> {
    // Validate inputs
    if transfer_id.is_empty() {
        return Err("Transfer ID cannot be empty".to_string());
    }

    if amount.is_empty() {
        return Err("Amount cannot be empty".to_string());
    }

    if target_chain.is_empty() {
        return Err("Target chain cannot be empty".to_string());
    }

    if recipient.is_empty() {
        return Err("Recipient cannot be empty".to_string());
    }

    // Check if target chain is supported
    CHAIN_LEDGERS.with(|ledgers| {
        if !ledgers.borrow().contains_key(&target_chain) {
            return Err("Target chain not supported".to_string());
        }
        Ok(())
    })?;

    // Create the transfer record
    let transfer = CrossChainTransfer {
        transfer_id: transfer_id.clone(),
        source_chain: "EVM".to_string(), // Assuming transfers originate from EVM
        target_chain: target_chain.clone(),
        amount: amount.clone(),
        recipient: recipient.clone(),
        status: TransferStatus::Pending,
        created_at: ic_cdk::api::time() / 1_000_000_000,
        processed_at: None,
    };

    // Store the transfer
    CROSS_CHAIN_TRANSFERS.with(|transfers| {
        transfers.borrow_mut().insert(transfer_id.clone(), transfer);
    });

    // Generate threshold signature
    let signature = generate_threshold_signature(&transfer_id, &amount, &target_chain, &recipient).await?;

    // Call the root contract to authorize the transfer
    let result = call_root_contract_authorize_transfer(
        &transfer_id,
        &amount,
        &target_chain,
        &recipient,
        &signature,
    ).await?;

    // Update transfer status
    CROSS_CHAIN_TRANSFERS.with(|transfers| {
        if let Some(transfer) = transfers.borrow_mut().get_mut(&transfer_id) {
            transfer.status = TransferStatus::Authorized;
            transfer.processed_at = Some(ic_cdk::api::time() / 1_000_000_000);
        }
    });

    ic_cdk::println!("✅ Cross-chain transfer authorized: {}", transfer_id);
    ic_cdk::println!("  Amount: {} -> {}", amount, target_chain);
    ic_cdk::println!("  Recipient: {}", recipient);
    ic_cdk::println!("  Root contract result: {}", result);

    Ok(format!("Cross-chain transfer authorized: {}", transfer_id))
}

/// Get all chain ledgers
pub fn get_all_chain_ledgers() -> Vec<ChainLedger> {
    CHAIN_LEDGERS.with(|ledgers| {
        ledgers.borrow().values().cloned().collect()
    })
}

/// Get chain ledger by ID
pub fn get_chain_ledger(chain_id: &str) -> Option<ChainLedger> {
    CHAIN_LEDGERS.with(|ledgers| {
        ledgers.borrow().get(chain_id).cloned()
    })
}

/// Get all cross-chain transfers
pub fn get_all_cross_chain_transfers() -> Vec<CrossChainTransfer> {
    CROSS_CHAIN_TRANSFERS.with(|transfers| {
        transfers.borrow().values().cloned().collect()
    })
}

/// Get cross-chain transfer by ID
pub fn get_cross_chain_transfer(transfer_id: &str) -> Option<CrossChainTransfer> {
    CROSS_CHAIN_TRANSFERS.with(|transfers| {
        transfers.borrow().get(transfer_id).cloned()
    })
}

/// Get root contract address
pub fn get_root_contract_address() -> Option<String> {
    ROOT_CONTRACT_ADDRESS.with(|addr| {
        addr.borrow().clone()
    })
}

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

/// Generate threshold signature for cross-chain transfer
async fn generate_threshold_signature(
    transfer_id: &str,
    amount: &str,
    target_chain: &str,
    recipient: &str,
) -> Result<String, String> {
    // Create the message hash
    let message = format!("{}{}{}{}{}", 
        transfer_id, 
        amount, 
        target_chain, 
        recipient, 
        ic_cdk::api::time() / 1_000_000_000
    );
    
    let message_bytes = message.as_bytes();
    let mut hasher = Keccak256::new();
    hasher.update(message_bytes);
    let hash = hasher.finalize();

    // Sign the hash using the canister's ECDSA key
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };

    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];

    let signature = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(
        ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument {
            message_hash: hash.to_vec(),
            derivation_path,
            key_id,
        },
    )
    .await
    .map_err(|e| format!("Failed to sign message: {:?}", e))?;

    Ok(hex::encode(signature.0.signature))
}

/// Call the root contract to create a new chain
async fn call_root_contract_create_chain(
    chain_id: &str,
    init_data: &ChainInitData,
) -> Result<String, String> {
    // Get the root contract address
    let root_contract = ROOT_CONTRACT_ADDRESS.with(|addr| {
        addr.borrow().clone().ok_or("Root contract not initialized".to_string())
    })?;

    // Encode the function call data
    let function_signature = "createChain(string,(string,bytes,address))";
    let function_selector = keccak256(function_signature.as_bytes());
    let selector = &function_selector[..4];

    // Encode the parameters
    let chain_id_encoded = encode_string(chain_id);
    let chain_type_encoded = encode_string(&init_data.chain_type);
    let init_params_encoded = encode_bytes(&init_data.init_params);
    let ledger_address_encoded = encode_address(&init_data.ledger_address);

    // Encode the struct
    let struct_data = [
        chain_type_encoded,
        init_params_encoded,
        ledger_address_encoded,
    ].concat();

    // Pad the struct to 32 bytes
    let padded_struct = pad_to_32_bytes(&struct_data);

    // Combine all encoded data
    let encoded_data = [selector, &chain_id_encoded, &padded_struct].concat();

    // Make the transaction call
    let tx_hash = crate::evm::send_transaction(
        &root_contract,
        "0", // value
        &hex::encode(encoded_data),
    ).await?;

    Ok(format!("Transaction sent: {}", tx_hash))
}

/// Call the root contract to authorize a cross-chain transfer
async fn call_root_contract_authorize_transfer(
    transfer_id: &str,
    amount: &str,
    target_chain: &str,
    recipient: &str,
    signature: &str,
) -> Result<String, String> {
    // Get the root contract address
    let root_contract = ROOT_CONTRACT_ADDRESS.with(|addr| {
        addr.borrow().clone().ok_or("Root contract not initialized".to_string())
    })?;

    // Encode the function call data
    let function_signature = "authorizeCrossChainTransfer(bytes32,uint256,string,address,bytes)";
    let function_selector = keccak256(function_signature.as_bytes());
    let selector = &function_selector[..4];

    // Encode the parameters
    let transfer_id_encoded = encode_bytes32(transfer_id);
    let amount_encoded = encode_uint256(amount);
    let target_chain_encoded = encode_string(target_chain);
    let recipient_encoded = encode_address(recipient);
    let signature_encoded = encode_bytes(&hex::decode(signature).unwrap_or_default());

    // Combine all encoded data
    let encoded_data = [
        selector,
        &transfer_id_encoded,
        &amount_encoded,
        &target_chain_encoded,
        &recipient_encoded,
        &signature_encoded,
    ].concat();

    // Make the transaction call
    let tx_hash = crate::evm::send_transaction(
        &root_contract,
        "0", // value
        &hex::encode(encoded_data),
    ).await?;

    Ok(format!("Transaction sent: {}", tx_hash))
}

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

fn encode_string(s: &str) -> Vec<u8> {
    let mut encoded = vec![0u8; 32]; // offset
    let length = s.len() as u64;
    encoded.extend_from_slice(&length.to_be_bytes());
    encoded.extend_from_slice(s.as_bytes());
    
    // Pad to 32-byte boundary
    let padding = (32 - (s.len() % 32)) % 32;
    encoded.extend_from_slice(&vec![0u8; padding]);
    
    encoded
}

fn encode_bytes(data: &[u8]) -> Vec<u8> {
    let mut encoded = vec![0u8; 32]; // offset
    let length = data.len() as u64;
    encoded.extend_from_slice(&length.to_be_bytes());
    encoded.extend_from_slice(data);
    
    // Pad to 32-byte boundary
    let padding = (32 - (data.len() % 32)) % 32;
    encoded.extend_from_slice(&vec![0u8; padding]);
    
    encoded
}

fn encode_address(addr: &str) -> Vec<u8> {
    let addr = addr.trim_start_matches("0x");
    let mut encoded = vec![0u8; 32];
    let addr_bytes = hex::decode(addr).unwrap_or_default();
    encoded[12..].copy_from_slice(&addr_bytes);
    encoded
}

fn encode_bytes32(data: &str) -> Vec<u8> {
    let data = data.trim_start_matches("0x");
    let mut encoded = vec![0u8; 32];
    let data_bytes = hex::decode(data).unwrap_or_default();
    encoded[..data_bytes.len()].copy_from_slice(&data_bytes);
    encoded
}

fn encode_uint256(value: &str) -> Vec<u8> {
    let value = U256::from_dec_str(value).unwrap_or_default();
    let mut encoded = vec![0u8; 32];
    value.to_big_endian(&mut encoded);
    encoded
}

fn pad_to_32_bytes(data: &[u8]) -> Vec<u8> {
    let mut padded = data.to_vec();
    let padding = (32 - (data.len() % 32)) % 32;
    padded.extend_from_slice(&vec![0u8; padding]);
    padded
}
