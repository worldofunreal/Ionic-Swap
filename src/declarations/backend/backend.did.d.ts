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
export interface LiquidityConfig {
  'max_dissolve_delay_seconds' : bigint,
  'max_trade_amount_usdt' : bigint,
  'k_depth' : number,
  'spread_base' : number,
  'paused_tokens' : Array<string>,
  'oracle_failure_threshold' : number,
  'volatility_window_seconds' : bigint,
  'min_dissolve_delay_seconds' : bigint,
  'token_thresholds' : Array<[string, TokenThresholds]>,
  'fee_rate_base' : number,
  'k_vol' : number,
  'max_hourly_volume_usdt' : bigint,
}
export interface LiquidityNeuron {
  'id' : string,
  'dissolve_delay_seconds' : bigint,
  'withdrawn_amount' : bigint,
  'staked_amount' : bigint,
  'token_symbol' : string,
  'user' : Principal,
  'created_at' : bigint,
  'dissolving_started_at' : [] | [bigint],
  'state' : NeuronState,
  'last_fee_index' : number,
}
export type LiquidityStatus = { 'Healthy' : null } |
  { 'Critical' : null } |
  { 'NeedsRebalance' : null } |
  { 'Halted' : null };
export interface LiquidityTransaction {
  'id' : string,
  'transaction_type' : LiquidityTxType,
  'token_symbol' : string,
  'user' : Principal,
  'error_message' : [] | [string],
  'before_state' : [] | [string],
  'after_state' : [] | [string],
  'timestamp' : bigint,
  'success' : boolean,
  'amount' : bigint,
  'position_id' : [] | [string],
}
export type LiquidityTxType = { 'FullWithdraw' : null } |
  { 'ClaimFees' : null } |
  { 'Stake' : null } |
  { 'CancelDissolving' : null } |
  { 'EmergencyPause' : null } |
  { 'StartDissolving' : null } |
  { 'ConfigUpdate' : null } |
  { 'PartialWithdraw' : null };
export type NeuronState = { 'Dissolved' : null } |
  { 'Locked' : null } |
  { 'Dissolving' : null };
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
export interface PoolInfo {
  'fees_from_volatility' : bigint,
  'current_volatility_1h' : number,
  'liquidity_status' : LiquidityStatus,
  'token_symbol' : string,
  'available_liquidity' : bigint,
  'tvl_usdt' : [] | [number],
  'fees_from_volatility_usdt' : [] | [number],
  'total_staked' : bigint,
  'current_price_usdt' : [] | [number],
  'fees_from_trading' : bigint,
  'available_liquidity_usdt' : [] | [number],
  'global_fee_index' : number,
  'fees_from_trading_usdt' : [] | [number],
  'fees_from_spread_usdt' : [] | [number],
  'total_volume_1h' : bigint,
  'total_fees_collected' : bigint,
  'fees_from_spread' : bigint,
  'fees_from_depth_usdt' : [] | [number],
  'total_voting_power' : number,
  'total_fees_collected_usdt' : [] | [number],
  'fees_from_depth' : bigint,
}
export interface PortfolioData {
  'change_24h' : number,
  'current_value_usdt' : number,
  'total_trades' : number,
  'change_24h_percent' : number,
  'portfolio_history' : Array<PortfolioPoint>,
  'initial_value_usdt' : number,
  'all_time_high' : number,
}
export interface PortfolioPoint { 'value_usdt' : number, 'timestamp' : bigint }
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
export type Result_10 = { 'Ok' : SwapResult_1 } |
  { 'Err' : string };
export type Result_11 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_12 = { 'Ok' : PriceUpdateResult } |
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
export type Result_7 = { 'Ok' : SwapResult } |
  { 'Err' : string };
export type Result_8 = { 'Ok' : Array<CompactProfile> } |
  { 'Err' : UserError };
export type Result_9 = { 'Ok' : EvmSwapResult } |
  { 'Err' : string };
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Testnet' : null } |
  { 'Devnet' : null };
