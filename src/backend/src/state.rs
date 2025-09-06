use crate::{
    ed25519::get_ed25519_public_key, Ed25519KeyName, SolanaNetwork,
};
use candid::Principal;
use sol_rpc_client::ed25519::DerivationPath;
use sol_rpc_types::CommitmentLevel;
use std::cell::RefCell;

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::new(None);
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct State {
    solana_network: SolanaNetwork,
    solana_commitment_level: CommitmentLevel,
    ed25519_key_name: Ed25519KeyName,
    sol_rpc_canister_id: Option<Principal>,
}

impl State {
    pub fn solana_network(&self) -> &SolanaNetwork {
        &self.solana_network
    }

    pub fn solana_commitment_level(&self) -> CommitmentLevel {
        self.solana_commitment_level.clone()
    }

    pub fn ed25519_key_name(&self) -> Ed25519KeyName {
        self.ed25519_key_name
    }

    pub fn sol_rpc_canister_id(&self) -> Option<Principal> {
        self.sol_rpc_canister_id
    }
}

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|state| f(state.borrow().as_ref().expect("State not initialized")))
}

pub fn init_state(init_arg: crate::InitArg) {
    STATE.with(|state| {
        *state.borrow_mut() = Some(State {
            solana_network: init_arg
                .solana_network
                .unwrap_or(SolanaNetwork::Devnet),
            solana_commitment_level: init_arg
                .solana_commitment_level
                .unwrap_or(CommitmentLevel::Finalized),
            ed25519_key_name: init_arg
                .ed25519_key_name
                .unwrap_or(Ed25519KeyName::MainnetTestKey1),
            sol_rpc_canister_id: init_arg.sol_rpc_canister_id,
        });
    });
}

pub async fn lazy_call_ed25519_public_key() -> crate::ed25519::Ed25519ExtendedPublicKey {
    let key_name = read_state(|s| s.ed25519_key_name());
    let derivation_path = DerivationPath::from(vec![]);
    get_ed25519_public_key(key_name, &derivation_path).await
}
