//! Liquidity Staking Core Types
//! 
//! This module defines the core data structures for the liquidity staking system,
//! inspired by the ICP neuron model for proven stability and incentive alignment.

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::collections::HashMap;
use uuid::Uuid;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Generate a UUID v4 for transaction IDs
fn generate_transaction_id() -> String {
    Uuid::new_v4().to_string()
}

// ============================================================================
// CORE NEURON TYPES
// ============================================================================

/// Represents the current state of a liquidity staking position
/// Based on ICP neuron model for proven stability
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq)]
pub enum NeuronState {
    /// Position is locked and earning fees
    /// - Age bonus accumulates over time
    /// - Full voting power for fee distribution
    /// - Cannot withdraw principal
    Locked,
    
    /// Position is dissolving with linear unlock schedule
    /// - Age bonus resets to 1.0 and stays there
    /// - Only locked portion earns fees (decreases linearly)
    /// - Dissolving portion available for withdrawal
    /// - Withdrawal amount = staked_amount × elapsed_time / dissolve_delay
    Dissolving,
    
    /// Position is fully dissolved and ready for complete withdrawal
    /// - No longer earning any fees
    /// - Full amount available for withdrawal
    /// - Serves as non-earning liquidity until withdrawn
    Dissolved,
}

/// A liquidity staking position, inspired by ICP neurons
/// Combines stake amount, time-based rewards, and dissolving mechanics
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LiquidityNeuron {
    /// Unique position identifier: "{user}_{token}_{timestamp}"
    pub id: String,
    
    /// Principal who owns this position
    pub user: Principal,
    
    /// Token symbol being staked (e.g., "ETH", "BTC", "USDT")
    pub token_symbol: String,
    
    /// Original amount staked (never changes)
    pub staked_amount: u64,
    
    /// Lock duration in seconds (determines voting power multiplier)
    /// Range: 86400 (1 day) to 31536000 (365 days)
    pub dissolve_delay_seconds: u64,
    
    /// When this position was created (for age calculation)
    pub created_at: u64,
    
    /// Current state: Locked → Dissolving → Dissolved
    pub state: NeuronState,
    
    /// When dissolving was started (None if never started)
    pub dissolving_started_at: Option<u64>,
    
    /// Cumulative amount withdrawn during dissolving
    /// Used to track partial withdrawals
    pub withdrawn_amount: u64,
    
    /// Last global_fee_index when fees were claimed
    /// Used for proportional fee distribution calculation
    pub last_fee_index: f64,
}

impl LiquidityNeuron {
    /// Create a new liquidity neuron position
    pub fn new(user: Principal, token_symbol: String, staked_amount: u64, dissolve_delay_seconds: u64) -> Self {
        let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
        let id = Self::generate_id(user, &token_symbol, timestamp);
        
        Self {
            id,
            user,
            token_symbol,
            staked_amount,
            dissolve_delay_seconds,
            state: NeuronState::Locked,
            created_at: timestamp,
            dissolving_started_at: None,
            withdrawn_amount: 0,
            last_fee_index: 0.0,
        }
    }
    
    /// Generate a unique position ID using UUID
    pub fn generate_id(_user: Principal, _token_symbol: &str, _timestamp: u64) -> String {
        generate_transaction_id()
    }

    /// Calculate current age in seconds (only counts time in Locked state)
    pub fn current_age_seconds(&self) -> u64 {
        let now = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
        match self.state {
            NeuronState::Locked => {
                // Age accumulates normally
                now.saturating_sub(self.created_at)
            },
            NeuronState::Dissolving | NeuronState::Dissolved => {
                // Age is frozen at time of dissolving start
                if let Some(dissolving_start) = self.dissolving_started_at {
                    dissolving_start.saturating_sub(self.created_at)
                } else {
                    0 // Should not happen, but safe fallback
                }
            }
        }
    }

