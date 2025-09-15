export const idlFactory = ({ IDL }) => {
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Testnet' : IDL.Null,
    'Devnet' : IDL.Null,
  });
  const InitArg = IDL.Record({ 'solana_network' : IDL.Opt(SolanaNetwork) });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const UserError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'UsernameTaken' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'InternalError' : IDL.Text,
    'UserNotFound' : IDL.Null,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : UserError });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : UserError });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'bio' : IDL.Opt(IDL.Text),
    'updated_at' : IDL.Nat64,
    'username' : IDL.Text,
    'evm_address' : IDL.Opt(IDL.Text),
    'bitcoin_address' : IDL.Opt(IDL.Text),
    'banner_url' : IDL.Opt(IDL.Text),
    'avatar_url' : IDL.Opt(IDL.Text),
    'following_count' : IDL.Nat32,
    'created_at' : IDL.Nat64,
    'website' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
    'is_verified' : IDL.Bool,
    'solana_address' : IDL.Opt(IDL.Text),
    'followers_count' : IDL.Nat32,
    'location' : IDL.Opt(IDL.Text),
  });
  const Result_3 = IDL.Variant({ 'Ok' : User, 'Err' : UserError });
  const InternalToken = IDL.Record({
    'decimals' : IDL.Nat8,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'total_supply' : IDL.Nat64,
    'symbol' : IDL.Text,
  });
  const LiquidityStatus = IDL.Variant({
    'Healthy' : IDL.Null,
    'Critical' : IDL.Null,
    'NeedsRebalance' : IDL.Null,
    'Halted' : IDL.Null,
  });
  const PoolInfo = IDL.Record({
    'fees_from_volatility' : IDL.Nat64,
    'current_volatility_1h' : IDL.Float64,
    'liquidity_status' : LiquidityStatus,
    'token_symbol' : IDL.Text,
    'available_liquidity' : IDL.Nat64,
    'tvl_usdt' : IDL.Opt(IDL.Float64),
    'fees_from_volatility_usdt' : IDL.Opt(IDL.Float64),
    'total_staked' : IDL.Nat64,
    'current_price_usdt' : IDL.Opt(IDL.Float64),
    'fees_from_trading' : IDL.Nat64,
    'available_liquidity_usdt' : IDL.Opt(IDL.Float64),
    'global_fee_index' : IDL.Float64,
    'fees_from_trading_usdt' : IDL.Opt(IDL.Float64),
    'fees_from_spread_usdt' : IDL.Opt(IDL.Float64),
    'total_volume_1h' : IDL.Nat64,
    'total_fees_collected' : IDL.Nat64,
    'fees_from_spread' : IDL.Nat64,
    'fees_from_depth_usdt' : IDL.Opt(IDL.Float64),
    'total_voting_power' : IDL.Float64,
    'total_fees_collected_usdt' : IDL.Opt(IDL.Float64),
    'fees_from_depth' : IDL.Nat64,
  });
  const FaucetClaim = IDL.Record({
    'user' : IDL.Principal,
    'timestamp' : IDL.Nat64,
    'amount' : IDL.Nat64,
  });
  const CompactProfile = IDL.Record({
    'id' : IDL.Principal,
    'bio' : IDL.Opt(IDL.Text),
    'username' : IDL.Text,
    'avatar_url' : IDL.Opt(IDL.Text),
    'is_following_me' : IDL.Bool,
    'display_name' : IDL.Opt(IDL.Text),
    'am_following_them' : IDL.Bool,
    'is_verified' : IDL.Bool,
  });
  const TokenThresholds = IDL.Record({
    'healthy_threshold_usdt' : IDL.Float64,
    'min_trade_threshold_usdt' : IDL.Float64,
    'rebalance_threshold_usdt' : IDL.Float64,
    'halt_threshold_usdt' : IDL.Float64,
  });
  const LiquidityConfig = IDL.Record({
    'max_dissolve_delay_seconds' : IDL.Nat64,
    'max_trade_amount_usdt' : IDL.Nat64,
    'k_depth' : IDL.Float64,
    'spread_base' : IDL.Float64,
    'paused_tokens' : IDL.Vec(IDL.Text),
    'oracle_failure_threshold' : IDL.Nat32,
    'volatility_window_seconds' : IDL.Nat64,
    'min_dissolve_delay_seconds' : IDL.Nat64,
    'token_thresholds' : IDL.Vec(IDL.Tuple(IDL.Text, TokenThresholds)),
    'fee_rate_base' : IDL.Float64,
    'k_vol' : IDL.Float64,
    'max_hourly_volume_usdt' : IDL.Nat64,
  });
  const NeuronState = IDL.Variant({
    'Dissolved' : IDL.Null,
    'Locked' : IDL.Null,
    'Dissolving' : IDL.Null,
  });
  const LiquidityNeuron = IDL.Record({
    'id' : IDL.Text,
    'dissolve_delay_seconds' : IDL.Nat64,
    'withdrawn_amount' : IDL.Nat64,
    'staked_amount' : IDL.Nat64,
    'token_symbol' : IDL.Text,
    'user' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'dissolving_started_at' : IDL.Opt(IDL.Nat64),
    'state' : NeuronState,
    'last_fee_index' : IDL.Float64,
  });
  const LiquidityTxType = IDL.Variant({
    'FullWithdraw' : IDL.Null,
    'ClaimFees' : IDL.Null,
    'Stake' : IDL.Null,
    'CancelDissolving' : IDL.Null,
    'EmergencyPause' : IDL.Null,
    'StartDissolving' : IDL.Null,
    'ConfigUpdate' : IDL.Null,
    'PartialWithdraw' : IDL.Null,
  });
  const LiquidityTransaction = IDL.Record({
    'id' : IDL.Text,
    'transaction_type' : LiquidityTxType,
    'token_symbol' : IDL.Text,
    'user' : IDL.Principal,
    'error_message' : IDL.Opt(IDL.Text),
    'before_state' : IDL.Opt(IDL.Text),
    'after_state' : IDL.Opt(IDL.Text),
    'timestamp' : IDL.Nat64,
    'success' : IDL.Bool,
    'amount' : IDL.Nat64,
    'position_id' : IDL.Opt(IDL.Text),
  });
  const TradingPair = IDL.Record({
    'base' : IDL.Text,
    'quote' : IDL.Text,
    'last_updated' : IDL.Nat64,
    'sources_count' : IDL.Nat8,
    'price' : IDL.Float64,
  });
  const Result_4 = IDL.Variant({ 'Ok' : TradingPair, 'Err' : IDL.Text });
  const PortfolioPoint = IDL.Record({
    'value_usdt' : IDL.Float64,
    'timestamp' : IDL.Nat64,
  });
  const PortfolioData = IDL.Record({
    'change_24h' : IDL.Float64,
    'current_value_usdt' : IDL.Float64,
    'total_trades' : IDL.Nat32,
    'change_24h_percent' : IDL.Float64,
    'portfolio_history' : IDL.Vec(PortfolioPoint),
    'initial_value_usdt' : IDL.Float64,
    'all_time_high' : IDL.Float64,
  });
  const PersonalUser = IDL.Record({
    'id' : IDL.Principal,
    'bio' : IDL.Opt(IDL.Text),
    'updated_at' : IDL.Nat64,
    'username' : IDL.Text,
    'evm_address' : IDL.Opt(IDL.Text),
    'bitcoin_address' : IDL.Opt(IDL.Text),
    'banner_url' : IDL.Opt(IDL.Text),
    'avatar_url' : IDL.Opt(IDL.Text),
    'following_count' : IDL.Nat32,
    'is_following_me' : IDL.Bool,
    'created_at' : IDL.Nat64,
    'website' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
    'am_following_them' : IDL.Bool,
    'is_verified' : IDL.Bool,
    'solana_address' : IDL.Opt(IDL.Text),
    'followers_count' : IDL.Nat32,
    'location' : IDL.Opt(IDL.Text),
  });
  const Result_5 = IDL.Variant({ 'Ok' : PersonalUser, 'Err' : UserError });
  const SwapTransaction = IDL.Record({
    'id' : IDL.Text,
    'to_token' : IDL.Text,
    'from_amount' : IDL.Nat64,
    'transaction_type' : IDL.Text,
    'from_token' : IDL.Text,
    'user' : IDL.Principal,
    'to_amount' : IDL.Nat64,
    'timestamp' : IDL.Nat64,
    'to_price' : IDL.Float64,
    'from_price' : IDL.Float64,
  });
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'certificate_version' : IDL.Opt(IDL.Nat16),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'upgrade' : IDL.Opt(IDL.Bool),
    'status_code' : IDL.Nat16,
  });
  const Result_6 = IDL.Variant({ 'Ok' : IDL.Bool, 'Err' : IDL.Text });
  const SwapRequest = IDL.Record({
    'to_token' : IDL.Text,
    'from_token' : IDL.Text,
    'amount' : IDL.Nat64,
  });
  const SwapResult = IDL.Record({
    'to_token' : IDL.Text,
    'from_amount' : IDL.Nat64,
    'from_token' : IDL.Text,
    'to_amount' : IDL.Nat64,
    'timestamp' : IDL.Nat64,
    'to_price' : IDL.Float64,
    'from_price' : IDL.Float64,
  });
  const Result_7 = IDL.Variant({ 'Ok' : SwapResult, 'Err' : IDL.Text });
  const Result_8 = IDL.Variant({
    'Ok' : IDL.Vec(CompactProfile),
    'Err' : UserError,
  });
  const PermitRequest = IDL.Record({
    'r' : IDL.Text,
    's' : IDL.Text,
    'v' : IDL.Text,
    'token' : IDL.Text,
    'value' : IDL.Text,
    'owner' : IDL.Text,
    'deadline' : IDL.Text,
    'spender' : IDL.Text,
  });
  const EvmSwapRequest = IDL.Record({
    'min_amount_out' : IDL.Nat64,
    'deadline' : IDL.Nat64,
    'amount_out' : IDL.Nat64,
    'user_address' : IDL.Text,
    'token_in_mint' : IDL.Text,
    'amount_in' : IDL.Nat64,
    'token_out_mint' : IDL.Text,
  });
  const EvmSwapResult = IDL.Record({
    'token_in_amount' : IDL.Nat64,
    'permit_tx_hash' : IDL.Text,
    'swap_tx_hash' : IDL.Text,
    'token_out_amount' : IDL.Nat64,
  });
  const Result_9 = IDL.Variant({ 'Ok' : EvmSwapResult, 'Err' : IDL.Text });
  const SwapRequest_1 = IDL.Record({
    'min_amount_out' : IDL.Nat64,
    'deadline' : IDL.Nat64,
    'amount_out' : IDL.Nat64,
    'user_token_account' : IDL.Text,
    'token_out_mint' : IDL.Text,
  });
  const SwapResult_1 = IDL.Record({
    'delegation_tx_hash' : IDL.Text,
    'token_in_amount' : IDL.Nat64,
    'swap_tx_hash' : IDL.Text,
    'token_out_amount' : IDL.Nat64,
  });
  const Result_10 = IDL.Variant({ 'Ok' : SwapResult_1, 'Err' : IDL.Text });
  const Result_11 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const PriceUpdateResult = IDL.Record({
    'total_sources' : IDL.Nat8,
    'pairs_updated' : IDL.Vec(TradingPair),
    'successful_sources' : IDL.Nat8,
    'timestamp' : IDL.Nat64,
  });
  const Result_12 = IDL.Variant({ 'Ok' : PriceUpdateResult, 'Err' : IDL.Text });
  const UserUpdate = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'evm_address' : IDL.Opt(IDL.Text),
    'bitcoin_address' : IDL.Opt(IDL.Text),
    'banner_url' : IDL.Opt(IDL.Text),
    'avatar_url' : IDL.Opt(IDL.Text),
    'website' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
    'solana_address' : IDL.Opt(IDL.Text),
    'location' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'bootstrap_canister_liquidity' : IDL.Func([], [Result], []),
    'claim_faucet' : IDL.Func([], [Result], []),
    'debug_test_external_apis' : IDL.Func([], [Result], []),
    'debug_wallet_verification' : IDL.Func([], [Result], []),
    'delete_account' : IDL.Func([], [Result_1], []),
    'export_token_registry' : IDL.Func([], [Result], ['query']),
    'finalize_upload' : IDL.Func([IDL.Text], [Result_2], []),
    'follow_user' : IDL.Func([IDL.Principal], [Result_3], []),
    'get_all_internal_tokens' : IDL.Func(
        [],
        [IDL.Vec(InternalToken)],
        ['query'],
      ),
    'get_all_liquidity_pools' : IDL.Func([], [IDL.Vec(PoolInfo)], []),
    'get_all_supported_tokens' : IDL.Func([], [Result], ['query']),
    'get_all_usernames' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'get_canister_ethereum_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_canister_public_key' : IDL.Func([], [IDL.Text], []),
    'get_current_prices' : IDL.Func([], [Result], ['query']),
    'get_faucet_claim' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(FaucetClaim)],
        ['query'],
      ),
    'get_faucet_stats' : IDL.Func([], [IDL.Nat64, IDL.Nat64], ['query']),
    'get_fee_analytics' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Nat64, IDL.Nat64],
        [IDL.Nat64, IDL.Nat64, IDL.Nat64, IDL.Nat64, IDL.Nat64],
        ['query'],
      ),
    'get_followers' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(CompactProfile)],
        ['query'],
      ),
    'get_following' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(CompactProfile)],
        ['query'],
      ),
    'get_liquidity_config' : IDL.Func([], [LiquidityConfig], ['query']),
    'get_liquidity_pool_info' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(PoolInfo)],
        ['query'],
      ),
    'get_liquidity_positions' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(LiquidityNeuron)],
        ['query'],
      ),
    'get_liquidity_system_stats' : IDL.Func(
        [],
        [IDL.Nat64, IDL.Nat64, IDL.Float64, IDL.Float64],
        [],
      ),
    'get_liquidity_transactions' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(LiquidityTransaction)],
        ['query'],
      ),
    'get_pair_price' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'get_portfolio_data' : IDL.Func([IDL.Principal], [PortfolioData], []),
    'get_solana_token_balances' : IDL.Func([], [Result], []),
    'get_token_address' : IDL.Func([IDL.Text, IDL.Text], [Result], ['query']),
    'get_token_balance' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [IDL.Nat64],
        ['query'],
      ),
    'get_token_info' : IDL.Func([IDL.Text], [Result], ['query']),
    'get_token_registry_stats' : IDL.Func([], [Result], ['query']),
    'get_token_volatility' : IDL.Func([IDL.Text], [IDL.Float64], ['query']),
    'get_tokens_by_chain' : IDL.Func([IDL.Text], [Result], ['query']),
    'get_user' : IDL.Func([IDL.Principal], [Result_3], ['query']),
    'get_user_balances' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64))],
        ['query'],
      ),
    'get_user_by_username' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'get_user_count' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_user_personal' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [Result_5],
        ['query'],
      ),
    'get_user_swap_history' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(SwapTransaction)],
        ['query'],
      ),
    'get_user_swap_history_paginated' : IDL.Func(
        [IDL.Principal, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(SwapTransaction)],
        ['query'],
      ),
    'get_user_transaction_count' : IDL.Func(
        [IDL.Principal],
        [IDL.Nat32],
        ['query'],
      ),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'init_all_liquidity_pools' : IDL.Func([], [IDL.Text], []),
    'init_all_tokens' : IDL.Func([], [Result], []),
    'init_canister_balances' : IDL.Func([], [Result], []),
    'init_liquidity_pool' : IDL.Func([IDL.Text], [IDL.Text], []),
    'init_upload' : IDL.Func(
        [IDL.Text, IDL.Nat64, IDL.Opt(IDL.Nat64), IDL.Text],
        [Result_1],
        [],
      ),
    'is_following' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Bool],
        ['query'],
      ),
    'is_token_deployed' : IDL.Func([IDL.Text, IDL.Text], [Result_6], ['query']),
    'is_username_available' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'market_swap' : IDL.Func([SwapRequest], [Result_7], []),
    'reload_token_registry' : IDL.Func([], [Result], []),
    'search_users' : IDL.Func([IDL.Text, IDL.Nat32], [Result_8], ['query']),
    'search_users_personal' : IDL.Func(
        [IDL.Text, IDL.Nat32, IDL.Principal],
        [Result_8],
        ['query'],
      ),
    'set_liquidity_config' : IDL.Func([LiquidityConfig], [Result], []),
    'signup' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [Result_3],
        [],
      ),
    'start_price_scheduler' : IDL.Func([], [Result], []),
    'stop_price_scheduler' : IDL.Func([], [Result], []),
    'store_chunk' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Nat8), IDL.Text],
        [Result_1],
        [],
      ),
    'submit_delegation_transaction' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'submit_gasless_permit' : IDL.Func([PermitRequest], [Result], []),
    'swap_evm' : IDL.Func([PermitRequest, EvmSwapRequest], [Result_9], []),
    'swap_solana' : IDL.Func(
        [IDL.Vec(IDL.Nat8), SwapRequest_1],
        [Result_10],
        [],
      ),
    'test_ed25519' : IDL.Func([], [Result], []),
    'test_secp256k1' : IDL.Func([], [Result], []),
    'test_simple_evm_transaction' : IDL.Func([], [Result], []),
    'transfer_tokens' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Text, IDL.Nat64],
        [Result_11],
        [],
      ),
    'unfollow_user' : IDL.Func([IDL.Principal], [Result_3], []),
    'update_avatar' : IDL.Func([IDL.Text], [Result_3], []),
    'update_banner' : IDL.Func([IDL.Text], [Result_3], []),
    'update_bio' : IDL.Func([IDL.Text], [Result_3], []),
    'update_bitcoin_address' : IDL.Func([IDL.Text], [Result_3], []),
    'update_display_name' : IDL.Func([IDL.Text], [Result_3], []),
    'update_evm_address' : IDL.Func([IDL.Text], [Result_3], []),
    'update_location' : IDL.Func([IDL.Text], [Result_3], []),
    'update_prices' : IDL.Func([], [Result_12], []),
    'update_profile' : IDL.Func([UserUpdate], [Result_3], []),
    'update_solana_address' : IDL.Func([IDL.Text], [Result_3], []),
    'update_website' : IDL.Func([IDL.Text], [Result_3], []),
  });
};
export const init = ({ IDL }) => {
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Testnet' : IDL.Null,
    'Devnet' : IDL.Null,
  });
  const InitArg = IDL.Record({ 'solana_network' : IDL.Opt(SolanaNetwork) });
  return [InitArg];
};
