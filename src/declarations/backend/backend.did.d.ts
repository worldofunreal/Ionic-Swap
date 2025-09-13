import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CompactProfile {
  'id' : Principal,
  'bio' : [] | [string],
  'username' : string,
  'avatar_url' : [] | [string],
  'is_following_me' : boolean,
  'display_name' : [] | [string],
  'am_following_them' : boolean,
  'is_verified' : boolean,
}
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
export interface FaucetClaim {
  'user' : Principal,
  'timestamp' : bigint,
  'amount' : bigint,
}
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'certificate_version' : [] | [number],
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'upgrade' : [] | [boolean],
  'status_code' : number,
}
export interface InitArg { 'solana_network' : [] | [SolanaNetwork] }
export interface InternalToken {
  'decimals' : number,
  'owner' : Principal,
  'name' : string,
  'total_supply' : bigint,
  'symbol' : string,
}
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
export interface PersonalUser {
  'id' : Principal,
  'bio' : [] | [string],
  'updated_at' : bigint,
  'username' : string,
  'evm_address' : [] | [string],
  'bitcoin_address' : [] | [string],
  'banner_url' : [] | [string],
  'avatar_url' : [] | [string],
  'following_count' : number,
  'is_following_me' : boolean,
  'created_at' : bigint,
  'website' : [] | [string],
  'display_name' : [] | [string],
  'am_following_them' : boolean,
  'is_verified' : boolean,
  'solana_address' : [] | [string],
  'followers_count' : number,
  'location' : [] | [string],
}
export interface PriceUpdateResult {
  'total_sources' : number,
  'pairs_updated' : Array<TradingPair>,
  'successful_sources' : number,
  'timestamp' : bigint,
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : null } |
  { 'Err' : UserError };
export type Result_10 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_11 = { 'Ok' : PriceUpdateResult } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : string } |
  { 'Err' : UserError };
export type Result_3 = { 'Ok' : User } |
  { 'Err' : UserError };
export type Result_4 = { 'Ok' : TradingPair } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : PersonalUser } |
  { 'Err' : UserError };
export type Result_6 = { 'Ok' : boolean } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : Array<CompactProfile> } |
  { 'Err' : UserError };
export type Result_8 = { 'Ok' : EvmSwapResult } |
  { 'Err' : string };
export type Result_9 = { 'Ok' : SwapResult } |
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
export interface User {
  'id' : Principal,
  'bio' : [] | [string],
  'updated_at' : bigint,
  'username' : string,
  'evm_address' : [] | [string],
  'bitcoin_address' : [] | [string],
  'banner_url' : [] | [string],
  'avatar_url' : [] | [string],
  'following_count' : number,
  'created_at' : bigint,
  'website' : [] | [string],
  'display_name' : [] | [string],
  'is_verified' : boolean,
  'solana_address' : [] | [string],
  'followers_count' : number,
  'location' : [] | [string],
}
export type UserError = { 'InvalidInput' : string } |
  { 'UsernameTaken' : null } |
  { 'Unauthorized' : null } |
  { 'InternalError' : string } |
  { 'UserNotFound' : null };
