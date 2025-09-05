import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AtomicSwapOrder {
  'maker' : string,
  'status' : SwapOrderStatus,
  'icp_destination_principal' : [] | [string],
  'taker' : string,
  'destination_htlc_id' : [] | [string],
  'destination_amount' : string,
  'hashlock' : string,
  'evm_destination_address' : [] | [string],
  'secret' : string,
  'created_at' : bigint,
  'source_htlc_id' : [] | [string],
  'solana_destination_address' : [] | [string],
  'order_id' : string,
  'source_amount' : string,
  'source_token' : string,
  'expires_at' : bigint,
  'counter_order_id' : [] | [string],
  'destination_token' : string,
  'timelock' : bigint,
}
export interface CapitalMove {
  'status' : CapitalMoveStatus,
  'to_chain' : string,
  'execution_time' : bigint,
  'move_id' : string,
  'from_chain' : string,
  'risk_score' : number,
  'pool_id' : string,
  'amount' : bigint,
  'expected_yield_improvement' : number,
}
export type CapitalMoveStatus = { 'Failed' : null } |
  { 'Executing' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export interface ChainInitData {
  'init_params' : Uint8Array | number[],
  'chain_type' : string,
  'ledger_address' : string,
}
export interface ChainLedger {
  'created_at' : bigint,
  'chain_id' : string,
  'is_active' : boolean,
  'chain_type' : string,
  'ledger_address' : string,
}
export interface ChainLiquidity {
  'utilization_rate' : number,
  'available_liquidity' : bigint,
  'last_updated' : bigint,
  'chain_id' : string,
  'current_apy' : number,
  'risk_score' : number,
  'is_active' : boolean,
  'borrowed_amount' : bigint,
}
export interface ChainState {
  'error_count' : number,
  'response_time_ms' : bigint,
  'is_healthy' : boolean,
  'last_block' : bigint,
  'chain_id' : string,
  'last_update' : bigint,
}
export interface CrossChainSwapOrder {
  'maker' : string,
  'source_chain_id' : bigint,
  'destination_asset' : string,
  'status' : HTLCStatus,
  'taker' : string,
  'direction' : SwapDirection,
  'destination_amount' : string,
  'hashlock' : string,
  'secret' : [] | [string],
  'created_at' : bigint,
  'order_id' : string,
  'source_amount' : string,
  'expiration_time' : bigint,
  'source_asset' : string,
  'destination_chain_id' : bigint,
}
export interface CrossChainTransfer {
  'source_chain' : string,
  'status' : TransferStatus,
  'recipient' : string,
  'created_at' : bigint,
  'transfer_id' : string,
  'processed_at' : [] | [bigint],
  'target_chain' : string,
  'amount' : string,
}
export interface GaslessApprovalRequest {
  'token_address' : string,
  'user_address' : string,
  'permit_request' : PermitRequest,
  'amount' : string,
}
export interface HTLC {
  'id' : string,
  'source_chain' : bigint,
  'status' : HTLCStatus,
  'token' : string,
  'hashlock' : string,
  'is_cross_chain' : boolean,
  'recipient' : string,
  'secret' : [] | [string],
  'created_at' : bigint,
  'sender' : string,
  'order_hash' : string,
  'target_chain' : bigint,
  'amount' : string,
  'timelock' : bigint,
}
export type HTLCStatus = { 'Refunded' : null } |
  { 'Claimed' : null } |
  { 'Deposited' : null } |
  { 'Created' : null } |
  { 'Expired' : null };
export interface PermitData {
  'r' : string,
  's' : string,
  'v' : number,
  'signature' : string,
  'value' : string,
  'owner' : string,
  'token_address' : string,
  'deadline' : bigint,
  'spender' : string,
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
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : SwapOrderStatus } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : HTLCStatus } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<[string, ChainLiquidity]> } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : UnifiedLiquidityPool } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<[string, number]> } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_8 = { 'Ok' : Array<CapitalMove> } |
  { 'Err' : string };
export type Result_9 = { 'Ok' : boolean } |
  { 'Err' : string };
export interface RiskConfig {
  'emergency_pause_threshold' : number,
  'max_chain_exposure' : number,
  'min_collateral_ratio' : number,
  'liquidation_threshold' : number,
}
export type SwapDirection = { 'EVMtoSolana' : null } |
  { 'EVMtoICP' : null } |
  { 'ICPtoEVM' : null } |
  { 'ICPtoSolana' : null } |
  { 'SolanatoEVM' : null } |
  { 'SolanatoICP' : null };