    /// Calculate how much of the position is currently available for withdrawal
    pub fn available_to_withdraw(&self) -> u64 {
        match self.state {
            NeuronState::Locked => 0, // Cannot withdraw from locked position
            NeuronState::Dissolved => {
                // Full amount minus what's already withdrawn
                self.staked_amount.saturating_sub(self.withdrawn_amount)
            },
            NeuronState::Dissolving => {
                if let Some(dissolving_start) = self.dissolving_started_at {
                    let now = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
                    let elapsed = now.saturating_sub(dissolving_start);
                    let dissolving_fraction = if elapsed >= self.dissolve_delay_seconds {
                        1.0 // Fully dissolved
                    } else {
                        elapsed as f64 / self.dissolve_delay_seconds as f64
                    };
                    
                    let total_available = (self.staked_amount as f64 * dissolving_fraction) as u64;
                    total_available.saturating_sub(self.withdrawn_amount)
                } else {
                    0 // Should not happen, but safe fallback
                }
            }
        }
    }

    /// Calculate the current locked amount (earning fees)
    pub fn locked_amount(&self) -> u64 {
        match self.state {
            NeuronState::Locked => self.staked_amount,
            NeuronState::Dissolved => 0, // No longer locked
            NeuronState::Dissolving => {
                if let Some(dissolving_start) = self.dissolving_started_at {
                    let now = ic_cdk::api::time() / 1_000_000_000;
                    let elapsed = now.saturating_sub(dissolving_start);
                    if elapsed >= self.dissolve_delay_seconds {
                        0 // Fully dissolved
                    } else {
                        let remaining_fraction = 1.0 - (elapsed as f64 / self.dissolve_delay_seconds as f64);
                        (self.staked_amount as f64 * remaining_fraction) as u64
                    }
                } else {
                    self.staked_amount // Should not happen, but conservative fallback
                }
            }
        }
    }
}

// ============================================================================
// POOL INFORMATION TYPES
// ============================================================================

/// Health status of a token pool based on absolute thresholds
/// Determines what operations are allowed
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq)]
pub enum LiquidityStatus {
    /// Above healthy_threshold - all operations allowed
    Healthy,
    
    /// Below healthy_threshold but above rebalance_threshold
    /// - Manual rebalancing alert triggered
    /// - Higher spreads applied
    /// - All operations still allowed
    NeedsRebalance,
    
    /// Below rebalance_threshold but above halt_threshold
    /// - Urgent rebalancing required
    /// - Very high spreads applied
    /// - Large trades restricted
    Critical,
    
    /// Below halt_threshold
    /// - All trading halted for this token
    /// - Only withdrawals allowed
    /// - Requires manual intervention
    Halted,
}

/// Aggregated information about a token's liquidity pool
/// Contains staking stats, fee analytics, and health status
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PoolInfo {
    /// Token symbol (e.g., "ETH")
    pub token_symbol: String,
    
    /// Sum of staked_amount across all active positions
    pub total_staked: u64,
    
    /// Sum of voting power (W_total) for fee distribution
    /// voting_power = staked_amount × delay_multiplier × age_multiplier
    pub total_voting_power: f64,
    
    /// Cumulative fee per unit of voting power
    /// Increases monotonically as fees are collected
    pub global_fee_index: f64,
    
    /// All-time fees collected for this token pool
    pub total_fees_collected: u64,
    
    /// Current amount available for immediate withdrawal
    /// Includes dissolving tranches and dissolved positions
    pub available_liquidity: u64,
    
    /// Current liquidity health status based on thresholds
    pub liquidity_status: LiquidityStatus,
    
    /// Current 1-hour price volatility percentage
    pub current_volatility_1h: f64,
    
    /// Trading volume in last hour (for rate limiting)
    pub total_volume_1h: u64,
    
    // **FEE ANALYTICS - Track sources of fee generation**
    /// Fees from base trading rate (0.3%)
    pub fees_from_trading: u64,
    
    /// Fees from spread protection (micro-arbitrage defense)
    pub fees_from_spread: u64,
    
    /// Fees from volatility penalties (market movement protection)
    pub fees_from_volatility: u64,
    
    /// Fees from depth penalties (large trade protection)
    pub fees_from_depth: u64,
}

