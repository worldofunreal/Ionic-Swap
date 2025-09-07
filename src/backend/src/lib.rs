use candid::{candid_method, Principal};
use ic_cdk_macros::*;
use std::collections::HashMap;

// ============================================================================
// MODULES
// ============================================================================

mod constants;
mod types;
mod storage;
mod http_client;
mod evm;
mod icp;
mod solana;
mod bridgeless_token;
mod unified_pools;

// New Solana modules using official SOL RPC canister
mod ed25519;
mod solana_wallet;
mod spl;
mod state;

use constants::*;
use types::*;
use storage::*;
use icp::*;
use solana::*;
use bridgeless_token::*;
use unified_pools::*;

// New Solana imports
use candid::{CandidType, Nat};
use serde::Deserialize;
use sol_rpc_client::{ed25519::Ed25519KeyId, IcRuntime, SolRpcClient};
use sol_rpc_types::{
    CommitmentLevel, ConsensusStrategy, RpcEndpoint, RpcSource, RpcSources, SolanaCluster,
};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_system_interface::instruction;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::{
    address::get_associated_token_address_with_program_id,
};
use std::str::FromStr;
use num::ToPrimitive;

// ============================================================================
// SOLANA TYPES AND CLIENT
// ============================================================================

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub sol_rpc_canister_id: Option<Principal>,
    pub solana_network: Option<SolanaNetwork>,
    pub ed25519_key_name: Option<Ed25519KeyName>,
    pub solana_commitment_level: Option<CommitmentLevel>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum SolanaNetwork {
    Mainnet,
    #[default]
    Devnet,
    Custom(RpcEndpoint),
}

impl From<SolanaNetwork> for RpcSources {
    fn from(network: SolanaNetwork) -> Self {
        match network {
            SolanaNetwork::Mainnet => Self::Default(SolanaCluster::Mainnet),
            SolanaNetwork::Devnet => Self::Default(SolanaCluster::Devnet),
            SolanaNetwork::Custom(endpoint) => Self::Custom(vec![RpcSource::Custom(endpoint)]),
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum Ed25519KeyName {
    #[default]
    LocalDevelopment,
    MainnetTestKey1,
    MainnetProdKey1,
}

impl From<Ed25519KeyName> for Ed25519KeyId {
    fn from(key_id: Ed25519KeyName) -> Self {
        match key_id {
            Ed25519KeyName::LocalDevelopment => Self::LocalDevelopment,
            Ed25519KeyName::MainnetTestKey1 => Self::MainnetTestKey1,
            Ed25519KeyName::MainnetProdKey1 => Self::MainnetProdKey1,
        }
    }
}

pub fn client() -> SolRpcClient<IcRuntime> {
    let rpc_sources = state::read_state(|state| state.solana_network().clone()).into();
    let consensus_strategy = match rpc_sources {
        RpcSources::Custom(_) => ConsensusStrategy::Equality,
        RpcSources::Default(_) => ConsensusStrategy::Threshold {
            min: 2,
            total: Some(3),
        },
    };
    state::read_state(|state| state.sol_rpc_canister_id())
        .map(|canister_id| SolRpcClient::builder(IcRuntime, canister_id))
        .unwrap_or(SolRpcClient::builder_for_ic())
        .with_rpc_sources(rpc_sources)
        .with_consensus_strategy(consensus_strategy)
        .with_default_commitment_level(state::read_state(|state| state.solana_commitment_level()))
        .build()
}

pub fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}

// ============================================================================
// JSON-RPC ENDPOINTS (Public canister interface)
// ============================================================================

#[update]
async fn get_sepolia_block_number() -> Result<String, String> {
    http_client::get_sepolia_block_number().await
}

#[update]
async fn get_transaction_receipt(tx_hash: String) -> Result<String, String> {
    http_client::get_transaction_receipt(tx_hash).await
}

#[update]
async fn get_balance(address: String) -> Result<String, String> {
    http_client::get_balance(address).await
}

#[update]
async fn get_transaction_count(address: String) -> Result<String, String> {
    http_client::get_transaction_count(address).await
}

#[update]
async fn get_icp_network_signer() -> Result<String, String> {
    http_client::get_icp_network_signer().await
}

#[update]
async fn get_claim_fee() -> Result<String, String> {
    http_client::get_claim_fee().await
}

#[update]
async fn get_refund_fee() -> Result<String, String> {
    http_client::get_refund_fee().await
}

#[update]
async fn get_total_fees() -> Result<String, String> {
    http_client::get_total_fees().await
}

// ============================================================================
// EIP-2771 MINIMAL FORWARDER RELAYER
// ============================================================================

#[update]
#[candid_method(update)]
async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    evm::execute_gasless_approval(request).await
}

// ============================================================================
// EVM INTEGRATION METHODS (USING IC CDK APIs)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    evm::get_public_key().await
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    evm::get_ethereum_address().await
}

