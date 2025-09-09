use candid::Principal;
use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer};
use ic_cdk::api::canister_self;
use sha3::{Digest, Keccak256};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

// ============================================================================
// SOLANA WALLET MANAGEMENT
// ============================================================================

#[derive(Debug, Clone)]
pub struct SolanaWallet {
    pub owner: Principal,
    pub solana_address: String,
    pub signing_key: SigningKey,
    pub verifying_key: VerifyingKey,
}

// Global storage for deterministic key generation based on principal - using Mutex for thread safety
static WALLET_STORE: OnceLock<Mutex<HashMap<Vec<u8>, (SigningKey, VerifyingKey)>>> = OnceLock::new();

impl SolanaWallet {
    pub fn new(owner: Principal) -> Self {
        // Derive Solana account from ICP principal
        let derivation_path = owner.as_slice();
        let solana_address = derive_solana_address(derivation_path);
        
        // Get or generate deterministic keypair for this principal
        let (signing_key, verifying_key) = get_or_generate_keypair(derivation_path);

        Self {
            owner,
            solana_address,
            signing_key,
            verifying_key,
        }
    }

    pub fn get_solana_address(&self) -> String {
        self.solana_address.clone()
    }

    /// Get the Solana account as a base58 string
    pub fn solana_account(&self) -> String {
        self.solana_address.clone()
    }

    /// Sign a message using local Ed25519 key
    pub async fn sign_message(&self, message: &[u8]) -> Result<Vec<u8>, String> {
        ic_cdk::println!("Signing message with local Ed25519 key...");
        
        // Sign the message using ed25519-dalek
        let signature: Signature = self.signing_key.sign(message);
        let signature_bytes = signature.to_bytes().to_vec();
        
        ic_cdk::println!("Message signed successfully with local Ed25519: {} ({} bytes)", 
                        hex::encode(&signature_bytes), signature_bytes.len());
        
        Ok(signature_bytes)
    }

    /// Get the public key as bytes
    pub fn get_public_key_bytes(&self) -> Vec<u8> {
        self.verifying_key.to_bytes().to_vec()
    }

    /// Get the public key as base58 string (Solana format)
    pub fn get_public_key_base58(&self) -> String {
        bs58::encode(&self.verifying_key.to_bytes()).into_string()
    }
}

// ============================================================================
// ED25519 KEY MANAGEMENT
// ============================================================================

/// Get or generate a deterministic Ed25519 keypair for local testing
fn get_or_generate_keypair(derivation_path: &[u8]) -> (SigningKey, VerifyingKey) {
    // Initialize the store if it doesn't exist
    let store = WALLET_STORE.get_or_init(|| Mutex::new(HashMap::new()));
    
    // Lock the store and check if we already have this keypair
    let mut store_guard = store.lock().unwrap();
    
    if let Some((signing_key, verifying_key)) = store_guard.get(derivation_path) {
        return (signing_key.clone(), *verifying_key);
    }
    
    // Generate deterministic keypair from derivation path
    let seed = generate_deterministic_seed(derivation_path);
    let signing_key = SigningKey::from_bytes(&seed);
    let verifying_key = signing_key.verifying_key();
    
    // Store the keypair for future use
    store_guard.insert(derivation_path.to_vec(), (signing_key.clone(), verifying_key));
    
    (signing_key, verifying_key)
}

/// Generate a deterministic seed from derivation path
fn generate_deterministic_seed(derivation_path: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(b"solana_wallet_seed");
    hasher.update(derivation_path);
    let hash = hasher.finalize();
    
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash[..32]);
    seed
}

/// Get the canister's Ed25519 public key for local testing
pub async fn get_ed25519_public_key_async() -> Result<(Vec<u8>, [u8; 32]), String> {
    ic_cdk::println!("Getting local Ed25519 key for testing...");
    
    // Use the canister's principal as derivation path
    let canister_id = canister_self();
    let derivation_path = canister_id.as_slice();
    
    let (_, verifying_key) = get_or_generate_keypair(derivation_path);
    let public_key_bytes = verifying_key.to_bytes().to_vec();
    
    // Generate a dummy chain code for compatibility
    let mut chain_code = [0u8; 32];
    let mut hasher = Keccak256::new();
    hasher.update(b"chain_code");
    hasher.update(derivation_path);
    let hash = hasher.finalize();
    chain_code.copy_from_slice(&hash[..32]);
    
    ic_cdk::println!("Got local Ed25519 public key: {} ({} bytes)", 
                    hex::encode(&public_key_bytes), public_key_bytes.len());
    
    Ok((public_key_bytes, chain_code))
}

// ============================================================================
// SOLANA ADDRESS UTILITIES
// ============================================================================

/// Derive a Solana account from a derivation path
fn derive_solana_address(derivation_path: &[u8]) -> String {
    // Use the SAME derivation method as key generation for consistency
    let mut hasher = Keccak256::new();
    hasher.update(b"solana_wallet_seed");
    hasher.update(derivation_path);
    let hash = hasher.finalize();
    bs58::encode(&hash[..32]).into_string()
}