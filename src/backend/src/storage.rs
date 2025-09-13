//! Unified Storage Module
//! 
//! This module provides a centralized storage system for all stable structures
//! in the canister, ensuring proper memory management and avoiding allocation conflicts.

use candid::Principal;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
use std::cell::RefCell;

use crate::user::types::{User, PrincipalList};
use crate::icp::types::{InternalToken, FaucetClaim, BalanceKey};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Memory IDs for different storage types
const USERS_MEMORY_ID: MemoryId = MemoryId::new(0);
const USERNAMES_MEMORY_ID: MemoryId = MemoryId::new(1);
const FOLLOWING_MEMORY_ID: MemoryId = MemoryId::new(2);
const FOLLOWERS_MEMORY_ID: MemoryId = MemoryId::new(3);
const ASSETS_MEMORY_ID: MemoryId = MemoryId::new(4);
const TOKENS_MEMORY_ID: MemoryId = MemoryId::new(10);
const BALANCES_MEMORY_ID: MemoryId = MemoryId::new(11);
const FAUCET_CLAIMS_MEMORY_ID: MemoryId = MemoryId::new(12);

// Single memory manager for all stable structures
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    // User-related storage
    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(USERS_MEMORY_ID)))
    );

    static USERNAMES: RefCell<StableBTreeMap<String, Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(USERNAMES_MEMORY_ID)))
    );

    static FOLLOWING: RefCell<StableBTreeMap<Principal, PrincipalList, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FOLLOWING_MEMORY_ID)))
    );

    static FOLLOWERS: RefCell<StableBTreeMap<Principal, PrincipalList, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FOLLOWERS_MEMORY_ID)))
    );

    static ASSETS: RefCell<StableBTreeMap<String, Vec<u8>, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(ASSETS_MEMORY_ID)))
    );

    // ICP token-related storage
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

// User Database Operations
pub struct UserDatabase;

impl UserDatabase {
    pub fn insert_user(user: User) {
        USERS.with(|users| {
            users.borrow_mut().insert(user.id, user.clone());
        });
        USERNAMES.with(|usernames| {
            usernames.borrow_mut().insert(user.username.clone(), user.id);
        });
    }

    pub fn get_user(principal: Principal) -> Option<User> {
        USERS.with(|users| {
            users.borrow().get(&principal)
        })
    }

    pub fn get_user_by_username(username: &str) -> Option<User> {
        USERNAMES.with(|usernames| {
            if let Some(principal) = usernames.borrow().get(&username.to_string()) {
                USERS.with(|users| {
                    users.borrow().get(&principal)
                })
            } else {
                None
            }
        })
    }

    pub fn update_user(user: User) {
        USERS.with(|users| {
            users.borrow_mut().insert(user.id, user);
        });
    }

    pub fn username_exists(username: &str) -> bool {
        let username_lower = username.to_lowercase();
        USERNAMES.with(|usernames| {
            usernames.borrow().iter().any(|entry| {
                entry.key().to_lowercase() == username_lower
            })
        })
    }

    pub fn get_user_count() -> u64 {
        USERS.with(|users| {
            users.borrow().len() as u64
        })
    }

    pub fn get_all_usernames() -> Vec<String> {
        USERNAMES.with(|usernames| {
            usernames.borrow().iter().map(|entry| entry.key().clone()).collect()
        })
    }

    pub fn search_users(query: &str, limit: u32) -> Vec<User> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();
        let mut count = 0;

        USERS.with(|users| {
            for entry in users.borrow().iter() {
                if count >= limit {
                    break;
                }

                let user = entry.value();
                let username_match = user.username.to_lowercase().contains(&query_lower);
                let display_name_match = user.display_name
                    .as_ref()
                    .map(|name| name.to_lowercase().contains(&query_lower))
                    .unwrap_or(false);

                if username_match || display_name_match {
                    results.push(user.clone());
                    count += 1;
                }
            }
        });

