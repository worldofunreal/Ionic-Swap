import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export type CommitmentLevel = { 'finalized' : null } |
  { 'confirmed' : null } |
  { 'processed' : null };
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
export type Ed25519KeyName = { 'MainnetTestKey1' : null } |
  { 'LocalDevelopment' : null } |
  { 'MainnetProdKey1' : null };
export interface GaslessApprovalRequest {
  'token_address' : string,
  'user_address' : string,
  'permit_request' : PermitRequest,
  'amount' : string,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface InitArg {
  'solana_commitment_level' : [] | [CommitmentLevel],
  'ed25519_key_name' : [] | [Ed25519KeyName],
  'solana_network' : [] | [SolanaNetwork],
  'sol_rpc_canister_id' : [] | [Principal],
}
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
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Array<[string, ChainLiquidity]> } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : UnifiedLiquidityPool } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<[string, number]> } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<CapitalMove> } |
  { 'Err' : string };
export interface RiskConfig {
  'emergency_pause_threshold' : number,
  'max_chain_exposure' : number,
  'min_collateral_ratio' : number,
  'liquidation_threshold' : number,
}
export interface RpcEndpoint {
  'url' : string,
  'headers' : [] | [Array<HttpHeader>],
}
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Custom' : RpcEndpoint } |
  { 'Devnet' : null };
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
  'create_associated_token_account_instruction_public' : ActorMethod<
    [string, string, string],
    Result
  >,
  'create_chain_ledger_public' : ActorMethod<[string, ChainInitData], Result>,
  'create_solana_liquidity_pool_public' : ActorMethod<
    [string, string, bigint],
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
  'execute_gasless_approval' : ActorMethod<[GaslessApprovalRequest], Result>,
  'get_all_chain_ledgers_public' : ActorMethod<[], Array<ChainLedger>>,
  'get_all_chain_states_public' : ActorMethod<[], Array<ChainState>>,
  'get_all_cross_chain_transfers_public' : ActorMethod<
    [],
    Array<CrossChainTransfer>
  >,
  'get_associated_token_account_address' : ActorMethod<
    [[] | [Principal], string],
    string
  >,
  'get_associated_token_address_public' : ActorMethod<[string, string], Result>,
  'get_balance' : ActorMethod<[string], Result>,
  'get_canister_solana_address_public' : ActorMethod<[], Result>,
  'get_chain_ledger_public' : ActorMethod<[string], [] | [ChainLedger]>,
  'get_claim_fee' : ActorMethod<[], Result>,
  'get_contract_info' : ActorMethod<[], string>,
  'get_cross_chain_transfer_public' : ActorMethod<
    [string],
    [] | [CrossChainTransfer]
  >,
  'get_ethereum_address' : ActorMethod<[], Result>,
  'get_icp_network_signer' : ActorMethod<[], Result>,
  'get_icrc_balance_public' : ActorMethod<[string, string], Result_1>,
  'get_pool_chain_distribution_public' : ActorMethod<[string], Result_2>,
  'get_pool_info_public' : ActorMethod<[string], Result_3>,
  'get_pool_total_liquidity_public' : ActorMethod<[string], Result_1>,
  'get_pool_yield_rates_public' : ActorMethod<[string], Result_4>,
  'get_public_key' : ActorMethod<[], Result>,
  'get_refund_fee' : ActorMethod<[], Result>,
  'get_root_contract_address_public' : ActorMethod<[], [] | [string]>,
  'get_sepolia_block_number' : ActorMethod<[], Result>,
  'get_sol_balance' : ActorMethod<[[] | [string]], bigint>,
  'get_solana_account_address' : ActorMethod<[[] | [Principal]], string>,
  'get_solana_account_info_public' : ActorMethod<[string], Result>,
  'get_solana_balance_public' : ActorMethod<[string], Result_5>,
  'get_solana_chain_state_public' : ActorMethod<[], ChainState>,
  'get_solana_slot_public' : ActorMethod<[], Result_5>,
  'get_solana_wallet_public' : ActorMethod<[string], Result>,
  'get_spl_token_balance_public' : ActorMethod<[string], Result>,
  'get_total_fees' : ActorMethod<[], Result>,
  'get_transaction_count' : ActorMethod<[string], Result>,
  'get_transaction_receipt' : ActorMethod<[string], Result>,
  'init_solana' : ActorMethod<[InitArg], undefined>,
  'initialize_bridgeless_token_public' : ActorMethod<
    [string, string, string],
    Result
  >,
  'initialize_nonce' : ActorMethod<[], Result>,
  'list_all_pools_public' : ActorMethod<[], Array<string>>,
  'optimize_pool_yields_basic_public' : ActorMethod<[string], Result_6>,
  'send_sol' : ActorMethod<[[] | [Principal], string, bigint], string>,
  'send_sol_transaction_public' : ActorMethod<[string, string, bigint], Result>,
  'send_spl_token' : ActorMethod<
    [[] | [Principal], string, string, bigint],
    string
  >,
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
  'withdraw_liquidity_cross_chain_public' : ActorMethod<
    [string, string, string, bigint],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
