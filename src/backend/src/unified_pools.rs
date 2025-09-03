// No imports needed - we're using the types from the main module
use std::collections::HashMap;
use crate::types::{
    UnifiedLiquidityPool, ChainLiquidity, YieldStrategy, RiskConfig,
    CrossChainOperation, CrossChainOperationType, CrossChainOperationStatus,
    CapitalMove, CapitalMoveStatus, ChainState
};
use crate::storage::{
    get_unified_liquidity_pools, insert_unified_liquidity_pool,
    update_unified_liquidity_pool, generate_pool_id, generate_operation_id,
    insert_cross_chain_operation, get_chain_states, update_chain_state,
    insert_capital_move, generate_capital_move_id
};

// ============================================================================
// UNIFIED LIQUIDITY POOL MANAGEMENT
// ============================================================================

/// Create a new unified liquidity pool
pub async fn create_unified_liquidity_pool(
    base_asset: String,
    initial_chains: Vec<String>,
) -> Result<String, String> {
    // Validate input
    if base_asset.is_empty() {
        return Err("Base asset cannot be empty".to_string());
    }
    
    if initial_chains.is_empty() {
        return Err("At least one chain must be specified".to_string());
    }
    
    // Generate unique pool ID
    let pool_id = generate_pool_id();
    
    // Create initial chain distribution
    let mut chain_distribution = HashMap::new();
    for chain_id in &initial_chains {
        let chain_liquidity = ChainLiquidity {
            chain_id: chain_id.clone(),
            available_liquidity: 0,
            borrowed_amount: 0,
            current_apy: 0.0,
            utilization_rate: 0.0,
            last_updated: ic_cdk::api::time() / 1_000_000_000,
            risk_score: 5, // Medium risk by default
            is_active: true,
        };
        chain_distribution.insert(chain_id.clone(), chain_liquidity);
    }
    
    // Create yield optimization strategy
    let yield_strategy = YieldStrategy {
        optimization_interval: 300, // 5 minutes
        min_yield_improvement: 0.5, // 0.5%
        max_capital_movement: 1_000_000_000, // 1B tokens
        target_utilization: 0.8, // 80%
        risk_tolerance: 7, // Medium-high risk tolerance
    };
    
    // Create risk configuration
    let risk_config = RiskConfig {
        max_chain_exposure: 0.4, // 40% max per chain
        min_collateral_ratio: 1.5, // 150% collateral ratio
        liquidation_threshold: 0.8, // 80% liquidation threshold
        emergency_pause_threshold: 0.95, // 95% emergency threshold
    };
    
    // Create the unified pool
    let pool = UnifiedLiquidityPool {
        pool_id: pool_id.clone(),
        base_asset: base_asset.clone(),
        chain_distribution,
        total_unified_liquidity: 0,
        yield_optimization: yield_strategy,
        risk_parameters: risk_config,
        created_at: ic_cdk::api::time() / 1_000_000_000,
        last_optimized: ic_cdk::api::time() / 1_000_000_000,
        is_active: true,
    };
    
    // Store the pool
    insert_unified_liquidity_pool(pool_id.clone(), pool);
    
    // Log pool creation
    ic_cdk::println!("✅ Created unified liquidity pool: {}", pool_id);
    ic_cdk::println!("  Base asset: {}", base_asset);
    ic_cdk::println!("  Initial chains: {:?}", initial_chains);
    
    Ok(pool_id)
}

