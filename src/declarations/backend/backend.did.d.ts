import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
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
