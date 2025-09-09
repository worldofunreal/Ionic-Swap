use std::sync::OnceLock;
use primitive_types::U256;
use sha3::Digest;
use serde_json;

// ============================================================================
// LOCAL SECP256K1 WALLET (Like Solana Ed25519)
// ============================================================================

pub struct EvmWallet {
    private_key: [u8; 32],
    public_key: [u8; 33],
    address: String,
}

impl EvmWallet {
    pub fn new(seed: &[u8]) -> Self {
        // Generate deterministic private key from seed (like Solana)
        let mut private_key = [0u8; 32];
        
        // Hash the seed to get 32 bytes
        let seed_hash = keccak256(seed);
        private_key.copy_from_slice(&seed_hash);
        
        // Generate public key from private key
        let public_key = Self::private_to_public(&private_key);
        
        // Generate Ethereum address from public key
        let address = Self::public_to_address(&public_key);
        
        Self {
            private_key,
            public_key,
            address,
        }
    }
    
    fn private_to_public(private_key: &[u8; 32]) -> [u8; 33] {
        use k256::ecdsa::SigningKey;
        
        let signing_key = SigningKey::from_bytes(private_key.into())
            .expect("Invalid private key");
        let public_key = signing_key.verifying_key().to_encoded_point(true);
        
        let mut pubkey_bytes = [0u8; 33];
        pubkey_bytes.copy_from_slice(public_key.as_bytes());
        pubkey_bytes
    }
    
    fn public_to_address(public_key: &[u8; 33]) -> String {
        // Decompress public key and hash to get address
        let hash = keccak256(&public_key[1..]); // Skip compression byte
        format!("0x{}", hex::encode(&hash[12..32]))
    }
    
    pub fn get_address(&self) -> &str {
        &self.address
    }
    
    pub fn get_public_key_hex(&self) -> String {
        hex::encode(self.public_key)
    }
    
    pub fn sign_message(&self, message_hash: &[u8; 32]) -> ([u8; 32], [u8; 32], u8) {
        use k256::ecdsa::{SigningKey, signature::Signer, Signature};
        
        let signing_key = SigningKey::from_bytes(&self.private_key.into())
            .expect("Invalid private key");
        
        let signature: Signature = signing_key.sign(message_hash);
        let (r, s) = signature.split_bytes();
        
        // Convert GenericArray to [u8; 32]
        let r_bytes: [u8; 32] = r.into();
        let s_bytes: [u8; 32] = s.into();
        
        // Calculate recovery ID (v)
        let v = self.calculate_recovery_id(message_hash, &r_bytes, &s_bytes);
        
        (r_bytes, s_bytes, v)
    }
    
    fn calculate_recovery_id(&self, message_hash: &[u8; 32], r: &[u8; 32], s: &[u8; 32]) -> u8 {
        use k256::ecdsa::{VerifyingKey, Signature, RecoveryId};
        
        let verifying_key = VerifyingKey::from_sec1_bytes(&self.public_key)
            .expect("Invalid public key");
        
        for recovery_id in [0u8, 1] {
            if let Ok(recid) = RecoveryId::try_from(recovery_id) {
                if let Ok(sig) = Signature::try_from([r.as_slice(), s.as_slice()].concat().as_slice()) {
                    if let Ok(recovered_key) = VerifyingKey::recover_from_prehash(message_hash, &sig, recid) {
                        if recovered_key == verifying_key {
                            return recovery_id + 27; // Ethereum format
                        }
                    }
                }
            }
        }
        
        panic!("Failed to calculate recovery ID");
    }
}

// Global wallet instance (like Solana)
static EVM_WALLET: OnceLock<EvmWallet> = OnceLock::new();

fn get_evm_wallet() -> &'static EvmWallet {
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

pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = sha3::Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

// ============================================================================
// ETHEREUM ADDRESS MANAGEMENT
// ============================================================================

pub async fn get_public_key() -> Result<String, String> {
    let wallet = get_evm_wallet();
    Ok(wallet.get_address().to_string())
}

pub async fn get_ethereum_address() -> Result<String, String> {
    get_public_key().await
}

// ============================================================================
// TRANSACTION SIGNING & SENDING
// ============================================================================

