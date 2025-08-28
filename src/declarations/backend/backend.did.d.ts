import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AtomicSwapOrder {
  'maker' : string,
  'status' : SwapOrderStatus,
  'icp_destination_principal' : [] | [string],
  'taker' : string,
  'destination_htlc_id' : [] | [string],
  'destination_amount' : string,
  'hashlock' : string,
  'evm_destination_address' : [] | [string],
  'secret' : string,
  'created_at' : bigint,
  'source_htlc_id' : [] | [string],
  'order_id' : string,
  'source_amount' : string,
  'source_token' : string,
  'expires_at' : bigint,
  'counter_order_id' : [] | [string],
  'destination_token' : string,
  'timelock' : bigint,
}
export interface ChainInitData {
  'token_symbol' : string,
  'chain_id' : string,
  'chain_name' : string,
  'token_name' : string,
  'total_supply' : bigint,
}
export interface ChainLedger {
  'token_symbol' : string,
  'created_at' : bigint,
  'circulating_supply' : bigint,
  'chain_id' : string,
  'chain_name' : string,
  'token_name' : string,
  'total_supply' : bigint,
}
export interface CrossChainSwapOrder {
  'maker' : string,
  'source_chain_id' : bigint,
  'destination_asset' : string,
  'status' : HTLCStatus,
  'taker' : string,
  'direction' : SwapDirection,
  'destination_amount' : string,
  'hashlock' : string,
  'secret' : [] | [string],
  'created_at' : bigint,
  'order_id' : string,
  'source_amount' : string,
  'expiration_time' : bigint,
  'source_asset' : string,
  'destination_chain_id' : bigint,
}
export interface CrossChainTransfer {
  'source_chain' : string,
  'status' : string,
  'recipient' : string,
  'created_at' : bigint,
  'transfer_id' : string,
  'target_chain' : string,
  'amount' : string,
}
export interface GaslessApprovalRequest {
  'token_address' : string,
  'user_address' : string,
  'permit_request' : PermitRequest,
  'amount' : string,
}
export interface HTLC {
  'id' : string,
  'source_chain' : bigint,
  'status' : HTLCStatus,
  'token' : string,
  'hashlock' : string,
  'is_cross_chain' : boolean,
  'recipient' : string,
  'secret' : [] | [string],
  'created_at' : bigint,
  'sender' : string,
  'order_hash' : string,
  'target_chain' : bigint,
  'amount' : string,
  'timelock' : bigint,
}
export type HTLCStatus = { 'Refunded' : null } |
  { 'Claimed' : null } |
  { 'Deposited' : null } |
  { 'Created' : null } |
  { 'Expired' : null };
export interface PermitRequest {
  'r' : string,
  's' : string,
  'v' : string,
  'signature' : string,
  'value' : string,
  'owner' : string,
  'deadline' : string,
  'nonce' : string,
  'spender' : string,
}
export type SwapDirection = { 'EVMtoICP' : null } |
  { 'ICPtoEVM' : null };
export type SwapOrderStatus = { 'DestinationHTLCClaimed' : null } |
  { 'SourceHTLCCreated' : null } |
  { 'SourceHTLCClaimed' : null } |
  { 'Cancelled' : null } |
  { 'Created' : null } |
  { 'Completed' : null } |
  { 'Expired' : null } |
  { 'DestinationHTLCCreated' : null };
