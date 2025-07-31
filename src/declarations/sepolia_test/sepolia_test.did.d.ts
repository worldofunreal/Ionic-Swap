import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HttpResponseResult {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export interface http_header { 'value' : string, 'name' : string }
export interface _SERVICE {
  'deposit_cycles' : ActorMethod<[], undefined>,
  'get_balance' : ActorMethod<[string], Result>,
  'get_claim_fee' : ActorMethod<[], Result>,
  'get_contract_info' : ActorMethod<[], string>,
  'get_cycles_balance' : ActorMethod<[], bigint>,
  'get_icp_network_signer' : ActorMethod<[], Result>,
  'get_refund_fee' : ActorMethod<[], Result>,
  'get_sepolia_block_number' : ActorMethod<[], Result>,
  'get_total_fees' : ActorMethod<[], Result>,
  'get_transaction_receipt' : ActorMethod<[string], Result>,
  'test_all_contract_functions' : ActorMethod<[], Result>,
  'test_basic_rpc' : ActorMethod<[], Result>,
  'test_deployment_transaction' : ActorMethod<[], Result>,
  'transform' : ActorMethod<
    [{ 'context' : Uint8Array | number[], 'response' : HttpResponseResult }],
    HttpResponseResult
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
