use std::collections::HashMap;
use crate::oracle::types::{PriceData, TradingPair, PriceUpdateResult};
use std::sync::{Mutex, OnceLock};

use super::binance;

// Track consecutive failures for trading halt logic
static CONSECUTIVE_FAILURES: OnceLock<Mutex<u32>> = OnceLock::new();

/// Update prices from Binance only (single source of truth)
pub async fn update_all_prices() -> Result<PriceUpdateResult, String> {
    
    // Initialize failure counter
    CONSECUTIVE_FAILURES.get_or_init(|| Mutex::new(0));
    
    // Try to fetch from Binance
    match binance::get_binance_prices().await {
        Ok(prices) => {
            // Reset failure counter on success
            {
                let mut failures = CONSECUTIVE_FAILURES.get().unwrap().lock().unwrap();
                *failures = 0;
            }
            
            ic_cdk::println!("   ✅ Binance: {} prices fetched", prices.len());
            
            // Convert to final prices format
            let final_prices = convert_to_trading_pairs(prices);
            
            // Update cache
            update_price_cache(final_prices.clone()).await?;
            
            let result = PriceUpdateResult {
                pairs_updated: final_prices.values().cloned().collect(),
                total_sources: 1,
                successful_sources: 1,
                timestamp: ic_cdk::api::time() / 1_000_000_000,
            };
            
            ic_cdk::println!("   🎉 Price update completed: {} pairs updated", result.pairs_updated.len());
            Ok(result)
        }
        Err(e) => {
            // Increment failure counter
            let failure_count = {
                let mut failures = CONSECUTIVE_FAILURES.get().unwrap().lock().unwrap();
                *failures += 1;
                *failures
            };
            
            ic_cdk::println!("   ❌ Binance failed (attempt {}): {}", failure_count, e);
            
            // Check if we should halt trading (3 consecutive failures)
            if failure_count >= 3 {
                ic_cdk::println!("   🚨 3 consecutive failures reached - halting trading");
                return Err("Binance API failed 3 times consecutively. Trading halted until successful connection restored.".to_string());
            }
            
            // Try to use cached prices as fallback
            ic_cdk::println!("   ⚠️  Attempting to use cached prices as fallback...");
            
            match get_current_prices().await {
                Ok(cached_prices) => {
                    if !cached_prices.is_empty() {
                        ic_cdk::println!("   📦 Using {} cached prices as fallback", cached_prices.len());
                        
                        let result = PriceUpdateResult {
                            pairs_updated: cached_prices.values().cloned().collect(),
                            total_sources: 1,
                            successful_sources: 0, // 0 because we're using cached data
                            timestamp: ic_cdk::api::time() / 1_000_000_000,
                        };
                        
                        ic_cdk::println!("   ⚠️  Using cached prices - {} pairs available", result.pairs_updated.len());
                        Ok(result)
                    } else {
                        ic_cdk::println!("   ❌ No cached prices available");
                        Err("Binance failed and no cached prices available. Trading unavailable.".to_string())
                    }
                }
                Err(cache_error) => {
                    ic_cdk::println!("   ❌ Failed to retrieve cached prices: {}", cache_error);
                    Err(format!("Binance failed and cache retrieval failed: {}. Trading unavailable.", cache_error))
                }
            }
        }
    }
}

/// Get current prices from cache
pub async fn get_current_prices() -> Result<HashMap<String, TradingPair>, String> {
    let cache = super::types::init_price_cache();
    let prices = cache.lock().unwrap();
    Ok(prices.clone())
}

/// Get specific trading pair price
pub async fn get_pair_price(symbol: &str) -> Result<TradingPair, String> {
    let cache = super::types::init_price_cache();
    let prices = cache.lock().unwrap();
    
    ic_cdk::println!("   🔍 Looking for price of {} in cache...", symbol);
    ic_cdk::println!("   📊 Cache contains {} prices: {:?}", prices.len(), prices.keys().collect::<Vec<_>>());
    
    prices.get(symbol).cloned()
        .ok_or_else(|| {
            ic_cdk::println!("   ❌ Price not found for {} in cache", symbol);
            format!("Price not found for {}", symbol)
        })
}

/// Convert PriceData to TradingPair format
fn convert_to_trading_pairs(prices: Vec<PriceData>) -> HashMap<String, TradingPair> {
    let mut final_prices = HashMap::new();
    
    for price in prices {
        let trading_pair = TradingPair {
            base: price.symbol.clone(),
            quote: "USDT".to_string(),
            price: price.price,
            last_updated: price.timestamp,
            sources_count: 1, // Only Binance
        };
        final_prices.insert(price.symbol, trading_pair);
    }
    
    final_prices
}

/// Update the price cache
async fn update_price_cache(prices: HashMap<String, TradingPair>) -> Result<(), String> {
    let cache = super::types::init_price_cache();
    let mut cache_guard = cache.lock().unwrap();
    
    for (symbol, pair) in prices {
        cache_guard.insert(symbol, pair);
    }
    
    Ok(())
}

/// Debug function to test Binance API (for testing only)
pub async fn debug_test_external_apis() -> Result<String, String> {
    ic_cdk::println!("🧪 Testing Binance API...");
    
    // Test Binance only
    match binance::get_binance_prices().await {
        Ok(prices) => {
            let result = format!("✅ Binance: {} prices", prices.len());
            ic_cdk::println!("🧪 API Test Results:\n{}", result);
            Ok(result)
        },
        Err(e) => {
            let result = format!("❌ Binance: {}", e);
            ic_cdk::println!("🧪 API Test Results:\n{}", result);
            Ok(result)
        }
    }
}