export interface _SERVICE {
  'authorize_cross_chain_transfer_public' : ActorMethod<
    [string, string, string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'check_expired_orders' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'claim_evm_htlc' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'claim_htlc_funds' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'claim_icp_htlc_public' : ActorMethod<
    [string, string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'complete_cross_chain_swap' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'complete_cross_chain_swap_public' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'coordinate_cross_chain_swap_public' : ActorMethod<
    [string, SwapDirection],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_associated_token_account_instruction_public' : ActorMethod<
    [string, string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_chain_ledger_public' : ActorMethod<
    [string, ChainInitData],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_cross_chain_swap_order' : ActorMethod<
    [string, string, string, string, string, string, bigint, bigint, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_evm_htlc' : ActorMethod<
    [string, boolean],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_evm_to_icp_order' : ActorMethod<
    [string, string, string, string, string, string, bigint, PermitRequest],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_htlc_escrow' : ActorMethod<
    [
      string,
      string,
      string,
      string,
      string,
      string,
      bigint,
      SwapDirection,
      bigint,
      bigint,
    ],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_icp_htlc_public' : ActorMethod<
    [string, string, bigint, string, bigint, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_icp_to_evm_order' : ActorMethod<
    [string, string, string, string, string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'deposit_to_htlc' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'execute_atomic_swap' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'execute_cross_chain_swap' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'execute_gasless_approval' : ActorMethod<
    [GaslessApprovalRequest],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_all_atomic_swap_orders' : ActorMethod<[], Array<AtomicSwapOrder>>,
  'get_all_chain_ledgers_public' : ActorMethod<[], Array<ChainLedger>>,
  'get_all_cross_chain_transfers_public' : ActorMethod<
    [],
    Array<CrossChainTransfer>
  >,
  'get_all_htlcs' : ActorMethod<[], Array<HTLC>>,
  'get_all_swap_orders' : ActorMethod<[], Array<CrossChainSwapOrder>>,
  'get_associated_token_address_public' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_atomic_swap_order' : ActorMethod<[string], [] | [AtomicSwapOrder]>,
  'get_balance' : ActorMethod<[string], { 'Ok' : string } | { 'Err' : string }>,
  'get_chain_ledger_public' : ActorMethod<[string], [] | [ChainLedger]>,
  'get_claim_fee' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_compatible_orders' : ActorMethod<[string], Array<AtomicSwapOrder>>,
  'get_contract_info' : ActorMethod<[], string>,
  'get_cross_chain_swap_status_public' : ActorMethod<
    [string],
    { 'Ok' : SwapOrderStatus } |
      { 'Err' : string }
  >,
  'get_cross_chain_transfer_public' : ActorMethod<
    [string],
    [] | [CrossChainTransfer]
  >,
  'get_ethereum_address' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_htlc' : ActorMethod<[string], [] | [HTLC]>,
  'get_icp_htlc_status_public' : ActorMethod<
    [string],
    { 'Ok' : HTLCStatus } |
      { 'Err' : string }
  >,
  'get_icp_network_signer' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_icrc_balance_public' : ActorMethod<
    [string, string],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'get_orders_by_status' : ActorMethod<
    [SwapOrderStatus],
    Array<AtomicSwapOrder>
  >,
  'get_public_key' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_refund_fee' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_root_contract_address_public' : ActorMethod<[], [] | [string]>,
  'get_sepolia_block_number' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_solana_account_info_public' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_solana_balance_public' : ActorMethod<
    [string],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'get_solana_slot_public' : ActorMethod<
    [],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'get_solana_wallet_public' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_spl_token_balance_public' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_swap_order' : ActorMethod<[string], [] | [CrossChainSwapOrder]>,
  'get_total_fees' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_transaction_count' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_transaction_receipt' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'initialize_bridgeless_token_public' : ActorMethod<
    [string, string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'initialize_nonce' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'list_icp_htlcs_public' : ActorMethod<[], Array<HTLC>>,
  'refund_htlc_funds' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'refund_icp_htlc_public' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'send_sol_transaction_public' : ActorMethod<
    [string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'send_spl_token_transaction_public' : ActorMethod<
    [string, string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'submit_permit_signature' : ActorMethod<
    [PermitRequest],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'test_all_contract_functions' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'test_basic_rpc' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'test_deployment_transaction' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'test_signing_address' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'test_simple_transaction' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'transfer_erc20_tokens_public' : ActorMethod<
    [string, string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'transfer_from_icrc_tokens_public' : ActorMethod<
    [string, string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'transfer_icrc_tokens_public' : ActorMethod<
    [string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'transfer_spl_tokens_instruction_public' : ActorMethod<
    [string, string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'validate_cross_chain_order_public' : ActorMethod<
    [string],
    { 'Ok' : boolean } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
