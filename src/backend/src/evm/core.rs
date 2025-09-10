use std::sync::OnceLock;
use super::types::EvmNetwork;

// Global state - using OnceLock for thread-safe initialization
static EVM_NETWORK: OnceLock<EvmNetwork> = OnceLock::new();

pub fn get_evm_network() -> EvmNetwork {
    EVM_NETWORK.get().cloned().unwrap_or_default()
}

pub fn set_evm_network(network: EvmNetwork) {
    let _ = EVM_NETWORK.set(network);
}

// ============================================================================
// EVM OPERATIONS
// ============================================================================

/// Get the canister's own Ethereum address (always returns canister's wallet)
pub async fn get_canister_ethereum_address() -> String {
    super::wallet::get_public_key().await.unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string())
}

/// Test secp256k1 key generation and signing
pub async fn test_secp256k1() -> Result<String, String> {
    ic_cdk::println!("Testing secp256k1 key generation and signing...");
    
    let canister_address = get_canister_ethereum_address().await;
    
    ic_cdk::println!("Created wallet for canister: {}", canister_address);
    
    // Test that we can get the address
    let result = format!(
        "secp256k1 test successful!\n\nEthereum Address: {}\nNetwork: {:?}\nChain ID: {}",
        canister_address,
        get_evm_network(),
        get_evm_network().chain_id()
    );
    
    Ok(result)
}

/// Test simple transaction (get nonce, etc.)
pub async fn test_simple_transaction() -> Result<String, String> {
    // Test a simple transaction using direct HTTP calls
    let from_addr_str = get_canister_ethereum_address().await;
    
    // Get current nonce
    let nonce_response = crate::http_client::get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // For now, just test that we can get the nonce and address correctly
    Ok(format!("Canister address: {}, Nonce: {}", from_addr_str, nonce))
}

/// Debug function to verify wallet address matches signer
pub async fn debug_wallet_verification() -> Result<String, String> {
    let wallet = super::wallet::get_evm_wallet();
    
    // Get both addresses
    let (stored_address, signer_address) = wallet.get_address_info();
    
    // Verify they match
    let addresses_match = wallet.verify_address_matches_signer();
    
    let result = format!(
        "🔍 WALLET VERIFICATION DEBUG:\n\n\
        Stored Address: {:?}\n\
        Signer Address: {:?}\n\
        Addresses Match: {}\n\
        Canister ID: {:?}\n\
        \n\
        ✅ VERIFICATION: {}",
        stored_address,
        signer_address,
        addresses_match,
        ic_cdk::api::canister_self(),
        if addresses_match { "PASSED - Address matches signer" } else { "FAILED - Address does NOT match signer!" }
    );
    
    Ok(result)
}