export type SwapOrderStatus = { 'Refunded' : null } |
  { 'DestinationHTLCClaimed' : null } |
  { 'SourceHTLCCreated' : null } |
  { 'SourceHTLCClaimed' : null } |
  { 'Cancelled' : null } |
  { 'Created' : null } |
  { 'Completed' : null } |
  { 'Expired' : null } |
  { 'DestinationHTLCCreated' : null };
export type TransferStatus = { 'Failed' : null } |
  { 'Authorized' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export interface UnifiedLiquidityPool {
  'risk_parameters' : RiskConfig,
  'last_optimized' : bigint,
  'chain_distribution' : Array<[string, ChainLiquidity]>,
  'created_at' : bigint,
  'total_unified_liquidity' : bigint,
  'yield_optimization' : YieldStrategy,
  'is_active' : boolean,
  'pool_id' : string,
  'base_asset' : string,
}
export interface YieldStrategy {
  'max_capital_movement' : bigint,
  'target_utilization' : number,
  'risk_tolerance' : number,
  'min_yield_improvement' : number,
  'optimization_interval' : bigint,
}
export interface _SERVICE {
  'add_chain_to_pool_public' : ActorMethod<[string, string, bigint], Result>,
  'authorize_cross_chain_transfer_public' : ActorMethod<
    [string, string, string, string],
    Result
  >,
  'check_expired_orders' : ActorMethod<[], Result>,
  'claim_evm_htlc' : ActorMethod<[string, string], Result>,
  'claim_htlc_funds' : ActorMethod<[string, string], Result>,
  'claim_solana_htlc_public' : ActorMethod<[string, string], Result>,
  'complete_cross_chain_swap' : ActorMethod<[string], Result>,
  'complete_cross_chain_swap_public' : ActorMethod<[string, string], Result>,
  'coordinate_cross_chain_swap_public' : ActorMethod<
    [string, SwapDirection],
    Result
  >,
  'create_associated_token_account_instruction_public' : ActorMethod<
    [string, string, string],
    Result
  >,
  'create_chain_ledger_public' : ActorMethod<[string, ChainInitData], Result>,
  'create_cross_chain_swap_order' : ActorMethod<
    [string, string, string, string, string, string, bigint, bigint, bigint],
    Result
  >,
  'create_evm_htlc' : ActorMethod<[string, boolean], Result>,
  'create_evm_to_icp_order' : ActorMethod<
    [string, string, string, string, string, string, bigint, PermitRequest],
    Result
  >,
  'create_evm_to_solana_order' : ActorMethod<
    [string, string, string, string, bigint, string, bigint, PermitRequest],
    Result
  >,
  'create_htlc_escrow' : ActorMethod<
    [
      string,
      string,
      string,
      string,
      string,
      string,
      bigint,
      SwapDirection,
      bigint,
      bigint,
    ],
    Result
  >,
  'create_icp_to_evm_order' : ActorMethod<
    [string, string, string, string, string, string, bigint],
    Result
  >,
  'create_icp_to_solana_order' : ActorMethod<
    [string, string, string, string, bigint, string, bigint],
    Result
  >,
  'create_solana_htlc_public' : ActorMethod<
    [string, string, string, string, bigint, string, bigint],
    Result
  >,
  'create_solana_liquidity_pool_public' : ActorMethod<
    [string, string, bigint],
    Result
  >,
  'create_solana_to_evm_order' : ActorMethod<
    [string, string, string, bigint, string, string, bigint],
    Result
  >,
  'create_solana_to_icp_order' : ActorMethod<
    [string, string, string, bigint, string, string, bigint],
    Result
  >,
  'create_unified_liquidity_pool_public' : ActorMethod<
    [string, Array<string>],
    Result
  >,
  'deposit_liquidity_cross_chain_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
  'deposit_to_htlc' : ActorMethod<[string], Result>,
  'execute_atomic_swap' : ActorMethod<[string], Result>,
  'execute_cross_chain_swap' : ActorMethod<[string], Result>,
  'execute_gasless_approval' : ActorMethod<[GaslessApprovalRequest], Result>,
  'get_all_atomic_swap_orders' : ActorMethod<[], Array<AtomicSwapOrder>>,
  'get_all_chain_ledgers_public' : ActorMethod<[], Array<ChainLedger>>,
  'get_all_chain_states_public' : ActorMethod<[], Array<ChainState>>,
  'get_all_cross_chain_transfers_public' : ActorMethod<
    [],
    Array<CrossChainTransfer>
  >,
  'get_all_htlcs' : ActorMethod<[], Array<HTLC>>,
  'get_all_swap_orders' : ActorMethod<[], Array<CrossChainSwapOrder>>,
  'get_associated_token_address_public' : ActorMethod<[string, string], Result>,
  'get_atomic_swap_order' : ActorMethod<[string], [] | [AtomicSwapOrder]>,
  'get_balance' : ActorMethod<[string], Result>,
  'get_canister_solana_address_public' : ActorMethod<[], Result>,
  'get_chain_ledger_public' : ActorMethod<[string], [] | [ChainLedger]>,
  'get_claim_fee' : ActorMethod<[], Result>,
  'get_compatible_orders' : ActorMethod<[string], Array<AtomicSwapOrder>>,
  'get_contract_info' : ActorMethod<[], string>,
  'get_cross_chain_swap_status_public' : ActorMethod<[string], Result_1>,
  'get_cross_chain_transfer_public' : ActorMethod<
    [string],
    [] | [CrossChainTransfer]
  >,
  'get_ethereum_address' : ActorMethod<[], Result>,
  'get_htlc' : ActorMethod<[string], [] | [HTLC]>,
  'get_icp_htlc_status_public' : ActorMethod<[string], Result_2>,
  'get_icp_network_signer' : ActorMethod<[], Result>,
  'get_icrc_balance_public' : ActorMethod<[string, string], Result_3>,
  'get_orders_by_status' : ActorMethod<
    [SwapOrderStatus],
    Array<AtomicSwapOrder>
  >,
  'get_pool_chain_distribution_public' : ActorMethod<[string], Result_4>,
  'get_pool_info_public' : ActorMethod<[string], Result_5>,
  'get_pool_total_liquidity_public' : ActorMethod<[string], Result_3>,
  'get_pool_yield_rates_public' : ActorMethod<[string], Result_6>,
  'get_public_key' : ActorMethod<[], Result>,
  'get_refund_fee' : ActorMethod<[], Result>,
  'get_root_contract_address_public' : ActorMethod<[], [] | [string]>,
  'get_sepolia_block_number' : ActorMethod<[], Result>,
  'get_solana_account_info_public' : ActorMethod<[string], Result>,
  'get_solana_balance_public' : ActorMethod<[string], Result_7>,
  'get_solana_chain_state_public' : ActorMethod<[], ChainState>,
  'get_solana_htlc_status_public' : ActorMethod<[string], Result_2>,
  'get_solana_slot_public' : ActorMethod<[], Result_7>,
  'get_solana_wallet_public' : ActorMethod<[string], Result>,
  'get_spl_token_balance_public' : ActorMethod<[string, string], Result>,
  'get_swap_order' : ActorMethod<[string], [] | [CrossChainSwapOrder]>,
  'get_total_fees' : ActorMethod<[], Result>,
  'get_transaction_count' : ActorMethod<[string], Result>,
  'get_transaction_receipt' : ActorMethod<[string], Result>,
  'initialize_bridgeless_token_public' : ActorMethod<
    [string, string, string],
    Result
  >,
  'initialize_nonce' : ActorMethod<[], Result>,
  'list_all_pools_public' : ActorMethod<[], Array<string>>,
  'list_icp_htlcs_public' : ActorMethod<[], Array<HTLC>>,
  'list_solana_htlcs_public' : ActorMethod<[], Array<HTLC>>,
  'optimize_pool_yields_basic_public' : ActorMethod<[string], Result_8>,
  'refund_htlc_funds' : ActorMethod<[string], Result>,
  'refund_icp_htlc_public' : ActorMethod<[string, string], Result>,
  'refund_solana_htlc_public' : ActorMethod<[string, string], Result>,
  'send_sol_transaction_public' : ActorMethod<[string, string, bigint], Result>,
  'send_spl_token_transaction_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
  'sign_and_send_solana_transaction_public' : ActorMethod<[string], Result>,
  'simulate_yield_rates_public' : ActorMethod<
    [string, Array<[string, number]>],
    Result
  >,
  'submit_permit_signature' : ActorMethod<[PermitData], Result>,
  'test_all_contract_functions' : ActorMethod<[], Result>,
  'test_basic_rpc' : ActorMethod<[], Result>,
  'test_deployment_transaction' : ActorMethod<[], Result>,
  'test_signing_address' : ActorMethod<[], Result>,
  'test_simple_transaction' : ActorMethod<[], Result>,
  'test_unified_pool_system' : ActorMethod<[], string>,
  'transfer_erc20_tokens_public' : ActorMethod<
    [string, string, string],
    Result
  >,
  'transfer_from_icrc_tokens_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
  'transfer_icrc_tokens_public' : ActorMethod<[string, string, bigint], Result>,
  'transfer_spl_tokens_instruction_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
  'update_chain_health_state_public' : ActorMethod<
    [string, bigint, bigint, boolean],
    Result
  >,
  'validate_cross_chain_order_public' : ActorMethod<[string], Result_9>,
  'withdraw_liquidity_cross_chain_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