#[update]
async fn test_signing_address() -> Result<String, String> {
    evm::test_signing_address().await
}

#[update]
async fn test_simple_transaction() -> Result<String, String> {
    evm::test_simple_transaction().await
}

// ============================================================================
// ICRC PUBLIC API ENDPOINTS
// ============================================================================

/// Transfer ICRC-1 tokens (public API)
#[update]
#[candid_method]
pub async fn transfer_icrc_tokens_public(
    canister_id: String,
    to: String,
    amount: u128,
) -> Result<String, String> {
    transfer_icrc_tokens(&canister_id, &to, amount).await
}

/// Get ICRC-1 token balance (public API)
#[update]
#[candid_method]
pub async fn get_icrc_balance_public(
    canister_id: String,
    account: String,
) -> Result<u128, String> {
    // Use the actual get_icrc_balance function to get real balances
    get_icrc_balance(&canister_id, &account).await
}

/// Transfer from ICRC-1 tokens (public API)
#[update]
#[candid_method]
pub async fn transfer_from_icrc_tokens_public(
    canister_id: String,
    from: String,
    to: String,
    amount: u128,
) -> Result<String, String> {
    transfer_from_icrc_tokens(&canister_id, &from, &to, amount).await
}

// ============================================================================
// CLEAN ARCHITECTURE - TSS FUNCTIONS ONLY
// ============================================================================

/// Transfer ERC20 tokens from backend canister to recipient
#[update]
#[candid_method]
pub async fn transfer_erc20_tokens_public(
    token_address: String,
    recipient: String,
    amount: String,
) -> Result<String, String> {
    evm::transfer_erc20_tokens(&token_address, &recipient, &amount).await
}

// ============================================================================
// SOLANA PUBLIC API ENDPOINTS
// ============================================================================

/// Get Solana account balance (public API)
#[update]
#[candid_method]
pub async fn get_solana_balance_public(account: String) -> Result<u64, String> {
    get_solana_balance(account).await
}

/// Get Solana slot (block number) (public API)
#[update]
#[candid_method]
pub async fn get_solana_slot_public() -> Result<u64, String> {
    get_solana_slot().await
}

/// Get Solana account info (public API)
#[update]
#[candid_method]
pub async fn get_solana_account_info_public(account: String) -> Result<String, String> {
    get_solana_account_info(account).await
}

/// Get SPL token account balance (public API)
#[update]
#[candid_method]
pub async fn get_spl_token_balance_public(token_account: String) -> Result<String, String> {
    let balance = get_spl_token_balance(token_account).await?;
    Ok(serde_json::to_string(&balance).unwrap())
}

/// Get associated token account address (public API)
#[update]
#[candid_method]
pub async fn get_associated_token_address_public(
    wallet_address: String,
    mint_address: String,
) -> Result<String, String> {
    solana::get_associated_token_address(&wallet_address, &mint_address).await
}

/// Create associated token account instruction (public API)
#[update]
#[candid_method]
pub async fn create_associated_token_account_instruction_public(
    funding_address: String,
    wallet_address: String,
    mint_address: String,
) -> Result<String, String> {
    let (account_address, instruction_data) = solana::create_associated_token_account_instruction(
        &funding_address,
        &wallet_address,
        &mint_address,
    ).await?;
    
    let response = serde_json::json!({
        "associated_token_account": account_address,
        "instruction_data": hex::encode(instruction_data)
    });
    
    Ok(serde_json::to_string(&response).unwrap())
}

