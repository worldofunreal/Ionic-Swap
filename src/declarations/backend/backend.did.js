export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const ChainInitData = IDL.Record({
    'init_params' : IDL.Vec(IDL.Nat8),
    'chain_type' : IDL.Text,
    'ledger_address' : IDL.Text,
  });
  const PermitRequest = IDL.Record({
    'r' : IDL.Text,
    's' : IDL.Text,
    'v' : IDL.Text,
    'signature' : IDL.Text,
    'value' : IDL.Text,
    'owner' : IDL.Text,
    'deadline' : IDL.Text,
    'nonce' : IDL.Text,
    'spender' : IDL.Text,
  });
  const GaslessApprovalRequest = IDL.Record({
    'token_address' : IDL.Text,
    'user_address' : IDL.Text,
    'permit_request' : PermitRequest,
    'amount' : IDL.Text,
  });
  const ChainLedger = IDL.Record({
    'created_at' : IDL.Nat64,
    'chain_id' : IDL.Text,
    'is_active' : IDL.Bool,
    'chain_type' : IDL.Text,
    'ledger_address' : IDL.Text,
  });
  const ChainState = IDL.Record({
    'error_count' : IDL.Nat32,
    'response_time_ms' : IDL.Nat64,
    'is_healthy' : IDL.Bool,
    'last_block' : IDL.Nat64,
    'chain_id' : IDL.Text,
    'last_update' : IDL.Nat64,
  });
  const TransferStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Authorized' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const CrossChainTransfer = IDL.Record({
    'source_chain' : IDL.Text,
    'status' : TransferStatus,
    'recipient' : IDL.Text,
    'created_at' : IDL.Nat64,
    'transfer_id' : IDL.Text,
    'processed_at' : IDL.Opt(IDL.Nat64),
    'target_chain' : IDL.Text,
    'amount' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text });
  const ChainLiquidity = IDL.Record({
    'utilization_rate' : IDL.Float64,
    'available_liquidity' : IDL.Nat,
    'last_updated' : IDL.Nat64,
    'chain_id' : IDL.Text,
    'current_apy' : IDL.Float64,
    'risk_score' : IDL.Nat8,
    'is_active' : IDL.Bool,
    'borrowed_amount' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Text, ChainLiquidity)),
    'Err' : IDL.Text,
  });
  const RiskConfig = IDL.Record({
    'emergency_pause_threshold' : IDL.Float64,
    'max_chain_exposure' : IDL.Float64,
    'min_collateral_ratio' : IDL.Float64,
    'liquidation_threshold' : IDL.Float64,
  });
  const YieldStrategy = IDL.Record({
    'max_capital_movement' : IDL.Nat,
    'target_utilization' : IDL.Float64,
    'risk_tolerance' : IDL.Nat8,
    'min_yield_improvement' : IDL.Float64,
    'optimization_interval' : IDL.Nat64,
  });
  const UnifiedLiquidityPool = IDL.Record({
    'risk_parameters' : RiskConfig,
    'last_optimized' : IDL.Nat64,
    'chain_distribution' : IDL.Vec(IDL.Tuple(IDL.Text, ChainLiquidity)),
    'created_at' : IDL.Nat64,
    'total_unified_liquidity' : IDL.Nat,
    'yield_optimization' : YieldStrategy,
    'is_active' : IDL.Bool,
    'pool_id' : IDL.Text,
    'base_asset' : IDL.Text,
  });
  const Result_3 = IDL.Variant({
    'Ok' : UnifiedLiquidityPool,
    'Err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64)),
    'Err' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const CommitmentLevel = IDL.Variant({
    'finalized' : IDL.Null,
    'confirmed' : IDL.Null,
    'processed' : IDL.Null,
  });
  const Ed25519KeyName = IDL.Variant({
    'MainnetTestKey1' : IDL.Null,
    'LocalDevelopment' : IDL.Null,
    'MainnetProdKey1' : IDL.Null,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const RpcEndpoint = IDL.Record({
    'url' : IDL.Text,
    'headers' : IDL.Opt(IDL.Vec(HttpHeader)),
  });
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Custom' : RpcEndpoint,
    'Devnet' : IDL.Null,
  });
  const InitArg = IDL.Record({
    'solana_commitment_level' : IDL.Opt(CommitmentLevel),
    'ed25519_key_name' : IDL.Opt(Ed25519KeyName),
    'solana_network' : IDL.Opt(SolanaNetwork),
    'sol_rpc_canister_id' : IDL.Opt(IDL.Principal),
  });
  const CapitalMoveStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Executing' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const CapitalMove = IDL.Record({
    'status' : CapitalMoveStatus,
    'to_chain' : IDL.Text,
    'execution_time' : IDL.Nat64,
    'move_id' : IDL.Text,
    'from_chain' : IDL.Text,
    'risk_score' : IDL.Nat8,
    'pool_id' : IDL.Text,
    'amount' : IDL.Nat,
    'expected_yield_improvement' : IDL.Float64,
  });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(CapitalMove),
    'Err' : IDL.Text,
  });
  const PermitData = IDL.Record({
    'r' : IDL.Text,
    's' : IDL.Text,
    'v' : IDL.Nat8,
    'signature' : IDL.Text,
    'value' : IDL.Text,
    'owner' : IDL.Text,
    'token_address' : IDL.Text,
    'deadline' : IDL.Nat64,
    'spender' : IDL.Text,
  });
  return IDL.Service({
    'add_chain_to_pool_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'authorize_cross_chain_transfer_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'create_associated_token_account_instruction_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'create_chain_ledger_public' : IDL.Func(
        [IDL.Text, ChainInitData],
        [Result],
        [],
      ),
    'create_solana_liquidity_pool_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'create_unified_liquidity_pool_public' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Text)],
        [Result],
        [],
      ),
    'deposit_liquidity_cross_chain_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'execute_gasless_approval' : IDL.Func(
        [GaslessApprovalRequest],
        [Result],
        [],
      ),
    'get_all_chain_ledgers_public' : IDL.Func([], [IDL.Vec(ChainLedger)], []),
    'get_all_chain_states_public' : IDL.Func([], [IDL.Vec(ChainState)], []),
    'get_all_cross_chain_transfers_public' : IDL.Func(
        [],
        [IDL.Vec(CrossChainTransfer)],
        [],
      ),
    'get_associated_token_account_address' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text],
        [IDL.Text],
        [],
      ),
    'get_associated_token_address_public' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'get_balance' : IDL.Func([IDL.Text], [Result], []),
    'get_canister_solana_address_public' : IDL.Func([], [Result], []),
    'get_chain_ledger_public' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(ChainLedger)],
        [],
      ),
    'get_claim_fee' : IDL.Func([], [Result], []),
    'get_contract_info' : IDL.Func([], [IDL.Text], ['query']),
    'get_cross_chain_transfer_public' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(CrossChainTransfer)],
        [],
      ),
    'get_ethereum_address' : IDL.Func([], [Result], []),
    'get_icp_network_signer' : IDL.Func([], [Result], []),
    'get_icrc_balance_public' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'get_pool_chain_distribution_public' : IDL.Func([IDL.Text], [Result_2], []),
    'get_pool_info_public' : IDL.Func([IDL.Text], [Result_3], []),
    'get_pool_total_liquidity_public' : IDL.Func([IDL.Text], [Result_1], []),
    'get_pool_yield_rates_public' : IDL.Func([IDL.Text], [Result_4], []),
    'get_public_key' : IDL.Func([], [Result], []),
    'get_refund_fee' : IDL.Func([], [Result], []),
    'get_root_contract_address_public' : IDL.Func([], [IDL.Opt(IDL.Text)], []),
    'get_sepolia_block_number' : IDL.Func([], [Result], []),
    'get_sol_balance' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Nat], []),
    'get_solana_account_address' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Text],
        [],
      ),
    'get_solana_account_info_public' : IDL.Func([IDL.Text], [Result], []),
    'get_solana_balance_public' : IDL.Func([IDL.Text], [Result_5], []),
    'get_solana_chain_state_public' : IDL.Func([], [ChainState], []),
    'get_solana_slot_public' : IDL.Func([], [Result_5], []),
    'get_solana_wallet_public' : IDL.Func([IDL.Text], [Result], []),
    'get_spl_token_balance_public' : IDL.Func([IDL.Text], [Result], []),
    'get_total_fees' : IDL.Func([], [Result], []),
    'get_transaction_count' : IDL.Func([IDL.Text], [Result], []),
    'get_transaction_receipt' : IDL.Func([IDL.Text], [Result], []),
    'init_solana' : IDL.Func([InitArg], [], []),
    'initialize_bridgeless_token_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'initialize_nonce' : IDL.Func([], [Result], []),
    'list_all_pools_public' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'optimize_pool_yields_basic_public' : IDL.Func([IDL.Text], [Result_6], []),
    'send_sol' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'send_sol_transaction_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat64],
        [Result],
        [],
      ),
    'send_spl_token' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'send_spl_token_transaction_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
        [Result],
        [],
      ),
    'sign_and_send_solana_transaction_public' : IDL.Func(
        [IDL.Text],
        [Result],
        [],
      ),
    'simulate_yield_rates_public' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64))],
        [Result],
        [],
      ),
    'submit_permit_signature' : IDL.Func([PermitData], [Result], []),
    'test_all_contract_functions' : IDL.Func([], [Result], []),
    'test_basic_rpc' : IDL.Func([], [Result], []),
    'test_deployment_transaction' : IDL.Func([], [Result], []),
    'test_signing_address' : IDL.Func([], [Result], []),
    'test_simple_transaction' : IDL.Func([], [Result], []),
    'test_unified_pool_system' : IDL.Func([], [IDL.Text], []),
    'transfer_erc20_tokens_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'transfer_from_icrc_tokens_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'transfer_icrc_tokens_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'transfer_spl_tokens_instruction_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
        [Result],
        [],
      ),
    'update_chain_health_state_public' : IDL.Func(
        [IDL.Text, IDL.Nat64, IDL.Nat64, IDL.Bool],
        [Result],
        [],
      ),
    'withdraw_liquidity_cross_chain_public' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
