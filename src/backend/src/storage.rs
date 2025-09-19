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
use crate::icp::types::{InternalToken, FaucetClaim, BalanceKey, SwapTransaction, SwapTransactionKey, PortfolioPoint, PortfolioPointKey, LiquidityPositionKey};
use crate::icp::liquidity::{LiquidityNeuron, PoolInfo, LiquidityConfig, LiquidityTransaction, FeeTransaction, VolatilityData};

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
const SWAP_TRANSACTIONS_MEMORY_ID: MemoryId = MemoryId::new(13);
const PORTFOLIO_POINTS_MEMORY_ID: MemoryId = MemoryId::new(14);
// Liquidity staking memory IDs
const LIQUIDITY_POSITIONS_MEMORY_ID: MemoryId = MemoryId::new(15);
const LIQUIDITY_POOLS_MEMORY_ID: MemoryId = MemoryId::new(16);
const LIQUIDITY_CONFIG_MEMORY_ID: MemoryId = MemoryId::new(17);
const LIQUIDITY_TRANSACTIONS_MEMORY_ID: MemoryId = MemoryId::new(18);
const FEE_TRANSACTIONS_MEMORY_ID: MemoryId = MemoryId::new(19);
const VOLATILITY_DATA_MEMORY_ID: MemoryId = MemoryId::new(20);

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

    // Swap transaction history storage
    static SWAP_TRANSACTIONS: RefCell<StableBTreeMap<SwapTransactionKey, SwapTransaction, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(SWAP_TRANSACTIONS_MEMORY_ID)))
    );

    // Portfolio points storage
    static PORTFOLIO_POINTS: RefCell<StableBTreeMap<PortfolioPointKey, PortfolioPoint, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(PORTFOLIO_POINTS_MEMORY_ID)))
    );

    // Liquidity staking storage
    static LIQUIDITY_POSITIONS: RefCell<StableBTreeMap<LiquidityPositionKey, LiquidityNeuron, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(LIQUIDITY_POSITIONS_MEMORY_ID)))
    );

    static LIQUIDITY_POOLS: RefCell<StableBTreeMap<String, PoolInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(LIQUIDITY_POOLS_MEMORY_ID)))
    );

    static LIQUIDITY_CONFIG: RefCell<StableBTreeMap<u8, LiquidityConfig, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(LIQUIDITY_CONFIG_MEMORY_ID)))
    );

    static LIQUIDITY_TRANSACTIONS: RefCell<StableBTreeMap<String, LiquidityTransaction, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(LIQUIDITY_TRANSACTIONS_MEMORY_ID)))
    );

    static FEE_TRANSACTIONS: RefCell<StableBTreeMap<String, FeeTransaction, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FEE_TRANSACTIONS_MEMORY_ID)))
    );

    static VOLATILITY_DATA: RefCell<StableBTreeMap<String, VolatilityData, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(VOLATILITY_DATA_MEMORY_ID)))
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
                                symbol: "BTC".to_string(),
                                name: "Bitcoin".to_string(),
                                decimals: 8,
                                total_supply: 21_000_000_000_000_000, // 21M BTC
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "ETH".to_string(),
                                name: "Ethereum".to_string(),
                                decimals: 8,
                                total_supply: 120_000_000_000_000_000, // 120M ETH
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "XRP".to_string(),
                                name: "XRP".to_string(),
                                decimals: 6,
                                total_supply: 100_000_000_000_000_000, // 100B XRP
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "USDT".to_string(),
                                name: "Tether USD".to_string(),
                                decimals: 6,
                                total_supply: 1_000_000_000_000_000, // 1B USDT
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "BNB".to_string(),
                                name: "BNB".to_string(),
                                decimals: 8,
                                total_supply: 200_000_000_000_000_00, // 200M BNB
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "SOL".to_string(),
                                name: "Solana".to_string(),
                                decimals: 9,
                                total_supply: 500_000_000_000_000_000, // 500M SOL
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "DOGE".to_string(),
                                name: "Dogecoin".to_string(),
                                decimals: 8,
                                total_supply: 130_000_000_000_000_000, // 130B DOGE
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "ADA".to_string(),
                                name: "Cardano".to_string(),
                                decimals: 6,
                                total_supply: 45_000_000_000_000_000, // 45B ADA
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "TRX".to_string(),
                                name: "TRON".to_string(),
                                decimals: 6,
                                total_supply: 100_000_000_000_000_000, // 100B TRX
                                owner: canister_id,
                            },
                            InternalToken {
                                symbol: "ICP".to_string(),
                                name: "Internet Computer".to_string(),
                                decimals: 8,
                                total_supply: 500_000_000_000_000_000, // 500M ICP
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
                        let token_symbols = vec!["BTC", "ETH", "XRP", "USDT", "BNB", "SOL", "DOGE", "ADA", "TRX", "ICP"];
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

// Swap Transaction History Storage Operations
pub struct SwapTransactionStorage;

impl SwapTransactionStorage {
    /// Store a completed swap transaction
    pub fn store_transaction(transaction: SwapTransaction) {
        let key = SwapTransactionKey {
            user: transaction.user,
            transaction_id: transaction.id.clone(),
        };
        
        SWAP_TRANSACTIONS.with(|transactions| {
            transactions.borrow_mut().insert(key, transaction);
        });
    }

    /// Get all swap transactions for a specific user
    pub fn get_user_transactions(user: Principal) -> Vec<SwapTransaction> {
        SWAP_TRANSACTIONS.with(|transactions| {
            transactions.borrow()
                .iter()
                .filter(|entry| entry.key().user == user)
                .map(|entry| entry.value().clone())
                .collect()
        })
    }

    /// Get swap transactions for a user with pagination
    pub fn get_user_transactions_paginated(
        user: Principal, 
        limit: u32, 
        offset: u32
    ) -> Vec<SwapTransaction> {
        let all_transactions = Self::get_user_transactions(user);
        
        // Sort by timestamp descending (newest first)
        let mut sorted_transactions = all_transactions;
        sorted_transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        // Apply pagination
        let start = offset as usize;
        let end = (start + limit as usize).min(sorted_transactions.len());
        
        if start >= sorted_transactions.len() {
            return Vec::new();
        }
        
        sorted_transactions[start..end].to_vec()
    }

    /// Get transaction count for a user
    pub fn get_user_transaction_count(user: Principal) -> u32 {
        SWAP_TRANSACTIONS.with(|transactions| {
            transactions.borrow()
                .iter()
                .filter(|entry| entry.key().user == user)
                .count() as u32
        })
    }

    /// Get a specific transaction by ID
    pub fn get_transaction(user: Principal, transaction_id: &str) -> Option<SwapTransaction> {
        let key = SwapTransactionKey {
            user,
            transaction_id: transaction_id.to_string(),
        };
        
        SWAP_TRANSACTIONS.with(|transactions| {
            transactions.borrow().get(&key)
        })
    }

    /// Get total transaction count across all users
    pub fn get_total_transaction_count() -> u64 {
        SWAP_TRANSACTIONS.with(|transactions| {
            transactions.borrow().len() as u64
        })
    }
}

// Portfolio Storage Operations
pub struct PortfolioStorage;

impl PortfolioStorage {
    /// Store a portfolio point for a user
    pub fn store_portfolio_point(user: Principal, timestamp: u64, value_usdt: f64) {
        let key = PortfolioPointKey { user, timestamp };
        let point = PortfolioPoint { timestamp, value_usdt };
        
        PORTFOLIO_POINTS.with(|points| {
            points.borrow_mut().insert(key, point);
        });
    }

    /// Get all portfolio points for a user, sorted by timestamp
    pub fn get_user_portfolio_points(user: Principal) -> Vec<PortfolioPoint> {
        PORTFOLIO_POINTS.with(|points| {
            points.borrow()
                .iter()
                .filter(|entry| entry.key().user == user)
                .map(|entry| entry.value().clone())
                .collect::<Vec<_>>()
        })
        .into_iter()
        .collect::<Vec<_>>()
    }

    /// Get portfolio points for a user within a time range
    pub fn get_user_portfolio_points_range(
        user: Principal, 
        start_time: u64, 
        end_time: u64
    ) -> Vec<PortfolioPoint> {
        PORTFOLIO_POINTS.with(|points| {
            points.borrow()
                .iter()
                .filter(|entry| {
                    let key = entry.key();
                    key.user == user && key.timestamp >= start_time && key.timestamp <= end_time
                })
                .map(|entry| entry.value().clone())
                .collect::<Vec<_>>()
        })
        .into_iter()
        .collect::<Vec<_>>()
    }

    /// Get the latest portfolio point for a user
    pub fn get_latest_portfolio_point(user: Principal) -> Option<PortfolioPoint> {
        let mut points = Self::get_user_portfolio_points(user);
        points.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        points.first().cloned()
    }

    /// Get portfolio point from 24 hours ago
    pub fn get_portfolio_point_24h_ago(user: Principal) -> Option<PortfolioPoint> {
        let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
        let twenty_four_hours_ago = current_time - (24 * 60 * 60);
        
        let mut points = Self::get_user_portfolio_points_range(user, twenty_four_hours_ago, current_time);
        points.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
        points.first().cloned()
    }

    /// Get all-time high portfolio value for a user
    pub fn get_all_time_high(user: Principal) -> f64 {
        let points = Self::get_user_portfolio_points(user);
        points.into_iter()
            .map(|point| point.value_usdt)
            .fold(0.0, f64::max)
    }

    /// Get total number of portfolio points for a user
    pub fn get_user_portfolio_point_count(user: Principal) -> u32 {
        PORTFOLIO_POINTS.with(|points| {
            points.borrow()
                .iter()
                .filter(|entry| entry.key().user == user)
                .count() as u32
        })
    }
}

// ============================================================================
// LIQUIDITY STAKING DATABASE OPERATIONS
// ============================================================================

/// Database operations for liquidity staking system
/// Provides CRUD operations for positions, pools, config, transactions, and analytics
pub struct LiquidityStorage;

impl LiquidityStorage {
    // ============================================================================
    // POSITION OPERATIONS
    // ============================================================================

    /// Store a new liquidity position
    pub fn store_position(position: LiquidityNeuron) -> Result<(), String> {
        let key = LiquidityPositionKey {
            user: position.user,
            position_id: position.id.clone(),
        };

        let position_id = key.position_id.clone();
        LIQUIDITY_POSITIONS.with(|positions| {
            positions.borrow_mut().insert(key, position);
        });

        ic_cdk::println!("💾 Stored liquidity position: {}", position_id);
        Ok(())
    }

    /// Get a specific liquidity position
    pub fn get_position(user: Principal, position_id: &str) -> Option<LiquidityNeuron> {
        let key = LiquidityPositionKey {
            user,
            position_id: position_id.to_string(),
        };

        LIQUIDITY_POSITIONS.with(|positions| {
            positions.borrow().get(&key)
        })
    }

    /// Get all positions for a user
    pub fn get_user_positions(user: Principal) -> Vec<LiquidityNeuron> {
        LIQUIDITY_POSITIONS.with(|positions| {
            positions.borrow().iter()
                .filter(|entry| entry.key().user == user)
                .map(|entry| entry.value())
                .collect()
        })
    }

    /// Update an existing position
    pub fn update_position(position: LiquidityNeuron) -> Result<(), String> {
        let key = LiquidityPositionKey {
            user: position.user,
            position_id: position.id.clone(),
        };

        LIQUIDITY_POSITIONS.with(|positions| {
            if positions.borrow().contains_key(&key) {
                positions.borrow_mut().insert(key, position);
                Ok(())
            } else {
                Err(format!("Position {} not found", key.position_id))
            }
        })
    }

    /// Delete a position (used when fully withdrawn)
    pub fn delete_position(user: Principal, position_id: &str) -> Result<(), String> {
        let key = LiquidityPositionKey {
            user,
            position_id: position_id.to_string(),
        };

        LIQUIDITY_POSITIONS.with(|positions| {
            if positions.borrow_mut().remove(&key).is_some() {
                ic_cdk::println!("🗑️ Deleted liquidity position: {}", position_id);
                Ok(())
            } else {
                Err(format!("Position {} not found", position_id))
            }
        })
    }

    /// Get all positions for a specific token
    pub fn get_token_positions(token_symbol: &str) -> Vec<LiquidityNeuron> {
        LIQUIDITY_POSITIONS.with(|positions| {
            positions.borrow().iter()
                .filter(|entry| entry.value().token_symbol == token_symbol)
                .map(|entry| entry.value())
                .collect()
        })
    }

    /// Count total positions in the system
    pub fn get_total_position_count() -> u64 {
        LIQUIDITY_POSITIONS.with(|positions| {
            positions.borrow().len()
        })
    }

    // ============================================================================
    // POOL OPERATIONS
    // ============================================================================

    /// Get pool information for a token
    pub fn get_pool_info(token_symbol: &str) -> Option<PoolInfo> {
        LIQUIDITY_POOLS.with(|pools| {
            pools.borrow().get(&token_symbol.to_string())
        })
    }

    /// Update pool information
    pub fn update_pool_info(pool: PoolInfo) {
        LIQUIDITY_POOLS.with(|pools| {
            pools.borrow_mut().insert(pool.token_symbol.clone(), pool);
        });
    }

    /// Initialize pool if it doesn't exist
    pub fn init_pool_if_needed(token_symbol: &str) {
        LIQUIDITY_POOLS.with(|pools| {
            if !pools.borrow().contains_key(&token_symbol.to_string()) {
                let new_pool = PoolInfo::new(token_symbol.to_string());
                pools.borrow_mut().insert(token_symbol.to_string(), new_pool);
                ic_cdk::println!("🏊 Initialized new liquidity pool for {}", token_symbol);
            }
        });
    }

    /// Get all pool information with threshold data
    pub async fn get_all_pools() -> Vec<PoolInfo> {
        let config = Self::get_config();
        let mut pools = Vec::new();
        
        // First collect all pools
        let raw_pools: Vec<PoolInfo> = LIQUIDITY_POOLS.with(|pool_storage| {
            pool_storage.borrow().iter()
                .map(|entry| entry.value())
                .collect()
        });
        
        // Then process each pool with async price fetching
        for mut pool in raw_pools {
            // Get current price for threshold calculations
            let price = if pool.token_symbol == "USDT" {
                1.0
            } else {
                match crate::oracle::aggregator::get_pair_price(&pool.token_symbol).await {
                    Ok(trading_pair) => trading_pair.price,
                    Err(_) => {
                        // Use fallback prices for MVP
                        match pool.token_symbol.as_str() {
                            "BTC" => 45000.0,
                            "ETH" => 3000.0,
                            "SOL" => 100.0,
                            "BNB" => 300.0,
                            "XRP" => 0.6,
                            "DOGE" => 0.08,
                            "ADA" => 0.5,
                            "TRX" => 0.1,
                            "ICP" => 12.0,
                            _ => 1.0,
                        }
                    }
                }
            };
            
            // Get token decimals
            let decimals = crate::icp::config::get_token_config(&pool.token_symbol)
                .map(|(_, _, decimals)| decimals)
                .unwrap_or(6);
            
            // Calculate USDT equivalent values
            let decimal_divisor = 10.0_f64.powi(decimals as i32);
            pool.current_price_usdt = Some(price);
            pool.tvl_usdt = Some((pool.total_staked as f64 / decimal_divisor) * price);
            pool.available_liquidity_usdt = Some((pool.available_liquidity as f64 / decimal_divisor) * price);
            pool.total_fees_collected_usdt = Some((pool.total_fees_collected as f64 / decimal_divisor) * price);
            
            // Calculate fee earnings USDT values
            pool.fees_from_trading_usdt = Some((pool.fees_from_trading as f64 / decimal_divisor) * price);
            pool.fees_from_spread_usdt = Some((pool.fees_from_spread as f64 / decimal_divisor) * price);
            pool.fees_from_volatility_usdt = Some((pool.fees_from_volatility as f64 / decimal_divisor) * price);
            pool.fees_from_depth_usdt = Some((pool.fees_from_depth as f64 / decimal_divisor) * price);
            
            // Calculate threshold amounts in token units
            if let Some(token_thresholds) = config.token_thresholds.get(&pool.token_symbol) {
                let healthy_amount = token_thresholds.get_healthy_amount(price, decimals);
                let rebalance_amount = token_thresholds.get_rebalance_amount(price, decimals);
                let halt_amount = token_thresholds.get_halt_amount(price, decimals);
                
                // Update pool status based on current liquidity vs thresholds
                pool.liquidity_status = if pool.available_liquidity >= healthy_amount {
                    crate::icp::liquidity::LiquidityStatus::Healthy
                } else if pool.available_liquidity >= rebalance_amount {
                    crate::icp::liquidity::LiquidityStatus::NeedsRebalance
                } else if pool.available_liquidity >= halt_amount {
                    crate::icp::liquidity::LiquidityStatus::Critical
                } else {
                    crate::icp::liquidity::LiquidityStatus::Halted
                };
            }
            
            pools.push(pool);
        }
        
        pools
    }

    /// Get pool names (token symbols)
    pub fn get_pool_tokens() -> Vec<String> {
        LIQUIDITY_POOLS.with(|pools| {
            pools.borrow().iter()
                .map(|entry| entry.key().clone())
                .collect()
        })
    }

    // ============================================================================
    // CONFIGURATION OPERATIONS
    // ============================================================================

    /// Get the current liquidity configuration
    pub fn get_config() -> LiquidityConfig {
        LIQUIDITY_CONFIG.with(|config| {
            config.borrow().get(&0).unwrap_or_else(|| {
                // Return default config if none exists
                let default_config = LiquidityConfig::default();
                ic_cdk::println!("📝 Using default liquidity configuration");
                default_config
            })
        })
    }

    /// Set the liquidity configuration
    pub fn set_config(config: LiquidityConfig) -> Result<(), String> {
        // Validate configuration first
        config.validate()?;

        LIQUIDITY_CONFIG.with(|cfg| {
            cfg.borrow_mut().insert(0, config);
        });

        ic_cdk::println!("⚙️ Updated liquidity configuration");
        Ok(())
    }

    /// Check if a token is paused
    pub fn is_token_paused(token_symbol: &str) -> bool {
        let config = Self::get_config();
        config.paused_tokens.contains(&token_symbol.to_string())
    }

    // ============================================================================
    // TRANSACTION LOGGING OPERATIONS
    // ============================================================================

    /// Store a liquidity transaction for audit trail
    pub fn store_transaction(transaction: LiquidityTransaction) {
        LIQUIDITY_TRANSACTIONS.with(|txs| {
            txs.borrow_mut().insert(transaction.id.clone(), transaction);
        });
    }

    /// Get transaction by ID
    pub fn get_transaction(transaction_id: &str) -> Option<LiquidityTransaction> {
        LIQUIDITY_TRANSACTIONS.with(|txs| {
            txs.borrow().get(&transaction_id.to_string())
        })
    }

    /// Get all transactions for a user
    pub fn get_user_transactions(user: Principal) -> Vec<LiquidityTransaction> {
        LIQUIDITY_TRANSACTIONS.with(|txs| {
            txs.borrow().iter()
                .filter(|entry| entry.value().user == user)
                .map(|entry| entry.value())
                .collect()
        })
    }

    /// Get recent transactions (last N)
    pub fn get_recent_transactions(limit: usize) -> Vec<LiquidityTransaction> {
        LIQUIDITY_TRANSACTIONS.with(|txs| {
            let mut transactions: Vec<_> = txs.borrow().iter()
                .map(|entry| entry.value())
                .collect();
            
            // Sort by timestamp (newest first)
            transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            transactions.into_iter().take(limit).collect()
        })
    }

    /// Get transaction count for a user
    pub fn get_user_transaction_count(user: Principal) -> u32 {
        LIQUIDITY_TRANSACTIONS.with(|txs| {
            txs.borrow().iter()
                .filter(|entry| entry.value().user == user)
                .count() as u32
        })
    }

    // ============================================================================
    // FEE TRANSACTION OPERATIONS
    // ============================================================================

    /// Store a fee transaction for analytics
    pub fn store_fee_transaction(fee_tx: FeeTransaction) {
        FEE_TRANSACTIONS.with(|fee_txs| {
            fee_txs.borrow_mut().insert(fee_tx.id.clone(), fee_tx);
        });
    }

    /// Get fee transaction by ID
    pub fn get_fee_transaction(fee_tx_id: &str) -> Option<FeeTransaction> {
        FEE_TRANSACTIONS.with(|fee_txs| {
            fee_txs.borrow().get(&fee_tx_id.to_string())
        })
    }

    /// Get all fee transactions for a token pair
    pub fn get_token_pair_fee_transactions(token_pair: &str) -> Vec<FeeTransaction> {
        FEE_TRANSACTIONS.with(|fee_txs| {
            fee_txs.borrow().iter()
                .filter(|entry| entry.value().token_pair == token_pair)
                .map(|entry| entry.value())
                .collect()
        })
    }

    /// Get fee analytics for a time period
    pub fn get_fee_analytics(
        token_symbol: Option<String>,
        start_time: u64,
        end_time: u64
    ) -> (u64, u64, u64, u64, u64) { // (total, trading, spread, volatility, depth)
        FEE_TRANSACTIONS.with(|fee_txs| {
            let relevant_txs: Vec<_> = fee_txs.borrow().iter()
                .filter(|entry| {
                    let tx = entry.value();
                    tx.timestamp >= start_time && tx.timestamp <= end_time &&
                    (token_symbol.is_none() || tx.token_pair.contains(token_symbol.as_ref().unwrap()))
                })
                .map(|entry| entry.value())
                .collect();

            let total_fees = relevant_txs.iter().map(|tx| tx.fee_breakdown.total_fee).sum();
            let trading_fees = relevant_txs.iter().map(|tx| tx.fee_breakdown.base_trading_fee).sum();
            let spread_fees = relevant_txs.iter().map(|tx| tx.fee_breakdown.spread_base_fee).sum();
            let volatility_fees = relevant_txs.iter().map(|tx| tx.fee_breakdown.volatility_fee).sum();
            let depth_fees = relevant_txs.iter().map(|tx| tx.fee_breakdown.depth_fee).sum();

            (total_fees, trading_fees, spread_fees, volatility_fees, depth_fees)
        })
    }

    // ============================================================================
    // VOLATILITY DATA OPERATIONS
    // ============================================================================

    /// Get volatility data for a token
    pub fn get_volatility_data(token_symbol: &str) -> Option<VolatilityData> {
        VOLATILITY_DATA.with(|vol_data| {
            vol_data.borrow().get(&token_symbol.to_string())
        })
    }

    /// Update volatility data for a token
    pub fn update_volatility_data(volatility: VolatilityData) {
        VOLATILITY_DATA.with(|vol_data| {
            vol_data.borrow_mut().insert(volatility.token_symbol.clone(), volatility);
        });
    }

    /// Initialize volatility tracking for a token
    pub fn init_volatility_if_needed(token_symbol: &str) {
        VOLATILITY_DATA.with(|vol_data| {
            if !vol_data.borrow().contains_key(&token_symbol.to_string()) {
                let new_volatility = VolatilityData::new(token_symbol.to_string());
                vol_data.borrow_mut().insert(token_symbol.to_string(), new_volatility);
                ic_cdk::println!("📈 Initialized volatility tracking for {}", token_symbol);
            }
        });
    }

    /// Get current volatility for a token
    pub fn get_current_volatility(token_symbol: &str) -> f64 {
        Self::get_volatility_data(token_symbol)
            .map(|vol| vol.current_volatility_1h)
            .unwrap_or(0.0)
    }

    // ============================================================================
    // AGGREGATE OPERATIONS (Cross-table queries)
    // ============================================================================

    /// Recalculate pool aggregates from individual positions
    /// Used for consistency checks and recovery
    pub fn recalculate_pool_aggregates(token_symbol: &str) -> Result<(), String> {
        let positions = Self::get_token_positions(token_symbol);
        ic_cdk::println!("🔍 Recalculating aggregates for {}: found {} positions", token_symbol, positions.len());
        
        let mut pool = Self::get_pool_info(token_symbol)
            .unwrap_or_else(|| PoolInfo::new(token_symbol.to_string()));

        // Log current pool state before reset
        ic_cdk::println!("📊 Pool {} before reset: staked={}, voting_power={:.2}, liquidity={}", 
                        token_symbol, pool.total_staked, pool.total_voting_power, pool.available_liquidity);

        // Reset aggregates (do NOT reset available_liquidity — it's managed by trades/stakes)
        pool.total_staked = 0;
        pool.total_voting_power = 0.0;

        // Recalculate from positions
        for (i, position) in positions.iter().enumerate() {
            ic_cdk::println!("  Position {}: user={}, amount={}, voting_power={:.2}", 
                           i, position.user, position.staked_amount, position.locked_amount() as f64);
            
            pool.total_staked += position.staked_amount;
            
            // Calculate voting power (simplified - will be enhanced in later stages)
            let base_voting_power = position.locked_amount() as f64;
            pool.total_voting_power += base_voting_power;
            
            // NOTE: available_liquidity is intentionally not recalculated here.
            // It is a live counter adjusted by swaps and stakes.
        }

        // Store values before update
        let total_staked = pool.total_staked;
        let total_voting_power = pool.total_voting_power;
        let total_liquidity = pool.available_liquidity;
        
        // Update pool
        Self::update_pool_info(pool);
        ic_cdk::println!("🔄 Recalculated aggregates for {}: {} staked, {:.2} voting power, {} liquidity", 
                        token_symbol, total_staked, total_voting_power, total_liquidity);
        
        Ok(())
    }

    /// Get system-wide statistics with USD conversion
    pub async fn get_system_stats_usdt() -> (u64, u64, f64, f64) { // (total_positions, total_pools, total_staked_usd, total_fees_usd)
        let total_positions = Self::get_total_position_count();
        let pools = Self::get_all_pools().await;
        let total_pools = pools.len() as u64;
        
        let mut total_staked_usd = 0.0;
        let mut total_fees_usd = 0.0;
        
        for pool in pools {
            // Get current price for this token
            let price = if pool.token_symbol == "USDT" {
                1.0
            } else {
                match crate::oracle::aggregator::get_pair_price(&pool.token_symbol).await {
                    Ok(trading_pair) => trading_pair.price,
                    Err(_) => {
                        // Use fallback prices for MVP
                        match pool.token_symbol.as_str() {
                            "BTC" => 45000.0,
                            "ETH" => 3000.0,
                            "SOL" => 100.0,
                            "BNB" => 300.0,
                            "XRP" => 0.6,
                            "DOGE" => 0.08,
                            "ADA" => 0.5,
                            "TRX" => 0.1,
                            "ICP" => 12.0,
                            _ => 1.0,
                        }
                    }
                }
            };
            
            // Convert token amounts to USD
            let decimals = crate::icp::config::get_token_config(&pool.token_symbol)
                .map(|(_, _, decimals)| decimals)
                .unwrap_or(6);
            let decimal_divisor = 10.0_f64.powi(decimals as i32);
            
            let staked_usd = (pool.total_staked as f64 / decimal_divisor) * price;
            let fees_usd = (pool.total_fees_collected as f64 / decimal_divisor) * price;
            
            total_staked_usd += staked_usd;
            total_fees_usd += fees_usd;
        }

        (total_positions, total_pools, total_staked_usd, total_fees_usd)
    }


    /// ⚡ NEW LIQUIDITY SYSTEM: Increase available liquidity in a pool (when users trade INTO a pool)
    pub fn increase_pool_liquidity(token_symbol: &str, amount: u64) -> Result<(), String> {
        let mut pool = Self::get_pool_info(token_symbol)
            .ok_or(format!("Liquidity pool not found for {}", token_symbol))?;
        
        pool.available_liquidity += amount;
        let new_total = pool.available_liquidity;
        Self::update_pool_info(pool);
        
        ic_cdk::println!("📈 Increased {} pool liquidity by {} (new total: {})", 
            token_symbol, amount, new_total);
        Ok(())
    }

    /// ⚡ NEW LIQUIDITY SYSTEM: Decrease available liquidity in a pool (when users trade OUT of a pool)
    pub fn decrease_pool_liquidity(token_symbol: &str, amount: u64) -> Result<(), String> {
        let mut pool = Self::get_pool_info(token_symbol)
            .ok_or(format!("Liquidity pool not found for {}", token_symbol))?;
        
        if pool.available_liquidity < amount {
            return Err(format!("Insufficient liquidity in {} pool: has {}, needs {}", 
                token_symbol, pool.available_liquidity, amount));
        }
        
        pool.available_liquidity -= amount;
        let new_total = pool.available_liquidity;
        Self::update_pool_info(pool);
        
        ic_cdk::println!("📉 Decreased {} pool liquidity by {} (new total: {})", 
            token_symbol, amount, new_total);
        Ok(())
    }

    /// ⚡ NEW LIQUIDITY SYSTEM: Add fees to a pool's fee counters
    pub fn add_pool_fees(
        token_symbol: &str, 
        trading_fees: u64, 
        spread_fees: u64, 
        volatility_fees: u64, 
        depth_fees: u64
    ) -> Result<(), String> {
        let mut pool = Self::get_pool_info(token_symbol)
            .ok_or(format!("Liquidity pool not found for {}", token_symbol))?;
        
        let total_fees = trading_fees + spread_fees + volatility_fees + depth_fees;
        
        // Update fee counters
        pool.fees_from_trading += trading_fees;
        pool.fees_from_spread += spread_fees;
        pool.fees_from_volatility += volatility_fees;
        pool.fees_from_depth += depth_fees;
        pool.total_fees_collected += total_fees;
        
        // Update global_fee_index (cumulative fee per unit of voting power)
        // Only update if there's voting power in the pool
        if pool.total_voting_power > 0.0 {
            let fee_per_voting_power = total_fees as f64 / pool.total_voting_power;
            pool.global_fee_index += fee_per_voting_power;
        }
        
        let final_fee_index = pool.global_fee_index;
        Self::update_pool_info(pool);
        
        ic_cdk::println!("💰 Added {} {} in fees to {} pool (trading: {}, spread: {}, volatility: {}, depth: {}) - global_fee_index: {:.6}", 
            total_fees, token_symbol, token_symbol, trading_fees, spread_fees, volatility_fees, depth_fees, final_fee_index);
        Ok(())
    }
}