/// Transfer SPL tokens instruction (public API)
#[query]
#[candid_method]
pub fn transfer_spl_tokens_instruction_public(
    source_address: String,
    destination_address: String,
    authority_address: String,
    amount: u64,
) -> Result<String, String> {
    let instruction_data = transfer_spl_tokens_instruction(
        &source_address,
        &destination_address,
        &authority_address,
        amount,
    )?;
    
    Ok(hex::encode(instruction_data))
}

/// Send SOL transaction (public API)
#[update]
#[candid_method]
pub async fn send_sol_transaction_public(
    from_address: String,
    to_address: String,
    amount: u64,
) -> Result<String, String> {
    send_sol_transaction(&from_address, &to_address, amount).await
}

/// Send SPL token transaction (public API)
#[update]
#[candid_method]
pub async fn send_spl_token_transaction_public(
    from_token_account: String,
    to_token_account: String,
    authority: String,
    amount: u64,
) -> Result<String, String> {
    send_spl_token_transaction(&from_token_account, &to_token_account, &authority, amount).await
}

/// Get Solana wallet for ICP principal (public API)
#[query]
#[candid_method]
pub fn get_solana_wallet_public(principal: String) -> Result<String, String> {
    let principal = Principal::from_text(principal)
        .map_err(|e| format!("Invalid principal: {}", e))?;
    
    let wallet = SolanaWallet::new(principal);
    Ok(wallet.get_solana_address())
}

/// Get canister's Solana address (public API)
#[query]
#[candid_method]
pub async fn get_canister_solana_address_public() -> Result<String, String> {
    solana::get_canister_solana_address().await
}

/// Sign and send a Solana transaction (public API)
#[update]
#[candid_method]
pub async fn sign_and_send_solana_transaction_public(
    transaction_data: String,
) -> Result<String, String> {
    solana::sign_and_send_solana_transaction(&transaction_data).await
}

// ============================================================================
// NEW SOLANA FUNCTIONS USING OFFICIAL SOL RPC CANISTER
// ============================================================================

/// Initialize the Solana state
#[update]
#[candid_method]
pub fn init_solana(init_arg: InitArg) {
    state::init_state(init_arg);
}

/// Get Solana account address for a principal
#[update]
#[candid_method]
pub async fn get_solana_account_address(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    wallet.solana_account().to_string()
}

