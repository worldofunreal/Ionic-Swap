pub mod ed25519;
pub mod state;
pub mod solana_wallet;

use crate::state::{read_state, State};
use candid::{CandidType, Principal};
use serde::Deserialize;
use sol_rpc_client::{ed25519::Ed25519KeyId, IcRuntime, SolRpcClient};
use sol_rpc_types::{
    CommitmentLevel, ConsensusStrategy, RpcEndpoint, RpcSource, RpcSources, SolanaCluster,
};

pub fn client() -> SolRpcClient<IcRuntime> {
    let rpc_sources = read_state(|state| state.solana_network().clone()).into();
    let consensus_strategy = match rpc_sources {
        RpcSources::Custom(_) => ConsensusStrategy::Equality,
        RpcSources::Default(_) => ConsensusStrategy::Threshold {
            min: 2,
            total: Some(3),
        },
    };
    read_state(|state| state.sol_rpc_canister_id())
        .map(|canister_id| SolRpcClient::builder(IcRuntime, canister_id))
        .unwrap_or(SolRpcClient::builder_for_ic())
        .with_rpc_sources(rpc_sources)
        .with_consensus_strategy(consensus_strategy)
        .with_default_commitment_level(read_state(State::solana_commitment_level))
        .build()
}

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

pub fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}

// Re-export commonly used types and functions
pub use state::init_state;

// Canister entry points
use candid::Nat;
use ic_cdk::{init, post_upgrade, update};
use num::ToPrimitive;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_system_interface::instruction;
use solana_transaction::Transaction;
use std::str::FromStr;

#[init]
pub fn init(init_arg: InitArg) {
    init_state(init_arg)
}

#[post_upgrade]
fn post_upgrade(init_arg: Option<InitArg>) {
    if let Some(init_arg) = init_arg {
        init_state(init_arg)
    }
}

// Get the Solana address derived from a principal
#[update]
pub async fn solana_account(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    wallet.solana_account().to_string()
}

// Get the SOL balance of a given account
#[update]
pub async fn get_balance(account: Option<String>) -> Nat {
    let account = account.unwrap_or(solana_account(None).await);
    let public_key = Pubkey::from_str(&account).unwrap();
    let balance = client()
        .get_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getBalance` failed");
    Nat::from(balance)
}

// Sign and send a SOL transfer transaction
#[update]
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

// Sign a transaction message and return the signature (without sending)
#[update]
pub async fn sign_transaction(owner: Option<Principal>, message_bytes: Vec<u8>) -> String {
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;
    let account = wallet.solana_account();

    // Deserialize the message
    let message: Message = bincode::deserialize(&message_bytes)
        .expect("Failed to deserialize message");

    // Sign the message
    let signature = account.sign_message(&message).await;
    
    signature.to_string()
}

// Create a simple transfer instruction and return the message bytes for signing
#[update]
pub async fn create_transfer_message(
    owner: Option<Principal>, 
    to: String, 
    amount: Nat
) -> Vec<u8> {
    let client = client();
    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = solana_wallet::SolanaWallet::new(owner).await;

    let recipient = Pubkey::from_str(&to).unwrap();
    let payer = wallet.solana_account();
    let amount = amount.0.to_u64().unwrap();

    let instruction = instruction::transfer(payer.as_ref(), &recipient, amount);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );

    bincode::serialize(&message).expect("Failed to serialize message")
}

// Permit-related types and functionality
#[derive(CandidType, Deserialize, Clone)]
pub struct PermitMessage {
    pub order_id: [u8; 32],
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub user_pubkey: String,
    pub nonce: u64,
    pub deadline: i64,
}

#[derive(CandidType, Deserialize)]
pub struct CreateEscrowWithPermitArgs {
    pub order_id: Vec<u8>,
    pub amount: u64,
    pub expiry_timestamp: u64,
    pub permit_signature: Vec<u8>,
    pub nonce: u64,
    pub deadline: u64,
    pub user_pubkey: String,
    pub token_mint: String,
}

// Create escrow using permit (gasless for user)
#[update]
pub async fn create_escrow_with_permit(args: CreateEscrowWithPermitArgs) -> Result<String, String> {
    ic_cdk::println!("Creating escrow with permit: order_id={:?}, amount={}, user={}", 
        args.order_id, args.amount, args.user_pubkey);
    
    // Validate input parameters
    if args.order_id.len() != 32 {
        return Err("Order ID must be exactly 32 bytes".to_string());
    }
    
    if args.permit_signature.len() != 64 {
        return Err("Permit signature must be exactly 64 bytes".to_string());
    }
    
    // Convert the arguments to the format expected by the Solana program
    let order_id_array: [u8; 32] = {
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&args.order_id);
        arr
    };
    
    let permit_signature_array: [u8; 64] = {
        let mut arr = [0u8; 64];
        arr.copy_from_slice(&args.permit_signature);
        arr
    };
    
    // Call the Solana program's reserve_with_permit method
    match call_solana_reserve_with_permit(
        order_id_array,
        args.amount,
        args.expiry_timestamp as i64,
        permit_signature_array,
        args.nonce,
        args.deadline as i64,
        args.user_pubkey,
        args.token_mint,
    ).await {
        Ok(tx_id) => Ok(tx_id),
        Err(e) => Err(format!("Failed to create escrow: {}", e)),
    }
}

// Helper function to call the Solana program
async fn call_solana_reserve_with_permit(
    order_id: [u8; 32],
    amount: u64,
    expiry_timestamp: i64,
    permit_signature: [u8; 64],
    nonce: u64,
    deadline: i64,
    user_pubkey: String,
    token_mint: String,
) -> Result<String, String> {
    // TODO: Implement actual Solana transaction creation and sending
    // This would involve:
    // 1. Creating the instruction to call reserve_with_permit on the Solana program
    // 2. Building the transaction
    // 3. Signing and sending it
    // 4. Returning the transaction ID
    
    // For now, return a mock transaction ID based on the order_id
    let tx_id = format!("solana_tx_{}", bs58::encode(&order_id[..8]).into_string());
    ic_cdk::println!("Mock transaction created: {}", tx_id);
    
    Ok(tx_id)
}

// Enable Candid export
ic_cdk::export_candid!();
