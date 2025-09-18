use std::collections::HashMap;
use crate::oracle::types::{PriceData, TradingPair, PriceUpdateResult};
use std::sync::{Mutex, OnceLock};

use super::coingecko;

// Track consecutive failures for trading halt logic
static CONSECUTIVE_FAILURES: OnceLock<Mutex<u32>> = OnceLock::new();

// Track API call statistics
static API_STATS: OnceLock<Mutex<ApiStats>> = OnceLock::new();

#[derive(Debug, Clone)]
struct ApiStats {
    successful_calls: u32,
    failed_calls: u32,
    first_call_time: Option<u64>,
    last_successful_call: Option<u64>,
    last_failed_call: Option<u64>,
    consecutive_successes: u32,
    max_consecutive_successes: u32,
    total_calls: u32,
}

/// Update prices from CoinGecko (single source of truth)
pub async fn update_all_prices() -> Result<PriceUpdateResult, String> {
    
    // Initialize counters
    CONSECUTIVE_FAILURES.get_or_init(|| Mutex::new(0));
    API_STATS.get_or_init(|| Mutex::new(ApiStats {
        successful_calls: 0,
        failed_calls: 0,
        first_call_time: None,
        last_successful_call: None,
        last_failed_call: None,
        consecutive_successes: 0,
        max_consecutive_successes: 0,
        total_calls: 0,
    }));
    
    let current_time = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
    
    // Update total calls and first call time
    {
        let mut stats = API_STATS.get().unwrap().lock().unwrap();
        stats.total_calls += 1;
        if stats.first_call_time.is_none() {
            stats.first_call_time = Some(current_time);
        }
    }
    
    // Try to fetch from CoinGecko
    match coingecko::get_coingecko_prices().await {
        Ok(prices) => {
            // Reset failure counter on success
            {
                let mut failures = CONSECUTIVE_FAILURES.get().unwrap().lock().unwrap();
                *failures = 0;
            }
            
            // Update success stats
            {
                let mut stats = API_STATS.get().unwrap().lock().unwrap();
                stats.successful_calls += 1;
                stats.last_successful_call = Some(current_time);
                stats.consecutive_successes += 1;
                if stats.consecutive_successes > stats.max_consecutive_successes {
                    stats.max_consecutive_successes = stats.consecutive_successes;
                }
            }
            
            ic_cdk::println!("   ✅ CoinGecko: {} prices fetched", prices.len());
            
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
            // Update failure stats
            {
                let mut stats = API_STATS.get().unwrap().lock().unwrap();
                stats.failed_calls += 1;
                stats.last_failed_call = Some(current_time);
                stats.consecutive_successes = 0; // Reset consecutive successes
            }
            
            // Increment failure counter
            let failure_count = {
                let mut failures = CONSECUTIVE_FAILURES.get().unwrap().lock().unwrap();
                *failures += 1;
                *failures
            };
            
            // Log detailed stats
            {
                let stats = API_STATS.get().unwrap().lock().unwrap();
                ic_cdk::println!("   ❌ CoinGecko failed (attempt {}): {}", failure_count, e);
                ic_cdk::println!("   📊 API Stats - Success: {}, Failed: {}, Total: {}, Consecutive Success: {}", 
                    stats.successful_calls, stats.failed_calls, stats.total_calls, stats.consecutive_successes);
            }
            
            // Check if we should halt trading (3 consecutive failures)
            if failure_count >= 3 {
                ic_cdk::println!("   🚨 3 consecutive failures reached - halting trading");
                return Err("CoinGecko API failed 3 times consecutively. Trading halted until successful connection restored.".to_string());
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
                        Err("CoinGecko failed and no cached prices available. Trading unavailable.".to_string())
                    }
                }
                Err(cache_error) => {
                    ic_cdk::println!("   ❌ Failed to retrieve cached prices: {}", cache_error);
                    Err(format!("CoinGecko failed and cache retrieval failed: {}. Trading unavailable.", cache_error))
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
            sources_count: 1, // Only CoinGecko
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

/// Get API call statistics
pub fn get_api_stats() -> String {
    let stats = API_STATS.get().unwrap().lock().unwrap();
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    
    let uptime = if let Some(first_call) = stats.first_call_time {
        current_time - first_call
    } else {
        0
    };
    
    let success_rate = if stats.total_calls > 0 {
        (stats.successful_calls as f64 / stats.total_calls as f64) * 100.0
    } else {
        0.0
    };
    
    format!(
        "📊 CoinGecko API Statistics:\n\
        • Total Calls: {}\n\
        • Successful: {} ({:.1}%)\n\
        • Failed: {}\n\
        • Consecutive Successes: {}\n\
        • Max Consecutive Successes: {}\n\
        • Uptime: {} seconds\n\
        • Last Success: {}\n\
        • Last Failure: {}",
        stats.total_calls,
        stats.successful_calls,
        success_rate,
        stats.failed_calls,
        stats.consecutive_successes,
        stats.max_consecutive_successes,
        uptime,
        stats.last_successful_call.map(|t| format!("{}s ago", current_time - t)).unwrap_or("Never".to_string()),
        stats.last_failed_call.map(|t| format!("{}s ago", current_time - t)).unwrap_or("Never".to_string())
    )
}

/// Debug function to test CoinGecko API (for testing only)
pub async fn debug_test_external_apis() -> Result<String, String> {
    ic_cdk::println!("🧪 Testing CoinGecko API...");
    
    // Test CoinGecko only
    match coingecko::get_coingecko_prices().await {
        Ok(prices) => {
            let result = format!("✅ CoinGecko: {} prices", prices.len());
            ic_cdk::println!("🧪 API Test Results:\n{}", result);
            Ok(result)
        },
        Err(e) => {
            let result = format!("❌ CoinGecko: {}", e);
            ic_cdk::println!("🧪 API Test Results:\n{}", result);
            Ok(result)
        }
    }
}
