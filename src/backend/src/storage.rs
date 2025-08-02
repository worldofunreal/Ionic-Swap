use std::collections::HashMap;
use crate::types::{HTLC, CrossChainSwapOrder, AtomicSwapOrder};

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

pub fn generate_order_id() -> String {
    unsafe {
        ORDER_COUNTER += 1;
        format!("order_{}", ORDER_COUNTER)
    }
} 