impl PoolInfo {
    /// Create a new empty pool for a token
    pub fn new(token_symbol: String) -> Self {
        Self {
            token_symbol,
            total_staked: 0,
            total_voting_power: 0.0,
            global_fee_index: 0.0,
            total_fees_collected: 0,
            available_liquidity: 0,
            liquidity_status: LiquidityStatus::Healthy,
            current_volatility_1h: 0.0,
            total_volume_1h: 0,
            fees_from_trading: 0,
            fees_from_spread: 0,
            fees_from_volatility: 0,
            fees_from_depth: 0,
        }
    }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/// Absolute liquidity thresholds for a specific token
/// Values are in the token's base units (wei for ETH, satoshis for BTC, etc.)
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct TokenThresholds {
    /// Healthy pool threshold in USDT value (e.g., $10M)
    /// Above this: normal operations, standard spreads
    pub healthy_threshold_usdt: f64,
    
    /// Rebalancing needed threshold in USDT value (e.g., $7M)
    /// Below this: manual alert, higher spreads, all ops allowed
    pub rebalance_threshold_usdt: f64,
    
    /// Critical threshold - halt trading in USDT value (e.g., $5M)
    /// Below this: halt all trades, only withdrawals allowed
    pub halt_threshold_usdt: f64,
    
    /// Minimum threshold for any trade in USDT value (e.g., $100)
    /// Prevents tiny trades that could be used for gaming
    pub min_trade_threshold_usdt: f64,
}

impl TokenThresholds {
    /// Convert USDT threshold to token amount based on current price
    pub fn get_token_amount(&self, threshold_usdt: f64, price: f64, decimals: u8) -> u64 {
        let decimal_multiplier = 10.0_f64.powi(decimals as i32);
        (threshold_usdt / price * decimal_multiplier) as u64
    }
    
    /// Get healthy threshold in token amount
    pub fn get_healthy_amount(&self, price: f64, decimals: u8) -> u64 {
        self.get_token_amount(self.healthy_threshold_usdt, price, decimals)
    }
    
    /// Get rebalance threshold in token amount
    pub fn get_rebalance_amount(&self, price: f64, decimals: u8) -> u64 {
        self.get_token_amount(self.rebalance_threshold_usdt, price, decimals)
    }
    
    /// Get halt threshold in token amount
    pub fn get_halt_amount(&self, price: f64, decimals: u8) -> u64 {
        self.get_token_amount(self.halt_threshold_usdt, price, decimals)
    }
    
    /// Get minimum trade threshold in token amount
    pub fn get_min_trade_amount(&self, price: f64, decimals: u8) -> u64 {
        self.get_token_amount(self.min_trade_threshold_usdt, price, decimals)
    }
}

impl TokenThresholds {
    /// Create default USDT-based thresholds for all tokens
    pub fn default_for_token(_token_symbol: &str) -> Self {
        Self {
            healthy_threshold_usdt: 10_000_000.0,    // $10M healthy threshold
            rebalance_threshold_usdt: 7_000_000.0,   // $7M rebalance alert
            halt_threshold_usdt: 5_000_000.0,        // $5M halt trading
            min_trade_threshold_usdt: 100.0,         // $100 minimum trade
        }
    }