pub async fn sign_eip1559_transaction(
    _from: &str,
    to: &str,
    nonce: &str,
    _gas_price: &str,
    base_fee_per_gas: &str,
    data: &str,
) -> Result<String, String> {
    const SEPOLIA_CHAIN_ID: u64 = 11155111;
    
    // Convert hex strings to U256
    let nonce_u256 = U256::from_str_radix(nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let base_fee_u256 = U256::from_str_radix(base_fee_per_gas, 16)
        .map_err(|e| format!("Invalid base fee: {}", e))?;
    
    // Calculate max fee per gas and max priority fee per gas
    let max_priority_fee_per_gas = U256::from(1500000000u64); // 1.5 gwei
    let max_fee_per_gas = base_fee_u256 * U256::from(2u64) + max_priority_fee_per_gas;
    
    // Gas limit for the transaction
    let gas_limit = U256::from(5000000u64); // 500k gas limit
    
    // Parse data - data is already hex-encoded, so we decode it to bytes
    let data_bytes = hex::decode(data.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid data: {}", e))?;
    
    // Create transaction hash for signing
    let tx_hash = create_transaction_hash(
        SEPOLIA_CHAIN_ID,
        nonce_u256,
        max_priority_fee_per_gas,
        max_fee_per_gas,
        gas_limit,
        to,
        U256::from(0u64),
        &data_bytes,
    );
    
    // Sign with our local wallet
    let wallet = get_evm_wallet();
    let (r, s, v) = wallet.sign_message(&tx_hash);
    
    // Create signed transaction
    let signed_tx = create_signed_transaction(
        SEPOLIA_CHAIN_ID,
        nonce_u256,
        max_priority_fee_per_gas,
        max_fee_per_gas,
        gas_limit,
        to,
        U256::from(0u64),
        &data_bytes,
        r,
        s,
        v,
    );
    
    Ok(format!("0x{}", hex::encode(signed_tx)))
}

fn create_transaction_hash(
    chain_id: u64,
    nonce: U256,
    max_priority_fee_per_gas: U256,
    max_fee_per_gas: U256,
    gas_limit: U256,
    to: &str,
    value: U256,
    data: &[u8],
) -> [u8; 32] {
    // Create EIP-1559 transaction hash
    let mut rlp_data = Vec::new();
    
    // Chain ID
    rlp_data.extend_from_slice(&chain_id.to_be_bytes());
    
    // Nonce
    let mut nonce_bytes = [0u8; 32];
    nonce.to_big_endian(&mut nonce_bytes);
    rlp_data.extend_from_slice(&nonce_bytes);
    
    // Max priority fee per gas
    let mut priority_fee_bytes = [0u8; 32];
    max_priority_fee_per_gas.to_big_endian(&mut priority_fee_bytes);
    rlp_data.extend_from_slice(&priority_fee_bytes);
    
    // Max fee per gas
    let mut max_fee_bytes = [0u8; 32];
    max_fee_per_gas.to_big_endian(&mut max_fee_bytes);
    rlp_data.extend_from_slice(&max_fee_bytes);
    
    // Gas limit
    let mut gas_limit_bytes = [0u8; 32];
    gas_limit.to_big_endian(&mut gas_limit_bytes);
    rlp_data.extend_from_slice(&gas_limit_bytes);
    
    // To address
    let to_bytes = hex::decode(to.trim_start_matches("0x")).unwrap_or_default();
    rlp_data.extend_from_slice(&to_bytes);
    
    // Value
    let mut value_bytes = [0u8; 32];
    value.to_big_endian(&mut value_bytes);
    rlp_data.extend_from_slice(&value_bytes);
    
    // Data
    rlp_data.extend_from_slice(data);
    
    // Access list (empty for now)
    rlp_data.push(0xc0); // Empty list
    
    keccak256(&rlp_data)
}

fn create_signed_transaction(
    chain_id: u64,
    nonce: U256,
    max_priority_fee_per_gas: U256,
    max_fee_per_gas: U256,
    gas_limit: U256,
    to: &str,
    value: U256,
    data: &[u8],
    r: [u8; 32],
    s: [u8; 32],
    v: u8,
) -> Vec<u8> {
    // Create signed EIP-1559 transaction
    let mut rlp_data = Vec::new();
    
    // Chain ID
    rlp_data.extend_from_slice(&chain_id.to_be_bytes());
    
    // Nonce
    let mut nonce_bytes = [0u8; 32];
    nonce.to_big_endian(&mut nonce_bytes);
    rlp_data.extend_from_slice(&nonce_bytes);
    
    // Max priority fee per gas
    let mut priority_fee_bytes = [0u8; 32];
    max_priority_fee_per_gas.to_big_endian(&mut priority_fee_bytes);
    rlp_data.extend_from_slice(&priority_fee_bytes);
    
    // Max fee per gas
    let mut max_fee_bytes = [0u8; 32];
    max_fee_per_gas.to_big_endian(&mut max_fee_bytes);
    rlp_data.extend_from_slice(&max_fee_bytes);
    
    // Gas limit
    let mut gas_limit_bytes = [0u8; 32];
    gas_limit.to_big_endian(&mut gas_limit_bytes);
    rlp_data.extend_from_slice(&gas_limit_bytes);
    
    // To address
    let to_bytes = hex::decode(to.trim_start_matches("0x")).unwrap_or_default();
    rlp_data.extend_from_slice(&to_bytes);
    
    // Value
    let mut value_bytes = [0u8; 32];
    value.to_big_endian(&mut value_bytes);
    rlp_data.extend_from_slice(&value_bytes);
    
    // Data
    rlp_data.extend_from_slice(data);
    
    // Access list (empty for now)
    rlp_data.push(0xc0); // Empty list
    
    // Signature components
    rlp_data.extend_from_slice(&r);
    rlp_data.extend_from_slice(&s);
    rlp_data.push(v);
    
    // EIP-1559 transaction type
    let mut signed_tx = vec![0x02]; // EIP-1559 type
    signed_tx.extend_from_slice(&rlp_data);
    
    signed_tx
}

pub async fn send_raw_transaction(signed_tx: &str) -> Result<String, String> {
    let params = format!("[\"{}\"]", signed_tx);
    let response = crate::http_client::make_json_rpc_call("eth_sendRawTransaction", &params).await?;
    
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
