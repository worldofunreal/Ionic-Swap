use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use candid::{CandidType, Deserialize};
use serde::Serialize;

// ============================================================================
// ORACLE TYPES
// ============================================================================

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PriceData {
    pub symbol: String,
    pub price: f64,
    pub timestamp: u64,
    pub source: String,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TradingPair {
    pub base: String,    // BTC, ETH, SOL, ICP
    pub quote: String,   // USDT
    pub price: f64,      // 45000.0
    pub last_updated: u64,
    pub sources_count: u8,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PriceUpdateResult {
    pub pairs_updated: Vec<TradingPair>,
    pub total_sources: u8,
    pub successful_sources: u8,
    pub timestamp: u64,
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

static PRICE_CACHE: OnceLock<Mutex<HashMap<String, TradingPair>>> = OnceLock::new();

/// Initialize the price cache
pub fn init_price_cache() -> &'static Mutex<HashMap<String, TradingPair>> {
    PRICE_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}