    /// Check what status the current liquidity amount corresponds to
    pub fn get_status(&self, current_liquidity: u64, price: f64, decimals: u8) -> LiquidityStatus {
        let healthy_amount = self.get_healthy_amount(price, decimals);
        let rebalance_amount = self.get_rebalance_amount(price, decimals);
        let halt_amount = self.get_halt_amount(price, decimals);
        
        if current_liquidity >= healthy_amount {
            LiquidityStatus::Healthy
        } else if current_liquidity >= rebalance_amount {
            LiquidityStatus::NeedsRebalance
        } else if current_liquidity >= halt_amount {
            LiquidityStatus::Critical
        } else {
            LiquidityStatus::Halted
        }
    }
}

/// Configuration parameters for the liquidity system
/// All values are admin-configurable with bounds checking
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LiquidityConfig {
    /// Base trading fee rate (e.g., 0.003 = 0.3%)
    /// Applied to all trades regardless of conditions
    pub fee_rate_base: f64,
    
    /// Base spread rate for micro-arbitrage protection (e.g., 0.003 = 0.3%)
    /// Creates bid-ask spread: bid = price × (1 - spread), ask = price × (1 + spread)
    pub spread_base: f64,
    
    /// Volatility penalty multiplier (e.g., 0.1)
    /// Extra spread = k_vol × volatility_1h
    /// If token moved 2% in 1 hour: extra spread = 0.1 × 0.02 = 0.002 (0.2%)
    pub k_vol: f64,
    
    /// Time window for volatility calculation (e.g., 3600 = 1 hour)
    pub volatility_window_seconds: u64,
    
    /// Depth penalty multiplier (e.g., 0.5)
    /// Extra spread = k_depth × (trade_size / available_liquidity)
    /// $100k trade in $1M liquidity: extra spread = 0.5 × 0.1 = 0.05 (5%)
    pub k_depth: f64,
    
    /// Number of consecutive oracle failures before halting trading
    /// Prevents trading with stale/unreliable price data
    pub oracle_failure_threshold: u32,
    
    /// Absolute thresholds per token (not percentages)
    /// Key = token_symbol, Value = threshold configuration
    pub token_thresholds: HashMap<String, TokenThresholds>,
    
    /// Maximum trade amount in USDT equivalent (e.g., 50000 = $50k)
    /// Prevents single large trades from draining pools
    pub max_trade_amount_usdt: u64,
    
    /// Maximum hourly trading volume in USDT (e.g., 500000 = $500k/hour)
    /// Rate limiting to prevent rapid pool drainage
    pub max_hourly_volume_usdt: u64,
    
    /// Minimum dissolve delay in seconds (e.g., 86400 = 1 day)
    /// Shortest commitment period to earn fees
    pub min_dissolve_delay_seconds: u64,
    
    /// Maximum dissolve delay in seconds (e.g., 31536000 = 365 days)
    /// Longest commitment period for maximum rewards
    pub max_dissolve_delay_seconds: u64,
    
    /// List of tokens where all operations are paused
    /// Emergency circuit breaker for exploit mitigation
    pub paused_tokens: Vec<String>,
}

impl Default for LiquidityConfig {
    fn default() -> Self {
        let mut token_thresholds = HashMap::new();
        
        // Add thresholds for all supported tokens
        for (symbol, _, _) in crate::icp::config::SUPPORTED_TOKENS {
            token_thresholds.insert(symbol.to_string(), TokenThresholds::default_for_token(symbol));
        }

        Self {
            fee_rate_base: 0.003,                   // 0.3% base fee
            spread_base: 0.003,                     // 0.3% base spread
            k_vol: 0.1,                             // Volatility multiplier
            volatility_window_seconds: 3600,        // 1 hour window
            k_depth: 0.5,                           // Depth multiplier
            oracle_failure_threshold: 3,            // 3 failures = halt
            max_trade_amount_usdt: 2_000_000,       // $2M max trade
            max_hourly_volume_usdt: 500_000,        // $500k/hour limit
            min_dissolve_delay_seconds: 86_400,     // 1 day minimum
            max_dissolve_delay_seconds: 31_536_000, // 365 days maximum
            paused_tokens: vec![],                  // No tokens paused initially
            token_thresholds,
        }
    }
}

impl LiquidityConfig {
    /// Validate configuration parameters are within reasonable bounds
    pub fn validate(&self) -> Result<(), String> {
        if self.fee_rate_base < 0.0 || self.fee_rate_base > 0.1 {
            return Err("fee_rate_base must be between 0% and 10%".to_string());
        }
        
        if self.spread_base < 0.0 || self.spread_base > 0.1 {
            return Err("spread_base must be between 0% and 10%".to_string());
        }
        
        if self.k_vol < 0.0 || self.k_vol > 10.0 {
            return Err("k_vol must be between 0 and 10".to_string());
        }
        
        if self.k_depth < 0.0 || self.k_depth > 10.0 {
            return Err("k_depth must be between 0 and 10".to_string());
        }
        
        if self.oracle_failure_threshold == 0 || self.oracle_failure_threshold > 10 {
            return Err("oracle_failure_threshold must be between 1 and 10".to_string());
        }
        
        if self.min_dissolve_delay_seconds > self.max_dissolve_delay_seconds {
            return Err("min_dissolve_delay_seconds cannot be greater than max".to_string());
        }
        
        if self.min_dissolve_delay_seconds < 3600 { // Less than 1 hour
            return Err("min_dissolve_delay_seconds must be at least 1 hour".to_string());
        }
        
        if self.max_dissolve_delay_seconds > 94_608_000 { // More than 3 years
            return Err("max_dissolve_delay_seconds cannot exceed 3 years".to_string());
        }
        
        Ok(())
    }
}

// ============================================================================
// FEE ANALYTICS TYPES
// ============================================================================

/// Detailed components used in fee calculation
/// Stored for analytics and debugging
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct FeeComponents {
    /// Size of the trade in USDT equivalent
    pub trade_notional: u64,
    
    /// Base fee rate applied (should equal config.fee_rate_base)
    pub base_fee_rate: f64,
    
    /// Spread rate applied (should equal config.spread_base)
    pub spread_rate: f64,
    
    /// Volatility penalty rate applied
    /// = k_vol × volatility_move_1h
    pub volatility_rate: f64,
    
    /// Depth penalty rate applied
    /// = k_depth × trade_vs_liquidity
    pub depth_rate: f64,
    
    /// Actual price movement in last hour (percentage)
    /// Used to calculate volatility_rate
    pub volatility_move_1h: f64,
    
    /// Trade size as fraction of available liquidity
    /// Used to calculate depth_rate
    pub trade_vs_liquidity: f64,
}

/// Detailed breakdown of fees collected from a single trade
/// Enables analytics on fee generation sources
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct FeeBreakdown {
    /// Total fee collected (sum of all components)
    pub total_fee: u64,
    
    /// Fee from base trading rate
    /// = trade_notional × fee_rate_base
    pub base_trading_fee: u64,
    
    /// Fee from spread protection
    /// = trade_notional × spread_base
    pub spread_base_fee: u64,
    
    /// Fee from volatility penalty
    /// = trade_notional × (k_vol × volatility_1h)
    pub volatility_fee: u64,
    
    /// Fee from depth penalty
    /// = trade_notional × (k_depth × trade_size_ratio)
    pub depth_fee: u64,
    
    /// Detailed calculation components for analysis
    pub fee_components: FeeComponents,
}

/// Record of fee generation from a trade
/// Links fees to the swap that generated them
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct FeeTransaction {
    /// Unique identifier for this fee generation event
    pub id: String,
    
    /// ID of the swap transaction that generated these fees
    pub swap_transaction_id: String,
    
    /// Trading pair (e.g., "ETH/USDT")
    pub token_pair: String,
    
    /// Principal who paid the fees (the trader)
    pub trader: Principal,
    
    /// When fees were generated
    pub timestamp: u64,
    
    /// Detailed breakdown of fee components
    pub fee_breakdown: FeeBreakdown,
    
    /// Global fee index before adding these fees
    pub global_fee_index_before: f64,
    
    /// Global fee index after adding these fees
    pub global_fee_index_after: f64,
    
    /// Number of active stakers who benefit from these fees
    pub stakers_benefited: u32,
}

// ============================================================================
// TRANSACTION LOGGING TYPES
// ============================================================================

/// Types of actions that can be performed in the liquidity system
#[derive(Debug, Clone, CandidType, Deserialize, Serialize, PartialEq)]
pub enum LiquidityTxType {
    /// User created a new staking position
    Stake,
    
