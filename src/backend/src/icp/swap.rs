//! ICP Token Swap Operations
//! 
//! This module handles market swaps between internal tokens using oracle prices.

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use crate::icp::storage::IcpTokenDatabase;
use crate::icp::config::is_supported_token;
use crate::oracle::aggregator::get_pair_price;

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

/// Execute a market swap between two internal tokens
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
    
    // Check canister has sufficient balance of to_token
    let canister_id = ic_cdk::api::canister_self();
    let canister_to_balance = IcpTokenDatabase::get_balance(canister_id, &request.to_token);
    
    if canister_to_balance < to_amount {
        return Err(format!("Insufficient liquidity. Canister has {} {} but needs {}", 
            canister_to_balance, request.to_token, to_amount));
    }
    
    // Execute transfers
    // 1. Transfer from_token from user to canister
    IcpTokenDatabase::transfer_tokens(caller, canister_id, &request.from_token, request.amount)?;
    
    // 2. Transfer to_token from canister to user
    IcpTokenDatabase::transfer_tokens(canister_id, caller, &request.to_token, to_amount)?;
    
    let result = SwapResult {
        from_token: request.from_token.clone(),
        to_token: request.to_token.clone(),
        from_amount: request.amount,
        to_amount,
        from_price: from_price.price,
        to_price: to_price.price,
        timestamp: ic_cdk::api::time() / 1_000_000_000, // Convert nanoseconds to seconds
    };
    
    ic_cdk::println!("   ✅ Swap executed successfully!");
    ic_cdk::println!("   User paid: {} {}", result.from_amount, result.from_token);
    ic_cdk::println!("   User received: {} {}", result.to_amount, result.to_token);
    
    Ok(result)
}

/// Get the decimal divisor for a token
fn get_decimal_divisor(symbol: &str) -> f64 {
    match symbol {
        "BTC" | "DOGE" | "ICP" => 100_000_000.0,      // 8 decimals
        "ETH" | "BNB" => 1_000_000_000_000_000_000.0, // 18 decimals
        "SOL" => 1_000_000_000.0,                      // 9 decimals
        "XRP" | "USDT" | "ADA" | "TRX" => 1_000_000.0, // 6 decimals
        _ => 1_000_000.0,                               // Default 6 decimals
    }
}