        results
    }

    // Following/Followers operations
    pub fn follow_user(follower: Principal, following: Principal) -> bool {
        let current_following = FOLLOWING.with(|following_map| {
            following_map.borrow().get(&follower).map(|list| list.0.clone()).unwrap_or_default()
        });
        
        if current_following.contains(&following) {
            return false;
        }
        
        let mut new_following = current_following;
        new_following.push(following);
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
        let current_followers = FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&following).map(|list| list.0.clone()).unwrap_or_default()
        });
        let mut new_followers = current_followers;
        new_followers.push(follower);
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow_mut().insert(following, PrincipalList(new_followers));
        });
        
        true
    }

    pub fn unfollow_user(follower: Principal, following: Principal) -> bool {
        let current_following = FOLLOWING.with(|following_map| {
            following_map.borrow().get(&follower).map(|list| list.0.clone()).unwrap_or_default()
        });
        
        if !current_following.contains(&following) {
            return false;
        }
        
        let new_following: Vec<Principal> = current_following.into_iter()
            .filter(|&p| p != following)
            .collect();
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
        let current_followers = FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&following).map(|list| list.0.clone()).unwrap_or_default()
        });
        let new_followers: Vec<Principal> = current_followers.into_iter()
            .filter(|&p| p != follower)
            .collect();
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow_mut().insert(following, PrincipalList(new_followers));
        });
        
        true
    }

    pub fn get_following_list(user: Principal) -> Vec<Principal> {
        FOLLOWING.with(|following_map| {
            following_map.borrow().get(&user).map(|list| list.0.clone()).unwrap_or_default()
        })
    }

    pub fn is_following(follower: Principal, following: Principal) -> bool {
        let following_list = Self::get_following_list(follower);
        following_list.contains(&following)
    }

    pub fn get_followers_list(user: Principal) -> Vec<Principal> {
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&user).map(|list| list.0.clone()).unwrap_or_default()
        })
    }

    // Asset storage operations
    pub fn store_asset(file_path: String, asset_data: Vec<u8>) {
        ASSETS.with(|assets| {
            assets.borrow_mut().insert(file_path, asset_data);
        });
    }

    pub fn get_asset(file_path: &str) -> Option<Vec<u8>> {
        ASSETS.with(|assets| {
            assets.borrow().get(&file_path.to_string())
        })
    }
}

// ICP Token Storage Operations
pub struct TokenStorage;

impl TokenStorage {
    /// Initialize the token storage system
    pub fn init_storage() {
        let canister_id = ic_cdk::api::canister_self();
        
        // Initialize default tokens if they don't exist
        if TOKENS.with(|tokens| tokens.borrow().is_empty()) {
            let default_tokens = vec![
                InternalToken {
                    symbol: "USDT".to_string(),
                    name: "Tether USD".to_string(),
                    decimals: 6,
                    total_supply: 1_000_000_000_000_000, // 1B USDT
                    owner: canister_id,
                },
                InternalToken {
                    symbol: "USDC".to_string(),
                    name: "USD Coin".to_string(),
                    decimals: 6,
                    total_supply: 1_000_000_000_000_000, // 1B USDC
                    owner: canister_id,
                },
                InternalToken {
                    symbol: "BTC".to_string(),
                    name: "Bitcoin".to_string(),
                    decimals: 8,
                    total_supply: 21_000_000_000_000_000, // 21M BTC
                    owner: canister_id,
                },
                InternalToken {
                    symbol: "ETH".to_string(),
                    name: "Ethereum".to_string(),
                    decimals: 18,
                    total_supply: 120_000_000_000_000_000, // 120M ETH (fits in u64)
                    owner: canister_id,
                },
            ];

            for token in default_tokens {
                TOKENS.with(|tokens| {
                    tokens.borrow_mut().insert(token.symbol.clone(), token.clone());
                });
                
                // Initialize canister balance for this token
                BalanceStorage::set_balance(canister_id, &token.symbol, token.total_supply);
            }
        } else {
            // If tokens already exist, ensure canister has proper balance
            let token_symbols = vec!["USDT", "USDC", "BTC", "ETH"];
            for symbol in token_symbols {
                if let Some(token) = TOKENS.with(|tokens| tokens.borrow().get(&symbol.to_string())) {
                    let current_balance = BalanceStorage::get_balance(canister_id, symbol);
                    if current_balance == 0 {
                        BalanceStorage::set_balance(canister_id, symbol, token.total_supply);
                        ic_cdk::println!("✅ Initialized canister balance for {}: {}", symbol, token.total_supply);
                    }
                }
            }
        }
    }