    /// User claimed accumulated fee earnings
    ClaimFees,
    
    /// User started the dissolving process
    StartDissolving,
    
    /// User cancelled dissolving (returned to Locked state)
    CancelDissolving,
    
    /// User withdrew partial amount during dissolving
    PartialWithdraw,
    
    /// User withdrew remaining amount after full dissolving
    FullWithdraw,
    
    /// Admin paused a token (emergency action)
    EmergencyPause,
    
    /// Admin updated system configuration
    ConfigUpdate,
}

/// Complete audit log of all user actions in the liquidity system
/// Ensures full traceability and debugging capability
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LiquidityTransaction {
    /// Unique transaction identifier
    pub id: String,
    
    /// Principal who performed the action
    pub user: Principal,
    
    /// Position ID if action relates to specific position
    pub position_id: Option<String>,
    
    /// Type of action performed
    pub transaction_type: LiquidityTxType,
    
    /// Token symbol involved
    pub token_symbol: String,
    
    /// Amount involved in the transaction
    pub amount: u64,
    
    /// When the action was attempted
    pub timestamp: u64,
    
    /// Whether the action succeeded
    pub success: bool,
    
    /// Error message if action failed
    pub error_message: Option<String>,
    
    /// JSON snapshot of relevant state before action
    pub before_state: Option<String>,
    
    /// JSON snapshot of relevant state after action
    pub after_state: Option<String>,
}

impl LiquidityTransaction {
    /// Generate a unique transaction ID using UUID
    pub fn generate_id(_user: Principal, _tx_type: &LiquidityTxType, _timestamp: u64) -> String {
        generate_transaction_id()
    }
}

// ============================================================================
// VOLATILITY TRACKING TYPES
// ============================================================================

/// Single price observation for volatility calculation
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PricePoint {
    /// Price in USD at this timestamp
    pub price: f64,
    
    /// When this price was recorded
    pub timestamp: u64,
}

/// Tracks price movements for volatility-based fee calculation
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct VolatilityData {
    /// Token being tracked
    pub token_symbol: String,
    
    /// Price history for the volatility window
    /// Only keeps last hour of data (rolling window)
    pub price_points: Vec<PricePoint>,
    
    /// Current 1-hour volatility as percentage
    /// Calculated as (max_price - min_price) / avg_price in window
    pub current_volatility_1h: f64,
    
    /// When volatility was last calculated
    pub last_updated: u64,
}

impl VolatilityData {
    /// Create new volatility tracker for a token
    pub fn new(token_symbol: String) -> Self {
        Self {
            token_symbol,
            price_points: Vec::new(),
            current_volatility_1h: 0.0,
            last_updated: ic_cdk::api::time() / 1_000_000_000,
        }
    }

    /// Add a new price point and update volatility
    pub fn add_price_point(&mut self, price: f64, window_seconds: u64) {
        let now = ic_cdk::api::time() / 1_000_000_000;
        
        // Add new price point
        self.price_points.push(PricePoint {
            price,
            timestamp: now,
        });

        // Remove old price points outside the window
        let cutoff_time = now.saturating_sub(window_seconds);
        self.price_points.retain(|point| point.timestamp >= cutoff_time);

        // Recalculate volatility
        self.update_volatility();
        self.last_updated = now;
    }

    /// Calculate current volatility from price points
    fn update_volatility(&mut self) {
        if self.price_points.len() < 2 {
            self.current_volatility_1h = 0.0;
            return;
        }

        let prices: Vec<f64> = self.price_points.iter().map(|p| p.price).collect();
        let min_price = prices.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_price = prices.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let avg_price = prices.iter().sum::<f64>() / prices.len() as f64;

        if avg_price > 0.0 {
            self.current_volatility_1h = (max_price - min_price) / avg_price;
        } else {
            self.current_volatility_1h = 0.0;
        }
    }
}
