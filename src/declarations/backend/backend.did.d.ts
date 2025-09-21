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
  /**
   * Add more tokens to an existing position
   */
  'add_to_position' : ActorMethod<[string, bigint], Result>,
  /**
   * Bootstrap canister as initial liquidity provider (admin function)
   * Stakes ~$20M worth of each token to provide initial liquidity
   */
  'bootstrap_canister_liquidity' : ActorMethod<[], Result>,
  /**
   * Cancel dissolving (return to Locked, preserving accumulated age)
   */
  'cancel_dissolving' : ActorMethod<[string], Result>,
  /**
   * Claim 2M USDT from faucet (one-time only per principal)
   */
  'claim_faucet' : ActorMethod<[], Result>,
  /**
   * Claim accumulated fees from a liquidity position
   */
  'claim_fees' : ActorMethod<[string], Result>,
  /**
   * Compound claimable fees into the staked position
   */
  'compound_fees' : ActorMethod<[string], Result>,
  /**
   * Debug function to check all positions in the system (testing function)
   */
  'debug_get_all_positions' : ActorMethod<[], Array<LiquidityNeuron>>,
  /**
   * Debug function to check all positions for a token (testing function)
   */
  'debug_get_token_positions' : ActorMethod<[string], Array<LiquidityNeuron>>,
  /**
   * Debug function to test external API calls (for testing only)
   */
  'debug_test_external_apis' : ActorMethod<[], Result>,
  /**
   * Debug function to verify wallet address matches signer
   */
  'debug_wallet_verification' : ActorMethod<[], Result>,
  /**
   * Delete account (requires signed call, owner only)
   */
  'delete_account' : ActorMethod<[], Result_1>,
  /**
   * Export complete token registry (admin function)
   */
  'export_token_registry' : ActorMethod<[], Result>,
  'finalize_upload' : ActorMethod<[string], Result_2>,
  /**
   * Follow/Unfollow functionality
   */
  'follow_user' : ActorMethod<[Principal], Result_3>,
  /**
   * Get all internal tokens
   */
  'get_all_internal_tokens' : ActorMethod<[], Array<InternalToken>>,
  /**
   * Get all liquidity pools with threshold data (testing function)
   */
  'get_all_liquidity_pools' : ActorMethod<[], Array<PoolInfo>>,
  /**
   * Get all supported tokens with their chain deployments
   */
  'get_all_supported_tokens' : ActorMethod<[], Result>,
  /**
   * Get all usernames for sitemap generation
   */
  'get_all_usernames' : ActorMethod<[], Array<string>>,
  /**
   * Get API call statistics for CoinGecko
   */
  'get_api_statistics' : ActorMethod<[], string>,
  /**
   * Get the canister's own Ethereum address (always returns canister's wallet)
   */
  'get_canister_ethereum_address' : ActorMethod<[], string>,
  /**
   * Get the canister's own public key (always returns canister's wallet)
   */
  'get_canister_public_key' : ActorMethod<[], string>,
  /**
   * Get current prices from cache
   */
  'get_current_prices' : ActorMethod<[], Result>,
  /**
   * Get faucet claim info for a principal
   */
  'get_faucet_claim' : ActorMethod<[Principal], [] | [FaucetClaim]>,
  /**
   * Get faucet statistics
   */
  'get_faucet_stats' : ActorMethod<[], [bigint, bigint]>,
  /**
   * Get fee analytics for a time period (testing function)
   */
  'get_fee_analytics' : ActorMethod<
    [[] | [string], bigint, bigint],
    [bigint, bigint, bigint, bigint, bigint]
  >,
  'get_followers' : ActorMethod<[Principal], Array<CompactProfile>>,
  /**
   * Get following and followers lists
   */
  'get_following' : ActorMethod<[Principal], Array<CompactProfile>>,
  /**
   * Get liquidity configuration (testing function)
   */
  'get_liquidity_config' : ActorMethod<[], LiquidityConfig>,
  /**
   * Get pool information for a token (testing function)
   */
  'get_liquidity_pool_info' : ActorMethod<[string], [] | [PoolInfo]>,
  /**
   * Get liquidity positions for a user (testing function)
   */
  'get_liquidity_positions' : ActorMethod<[Principal], Array<LiquidityNeuron>>,
  /**
   * Get system-wide liquidity statistics with USDT conversion (testing function)
   */
  'get_liquidity_system_stats' : ActorMethod<
    [],
    [bigint, bigint, number, number]
  >,
  /**
   * Get liquidity transactions for a user (testing function)
   */
  'get_liquidity_transactions' : ActorMethod<
    [Principal],
    Array<LiquidityTransaction>
  >,
  /**
   * Get specific trading pair price
   */
  'get_pair_price' : ActorMethod<[string], Result_4>,
  /**
   * Get complete portfolio data for a user
   */
  'get_portfolio_data' : ActorMethod<[Principal], PortfolioData>,
  /**
   * Get comprehensive Solana token balances for all known tokens
   */
  'get_solana_token_balances' : ActorMethod<[], Result>,
  /**
   * Get token address on specific chain
   */
  'get_token_address' : ActorMethod<[string, string], Result>,
  /**
   * Get balance of a token for a user
   */
  'get_token_balance' : ActorMethod<[Principal, string], bigint>,
  /**
   * Get token information by symbol
   */
  'get_token_info' : ActorMethod<[string], Result>,
  /**
   * Get token registry statistics
   */
  'get_token_registry_stats' : ActorMethod<[], Result>,
  /**
   * Get current volatility for a token (testing function)
   */
  'get_token_volatility' : ActorMethod<[string], number>,
  /**
   * Get tokens deployed on specific chain
   */
  'get_tokens_by_chain' : ActorMethod<[string], Result>,
  /**
   * Get user by principal
   */
  'get_user' : ActorMethod<[Principal], Result_3>,
  /**
   * Get all token balances for a user
   */
  'get_user_balances' : ActorMethod<[Principal], Array<[string, bigint]>>,
  /**
   * Get user by username
   */
  'get_user_by_username' : ActorMethod<[string], Result_3>,
  /**
   * Get total user count
   */
  'get_user_count' : ActorMethod<[], bigint>,
  /**
   * Personal user lookup with follow state
   */
  'get_user_personal' : ActorMethod<[Principal, Principal], Result_5>,
  /**
   * Get swap transaction history for a user
   */
  'get_user_swap_history' : ActorMethod<[Principal], Array<SwapTransaction>>,
  /**
   * Get swap transaction history for a user with pagination
   */
  'get_user_swap_history_paginated' : ActorMethod<
    [Principal, number, number],
    Array<SwapTransaction>
  >,
  /**
   * Get transaction count for a user
   */
  'get_user_transaction_count' : ActorMethod<[Principal], number>,
  /**
   * HTTP request handler for serving assets
   */
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  /**
   * Initialize liquidity pools for all supported tokens
   */
  'init_all_liquidity_pools' : ActorMethod<[], string>,
  /**
   * Initialize all missing tokens (admin function)
   */
  'init_all_tokens' : ActorMethod<[], Result>,
  /**
   * Initialize canister token balances (admin function)
   */
  'init_canister_balances' : ActorMethod<[], Result>,
  /**
   * Initialize a liquidity pool for a token (testing function)
   */
  'init_liquidity_pool' : ActorMethod<[string], string>,
  /**
   * Asset upload functions (requires signed call, registered users only)
   */
  'init_upload' : ActorMethod<
    [string, bigint, [] | [bigint], string],
    Result_1
  >,
  /**
   * Check if user is following another user
   */
  'is_following' : ActorMethod<[Principal, Principal], boolean>,
  /**
   * Check if token is deployed on chain
   */
  'is_token_deployed' : ActorMethod<[string, string], Result_6>,
  /**
   * Check if username is available
   */
  'is_username_available' : ActorMethod<[string], boolean>,
  /**
   * Execute a market swap between internal tokens
   */
  'market_swap' : ActorMethod<[SwapRequest], Result_7>,
  /**
   * Reload token registry from chain definitions (admin function)
   */
  'reload_token_registry' : ActorMethod<[], Result>,
  /**
   * Search users
   */
  'search_users' : ActorMethod<[string, number], Result_8>,
  /**
   * Personal search with follow state
   */
  'search_users_personal' : ActorMethod<[string, number, Principal], Result_8>,
  /**
   * Set liquidity configuration (admin function for testing)
   */
  'set_liquidity_config' : ActorMethod<[LiquidityConfig], Result>,
  /**
   * User registration (requires signed call)
   */
  'signup' : ActorMethod<
    [string, [] | [string], [] | [string], [] | [string]],
    Result_3
  >,
  /**
   * Stake tokens in liquidity pool (user function)
   */
  'stake_tokens' : ActorMethod<[string, bigint, bigint], Result>,
  /**
   * Start dissolving a position (automatically claims fees first)
   */
  'start_dissolving' : ActorMethod<[string], Result>,
  /**
   * Start the price update scheduler (runs every second)
   */
  'start_price_scheduler' : ActorMethod<[], Result>,
  /**
   * Stop the price update scheduler
   */
  'stop_price_scheduler' : ActorMethod<[], Result>,
  'store_chunk' : ActorMethod<
    [bigint, Uint8Array | number[], string],
    Result_1
  >,
  /**
   * Submit atomic delegation + transfer transaction (gasless for user)
   */
  'submit_delegation_transaction' : ActorMethod<
    [Uint8Array | number[]],
    Result
  >,
  /**
   * Submit gasless permit transaction (user signs permit, canister pays gas)
   */
  'submit_gasless_permit' : ActorMethod<[PermitRequest], Result>,
  /**
   * Submit atomic EVM swap transaction (permit + immediate token transfer)
   */
  'swap_evm' : ActorMethod<[PermitRequest, EvmSwapRequest], Result_9>,
  /**
   * Submit atomic swap transaction (delegation + immediate liquidity transfer)
   */
  'swap_solana' : ActorMethod<
    [Uint8Array | number[], SwapRequest_1],
    Result_10
  >,
  /**
   * Test Ed25519 key generation and signing
   */
  'test_ed25519' : ActorMethod<[], Result>,
  /**
   * Test secp256k1 key generation and signing
   */
  'test_secp256k1' : ActorMethod<[], Result>,
  /**
   * Test simple EVM transaction (get nonce, etc.)
   */
  'test_simple_evm_transaction' : ActorMethod<[], Result>,
  /**
   * Transfer tokens between users
   */
  'transfer_tokens' : ActorMethod<
    [Principal, Principal, string, bigint],
    Result_11
  >,
  'unfollow_user' : ActorMethod<[Principal], Result_3>,
  'update_avatar' : ActorMethod<[string], Result_3>,
  'update_banner' : ActorMethod<[string], Result_3>,
  'update_bio' : ActorMethod<[string], Result_3>,
  'update_bitcoin_address' : ActorMethod<[string], Result_3>,
  /**
   * Individual field updates (requires signed call, owner only)
   */
  'update_display_name' : ActorMethod<[string], Result_3>,
  'update_evm_address' : ActorMethod<[string], Result_3>,
  'update_location' : ActorMethod<[string], Result_3>,
  /**
   * Update all prices from all sources (manual trigger)
   */
  'update_prices' : ActorMethod<[], Result_12>,
  /**
   * Update user profile (requires signed call, owner only)
   */
  'update_profile' : ActorMethod<[UserUpdate], Result_3>,
  'update_solana_address' : ActorMethod<[string], Result_3>,
  'update_website' : ActorMethod<[string], Result_3>,
  /**
   * Withdraw available amount from a dissolving or dissolved position
   */
  'withdraw' : ActorMethod<[string, bigint], Result>,
  /**
   * Withdraw the full currently available amount from a dissolving or dissolved position
   */
  'withdraw_available' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
