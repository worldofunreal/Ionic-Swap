use serde_json::json;
use sha3::{Digest, Keccak256};

// ============================================================================
// SPL TOKEN PROGRAM CONSTANTS
// ============================================================================

/// SPL Token Program ID
pub const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/// SPL Associated Token Program ID
pub const ASSOCIATED_TOKEN_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

/// SPL Token 2022 Program ID
pub const TOKEN_2022_PROGRAM_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// ============================================================================
// SPL TOKEN INSTRUCTIONS
// ============================================================================

/// SPL Token instruction types
pub mod instruction_type {
    pub const INITIALIZE_MINT: u8 = 0;
    pub const INITIALIZE_ACCOUNT: u8 = 1;
    pub const INITIALIZE_MULTISIG: u8 = 2;
    pub const TRANSFER: u8 = 3;
    pub const APPROVE: u8 = 4;
    pub const REVOKE: u8 = 5;
    pub const SET_AUTHORITY: u8 = 6;
    pub const MINT_TO: u8 = 7;
    pub const BURN: u8 = 8;
    pub const CLOSE_ACCOUNT: u8 = 9;
    pub const FREEZE_ACCOUNT: u8 = 10;
    pub const THAW_ACCOUNT: u8 = 11;
    pub const TRANSFER_CHECKED: u8 = 12;
    pub const APPROVE_CHECKED: u8 = 13;
    pub const MINT_TO_CHECKED: u8 = 14;
    pub const BURN_CHECKED: u8 = 15;
    pub const INITIALIZE_ACCOUNT2: u8 = 16;
    pub const SYNC_NATIVE: u8 = 17;
    pub const INITIALIZE_ACCOUNT3: u8 = 18;
    pub const INITIALIZE_MULTISIG2: u8 = 19;
    pub const INITIALIZE_MINT2: u8 = 20;
}

// ============================================================================
// ASSOCIATED TOKEN ACCOUNT OPERATIONS
// ============================================================================

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
    funding_address: &str,
    wallet_address: &str,
    mint_address: &str,
) -> Result<serde_json::Value, String> {
    let associated_account = get_associated_token_address(wallet_address, mint_address)?;

    // Create instruction structure
    let instruction = json!({
        "program_id": ASSOCIATED_TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": funding_address,
                "is_signer": true,
                "is_writable": true
            },
            {
                "pubkey": associated_account,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": wallet_address,
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": mint_address,
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": "11111111111111111111111111111111", // System Program
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": TOKEN_PROGRAM_ID,
                "is_signer": false,
                "is_writable": false
            }
        ],
        "data": "" // Associated token program doesn't require data
    });

    Ok(instruction)
}

// ============================================================================
// SPL TOKEN TRANSFER OPERATIONS
// ============================================================================

