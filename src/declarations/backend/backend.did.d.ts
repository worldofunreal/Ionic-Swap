import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface EvmSwapRequest {
  'min_amount_out' : bigint,
  'deadline' : bigint,
  'amount_out' : bigint,
  'user_address' : string,
  'token_in_mint' : string,
  'amount_in' : bigint,
  'token_out_mint' : string,
}
export interface EvmSwapResult {
  'token_in_amount' : bigint,
  'permit_tx_hash' : string,
  'swap_tx_hash' : string,
  'token_out_amount' : bigint,
}
export interface IcpPermitRequest {
  'r' : string,
  's' : string,
  'v' : string,
  'token' : string,
  'owner' : string,
  'deadline' : string,
  'amount' : string,
  'spender' : string,
}
export interface InitArg { 'solana_network' : [] | [SolanaNetwork] }
export interface PermitRequest {
  'r' : string,
  's' : string,
  'v' : string,
  'token' : string,
  'value' : string,
  'owner' : string,
  'deadline' : string,
  'spender' : string,
}
export interface PriceUpdateResult {
  'total_sources' : number,
  'pairs_updated' : Array<TradingPair>,
  'successful_sources' : number,
  'timestamp' : bigint,
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : TradingPair } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : EvmSwapResult } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : SwapResult } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : PriceUpdateResult } |
  { 'Err' : string };
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Testnet' : null } |
  { 'Devnet' : null };
export interface SwapRequest {
  'min_amount_out' : bigint,
  'deadline' : bigint,
  'amount_out' : bigint,
  'user_token_account' : string,
  'token_out_mint' : string,
}
export interface SwapResult {
  'delegation_tx_hash' : string,
  'token_in_amount' : bigint,
  'swap_tx_hash' : string,
  'token_out_amount' : bigint,
}
export interface TradingPair {
  'base' : string,
  'quote' : string,
  'last_updated' : bigint,
  'sources_count' : number,
  'price' : number,
}
export interface _SERVICE {
  'debug_test_external_apis' : ActorMethod<[], Result>,
  'debug_wallet_verification' : ActorMethod<[], Result>,
  'get_canister_ethereum_address' : ActorMethod<[], string>,
  'get_canister_icrc_balances' : ActorMethod<[], Result>,
  'get_canister_public_key' : ActorMethod<[], string>,
  'get_current_prices' : ActorMethod<[], Result>,
  'get_pair_price' : ActorMethod<[string], Result_1>,
  'get_solana_token_balances' : ActorMethod<[], Result>,
  'start_price_scheduler' : ActorMethod<[], Result>,
  'stop_price_scheduler' : ActorMethod<[], Result>,
  'submit_delegation_transaction' : ActorMethod<
    [Uint8Array | number[]],
    Result
  >,
  'submit_gasless_permit' : ActorMethod<[PermitRequest], Result>,
  'submit_icp_gasless_permit' : ActorMethod<[IcpPermitRequest], Result>,
  'swap_evm' : ActorMethod<[PermitRequest, EvmSwapRequest], Result_2>,
  'swap_solana' : ActorMethod<[Uint8Array | number[], SwapRequest], Result_3>,
  'test_ed25519' : ActorMethod<[], Result>,
  'test_secp256k1' : ActorMethod<[], Result>,
  'test_simple_evm_transaction' : ActorMethod<[], Result>,
  'update_prices' : ActorMethod<[], Result_4>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
