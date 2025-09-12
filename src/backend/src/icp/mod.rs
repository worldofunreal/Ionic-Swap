//! ICP Token System
//! 
//! This module provides a comprehensive token system for the Internet Computer Protocol (ICP).
//! It includes token definitions, balance management, faucet functionality, and query operations.
//! 
//! ## Components:
//! - `types`: Token and balance data structures
//! - `config`: Token configuration and supported tokens
//! - `storage`: Global state management for tokens and balances
//! - `faucet`: Faucet functionality for claiming tokens
//! - `balances`: Token balance management and transfers
//! - `queries`: Public query methods

pub mod types;
pub mod config;
pub mod storage;
pub mod faucet;
pub mod balances;
pub mod queries;

// Re-export main functionality
pub use types::*;
pub use config::*;
pub use storage::*;
pub use faucet::*;
pub use balances::*;
pub use queries::*;
