//! ICP Token Swap Operations
//! 
//! This module handles market swaps between internal tokens using oracle prices.

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use crate::icp::storage::IcpTokenDatabase;
use crate::icp::config::is_supported_token;
use crate::oracle::aggregator::get_pair_price;
use crate::storage::{SwapTransactionStorage, PortfolioStorage};
use crate::icp::types::SwapTransaction;

// ============================================================================
// SWAP TYPES
// ============================================================================

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct SwapRequest {
    pub from_token: String,    // Token symbol to sell (e.g., "USDT")
    pub to_token: String,      // Token symbol to buy (e.g., "BTC")
    pub amount: u64,           // Amount of from_token to sell (with decimals)
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct SwapResult {
    pub from_token: String,
    pub to_token: String,
    pub from_amount: u64,      // Amount sold
    pub to_amount: u64,        // Amount received
    pub from_price: f64,       // Price of from_token in USD
    pub to_price: f64,         // Price of to_token in USD
    pub timestamp: u64,
}

// ============================================================================
// SWAP OPERATIONS
// ============================================================================

/// Execute a market swap between two internal tokens (NEW LIQUIDITY SYSTEM)
pub async fn market_swap(
    caller: Principal,
    request: SwapRequest
) -> Result<SwapResult, String> {
    ic_cdk::println!("🔄 Market swap request from {}", caller);
    ic_cdk::println!("   From: {} {} to {}", request.amount, request.from_token, request.to_token);
    
    // Validate tokens
    if !is_supported_token(&request.from_token) {
        return Err(format!("Token {} is not supported", request.from_token));
    }
    if !is_supported_token(&request.to_token) {
        return Err(format!("Token {} is not supported", request.to_token));
    }
    if request.from_token == request.to_token {
        return Err("Cannot swap token to itself".to_string());
    }
    if request.amount == 0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    // Get current prices from oracle
    // USDT has a fixed price of $1.00 since it's the base currency
    let from_price = if request.from_token == "USDT" {
        crate::oracle::types::TradingPair {
            base: "USDT".to_string(),
            quote: "USD".to_string(),
            price: 1.0,
            last_updated: ic_cdk::api::time() / 1_000_000_000,
            sources_count: 1,
        }
    } else {
        ic_cdk::println!("   🔍 Fetching price for {}...", request.from_token);
        get_pair_price(&request.from_token).await
            .map_err(|e| {
                ic_cdk::println!("   ❌ Failed to get price for {}: {}", request.from_token, e);
                format!("Failed to get price for {}: {}", request.from_token, e)
            })?
    };
    
    let to_price = if request.to_token == "USDT" {
        crate::oracle::types::TradingPair {
            base: "USDT".to_string(),
            quote: "USD".to_string(),
            price: 1.0,
            last_updated: ic_cdk::api::time() / 1_000_000_000,
            sources_count: 1,
        }
    } else {
        ic_cdk::println!("   🔍 Fetching price for {}...", request.to_token);
        get_pair_price(&request.to_token).await
            .map_err(|e| {
                ic_cdk::println!("   ❌ Failed to get price for {}: {}", request.to_token, e);
                format!("Failed to get price for {}: {}", request.to_token, e)
            })?
    };
    
    ic_cdk::println!("   Current prices: {} = ${}, {} = ${}", 
        request.from_token, from_price.price,
        request.to_token, to_price.price
    );
    
    // Calculate swap amount
    // Formula: to_amount = (from_amount * from_price) / to_price
    let from_value_usd = request.amount as f64 * from_price.price / get_decimal_divisor(&request.from_token);
    let to_amount = (from_value_usd / to_price.price * get_decimal_divisor(&request.to_token)) as u64;
    
    ic_cdk::println!("   Swap calculation: {} {} (${})", 
        request.amount, request.from_token, from_value_usd
    );
    ic_cdk::println!("   Will receive: {} {}", to_amount, request.to_token);
    
    // Check user has sufficient balance
    let user_from_balance = IcpTokenDatabase::get_balance(caller, &request.from_token);
    
    if user_from_balance < request.amount {
        return Err(format!("Insufficient balance. You have {} {} but trying to swap {}", 
            user_from_balance, request.from_token, request.amount));
    }
    
    // Check staker liquidity pool has sufficient balance
    let pool_info = crate::storage::LiquidityStorage::get_pool_info(&request.to_token)
        .ok_or(format!("Liquidity pool not found for {}", request.to_token))?;
    
    // Get current configuration for fees and thresholds
    let config = crate::storage::LiquidityStorage::get_config();
    let to_token_config = config.token_thresholds.get(&request.to_token)
        .ok_or(format!("Token thresholds not configured for {}", request.to_token))?;
    
    // Check if trading is halted due to low liquidity
    let halt_amount = to_token_config.get_halt_amount(to_price.price, get_token_decimals(&request.to_token));
    if pool_info.available_liquidity < halt_amount {
        return Err(format!("Trading halted for {} due to insufficient liquidity (${:.1}M remaining)", 
            request.to_token, 
            pool_info.available_liquidity as f64 * to_price.price / get_decimal_divisor(&request.to_token) / 1_000_000.0
        ));
    }
    
    // Apply fees and spreads to protect LPs
    let base_fee = config.fee_rate_base;
    let spread = config.spread_base;
    let volatility_penalty = config.k_vol * pool_info.current_volatility_1h;
    let total_fee_rate = base_fee + volatility_penalty;
    
    // Adjust to_amount for fees and spreads
    let fee_amount = (to_amount as f64 * total_fee_rate) as u64;
    let spread_amount = (to_amount as f64 * spread) as u64;
    let final_to_amount = to_amount.saturating_sub(fee_amount + spread_amount);
    
    // Check if we have enough liquidity for the final amount
    if pool_info.available_liquidity < final_to_amount {
        return Err(format!("Insufficient staker liquidity. Pool has {} {} but needs {} (after fees)", 
            pool_info.available_liquidity, request.to_token, final_to_amount));
    }
    
    // Execute transfers with new liquidity system
    let canister_id = ic_cdk::api::canister_self();
    
    // 1. Transfer from_token from user to canister (liquidity pool)
    IcpTokenDatabase::transfer_tokens(caller, canister_id, &request.from_token, request.amount)?;
    
    // 2. Transfer to_token from canister/staker pool to user (reduced amount due to fees)
    IcpTokenDatabase::transfer_tokens(canister_id, caller, &request.to_token, final_to_amount)?;
    
    let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    // Generate unique transaction ID
    let transaction_id = format!("{}_{}_{}", timestamp, caller, request.amount);
    
    // Record fee transaction for analytics
    let trade_notional = (request.amount as f64 * from_price.price / get_decimal_divisor(&request.from_token)) as u64;
    let fee_transaction = crate::icp::liquidity::FeeTransaction {
        id: format!("fee_{}_{}", timestamp, caller),
        swap_transaction_id: transaction_id.clone(),
        token_pair: format!("{}/{}", request.from_token, request.to_token),
        trader: caller,
        timestamp,
        fee_breakdown: crate::icp::liquidity::FeeBreakdown {
            total_fee: fee_amount + spread_amount,
            base_trading_fee: (request.amount as f64 * base_fee) as u64,
            spread_base_fee: spread_amount,
            volatility_fee: (request.amount as f64 * volatility_penalty) as u64,
            depth_fee: 0, // Not implemented in MVP
            fee_components: crate::icp::liquidity::FeeComponents {
                trade_notional,
                base_fee_rate: base_fee,
                spread_rate: spread,
                volatility_rate: volatility_penalty,
                depth_rate: 0.0,
                volatility_move_1h: pool_info.current_volatility_1h,
                trade_vs_liquidity: final_to_amount as f64 / pool_info.available_liquidity as f64,
            },
        },
        global_fee_index_before: pool_info.global_fee_index,
        global_fee_index_after: pool_info.global_fee_index + (fee_amount + spread_amount) as f64,
        stakers_benefited: 1, // Simplified for MVP - canister is the only LP initially
    };
    
    crate::storage::LiquidityStorage::store_fee_transaction(fee_transaction);
    
    // Update pool aggregates and global fee index
    crate::storage::LiquidityStorage::recalculate_pool_aggregates(&request.to_token)?;
    
    let result = SwapResult {
        from_token: request.from_token.clone(),
        to_token: request.to_token.clone(),
        from_amount: request.amount,
        to_amount: final_to_amount, // Show actual amount received (after fees)
        from_price: from_price.price,
        to_price: to_price.price,
        timestamp,
    };
    
    // Store transaction in history with new fee structure
    let swap_transaction = SwapTransaction {
        id: transaction_id.clone(),
        user: caller,
        from_token: request.from_token.clone(),
        to_token: request.to_token.clone(),
        from_amount: request.amount,
        to_amount: final_to_amount, // Actual amount received after fees
        from_price: from_price.price,
        to_price: to_price.price,
        timestamp,
        transaction_type: "market_with_fees".to_string(),
    };
    
    SwapTransactionStorage::store_transaction(swap_transaction);
    
    // Record portfolio snapshot after successful swap
    let current_portfolio_value = calculate_portfolio_value(caller).await;
    PortfolioStorage::store_portfolio_point(caller, timestamp, current_portfolio_value);
    ic_cdk::println!("   📊 Portfolio snapshot recorded: {} USDT", current_portfolio_value);
    
    ic_cdk::println!("   ✅ Swap executed successfully with new liquidity system!");
    ic_cdk::println!("   User paid: {} {}", result.from_amount, result.from_token);
    ic_cdk::println!("   User received: {} {} (after {:.2}% fees + {:.2}% spread)", 
        result.to_amount, result.to_token, total_fee_rate * 100.0, spread * 100.0);
    ic_cdk::println!("   Total fees collected: {} {} (distributed to stakers)", 
        fee_amount + spread_amount, result.to_token);
    ic_cdk::println!("   Transaction ID: {}", transaction_id);
    
    Ok(result)
}

/// Calculate current portfolio value for a user
async fn calculate_portfolio_value(user: Principal) -> f64 {
    let current_balances = IcpTokenDatabase::get_user_balances(user);
    let tokens = crate::icp::queries::get_all_tokens();
    
    let mut total_value = 0.0;
    for (symbol, amount) in current_balances.iter() {
        // Get price from oracle
        let price = if symbol.as_str() == "USDT" {
            1.0 // USDT is always $1
        } else {
            // Get price from oracle (oracle stores prices with base symbol as key)
            crate::oracle::get_pair_price(symbol)
                .await
                .map(|trading_pair| trading_pair.price)
                .unwrap_or(1.0)
        };
        
        let token = tokens.iter().find(|t| t.symbol == *symbol);
        let decimals = token.map(|t| t.decimals as u32).unwrap_or(6);
        let normalized_amount = *amount as f64 / (10.0_f64.powi(decimals as i32));
        
        total_value += normalized_amount * price;
    }
    
    total_value
}

/// Get the decimal divisor for a token
fn get_decimal_divisor(symbol: &str) -> f64 {
    match symbol {
        "BTC" | "DOGE" | "ICP" => 100_000_000.0,      // 8 decimals
        "ETH" => 100_000_000.0, // 8 decimals
        "BNB" => 100_000_000.0, // 8 decimals
        "SOL" => 1_000_000_000.0,                      // 9 decimals
        "XRP" | "USDT" | "ADA" | "TRX" => 1_000_000.0, // 6 decimals
        _ => 1_000_000.0,                               // Default 6 decimals
    }
}

/// Get the number of decimals for a token
fn get_token_decimals(symbol: &str) -> u8 {
    match symbol {
        "BTC" | "DOGE" | "ICP" | "ETH" | "BNB" => 8,  // 8 decimals
        "SOL" => 9,                                    // 9 decimals
        "XRP" | "USDT" | "ADA" | "TRX" => 6,          // 6 decimals
        _ => 6,                                        // Default 6 decimals
    }
}