/// Create SPL token transfer instruction
pub fn create_transfer_instruction(
    source_address: &str,
    destination_address: &str,
    authority_address: &str,
    amount: u64,
) -> Result<serde_json::Value, String> {
    // Create transfer instruction data
    let mut instruction_data = vec![instruction_type::TRANSFER];
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": source_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token transfer instruction with custom program ID
pub fn create_transfer_instruction_with_program_id(
    source_address: &str,
    destination_address: &str,
    authority_address: &str,
    amount: u64,
    program_id: &str,
) -> Result<serde_json::Value, String> {
    // Create transfer instruction data
    let mut instruction_data = vec![instruction_type::TRANSFER];
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Create instruction structure
    let instruction = json!({
        "program_id": program_id,
        "accounts": [
            {
                "pubkey": source_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token transfer checked instruction
pub fn create_transfer_checked_instruction(
    source_address: &str,
    destination_address: &str,
    authority_address: &str,
    amount: u64,
    decimals: u8,
) -> Result<serde_json::Value, String> {
    // Create transfer checked instruction data
    let mut instruction_data = vec![instruction_type::TRANSFER_CHECKED];
    instruction_data.extend_from_slice(&amount.to_le_bytes());
    instruction_data.push(decimals);

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": source_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            },
            {
                "pubkey": "11111111111111111111111111111111", // Mint address (would be passed as parameter)
                "is_signer": false,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token transfer checked instruction with mint
pub fn create_transfer_checked_instruction_with_mint(
    source_address: &str,
    destination_address: &str,
    authority_address: &str,
    mint_address: &str,
    amount: u64,
    decimals: u8,
) -> Result<serde_json::Value, String> {
    // Create transfer checked instruction data
    let mut instruction_data = vec![instruction_type::TRANSFER_CHECKED];
    instruction_data.extend_from_slice(&amount.to_le_bytes());
    instruction_data.push(decimals);

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": source_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            },
            {
                "pubkey": mint_address,
                "is_signer": false,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

// ============================================================================
// SPL TOKEN APPROVAL OPERATIONS
// ============================================================================

/// Create SPL token approve instruction
pub fn create_approve_instruction(
    account_address: &str,
    delegate_address: &str,
    authority_address: &str,
    amount: u64,
) -> Result<serde_json::Value, String> {
    // Create approve instruction data
    let mut instruction_data = vec![instruction_type::APPROVE];
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": account_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": delegate_address,
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token revoke instruction
pub fn create_revoke_instruction(
    account_address: &str,
    authority_address: &str,
) -> Result<serde_json::Value, String> {
    // Create revoke instruction data
    let instruction_data = vec![instruction_type::REVOKE];

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": account_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

// ============================================================================
// SPL TOKEN MINT OPERATIONS
// ============================================================================

/// Create SPL token mint to instruction
pub fn create_mint_to_instruction(
    mint_address: &str,
    destination_address: &str,
    authority_address: &str,
    amount: u64,
) -> Result<serde_json::Value, String> {
    // Create mint to instruction data
    let mut instruction_data = vec![instruction_type::MINT_TO];
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": mint_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token burn instruction
pub fn create_burn_instruction(
    account_address: &str,
    mint_address: &str,
    authority_address: &str,
    amount: u64,
) -> Result<serde_json::Value, String> {
    // Create burn instruction data
    let mut instruction_data = vec![instruction_type::BURN];
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": account_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": mint_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

// ============================================================================
// SPL TOKEN ACCOUNT OPERATIONS
// ============================================================================

/// Create SPL token initialize account instruction
pub fn create_initialize_account_instruction(
    account_address: &str,
    mint_address: &str,
    owner_address: &str,
) -> Result<serde_json::Value, String> {
    // Create initialize account instruction data
    let instruction_data = vec![instruction_type::INITIALIZE_ACCOUNT];

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": account_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": mint_address,
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": owner_address,
                "is_signer": false,
                "is_writable": false
            },
            {
                "pubkey": "11111111111111111111111111111111", // Rent Sysvar
                "is_signer": false,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

/// Create SPL token close account instruction
pub fn create_close_account_instruction(
    account_address: &str,
    destination_address: &str,
    authority_address: &str,
) -> Result<serde_json::Value, String> {
    // Create close account instruction data
    let instruction_data = vec![instruction_type::CLOSE_ACCOUNT];

    // Create instruction structure
    let instruction = json!({
        "program_id": TOKEN_PROGRAM_ID,
        "accounts": [
            {
                "pubkey": account_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": destination_address,
                "is_signer": false,
                "is_writable": true
            },
            {
                "pubkey": authority_address,
                "is_signer": true,
                "is_writable": false
            }
        ],
        "data": hex::encode(instruction_data)
    });

    Ok(instruction)
}

// ============================================================================
// SPL TOKEN UTILITIES
// ============================================================================

/// Get token program ID
pub fn token_program_id() -> String {
    TOKEN_PROGRAM_ID.to_string()
}

/// Get associated token program ID
pub fn associated_token_program_id() -> String {
    ASSOCIATED_TOKEN_PROGRAM_ID.to_string()
}

/// Validate SPL token address
pub fn is_valid_spl_token_address(address: &str) -> bool {
    if address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    // Try to decode as base58
    bs58::decode(address).into_vec().is_ok()
}

/// Parse SPL token amount from string
pub fn parse_token_amount(amount_str: &str) -> Result<u64, String> {
    amount_str.parse::<u64>()
        .map_err(|e| format!("Invalid token amount: {}", e))
}

/// Format SPL token amount to string
pub fn format_token_amount(amount: u64) -> String {
    amount.to_string()
}

/// Calculate token amount with decimals
pub fn calculate_token_amount(amount: u64, decimals: u8) -> u64 {
    amount * 10_u64.pow(decimals as u32)
}

/// Remove decimals from token amount
pub fn remove_token_decimals(amount: u64, decimals: u8) -> u64 {
    amount / 10_u64.pow(decimals as u32)
}
