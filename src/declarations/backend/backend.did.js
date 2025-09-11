export const idlFactory = ({ IDL }) => {
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Testnet' : IDL.Null,
    'Devnet' : IDL.Null,
  });
  const InitArg = IDL.Record({ 'solana_network' : IDL.Opt(SolanaNetwork) });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const TradingPair = IDL.Record({
    'base' : IDL.Text,
    'quote' : IDL.Text,
    'last_updated' : IDL.Nat64,
    'sources_count' : IDL.Nat8,
    'price' : IDL.Float64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : TradingPair, 'Err' : IDL.Text });
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
  const IcpPermitRequest = IDL.Record({
    'r' : IDL.Text,
    's' : IDL.Text,
    'v' : IDL.Text,
    'token' : IDL.Text,
    'owner' : IDL.Text,
    'deadline' : IDL.Text,
    'amount' : IDL.Text,
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
  const Result_2 = IDL.Variant({ 'Ok' : EvmSwapResult, 'Err' : IDL.Text });
  const SwapRequest = IDL.Record({
    'min_amount_out' : IDL.Nat64,
    'deadline' : IDL.Nat64,
    'amount_out' : IDL.Nat64,
    'user_token_account' : IDL.Text,
    'token_out_mint' : IDL.Text,
  });
  const SwapResult = IDL.Record({
    'delegation_tx_hash' : IDL.Text,
    'token_in_amount' : IDL.Nat64,
    'swap_tx_hash' : IDL.Text,
    'token_out_amount' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'Ok' : SwapResult, 'Err' : IDL.Text });
  const PriceUpdateResult = IDL.Record({
    'total_sources' : IDL.Nat8,
    'pairs_updated' : IDL.Vec(TradingPair),
    'successful_sources' : IDL.Nat8,
    'timestamp' : IDL.Nat64,
  });
  const Result_4 = IDL.Variant({ 'Ok' : PriceUpdateResult, 'Err' : IDL.Text });
  return IDL.Service({
    'debug_test_external_apis' : IDL.Func([], [Result], []),
    'debug_wallet_verification' : IDL.Func([], [Result], []),
    'get_canister_ethereum_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_canister_icrc_balances' : IDL.Func([], [Result], []),
    'get_canister_public_key' : IDL.Func([], [IDL.Text], []),
    'get_current_prices' : IDL.Func([], [Result], ['query']),
    'get_pair_price' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'get_solana_token_balances' : IDL.Func([], [Result], []),
    'start_price_scheduler' : IDL.Func([], [Result], []),
    'stop_price_scheduler' : IDL.Func([], [Result], []),
    'submit_delegation_transaction' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'submit_gasless_permit' : IDL.Func([PermitRequest], [Result], []),
    'submit_icp_gasless_permit' : IDL.Func([IcpPermitRequest], [Result], []),
    'swap_evm' : IDL.Func([PermitRequest, EvmSwapRequest], [Result_2], []),
    'swap_solana' : IDL.Func([IDL.Vec(IDL.Nat8), SwapRequest], [Result_3], []),
    'test_ed25519' : IDL.Func([], [Result], []),
    'test_secp256k1' : IDL.Func([], [Result], []),
    'test_simple_evm_transaction' : IDL.Func([], [Result], []),
    'update_prices' : IDL.Func([], [Result_4], []),
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
