use std::collections::HashMap;
use crate::types::{HTLC, CrossChainSwapOrder, AtomicSwapOrder, UnifiedLiquidityPool, CrossChainOperation, ChainState, CapitalMove};

// ============================================================================
// STORAGE FOR HTLC AND SWAPS
// ============================================================================

static mut HTLC_STORE: Option<HashMap<String, HTLC>> = None;
static mut SWAP_ORDERS: Option<HashMap<String, CrossChainSwapOrder>> = None;
static mut ATOMIC_SWAP_ORDERS: Option<HashMap<String, AtomicSwapOrder>> = None;
static mut ORDER_COUNTER: u64 = 0;

// ============================================================================
// NONCE MANAGEMENT FOR EVM TRANSACTIONS
// ============================================================================

static mut CURRENT_NONCE: u64 = 0;
static mut NONCE_LOCK: bool = false;

// Thread-safe nonce management to prevent racing conditions
pub fn get_next_nonce() -> u64 {
    unsafe {
        if NONCE_LOCK {
            // If locked, wait a bit and try again
            // In a real implementation, you might want to use a more sophisticated locking mechanism
            ic_cdk::api::time(); // Small delay
        }
        NONCE_LOCK = true;
        let nonce = CURRENT_NONCE;
        CURRENT_NONCE += 1;
        NONCE_LOCK = false;
        nonce
    }
}

pub fn update_current_nonce(new_nonce: u64) {
    unsafe {
        NONCE_LOCK = true;
        CURRENT_NONCE = new_nonce;
        NONCE_LOCK = false;
    }
}

// ============================================================================
// STORAGE HELPER FUNCTIONS
// ============================================================================

