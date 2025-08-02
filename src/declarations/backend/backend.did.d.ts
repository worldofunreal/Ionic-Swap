import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AtomicSwapOrder {
  'maker' : string,
  'status' : SwapOrderStatus,
  'taker' : string,
  'destination_htlc_id' : [] | [string],
  'destination_amount' : string,
  'hashlock' : string,
  'secret' : string,
  'created_at' : bigint,
  'source_htlc_id' : [] | [string],
  'order_id' : string,
  'source_amount' : string,
  'source_token' : string,
  'expires_at' : bigint,
  'destination_token' : string,
  'timelock' : bigint,
}
export interface GaslessApprovalRequest {
  'user_address' : string,
  'permit_request' : PermitRequest,
  'amount' : string,
}
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
export type SwapOrderStatus = { 'DestinationHTLCClaimed' : null } |
  { 'SourceHTLCCreated' : null } |
  { 'SourceHTLCClaimed' : null } |
  { 'Cancelled' : null } |
  { 'Created' : null } |
  { 'Completed' : null } |
  { 'Expired' : null } |
  { 'DestinationHTLCCreated' : null };
export interface _SERVICE {
  'claim_evm_htlc' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_atomic_swap_order' : ActorMethod<
    [string, string, string, string, string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'create_evm_htlc' : ActorMethod<
    [string, boolean],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'execute_atomic_swap' : ActorMethod<
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
  'get_atomic_swap_order' : ActorMethod<[string], [] | [AtomicSwapOrder]>,
  'get_balance' : ActorMethod<[string], { 'Ok' : string } | { 'Err' : string }>,
  'get_claim_fee' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_contract_info' : ActorMethod<[], string>,
  'get_ethereum_address' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_icp_network_signer' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_public_key' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_refund_fee' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_sepolia_block_number' : ActorMethod<
    [],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_total_fees' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'get_transaction_receipt' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'initialize_nonce' : ActorMethod<[], { 'Ok' : string } | { 'Err' : string }>,
  'send_raw_transaction' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'sign_transaction' : ActorMethod<
    [string, string, string, string],
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
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