export interface SwapRequest {
  'to_token' : string,
  'from_token' : string,
  'amount' : bigint,
}
export interface SwapRequest_1 {
  'min_amount_out' : bigint,
  'deadline' : bigint,
  'amount_out' : bigint,
  'user_token_account' : string,
  'token_out_mint' : string,
}
export interface SwapResult {
  'to_token' : string,
  'from_amount' : bigint,
  'from_token' : string,
  'to_amount' : bigint,
  'timestamp' : bigint,
  'to_price' : number,
  'from_price' : number,
}
export interface SwapResult_1 {
  'delegation_tx_hash' : string,
  'token_in_amount' : bigint,
  'swap_tx_hash' : string,
  'token_out_amount' : bigint,
}
export interface SwapTransaction {
  'id' : string,
  'to_token' : string,
  'from_amount' : bigint,
  'transaction_type' : string,
  'from_token' : string,
  'user' : Principal,
  'to_amount' : bigint,
  'timestamp' : bigint,
  'to_price' : number,
  'from_price' : number,
}
export interface TokenThresholds {
  'healthy_threshold_usdt' : number,
  'min_trade_threshold_usdt' : number,
  'rebalance_threshold_usdt' : number,
  'halt_threshold_usdt' : number,
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
  'bootstrap_canister_liquidity' : ActorMethod<[], Result>,
  'claim_faucet' : ActorMethod<[], Result>,
  'claim_fees' : ActorMethod<[string], Result>,
  'debug_get_all_positions' : ActorMethod<[], Array<LiquidityNeuron>>,
  'debug_get_token_positions' : ActorMethod<[string], Array<LiquidityNeuron>>,
  'debug_test_external_apis' : ActorMethod<[], Result>,
  'debug_wallet_verification' : ActorMethod<[], Result>,
  'delete_account' : ActorMethod<[], Result_1>,
  'export_token_registry' : ActorMethod<[], Result>,
  'finalize_upload' : ActorMethod<[string], Result_2>,
  'follow_user' : ActorMethod<[Principal], Result_3>,
  'get_all_internal_tokens' : ActorMethod<[], Array<InternalToken>>,
  'get_all_liquidity_pools' : ActorMethod<[], Array<PoolInfo>>,
  'get_all_supported_tokens' : ActorMethod<[], Result>,
  'get_all_usernames' : ActorMethod<[], Array<string>>,
  'get_api_statistics' : ActorMethod<[], string>,
  'get_canister_ethereum_address' : ActorMethod<[], string>,
  'get_canister_public_key' : ActorMethod<[], string>,
  'get_current_prices' : ActorMethod<[], Result>,
  'get_faucet_claim' : ActorMethod<[Principal], [] | [FaucetClaim]>,
  'get_faucet_stats' : ActorMethod<[], [bigint, bigint]>,
  'get_fee_analytics' : ActorMethod<
    [[] | [string], bigint, bigint],
    [bigint, bigint, bigint, bigint, bigint]
  >,
  'get_followers' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_following' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_liquidity_config' : ActorMethod<[], LiquidityConfig>,
  'get_liquidity_pool_info' : ActorMethod<[string], [] | [PoolInfo]>,
  'get_liquidity_positions' : ActorMethod<[Principal], Array<LiquidityNeuron>>,
  'get_liquidity_system_stats' : ActorMethod<
    [],
    [bigint, bigint, number, number]
  >,
  'get_liquidity_transactions' : ActorMethod<
    [Principal],
    Array<LiquidityTransaction>
  >,
  'get_pair_price' : ActorMethod<[string], Result_4>,
  'get_portfolio_data' : ActorMethod<[Principal], PortfolioData>,
  'get_solana_token_balances' : ActorMethod<[], Result>,
  'get_token_address' : ActorMethod<[string, string], Result>,
  'get_token_balance' : ActorMethod<[Principal, string], bigint>,
  'get_token_info' : ActorMethod<[string], Result>,
  'get_token_registry_stats' : ActorMethod<[], Result>,
  'get_token_volatility' : ActorMethod<[string], number>,
  'get_tokens_by_chain' : ActorMethod<[string], Result>,
  'get_user' : ActorMethod<[Principal], Result_3>,
  'get_user_balances' : ActorMethod<[Principal], Array<[string, bigint]>>,
  'get_user_by_username' : ActorMethod<[string], Result_3>,
  'get_user_count' : ActorMethod<[], bigint>,
  'get_user_personal' : ActorMethod<[Principal, Principal], Result_5>,
  'get_user_swap_history' : ActorMethod<[Principal], Array<SwapTransaction>>,
  'get_user_swap_history_paginated' : ActorMethod<
    [Principal, number, number],
    Array<SwapTransaction>
  >,
  'get_user_transaction_count' : ActorMethod<[Principal], number>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'init_all_liquidity_pools' : ActorMethod<[], string>,
  'init_all_tokens' : ActorMethod<[], Result>,
  'init_canister_balances' : ActorMethod<[], Result>,
  'init_liquidity_pool' : ActorMethod<[string], string>,
  'init_upload' : ActorMethod<
    [string, bigint, [] | [bigint], string],
    Result_1
  >,
  'is_following' : ActorMethod<[Principal, Principal], boolean>,
  'is_token_deployed' : ActorMethod<[string, string], Result_6>,
  'is_username_available' : ActorMethod<[string], boolean>,
  'market_swap' : ActorMethod<[SwapRequest], Result_7>,
  'reload_token_registry' : ActorMethod<[], Result>,
  'search_users' : ActorMethod<[string, number], Result_8>,
  'search_users_personal' : ActorMethod<[string, number, Principal], Result_8>,
  'set_liquidity_config' : ActorMethod<[LiquidityConfig], Result>,
  'signup' : ActorMethod<
    [string, [] | [string], [] | [string], [] | [string]],
    Result_3
  >,
  'stake_tokens' : ActorMethod<[string, bigint, bigint], Result>,
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
  'swap_evm' : ActorMethod<[PermitRequest, EvmSwapRequest], Result_9>,
  'swap_solana' : ActorMethod<
    [Uint8Array | number[], SwapRequest_1],
    Result_10
  >,
  'test_ed25519' : ActorMethod<[], Result>,
  'test_secp256k1' : ActorMethod<[], Result>,
  'test_simple_evm_transaction' : ActorMethod<[], Result>,
  'transfer_tokens' : ActorMethod<
    [Principal, Principal, string, bigint],
    Result_11
  >,
  'unfollow_user' : ActorMethod<[Principal], Result_3>,
  'update_avatar' : ActorMethod<[string], Result_3>,
  'update_banner' : ActorMethod<[string], Result_3>,
  'update_bio' : ActorMethod<[string], Result_3>,
  'update_bitcoin_address' : ActorMethod<[string], Result_3>,
  'update_display_name' : ActorMethod<[string], Result_3>,
  'update_evm_address' : ActorMethod<[string], Result_3>,
  'update_location' : ActorMethod<[string], Result_3>,
  'update_prices' : ActorMethod<[], Result_12>,
  'update_profile' : ActorMethod<[UserUpdate], Result_3>,
  'update_solana_address' : ActorMethod<[string], Result_3>,
  'update_website' : ActorMethod<[string], Result_3>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