#[allow(static_mut_refs)]
pub fn get_htlc_store() -> &'static mut HashMap<String, HTLC> {
    unsafe {
        if let Some(store) = &mut HTLC_STORE {
            store
        } else {
            HTLC_STORE = Some(HashMap::new());
            HTLC_STORE.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn get_swap_orders() -> &'static mut HashMap<String, CrossChainSwapOrder> {
    unsafe {
        if let Some(orders) = &mut SWAP_ORDERS {
            orders
        } else {
            SWAP_ORDERS = Some(HashMap::new());
            SWAP_ORDERS.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn get_atomic_swap_orders() -> &'static mut HashMap<String, AtomicSwapOrder> {
    unsafe {
        if let Some(orders) = &mut ATOMIC_SWAP_ORDERS {
            orders
        } else {
            ATOMIC_SWAP_ORDERS = Some(HashMap::new());
            ATOMIC_SWAP_ORDERS.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn generate_order_id() -> String {
    unsafe {
        ORDER_COUNTER += 1;
        format!("order_{}", ORDER_COUNTER)
    }
} 

// ============================================================================
// UNIFIED LIQUIDITY POOL STORAGE
// ============================================================================

static mut UNIFIED_LIQUIDITY_POOLS: Option<HashMap<String, UnifiedLiquidityPool>> = None;
static mut CROSS_CHAIN_OPERATIONS: Option<HashMap<String, CrossChainOperation>> = None;
static mut CHAIN_STATES: Option<HashMap<String, ChainState>> = None;
static mut CAPITAL_MOVES: Option<HashMap<String, CapitalMove>> = None;
static mut POOL_COUNTER: u64 = 0;

// ============================================================================
// UNIFIED LIQUIDITY POOL STORAGE FUNCTIONS
// ============================================================================

#[allow(static_mut_refs)]
pub fn get_unified_liquidity_pools() -> &'static mut HashMap<String, UnifiedLiquidityPool> {
    unsafe {
        if let Some(pools) = &mut UNIFIED_LIQUIDITY_POOLS {
            pools
        } else {
            UNIFIED_LIQUIDITY_POOLS = Some(HashMap::new());
            UNIFIED_LIQUIDITY_POOLS.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn get_unified_liquidity_pool(pool_id: &str) -> Option<UnifiedLiquidityPool> {
    unsafe {
        if let Some(pools) = &mut UNIFIED_LIQUIDITY_POOLS {
            pools.get(pool_id).cloned()
        } else {
            None
        }
    }
}

#[allow(static_mut_refs)]
pub fn insert_unified_liquidity_pool(pool_id: String, pool: UnifiedLiquidityPool) {
    unsafe {
        if let Some(pools) = &mut UNIFIED_LIQUIDITY_POOLS {
            pools.insert(pool_id, pool);
        } else {
            UNIFIED_LIQUIDITY_POOLS = Some(HashMap::new());
            UNIFIED_LIQUIDITY_POOLS.as_mut().unwrap().insert(pool_id, pool);
        }
    }
}

#[allow(static_mut_refs)]
pub fn update_unified_liquidity_pool(pool_id: &str, pool: UnifiedLiquidityPool) {
    unsafe {
        if let Some(pools) = &mut UNIFIED_LIQUIDITY_POOLS {
            pools.insert(pool_id.to_string(), pool);
        }
    }
}

// ============================================================================
// CROSS-CHAIN OPERATIONS STORAGE
// ============================================================================

#[allow(static_mut_refs)]
pub fn get_cross_chain_operations() -> &'static mut HashMap<String, CrossChainOperation> {
    unsafe {
        if let Some(operations) = &mut CROSS_CHAIN_OPERATIONS {
            operations
        } else {
            CROSS_CHAIN_OPERATIONS = Some(HashMap::new());
            CROSS_CHAIN_OPERATIONS.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn insert_cross_chain_operation(operation_id: String, operation: CrossChainOperation) {
    unsafe {
        if let Some(operations) = &mut CROSS_CHAIN_OPERATIONS {
            operations.insert(operation_id, operation);
        } else {
            CROSS_CHAIN_OPERATIONS = Some(HashMap::new());
            CROSS_CHAIN_OPERATIONS.as_mut().unwrap().insert(operation_id, operation);
        }
    }
}

// ============================================================================
// CHAIN STATES STORAGE
// ============================================================================

#[allow(static_mut_refs)]
pub fn get_chain_states() -> &'static mut HashMap<String, ChainState> {
    unsafe {
        if let Some(states) = &mut CHAIN_STATES {
            states
        } else {
            CHAIN_STATES = Some(HashMap::new());
            CHAIN_STATES.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn update_chain_state(chain_id: String, state: ChainState) {
    unsafe {
        if let Some(states) = &mut CHAIN_STATES {
            states.insert(chain_id, state);
        } else {
            CHAIN_STATES = Some(HashMap::new());
            CHAIN_STATES.as_mut().unwrap().insert(chain_id, state);
        }
    }
}

// ============================================================================
// CAPITAL MOVES STORAGE
// ============================================================================

#[allow(static_mut_refs)]
pub fn get_capital_moves() -> &'static mut HashMap<String, CapitalMove> {
    unsafe {
        if let Some(moves) = &mut CAPITAL_MOVES {
            moves
        } else {
            CAPITAL_MOVES = Some(HashMap::new());
            CAPITAL_MOVES.as_mut().unwrap()
        }
    }
}

#[allow(static_mut_refs)]
pub fn insert_capital_move(move_id: String, capital_move: CapitalMove) {
    unsafe {
        if let Some(moves) = &mut CAPITAL_MOVES {
            moves.insert(move_id, capital_move);
        } else {
            CAPITAL_MOVES = Some(HashMap::new());
            CAPITAL_MOVES.as_mut().unwrap().insert(move_id, capital_move);
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

pub fn generate_pool_id() -> String {
    unsafe {
        POOL_COUNTER += 1;
        format!("pool_{}", POOL_COUNTER)
    }
}

pub fn generate_operation_id() -> String {
    unsafe {
        ORDER_COUNTER += 1;
        format!("op_{}", ORDER_COUNTER)
    }
}

pub fn generate_capital_move_id() -> String {
    unsafe {
        ORDER_COUNTER += 1;
        format!("move_{}", ORDER_COUNTER)
    }
} 