/// Add a new chain to an existing pool
pub async fn add_chain_to_pool(
    pool_id: String,
    chain_id: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(mut pool) = pools.get_mut(&pool_id) {
        // Check if chain already exists
        if pool.chain_distribution.contains_key(&chain_id) {
            return Err(format!("Chain {} already exists in pool {}", chain_id, pool_id));
        }
        
        // Create new chain liquidity entry
        let chain_liquidity = ChainLiquidity {
            chain_id: chain_id.clone(),
            available_liquidity: initial_liquidity,
            borrowed_amount: 0,
            current_apy: 0.0,
            utilization_rate: 0.0,
            last_updated: ic_cdk::api::time() / 1_000_000_000,
            risk_score: 5, // Medium risk by default
            is_active: true,
        };
        
        // Add chain to pool
        pool.chain_distribution.insert(chain_id.clone(), chain_liquidity);
        pool.total_unified_liquidity += initial_liquidity;
        
        // Update pool
        update_unified_liquidity_pool(&pool_id, pool.clone());
        
        ic_cdk::println!("✅ Added chain {} to pool {} with {} liquidity", chain_id, pool_id, initial_liquidity);
        Ok(format!("Chain {} added successfully", chain_id))
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// Deposit liquidity into a specific chain within a pool
pub async fn deposit_liquidity_cross_chain(
    pool_id: String,
    _user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(mut pool) = pools.get_mut(&pool_id) {
        // Check if chain exists in pool
        if let Some(chain_liquidity) = pool.chain_distribution.get_mut(&chain_id) {
            // Update chain liquidity
            chain_liquidity.available_liquidity += amount;
            chain_liquidity.last_updated = ic_cdk::api::time() / 1_000_000_000;
            
            // Update total unified liquidity
            pool.total_unified_liquidity += amount;
            
            // Update pool
            update_unified_liquidity_pool(&pool_id, pool.clone());
            
            // Create cross-chain operation record
            let operation_id = generate_operation_id();
            let operation = CrossChainOperation {
                operation_id: operation_id.clone(),
                pool_id: pool_id.clone(),
                operation_type: CrossChainOperationType::Deposit,
                source_chain: "USER".to_string(),
                target_chain: chain_id.clone(),
                amount,
                status: CrossChainOperationStatus::Completed,
                created_at: ic_cdk::api::time() / 1_000_000_000,
                completed_at: Some(ic_cdk::api::time() / 1_000_000_000),
                error_message: None,
            };
            insert_cross_chain_operation(operation_id.clone(), operation);
            
            ic_cdk::println!("✅ Deposited {} {} into chain {} of pool {}", amount, pool.base_asset, chain_id, pool_id);
            Ok(format!("Successfully deposited {} {} into chain {}", amount, pool.base_asset, chain_id))
        } else {
            Err(format!("Chain {} not found in pool {}", chain_id, pool_id))
        }
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// Withdraw liquidity from a specific chain within a pool
pub async fn withdraw_liquidity_cross_chain(
    pool_id: String,
    _user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(mut pool) = pools.get_mut(&pool_id) {
        // Check if chain exists in pool
        if let Some(chain_liquidity) = pool.chain_distribution.get_mut(&chain_id) {
            // Check if sufficient liquidity exists
            if chain_liquidity.available_liquidity < amount {
                return Err(format!("Insufficient liquidity on chain {}. Available: {}, Requested: {}", 
                    chain_id, chain_liquidity.available_liquidity, amount));
            }
            
            // Update chain liquidity
            chain_liquidity.available_liquidity -= amount;
            chain_liquidity.last_updated = ic_cdk::api::time() / 1_000_000_000;
            
            // Update total unified liquidity
            pool.total_unified_liquidity -= amount;
            
            // Update pool
            update_unified_liquidity_pool(&pool_id, pool.clone());
            
            // Create cross-chain operation record
            let operation_id = generate_operation_id();
            let operation = CrossChainOperation {
                operation_id: operation_id.clone(),
                pool_id: pool_id.clone(),
                operation_type: CrossChainOperationType::Withdrawal,
                source_chain: chain_id.clone(),
                target_chain: "USER".to_string(),
                amount,
                status: CrossChainOperationStatus::Completed,
                created_at: ic_cdk::api::time() / 1_000_000_000,
                completed_at: Some(ic_cdk::api::time() / 1_000_000_000),
                error_message: None,
            };
            insert_cross_chain_operation(operation_id.clone(), operation);
            
            ic_cdk::println!("✅ Withdrew {} {} from chain {} of pool {}", amount, pool.base_asset, chain_id, pool_id);
            Ok(format!("Successfully withdrew {} {} from chain {}", amount, pool.base_asset, chain_id))
        } else {
            Err(format!("Chain {} not found in pool {}", chain_id, pool_id))
        }
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

// ============================================================================
// POOL STATE QUERIES
// ============================================================================

/// Get total liquidity across all chains in a pool
pub fn get_pool_total_liquidity(pool_id: &str) -> Result<u128, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(pool) = pools.get(pool_id) {
        Ok(pool.total_unified_liquidity)
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// Get liquidity distribution across chains for a pool
pub fn get_pool_chain_distribution(pool_id: &str) -> Result<HashMap<String, ChainLiquidity>, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(pool) = pools.get(pool_id) {
        Ok(pool.chain_distribution.clone())
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// Get yield rates across all chains for a pool
pub fn get_pool_yield_rates(pool_id: &str) -> Result<HashMap<String, f64>, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(pool) = pools.get(pool_id) {
        let mut yield_rates = HashMap::new();
        for (chain_id, chain_liquidity) in &pool.chain_distribution {
            yield_rates.insert(chain_id.clone(), chain_liquidity.current_apy);
        }
        Ok(yield_rates)
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// Get pool information
pub fn get_pool_info(pool_id: &str) -> Result<UnifiedLiquidityPool, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(pool) = pools.get(pool_id) {
        Ok(pool.clone())
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

/// List all pools
pub fn list_all_pools() -> Vec<String> {
    let pools = get_unified_liquidity_pools();
    pools.keys().cloned().collect()
}

// ============================================================================
// CHAIN STATE MANAGEMENT
// ============================================================================

/// Update chain state (health, response time, etc.)
pub fn update_chain_health_state(
    chain_id: String,
    last_block: u64,
    response_time_ms: u64,
    is_healthy: bool,
) -> Result<String, String> {
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    
    let chain_state = ChainState {
        chain_id: chain_id.clone(),
        last_block,
        last_update: current_time,
        is_healthy,
        response_time_ms,
        error_count: if is_healthy { 0 } else { 1 },
    };
    
    update_chain_state(chain_id.clone(), chain_state);
    
    Ok(format!("Chain {} state updated", chain_id))
}

/// Get health status of all chains
pub fn get_all_chain_states() -> Vec<ChainState> {
    let states = get_chain_states();
    states.values().cloned().collect()
}

// ============================================================================
// BASIC YIELD OPTIMIZATION
// ============================================================================

/// Simple yield optimization - move capital to higher-yielding chains
pub async fn optimize_pool_yields_basic(pool_id: &str) -> Result<Vec<CapitalMove>, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(pool) = pools.get(pool_id) {
        let mut capital_moves = Vec::new();
        
        // Find chains with highest and lowest yields
        let mut chain_yields: Vec<(&String, f64)> = pool.chain_distribution
            .iter()
            .filter(|(_, chain)| chain.is_active && chain.available_liquidity > 0)
            .map(|(chain_id, chain)| (chain_id, chain.current_apy))
            .collect();
        
        // Sort by yield (highest first)
        chain_yields.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        if chain_yields.len() < 2 {
            return Ok(capital_moves); // Need at least 2 chains for optimization
        }
        
        let (highest_yield_chain, highest_yield) = chain_yields[0];
        let (lowest_yield_chain, lowest_yield) = chain_yields[chain_yields.len() - 1];
        
        // Calculate yield improvement
        let yield_improvement = highest_yield - lowest_yield;
        
        // Only optimize if improvement is significant
        if yield_improvement > pool.yield_optimization.min_yield_improvement {
            let move_amount = std::cmp::min(
                pool.yield_optimization.max_capital_movement,
                pool.chain_distribution[lowest_yield_chain].available_liquidity / 10 // Move 10% of available
            );
            
            if move_amount > 0 {
                let move_id = generate_capital_move_id();
                let capital_move = CapitalMove {
                    move_id: move_id.clone(),
                    pool_id: pool_id.to_string(),
                    from_chain: lowest_yield_chain.clone(),
                    to_chain: highest_yield_chain.clone(),
                    amount: move_amount,
                    expected_yield_improvement: yield_improvement,
                    risk_score: 3, // Low risk for basic optimization
                    execution_time: ic_cdk::api::time() / 1_000_000_000,
                    status: CapitalMoveStatus::Pending,
                };
                
                capital_moves.push(capital_move.clone());
                insert_capital_move(move_id, capital_move);
                
                ic_cdk::println!("🔄 Yield optimization suggested: Move {} from {} ({}%) to {} ({}%)", 
                    move_amount, lowest_yield_chain, lowest_yield, highest_yield_chain, highest_yield);
            }
        }
        
        Ok(capital_moves)
    } else {
        Err(format!("Pool {} not found", pool_id))
    }
}

// ============================================================================
// SOLANA INTEGRATION
// ============================================================================

/// Create a Solana-specific liquidity pool
pub fn create_solana_liquidity_pool(
    pool_id: String,
    base_asset: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    let chain_liquidity = ChainLiquidity {
        chain_id: "SOLANA".to_string(),
        available_liquidity: initial_liquidity,
        borrowed_amount: 0,
        current_apy: 0.0,
        utilization_rate: 0.0,
        last_updated: ic_cdk::api::time() / 1_000_000_000,
        risk_score: 5,
        is_active: true,
    };

    let mut chain_distribution = HashMap::new();
    chain_distribution.insert("SOLANA".to_string(), chain_liquidity);

    let pool = UnifiedLiquidityPool {
        pool_id: pool_id.clone(),
        base_asset,
        chain_distribution,
        total_unified_liquidity: initial_liquidity,
        yield_optimization: YieldStrategy {
            optimization_interval: 3600, // 1 hour
            min_yield_improvement: 0.5,  // 0.5%
            max_capital_movement: initial_liquidity / 10, // 10% max movement
            target_utilization: 0.8,     // 80% target
            risk_tolerance: 7,           // Medium-high risk tolerance
        },
        risk_parameters: RiskConfig {
            max_chain_exposure: 0.4,     // 40% max per chain
            min_collateral_ratio: 1.5,   // 150% collateral
            liquidation_threshold: 0.8,   // 80% liquidation threshold
            emergency_pause_threshold: 0.95, // 95% emergency threshold
        },
        created_at: ic_cdk::api::time() / 1_000_000_000,
        last_optimized: ic_cdk::api::time() / 1_000_000_000,
        is_active: true,
    };

    crate::storage::insert_unified_liquidity_pool(pool_id.clone(), pool);

    Ok(format!("Solana liquidity pool created: {}", pool_id))
}

/// Get Solana chain state
pub fn get_solana_chain_state() -> ChainState {
    ChainState {
        chain_id: "SOLANA".to_string(),
        last_block: 0, // Will be updated via RPC calls
        last_update: ic_cdk::api::time() / 1_000_000_000,
        is_healthy: true,
        response_time_ms: 0,
        error_count: 0,
    }
}