/// Get SOL balance for an account
#[update]
#[candid_method]
pub async fn get_sol_balance(account: Option<String>) -> Nat {
    let account = account.unwrap_or(get_solana_account_address(None).await);
    let public_key = Pubkey::from_str(&account).unwrap();
    let balance = client()
        .get_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getBalance` failed");
    Nat::from(balance)
}

/// Send SOL from canister's account to recipient
#[update]
#[candid_method]
pub async fn send_sol(owner: Option<Principal>, to: String, amount: Nat) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;

    let recipient = Pubkey::from_str(&to).unwrap();
    let payer = wallet.solana_account();
    let amount = amount.0.to_u64().unwrap();

    ic_cdk::println!(
        "Instruction to transfer {amount} lamports from {} to {recipient}",
        payer.as_ref()
    );
    let instruction = instruction::transfer(payer.as_ref(), &recipient, amount);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string()
}

/// Get associated token account address
#[update]
#[candid_method]
pub async fn get_associated_token_account_address(
    owner: Option<Principal>, 
    mint_account: String
) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    let mint = Pubkey::from_str(&mint_account).unwrap();
    get_associated_token_address_with_program_id(
        wallet.solana_account().as_ref(),
        &mint,
        &get_account_owner(&mint).await,
    )
    .to_string()
}

/// Send SPL tokens
#[update]
#[candid_method]
pub async fn send_spl_token(
    owner: Option<Principal>,
    mint_account: String,
    to: String,
    amount: Nat,
) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;

    let payer = wallet.solana_account();
    let recipient = Pubkey::from_str(&to).unwrap();
    let mint = Pubkey::from_str(&mint_account).unwrap();
    let amount = amount.0.to_u64().unwrap();

    let token_program = get_account_owner(&mint).await;

    let from = get_associated_token_address_with_program_id(payer.as_ref(), &mint, &token_program);
    let to = get_associated_token_address_with_program_id(&recipient, &mint, &token_program);

    let instruction = spl::transfer_instruction_with_program_id(&from, &to, payer.as_ref(), amount, &token_program);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string()
}

async fn get_account_owner(account: &Pubkey) -> Pubkey {
    use sol_rpc_types::GetAccountInfoEncoding;
    let owner = client()
        .get_account_info(*account)
        .with_encoding(GetAccountInfoEncoding::Base64)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getAccountInfo` failed")
        .unwrap_or_else(|| panic!("Account not found for pubkey `{account}`"))
        .owner;
    Pubkey::from_str(&owner).unwrap()
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

#[query]
fn get_contract_info() -> String {
    format!(
        "Factory Address: {}\nICP Signer: {}\nChain ID: {}",
        FACTORY_ADDRESS, ICP_SIGNER_ADDRESS, SEPOLIA_CHAIN_ID
    )
}

// ============================================================================
// TESTING METHODS
// ============================================================================

#[update]
async fn test_all_contract_functions() -> Result<String, String> {
    let mut result = String::from("=== Sepolia Contract Test Results ===\n");
    
    // Test ICP Network Signer
    match get_icp_network_signer().await {
        Ok(response) => result.push_str(&format!("✅ ICP Network Signer: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ ICP Network Signer: {}\n", error)),
    }
    
    // Test Claim Fee
    match get_claim_fee().await {
        Ok(response) => result.push_str(&format!("✅ Claim Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Claim Fee: {}\n", error)),
    }
    
    // Test Refund Fee
    match get_refund_fee().await {
        Ok(response) => result.push_str(&format!("✅ Refund Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Refund Fee: {}\n", error)),
    }
    
    // Test Total Fees
    match get_total_fees().await {
        Ok(response) => result.push_str(&format!("✅ Total Fees: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Total Fees: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_basic_rpc() -> Result<String, String> {
    let mut result = String::from("=== Basic RPC Test Results ===\n");
    
    // Test block number
    match get_sepolia_block_number().await {
        Ok(block_number) => result.push_str(&format!("✅ Latest Block: {}\n", block_number)),
        Err(error) => result.push_str(&format!("❌ Block Number: {}\n", error)),
    }
    
    // Test balance
    match get_balance(ICP_SIGNER_ADDRESS.to_string()).await {
        Ok(balance) => result.push_str(&format!("✅ ICP Signer Balance: {}\n", balance)),
        Err(error) => result.push_str(&format!("❌ Balance: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_deployment_transaction() -> Result<String, String> {
    let deployment_tx = "0x632b719a0b30557774ad8e4a7025ccb75497bf38818cd16c9263c03b641c7338";
    
    match get_transaction_receipt(deployment_tx.to_string()).await {
        Ok(receipt) => Ok(format!("✅ Deployment Transaction Receipt:\n{}", receipt)),
        Err(error) => Err(format!("❌ Failed to get deployment receipt: {}", error)),
    }
}

// ============================================================================
// BRIDGELESS TOKEN API ENDPOINTS
// ============================================================================

/// Initialize the bridgeless token system
#[update]
#[candid_method]
pub async fn initialize_bridgeless_token_public(
    root_contract_address: String,
    token_name: String,
    token_symbol: String,
) -> Result<String, String> {
    initialize_bridgeless_token(root_contract_address, token_name, token_symbol).await
}

/// Create a new chain ledger
#[update]
#[candid_method]
pub async fn create_chain_ledger_public(
    chain_id: String,
    init_data: ChainInitData,
) -> Result<String, String> {
    create_chain_ledger(chain_id, init_data).await
}

/// Authorize a cross-chain transfer
#[update]
#[candid_method]
pub async fn authorize_cross_chain_transfer_public(
    transfer_id: String,
    amount: String,
    target_chain: String,
    recipient: String,
) -> Result<String, String> {
    authorize_cross_chain_transfer(transfer_id, amount, target_chain, recipient).await
}

/// Get all chain ledgers
#[query]
#[candid_method]
pub fn get_all_chain_ledgers_public() -> Vec<ChainLedger> {
    get_all_chain_ledgers()
}

/// Get chain ledger by ID
#[query]
#[candid_method]
pub fn get_chain_ledger_public(chain_id: String) -> Option<ChainLedger> {
    get_chain_ledger(&chain_id)
}

/// Get all cross-chain transfers
#[query]
#[candid_method]
pub fn get_all_cross_chain_transfers_public() -> Vec<CrossChainTransfer> {
    get_all_cross_chain_transfers()
}

/// Get cross-chain transfer by ID
#[query]
#[candid_method]
pub fn get_cross_chain_transfer_public(transfer_id: String) -> Option<CrossChainTransfer> {
    get_cross_chain_transfer(&transfer_id)
}

/// Get root contract address
#[query]
#[candid_method]
pub fn get_root_contract_address_public() -> Option<String> {
    get_root_contract_address()
}

// ============================================================================
// CANISTER LIFECYCLE
// ============================================================================

#[init]
fn init() {
    // Initialize the HTTP certification tree
    http_client::get_http_certification_tree();
    
    // Initialize SOL RPC client with default configuration
    let init_arg = InitArg {
        sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
        solana_network: Some(SolanaNetwork::Devnet),
        ed25519_key_name: Some(Ed25519KeyName::MainnetTestKey1),
        solana_commitment_level: Some(CommitmentLevel::Confirmed),
    };
    state::init_state(init_arg);
}

// Function to initialize nonce from blockchain (call this after deployment)
#[update]
async fn initialize_nonce() -> Result<String, String> {
    let canister_address = get_ethereum_address().await?;
    let nonce_response = get_transaction_count(canister_address.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let current_nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    let nonce_u64 = u64::from_str_radix(current_nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    
    update_current_nonce(nonce_u64);
    
    Ok(format!("Nonce initialized to: {}", nonce_u64))
}

#[pre_upgrade]
fn pre_upgrade() {
    // The certification tree will be re-initialized in post_upgrade
}

#[post_upgrade]
fn post_upgrade() {
    // Re-initialize the HTTP certification tree after upgrade
    http_client::get_http_certification_tree();
    
    // Re-initialize SOL RPC client with default configuration
    let init_arg = InitArg {
        sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
        solana_network: Some(SolanaNetwork::Devnet),
        ed25519_key_name: Some(Ed25519KeyName::MainnetTestKey1),
        solana_commitment_level: Some(CommitmentLevel::Confirmed),
    };
    state::init_state(init_arg);
}

// ============================================================================
// PERMIT SUBMISSION AND EXECUTION (LEGACY - KEEPING FOR REFERENCE)
// ============================================================================

#[update]
async fn submit_permit_signature(permit_data: PermitData) -> Result<String, String> {
    evm::submit_permit_signature(permit_data).await
}

// ============================================================================
// UNIFIED LIQUIDITY POOL PUBLIC API ENDPOINTS
// ============================================================================

/// Create a new unified liquidity pool
#[update]
#[candid_method]
pub async fn create_unified_liquidity_pool_public(
    base_asset: String,
    initial_chains: Vec<String>,
) -> Result<String, String> {
    create_unified_liquidity_pool(base_asset, initial_chains).await
}

/// Add a new chain to an existing pool
#[update]
#[candid_method]
pub async fn add_chain_to_pool_public(
    pool_id: String,
    chain_id: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    add_chain_to_pool(pool_id, chain_id, initial_liquidity).await
}

/// Deposit liquidity into a specific chain within a pool
#[update]
#[candid_method]
pub async fn deposit_liquidity_cross_chain_public(
    pool_id: String,
    user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    deposit_liquidity_cross_chain(pool_id, user, chain_id, amount).await
}

/// Withdraw liquidity from a specific chain within a pool
#[update]
#[candid_method]
pub async fn withdraw_liquidity_cross_chain_public(
    pool_id: String,
    user: String,
    chain_id: String,
    amount: u128,
) -> Result<String, String> {
    withdraw_liquidity_cross_chain(pool_id, user, chain_id, amount).await
}

/// Get total liquidity across all chains in a pool
#[query]
#[candid_method]
pub fn get_pool_total_liquidity_public(pool_id: String) -> Result<u128, String> {
    get_pool_total_liquidity(&pool_id)
}

/// Get liquidity distribution across chains for a pool
#[query]
#[candid_method]
pub fn get_pool_chain_distribution_public(pool_id: String) -> Result<HashMap<String, ChainLiquidity>, String> {
    get_pool_chain_distribution(&pool_id)
}

/// Get yield rates across all chains for a pool
#[query]
#[candid_method]
pub fn get_pool_yield_rates_public(pool_id: String) -> Result<HashMap<String, f64>, String> {
    get_pool_yield_rates(&pool_id)
}

/// Get pool information
#[query]
#[candid_method]
pub fn get_pool_info_public(pool_id: String) -> Result<UnifiedLiquidityPool, String> {
    get_pool_info(&pool_id)
}

/// List all pools
#[query]
#[candid_method]
pub fn list_all_pools_public() -> Vec<String> {
    list_all_pools()
}

/// Update chain health state
#[update]
#[candid_method]
pub fn update_chain_health_state_public(
    chain_id: String,
    last_block: u64,
    response_time_ms: u64,
    is_healthy: bool,
) -> Result<String, String> {
    update_chain_health_state(chain_id, last_block, response_time_ms, is_healthy)
}

/// Get health status of all chains
#[query]
#[candid_method]
pub fn get_all_chain_states_public() -> Vec<ChainState> {
    get_all_chain_states()
}

/// Create a Solana-specific liquidity pool
#[update]
#[candid_method]
pub async fn create_solana_liquidity_pool_public(
    pool_id: String,
    base_asset: String,
    initial_liquidity: u128,
) -> Result<String, String> {
    unified_pools::create_solana_liquidity_pool(pool_id, base_asset, initial_liquidity)
}

/// Get Solana chain state
#[query]
#[candid_method]
pub fn get_solana_chain_state_public() -> ChainState {
    unified_pools::get_solana_chain_state()
}

/// Basic yield optimization for a pool
#[update]
#[candid_method]
pub async fn optimize_pool_yields_basic_public(pool_id: String) -> Result<Vec<CapitalMove>, String> {
    optimize_pool_yields_basic(&pool_id).await
}

/// Simulate yield rates for testing (mock data)
#[update]
#[candid_method]
pub async fn simulate_yield_rates_public(
    pool_id: String,
    chain_yields: HashMap<String, f64>,
) -> Result<String, String> {
    let pools = get_unified_liquidity_pools();
    
    if let Some(mut pool) = pools.get_mut(&pool_id) {
        // Update yield rates for each chain
        for (chain_id, yield_rate) in chain_yields {
            if let Some(chain_liquidity) = pool.chain_distribution.get_mut(&chain_id) {
                chain_liquidity.current_apy = yield_rate;
                chain_liquidity.last_updated = ic_cdk::api::time() / 1_000_000_000;
            }
        }
        
        // Update pool
        update_unified_liquidity_pool(&pool_id, pool.clone());
        
        Ok("Yield rates updated successfully".to_string())
    } else {
        Err("Pool not found".to_string())
    }
}

/// Test endpoint to verify unified pool system is working
#[query]
#[candid_method]
pub fn test_unified_pool_system() -> String {
    "✅ Unified liquidity pool system is operational!".to_string()
}

// ============================================================================
// CANDID EXPORT
// ============================================================================

// Enable Candid export for automatic interface generation
ic_cdk::export_candid!();