export interface UserUpdate {
  'bio' : [] | [string],
  'evm_address' : [] | [string],
  'bitcoin_address' : [] | [string],
  'banner_url' : [] | [string],
  'avatar_url' : [] | [string],
  'website' : [] | [string],
  'display_name' : [] | [string],
  'solana_address' : [] | [string],
  'location' : [] | [string],
}
export interface _SERVICE {
  'claim_faucet' : ActorMethod<[], Result>,
  'debug_test_external_apis' : ActorMethod<[], Result>,
  'debug_wallet_verification' : ActorMethod<[], Result>,
  'delete_account' : ActorMethod<[], Result_1>,
  'export_token_registry' : ActorMethod<[], Result>,
  'finalize_upload' : ActorMethod<[string], Result_2>,
  'follow_user' : ActorMethod<[Principal], Result_3>,
  'get_all_internal_tokens' : ActorMethod<[], Array<InternalToken>>,
  'get_all_supported_tokens' : ActorMethod<[], Result>,
  'get_all_usernames' : ActorMethod<[], Array<string>>,
  'get_canister_ethereum_address' : ActorMethod<[], string>,
  'get_canister_public_key' : ActorMethod<[], string>,
  'get_current_prices' : ActorMethod<[], Result>,
  'get_faucet_claim' : ActorMethod<[Principal], [] | [FaucetClaim]>,
  'get_faucet_stats' : ActorMethod<[], [bigint, bigint]>,
  'get_followers' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_following' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_pair_price' : ActorMethod<[string], Result_4>,
  'get_solana_token_balances' : ActorMethod<[], Result>,
  'get_token_address' : ActorMethod<[string, string], Result>,
  'get_token_balance' : ActorMethod<[Principal, string], bigint>,
  'get_token_info' : ActorMethod<[string], Result>,
  'get_token_registry_stats' : ActorMethod<[], Result>,
  'get_tokens_by_chain' : ActorMethod<[string], Result>,
  'get_user' : ActorMethod<[Principal], Result_3>,
  'get_user_balances' : ActorMethod<[Principal], Array<[string, bigint]>>,
  'get_user_by_username' : ActorMethod<[string], Result_3>,
  'get_user_count' : ActorMethod<[], bigint>,
  'get_user_personal' : ActorMethod<[Principal, Principal], Result_5>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'init_upload' : ActorMethod<
    [string, bigint, [] | [bigint], string],
    Result_1
  >,
  'is_following' : ActorMethod<[Principal, Principal], boolean>,
  'is_token_deployed' : ActorMethod<[string, string], Result_6>,
  'is_username_available' : ActorMethod<[string], boolean>,
  'reload_token_registry' : ActorMethod<[], Result>,
  'search_users' : ActorMethod<[string, number], Result_7>,
  'search_users_personal' : ActorMethod<[string, number, Principal], Result_7>,
  'signup' : ActorMethod<
    [string, [] | [string], [] | [string], [] | [string]],
    Result_3
  >,
  'start_price_scheduler' : ActorMethod<[], Result>,
  'stop_price_scheduler' : ActorMethod<[], Result>,
  'store_chunk' : ActorMethod<
    [bigint, Uint8Array | number[], string],
    Result_1
  >,
  'submit_delegation_transaction' : ActorMethod<
    [Uint8Array | number[]],
    Result
  >,
  'submit_gasless_permit' : ActorMethod<[PermitRequest], Result>,
  'swap_evm' : ActorMethod<[PermitRequest, EvmSwapRequest], Result_8>,
  'swap_solana' : ActorMethod<[Uint8Array | number[], SwapRequest], Result_9>,
  'test_ed25519' : ActorMethod<[], Result>,
  'test_secp256k1' : ActorMethod<[], Result>,
  'test_simple_evm_transaction' : ActorMethod<[], Result>,
  'transfer_tokens' : ActorMethod<
    [Principal, Principal, string, bigint],
    Result_10
  >,
  'unfollow_user' : ActorMethod<[Principal], Result_3>,
  'update_avatar' : ActorMethod<[string], Result_3>,
  'update_banner' : ActorMethod<[string], Result_3>,
  'update_bio' : ActorMethod<[string], Result_3>,
  'update_bitcoin_address' : ActorMethod<[string], Result_3>,
  'update_display_name' : ActorMethod<[string], Result_3>,
  'update_evm_address' : ActorMethod<[string], Result_3>,
  'update_location' : ActorMethod<[string], Result_3>,
  'update_prices' : ActorMethod<[], Result_11>,
  'update_profile' : ActorMethod<[UserUpdate], Result_3>,
  'update_solana_address' : ActorMethod<[string], Result_3>,
  'update_website' : ActorMethod<[string], Result_3>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
