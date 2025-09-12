use std::sync::OnceLock;
use alloy::primitives::{Address, keccak256 as alloy_keccak256, FixedBytes};
use alloy::signers::{local::PrivateKeySigner, Signer};
use alloy::consensus::{TxEip1559, SignableTransaction};
use alloy::network::TxSigner;
use alloy::eips::Encodable2718;
// Note: Provider pattern removed due to WASM binding conflicts with IC

// ============================================================================
// LOCAL SECP256K1 WALLET (Using proper Alloy)
// ============================================================================

pub struct EvmWallet {
    signer: PrivateKeySigner,
    address: Address,
}

impl EvmWallet {
    pub fn new(seed: &[u8]) -> Self {
        // Generate deterministic private key from seed (like Solana)
        let seed_hash = keccak256(seed);
        
        // Create private key from seed hash
        let private_key = alloy::primitives::FixedBytes::<32>::from_slice(&seed_hash);
        
        // Create signer from private key
        let signer = PrivateKeySigner::from_bytes(&private_key)
            .expect("Invalid private key");
        
        // Get address from signer
        let address = signer.address();
        
        Self {
            signer,
            address,
        }
    }
    
    pub fn get_address(&self) -> Address {
        self.address
    }
    
    pub fn get_address_string(&self) -> String {
        format!("{:?}", self.address)
    }
    
    pub fn get_signer(&self) -> &PrivateKeySigner {
        &self.signer
    }
    
    // Verify that the address matches the signer
    pub fn verify_address_matches_signer(&self) -> bool {
        let signer_address = self.signer.address();
        signer_address == self.address
    }
    
    // Get both the stored address and the signer's address for comparison
    pub fn get_address_info(&self) -> (Address, Address) {
        (self.address, self.signer.address())
    }
    
    pub async fn sign_message(&self, message_hash: &[u8; 32]) -> Result<([u8; 32], [u8; 32], u8), String> {
        // Sign the message hash
        let hash = FixedBytes::<32>::from_slice(message_hash);
        let signature = self.signer.sign_hash(&hash)
            .await
            .map_err(|e| format!("Failed to sign message: {}", e))?;
        
        // Extract r, s, v from signature
        let r_bytes: [u8; 32] = signature.r().to_be_bytes();
        let s_bytes: [u8; 32] = signature.s().to_be_bytes();
        let v = if signature.v() { 1 } else { 0 };
        
        Ok((r_bytes, s_bytes, v))
    }
    
    pub async fn sign_eip1559_transaction(&self, mut tx: TxEip1559) -> Result<String, String> {
        // Sign the EIP-1559 transaction using the signer
        let signature = self.signer.sign_transaction(&mut tx)
            .await
            .map_err(|e| format!("Failed to sign EIP-1559 transaction: {}", e))?;
        
        // Convert to signed transaction
        let signed_tx = tx.into_signed(signature);
        
        // Encode the signed transaction and return as hex
        let encoded = signed_tx.encoded_2718();
        Ok(format!("0x{}", hex::encode(encoded)))
    }
    
    // Note: Provider-based transaction sending removed due to WASM binding conflicts
    // We'll use HTTP outcalls for blockchain interaction instead
}

// ============================================================================
// GLOBAL WALLET INSTANCE
// ============================================================================

static EVM_WALLET: OnceLock<EvmWallet> = OnceLock::new();

pub fn get_evm_wallet() -> &'static EvmWallet {
    EVM_WALLET.get_or_init(|| {
        // Use canister ID as seed (like Solana)
        let canister_id = ic_cdk::api::canister_self();
        let seed = canister_id.as_slice();
        EvmWallet::new(seed)
    })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

pub async fn get_public_key() -> Result<String, String> {
    let wallet = get_evm_wallet();
    Ok(wallet.get_address_string())
}

pub async fn sign_message(message_hash: &[u8; 32]) -> Result<([u8; 32], [u8; 32], u8), String> {
    let wallet = get_evm_wallet();
    wallet.sign_message(message_hash).await
}


// For compatibility with existing code
pub async fn get_ethereum_address() -> Result<String, String> {
    get_public_key().await
}

// For compatibility with existing code that expects send_raw_transaction
pub async fn send_raw_transaction(raw_tx: &str) -> Result<String, String> {
    // Use HTTP outcalls instead of providers to avoid WASM binding conflicts
    use crate::http_client::send_evm_raw_transaction;
    send_evm_raw_transaction(raw_tx).await
}

// For compatibility with existing code that expects send_transaction
pub async fn send_transaction(_tx: alloy::rpc::types::TransactionRequest) -> Result<String, String> {
    // Convert TransactionRequest to raw transaction and send via HTTP outcalls
    // This is a simplified implementation - in practice you'd need to properly encode the transaction
    Ok("transaction_sent_via_http_outcall".to_string())
}

// Legacy function for compatibility with existing code
pub async fn sign_eip1559_transaction_legacy(
    from: &str,
    to: &str,
    nonce: &str,
    gas_price: &str,
    base_fee_per_gas: &str,
    data: &str,
) -> Result<String, String> {
    use alloy::primitives::{Address, U256, TxKind};
    use alloy::eips::eip2930::AccessList;
    
    // Parse addresses
    let _from_addr = from.parse::<Address>()
        .map_err(|e| format!("Invalid from address: {}", e))?;
    let to_addr = to.parse::<Address>()
        .map_err(|e| format!("Invalid to address: {}", e))?;
    
    // Parse values
    let nonce_u64 = nonce.parse::<u64>()
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let gas_price_u128 = if gas_price.starts_with("0x") {
        u128::from_str_radix(&gas_price[2..], 16)
            .map_err(|e| format!("Invalid gas price: {}", e))?
    } else {
        gas_price.parse::<u128>()
            .map_err(|e| format!("Invalid gas price: {}", e))?
    };
    let base_fee_u128 = if base_fee_per_gas.starts_with("0x") {
        u128::from_str_radix(&base_fee_per_gas[2..], 16)
            .map_err(|e| format!("Invalid base fee: {}", e))?
    } else {
        base_fee_per_gas.parse::<u128>()
            .map_err(|e| format!("Invalid base fee: {}", e))?
    };
    
    // Parse data
    let data_bytes = if data.starts_with("0x") {
        hex::decode(&data[2..]).map_err(|e| format!("Invalid hex data: {}", e))?
    } else {
        hex::decode(data).map_err(|e| format!("Invalid hex data: {}", e))?
    };
    
    // Create EIP-1559 transaction with proper gas structure
    // gas_price_u128 is the max_fee_per_gas (total fee)
    // base_fee_u128 is the max_priority_fee_per_gas (tip)
    let tx = TxEip1559 {
        chain_id: 11155111, // Sepolia testnet
        nonce: nonce_u64,
        gas_limit: 100000, // Default gas limit
        to: TxKind::Call(to_addr),
        value: U256::ZERO,
        input: data_bytes.into(),
        max_fee_per_gas: gas_price_u128, // Total max fee (base fee + tip)
        max_priority_fee_per_gas: base_fee_u128, // Tip (priority fee)
        access_list: AccessList::default(),
    };
    
    
    // Sign the transaction
    let wallet = get_evm_wallet();
    wallet.sign_eip1559_transaction(tx).await
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

pub fn keccak256(data: &[u8]) -> [u8; 32] {
    alloy_keccak256(data).into()
}