use candid::Principal;
use ic_http_certification::HttpRequest;
use serde_json::json;
use sha3::{Digest, Keccak256};

// ============================================================================
// SOLANA RPC CONFIGURATION
// ============================================================================

/// Solana Devnet RPC endpoint
const SOLANA_DEVNET_RPC: &str = "https://api.devnet.solana.com";

/// Solana Testnet RPC endpoint  
const SOLANA_TESTNET_RPC: &str = "https://api.testnet.solana.com";

/// Get the current Solana RPC endpoint (using devnet for now)
fn get_solana_rpc_endpoint() -> &'static str {
    SOLANA_DEVNET_RPC
}

// ============================================================================
// SOLANA WALLET MANAGEMENT
// ============================================================================

#[derive(Debug, Clone)]
pub struct SolanaWallet {
    pub owner: Principal,
    pub solana_address: String,
}

impl SolanaWallet {
    pub fn new(owner: Principal) -> Self {
        // Derive Solana account from ICP principal
        let derivation_path = owner.as_slice();
        let solana_address = derive_solana_address(derivation_path);

        Self {
            owner,
            solana_address,
        }
    }

    pub fn get_solana_address(&self) -> String {
        self.solana_address.clone()
    }
}

/// Derive a Solana account from a derivation path
fn derive_solana_address(derivation_path: &[u8]) -> String {
    // For now, use a simple hash-based derivation
    // In production, you'd use proper HD wallet derivation
    let mut hasher = Keccak256::new();
    hasher.update(derivation_path);
    let hash = hasher.finalize();
    bs58::encode(&hash[..32]).into_string()
}

// ============================================================================
// HTTP RPC CALLS TO SOLANA
// ============================================================================

/// Make an HTTP RPC call to Solana
async fn call_solana_rpc(method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let request_body = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    let url = get_solana_rpc_endpoint();
    
    // Use the same HTTP client pattern as EVM
    let http_request = HttpRequest::post(url)
        .with_headers(vec![
            ("Content-Type".to_string(), "application/json".to_string()),
            ("User-Agent".to_string(), "ionic-swap-backend".to_string()),
        ])
        .with_body(request_body.into_bytes())
        .build();

    let response = crate::http_client::make_http_request(http_request).await?;
    
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;

    let response_json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    // Check for RPC error
    if let Some(error) = response_json.get("error") {
        return Err(format!("Solana RPC error: {:?}", error));
    }

    Ok(response_json)
}

// ============================================================================
// BASIC SOLANA OPERATIONS
// ============================================================================

/// Get Solana account balance
pub async fn get_solana_balance(account: String) -> Result<u64, String> {
    let params = json!([account]);
    let response = call_solana_rpc("getBalance", params).await?;
    
    // Extract balance from response - handle both direct result and nested value
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else if let Some(result) = response["result"]["value"].as_u64() {
        Ok(result)
    } else {
        // Debug: print the actual response structure
        let debug_response = serde_json::to_string(&response).unwrap_or_else(|_| "Failed to serialize".to_string());
        Err(format!("Invalid response format - no balance found. Response: {}", debug_response))
    }
}

/// Get Solana slot (block number)
pub async fn get_solana_slot() -> Result<u64, String> {
    let params = json!([]);
    let response = call_solana_rpc("getSlot", params).await?;
    
    // Extract slot from response
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else {
        Err("Invalid response format - no slot found".to_string())
    }
}

/// Get Solana account info
pub async fn get_solana_account_info(account: String) -> Result<String, String> {
    let params = json!([
        account,
        {
            "encoding": "base64"
        }
    ]);
    
    let response = call_solana_rpc("getAccountInfo", params).await?;
    
    // Return the full result as string
    if let Some(result) = response["result"]["value"].as_object() {
        Ok(serde_json::to_string(&result).unwrap())
    } else {
        Err("Invalid response format - no account info found".to_string())
    }
}

// ============================================================================
// SPL TOKEN OPERATIONS
// ============================================================================

/// Get SPL token account balance
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    let params = json!([token_account]);
    let response = call_solana_rpc("getTokenAccountBalance", params).await?;
    
    // Extract balance from response
    if let Some(amount) = response["result"]["value"]["amount"].as_str() {
        Ok(amount.to_string())
    } else {
        Err("Invalid response format - no token balance found".to_string())
    }
}

/// Get associated token account address
pub fn get_associated_token_address(
    wallet_address: &str,
    mint_address: &str,
) -> Result<String, String> {
    // This would need the full Solana SDK for proper derivation
    // For now, return a deterministic address based on inputs
    let combined = format!("{}{}", wallet_address, mint_address);
    let mut hasher = Keccak256::new();
    hasher.update(combined.as_bytes());
    let hash = hasher.finalize();
    Ok(bs58::encode(&hash[..32]).into_string())
}

/// Create associated token account instruction
pub fn create_associated_token_account_instruction(
    _funding_address: &str,
    wallet_address: &str,
    mint_address: &str,
) -> Result<(String, Vec<u8>), String> {
    // This would need the full Solana SDK for proper instruction building
    // For now, return a placeholder instruction structure
    let associated_account = get_associated_token_address(wallet_address, mint_address)?;

    // Create a basic instruction structure (this is simplified)
    let instruction_data = vec![
        1u8, // Instruction type: create associated token account
        // Additional data would be added here in real implementation
    ];

    Ok((associated_account, instruction_data))
}

/// Transfer SPL tokens instruction
pub fn transfer_spl_tokens_instruction(
    _source_address: &str,
    _destination_address: &str,
    _authority_address: &str,
    amount: u64,
) -> Result<Vec<u8>, String> {
    // This would need the full Solana SDK for proper instruction building
    // For now, return a basic instruction structure
    let mut instruction_data = vec![
        3u8, // Instruction type: transfer
    ];

    // Add amount as little-endian bytes
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    Ok(instruction_data)
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/// Send SOL transaction
pub async fn send_sol_transaction(
    from_address: &str,
    to_address: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };

    // Create transfer instruction (simplified)
    let instruction_data = vec![
        2u8, // Instruction type: transfer
    ];

    // In a real implementation, you would:
    // 1. Create proper Solana instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    // For now, return the blockhash and instruction data
    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from": from_address,
        "to": to_address,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}

/// Send SPL token transaction
pub async fn send_spl_token_transaction(
    from_token_account: &str,
    to_token_account: &str,
    authority: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash_params = json!([{"commitment": "confirmed"}]);
    let blockhash_response = call_solana_rpc("getLatestBlockhash", blockhash_params).await?;
    
    let blockhash = if let Some(result) = blockhash_response["result"]["value"]["blockhash"].as_str() {
        result
    } else {
        return Err("Failed to get blockhash".to_string());
    };

    // Create transfer instruction
    let instruction_data = transfer_spl_tokens_instruction(
        from_token_account,
        to_token_account,
        authority,
        amount,
    )?;

    // In a real implementation, you would:
    // 1. Create proper SPL token transfer instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from_token_account": from_token_account,
        "to_token_account": to_token_account,
        "authority": authority,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}
