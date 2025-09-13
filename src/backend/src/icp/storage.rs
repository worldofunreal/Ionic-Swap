//! ICP Token Storage
//! 
//! This module manages the global state for the ICP token system using stable storage.

use candid::Principal;
use ic_cdk::api::canister_self;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
use std::cell::RefCell;

use crate::icp::types::{InternalToken, FaucetClaim, BalanceKey};

type Memory = VirtualMemory<DefaultMemoryImpl>;

const TOKENS_MEMORY_ID: MemoryId = MemoryId::new(10);
const BALANCES_MEMORY_ID: MemoryId = MemoryId::new(11);
const FAUCET_CLAIMS_MEMORY_ID: MemoryId = MemoryId::new(12);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static TOKENS: RefCell<StableBTreeMap<String, InternalToken, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(TOKENS_MEMORY_ID)))
    );

    static BALANCES: RefCell<StableBTreeMap<BalanceKey, u64, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(BALANCES_MEMORY_ID)))
    );

    static FAUCET_CLAIMS: RefCell<StableBTreeMap<Principal, FaucetClaim, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FAUCET_CLAIMS_MEMORY_ID)))
    );
}

/// Initialize the token storage system
pub fn init_storage() {
    let canister_id = canister_self();

    // Initialize all tokens with supply minted to canister
    for (symbol, name, decimals) in crate::icp::config::SUPPORTED_TOKENS {
        let total_supply = crate::icp::config::get_token_supply(symbol);

        let token = InternalToken {
            symbol: symbol.to_string(),
            name: name.to_string(),
            decimals: *decimals,
            total_supply,
            owner: canister_id,
        };

        TOKENS.with(|tokens| {
            tokens.borrow_mut().insert(symbol.to_string(), token);
        });

        // Initialize canister balance for this token
        let balance_key = BalanceKey {
            user: canister_id,
            symbol: symbol.to_string(),
        };
        BALANCES.with(|balances| {
            balances.borrow_mut().insert(balance_key, total_supply);
        });
    }

    ic_cdk::println!("✅ Initialized {} internal tokens with supply minted to canister", 
                     crate::icp::config::SUPPORTED_TOKENS.len());
}

/// ICP Token Database Operations
pub struct IcpTokenDatabase;

impl IcpTokenDatabase {
    /// Get a token by symbol
    pub fn get_token(symbol: &str) -> Option<InternalToken> {
        TOKENS.with(|tokens| {
            tokens.borrow().get(&symbol.to_string())
        })
    }

    /// Get all tokens
    pub fn get_all_tokens() -> Vec<InternalToken> {
        TOKENS.with(|tokens| {
            tokens.borrow().iter().map(|entry| entry.value().clone()).collect()
        })
    }

    /// Update a token
    pub fn update_token(token: InternalToken) {
        TOKENS.with(|tokens| {
            tokens.borrow_mut().insert(token.symbol.clone(), token);
        });
    }

    /// Get balance for a specific user and token
    pub fn get_balance(user: Principal, symbol: &str) -> u64 {
        let balance_key = BalanceKey {
            user,
            symbol: symbol.to_string(),
        };
        BALANCES.with(|balances| {
            balances.borrow().get(&balance_key).unwrap_or(0)
        })
    }

    /// Set balance for a specific user and token
    pub fn set_balance(user: Principal, symbol: &str, amount: u64) {
        let balance_key = BalanceKey {
            user,
            symbol: symbol.to_string(),
        };
        BALANCES.with(|balances| {
            if amount == 0 {
                balances.borrow_mut().remove(&balance_key);
            } else {
                balances.borrow_mut().insert(balance_key, amount);
            }
        });
    }

    /// Transfer tokens between users
    pub fn transfer_tokens(from: Principal, to: Principal, symbol: &str, amount: u64) -> Result<(), String> {
        let from_balance = Self::get_balance(from, symbol);
        if from_balance < amount {
            return Err("Insufficient balance".to_string());
        }

        let to_balance = Self::get_balance(to, symbol);
        
        Self::set_balance(from, symbol, from_balance - amount);
        Self::set_balance(to, symbol, to_balance + amount);
        
        Ok(())
    }

    /// Get all balances for a user
    pub fn get_user_balances(user: Principal) -> std::collections::HashMap<String, u64> {
        let mut user_balances = std::collections::HashMap::new();
        
        BALANCES.with(|balances| {
            for entry in balances.borrow().iter() {
                let balance_key = entry.key();
                let amount = entry.value();
                if balance_key.user == user && amount > 0 {
                    user_balances.insert(balance_key.symbol.clone(), amount);
                }
            }
        });
        
        user_balances
    }

    /// Get circulating supply of a token (total supply minus canister balance)
    pub fn get_token_circulating_supply(symbol: &str) -> Option<u64> {
        let token = Self::get_token(symbol)?;
        let canister_balance = Self::get_balance(ic_cdk::api::canister_self(), symbol);
        Some(token.total_supply - canister_balance)
    }

    /// Store a faucet claim
    pub fn store_faucet_claim(claim: FaucetClaim) {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow_mut().insert(claim.user, claim);
        });
    }

    /// Get a faucet claim
    pub fn get_faucet_claim(user: Principal) -> Option<FaucetClaim> {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow().get(&user)
        })
    }

    /// Get all faucet claims
    pub fn get_all_faucet_claims() -> Vec<FaucetClaim> {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow().iter().map(|entry| entry.value().clone()).collect()
        })
    }
}