    pub fn get_all_tokens() -> Vec<InternalToken> {
        TOKENS.with(|tokens| {
            tokens.borrow().iter().map(|entry| entry.value().clone()).collect()
        })
    }

    pub fn get_token(symbol: &str) -> Option<InternalToken> {
        TOKENS.with(|tokens| {
            tokens.borrow().get(&symbol.to_string())
        })
    }

    pub fn create_token(token: InternalToken) -> Result<(), String> {
        if TOKENS.with(|tokens| tokens.borrow().contains_key(&token.symbol)) {
            return Err(format!("Token {} already exists", token.symbol));
        }
        
        TOKENS.with(|tokens| {
            tokens.borrow_mut().insert(token.symbol.clone(), token);
        });
        
        Ok(())
    }

    pub fn update_token(token: InternalToken) {
        TOKENS.with(|tokens| {
            tokens.borrow_mut().insert(token.symbol.clone(), token);
        });
    }

    pub fn delete_token(symbol: &str) -> Result<(), String> {
        if !TOKENS.with(|tokens| tokens.borrow().contains_key(&symbol.to_string())) {
            return Err(format!("Token {} not found", symbol));
        }
        
        TOKENS.with(|tokens| {
            tokens.borrow_mut().remove(&symbol.to_string());
        });
        
        Ok(())
    }
}

// Balance Storage Operations
pub struct BalanceStorage;

impl BalanceStorage {
    pub fn get_balance(user: Principal, symbol: &str) -> u64 {
        let key = BalanceKey { user, symbol: symbol.to_string() };
        BALANCES.with(|balances| {
            balances.borrow().get(&key).unwrap_or(0)
        })
    }

    pub fn set_balance(user: Principal, symbol: &str, amount: u64) {
        let key = BalanceKey { user, symbol: symbol.to_string() };
        BALANCES.with(|balances| {
            balances.borrow_mut().insert(key, amount);
        });
    }

    pub fn add_balance(user: Principal, symbol: &str, amount: u64) -> u64 {
        let current_balance = Self::get_balance(user, symbol);
        let new_balance = current_balance + amount;
        Self::set_balance(user, symbol, new_balance);
        new_balance
    }

    pub fn subtract_balance(user: Principal, symbol: &str, amount: u64) -> Result<u64, String> {
        let current_balance = Self::get_balance(user, symbol);
        if current_balance < amount {
            return Err(format!("Insufficient balance. Required: {}, Available: {}", amount, current_balance));
        }
        
        let new_balance = current_balance - amount;
        Self::set_balance(user, symbol, new_balance);
        Ok(new_balance)
    }

    pub fn transfer_balance(from: Principal, to: Principal, symbol: &str, amount: u64) -> Result<(), String> {
        Self::subtract_balance(from, symbol, amount)?;
        Self::add_balance(to, symbol, amount);
        Ok(())
    }

    pub fn get_user_balances(user: Principal) -> Vec<(String, u64)> {
        let mut balances = Vec::new();
        
        // Get all token symbols
        let token_symbols: Vec<String> = TOKENS.with(|tokens| {
            tokens.borrow().iter().map(|entry| entry.key().clone()).collect()
        });
        
        for symbol in token_symbols {
            let balance = Self::get_balance(user, &symbol);
            if balance > 0 {
                balances.push((symbol, balance));
            }
        }
        
        balances
    }
}

// Faucet Storage Operations
pub struct FaucetStorage;

impl FaucetStorage {
    pub fn get_faucet_claim(user: Principal) -> Option<FaucetClaim> {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow().get(&user)
        })
    }

    pub fn set_faucet_claim(claim: FaucetClaim) {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow_mut().insert(claim.user, claim);
        });
    }

    pub fn has_claimed_faucet(user: Principal) -> bool {
        FAUCET_CLAIMS.with(|claims| {
            claims.borrow().contains_key(&user)
        })
    }

    pub fn get_faucet_stats() -> (u64, u64) {
        let total_claims = FAUCET_CLAIMS.with(|claims| claims.borrow().len() as u64);
        let total_distributed = FAUCET_CLAIMS.with(|claims| {
            claims.borrow().iter()
                .map(|entry| entry.value().amount)
                .sum()
        });
        (total_claims, total_distributed)
    }
}
