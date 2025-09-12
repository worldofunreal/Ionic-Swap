//! ICP Token Storage
//! 
//! This module manages the global state for the ICP token system.

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::OnceLock;
use candid::Principal;
use ic_cdk::api::canister_self;

use crate::icp::types::{InternalToken, FaucetClaim};

/// Global storage for internal tokens
static INTERNAL_TOKENS: OnceLock<Mutex<HashMap<String, InternalToken>>> = OnceLock::new();

/// Global storage for token balances
/// Structure: HashMap<token_symbol, HashMap<user_principal, balance>>
static TOKEN_BALANCES: OnceLock<Mutex<HashMap<String, HashMap<Principal, u64>>>> = OnceLock::new();

/// Global storage for faucet claims
static FAUCET_CLAIMS: OnceLock<Mutex<HashMap<Principal, FaucetClaim>>> = OnceLock::new();

/// Initialize the token storage system
pub fn init_storage() {
    let tokens = INTERNAL_TOKENS.get_or_init(|| Mutex::new(HashMap::new()));
    let balances = TOKEN_BALANCES.get_or_init(|| Mutex::new(HashMap::new()));
    let _claims = FAUCET_CLAIMS.get_or_init(|| Mutex::new(HashMap::new()));

    // Initialize all tokens with supply minted to canister
    let canister_id = canister_self();
    let mut tokens_guard = tokens.lock().unwrap();
    let mut balances_guard = balances.lock().unwrap();

    for (symbol, name, decimals) in crate::icp::config::SUPPORTED_TOKENS {
        let total_supply = crate::icp::config::get_token_supply(symbol);

        let token = InternalToken {
            symbol: symbol.to_string(),
            name: name.to_string(),
            decimals: *decimals,
            total_supply,
            owner: canister_id,
        };

        tokens_guard.insert(symbol.to_string(), token);

        // Initialize balance map for this token
        let mut token_balances = HashMap::new();
        token_balances.insert(canister_id, total_supply);
        balances_guard.insert(symbol.to_string(), token_balances);
    }

    ic_cdk::println!("✅ Initialized {} internal tokens with supply minted to canister", 
                     crate::icp::config::SUPPORTED_TOKENS.len());
}

/// Get the tokens storage
pub fn get_tokens_storage() -> &'static Mutex<HashMap<String, InternalToken>> {
    INTERNAL_TOKENS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Get the balances storage
pub fn get_balances_storage() -> &'static Mutex<HashMap<String, HashMap<Principal, u64>>> {
    TOKEN_BALANCES.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Get the claims storage
pub fn get_claims_storage() -> &'static Mutex<HashMap<Principal, FaucetClaim>> {
    FAUCET_CLAIMS.get_or_init(|| Mutex::new(HashMap::new()))
}
