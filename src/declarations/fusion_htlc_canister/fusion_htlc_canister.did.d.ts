import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ChainType = { 'ICP' : null } |
  { 'Base' : null } |
  { 'Ethereum' : null } |
  { 'Polygon' : null } |
  { 'Optimism' : null } |
  { 'Arbitrum' : null };
export type EthMainnetService = { 'Alchemy' : null } |
  { 'Llama' : null } |
  { 'BlockPi' : null } |
  { 'Cloudflare' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null };
export type EthSepoliaService = { 'Alchemy' : null } |
  { 'BlockPi' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null } |
  { 'Sepolia' : null };
export interface EvmChainConfig {
  'htlc_contract_address' : [] | [string],
  'rpc_services' : RpcServices,
  'chain_id' : bigint,
  'gas_limit' : bigint,
  'gas_price' : bigint,
}
export interface EvmHtlcInteraction {
  'status' : { 'Failed' : null } |
    { 'Confirmed' : null } |
    { 'Pending' : null },
  'action' : { 'Refund' : null } |
    { 'Create' : null } |
    { 'Claim' : null },
  'transaction_hash' : [] | [string],
  'secret' : [] | [string],
  'evm_htlc_address' : string,
  'htlc_id' : string,
}
export interface HTLC {
  'id' : string,
  'status' : HTLCStatus,
  'hashlock' : Uint8Array | number[],
  'token_canister' : Principal,
  'recipient' : Principal,
  'ethereum_address' : [] | [string],
  'secret' : [] | [string],
  'created_at' : bigint,
  'sender' : Principal,
  'chain_type' : ChainType,
  'expiration_time' : bigint,
  'amount' : bigint,
}
export interface HTLCOrder {
  'oneinch_order' : OneInchOrder,
  'partial_fill_index' : [] | [bigint],
  'is_source_chain' : boolean,
  'merkle_root' : [] | [string],
  'partial_fills' : Array<string>,
  'htlc_id' : string,
  'total_filled' : bigint,
  'remaining_amount' : bigint,
}
export type HTLCStatus = { 'Refunded' : null } |
  { 'Claimed' : null } |
  { 'Locked' : null } |
  { 'Expired' : null };
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponseResult {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export type L2MainnetService = { 'Alchemy' : null } |
  { 'Llama' : null } |
  { 'BlockPi' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null };
export interface OneInchOrder {
  'fills' : Array<string>,
  'maker' : string,
  'taker' : string,
  'secret_hashes' : Array<string>,
  'src_chain_id' : bigint,
  'maker_asset' : string,
  'hashlock' : string,
  'taking_amount' : string,
  'making_amount' : string,
  'dst_chain_id' : bigint,
  'order_hash' : string,
  'taker_asset' : string,
  'timelock' : bigint,
}
export interface PartialFill {
  'fill_id' : string,
  'status' : { 'Failed' : null } |
    { 'Completed' : null } |
    { 'Pending' : null },
  'fill_timestamp' : bigint,
  'secret_hash' : string,
  'htlc_id' : string,
  'amount' : bigint,
  'resolver_address' : string,
}
export interface Resolver {
  'last_active' : bigint,
  'total_fills' : bigint,
  'success_rate' : number,
  'address' : string,
  'is_active' : boolean,
  'supported_chains' : Array<ChainType>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_10 = { 'ok' : HTLCOrder } |
  { 'err' : string };
export type Result_2 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_3 = { 'ok' : Resolver } |
  { 'err' : string };
export type Result_4 = { 'ok' : PartialFill } |
  { 'err' : string };
export type Result_5 = { 'ok' : Array<PartialFill> } |
  { 'err' : string };
export type Result_6 = { 'ok' : HTLC } |
  { 'err' : string };
export type Result_7 = { 'ok' : EvmHtlcInteraction } |
  { 'err' : string };
export type Result_8 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_9 = { 'ok' : EvmChainConfig } |
  { 'err' : string };
export interface RpcApi { 'url' : string, 'headers' : [] | [Array<HttpHeader>] }
export type RpcServices = { 'EthSepolia' : [] | [Array<EthSepoliaService>] } |
  { 'BaseMainnet' : [] | [Array<L2MainnetService>] } |
  { 'Custom' : { 'chainId' : bigint, 'services' : Array<RpcApi> } } |
  { 'OptimismMainnet' : [] | [Array<L2MainnetService>] } |
  { 'ArbitrumOne' : [] | [Array<L2MainnetService>] } |
  { 'EthMainnet' : [] | [Array<EthMainnetService>] };
export interface http_header { 'value' : string, 'name' : string }
export interface _SERVICE {
  'claim_evm_htlc' : ActorMethod<[bigint, string, string], Result_1>,
  'claim_htlc' : ActorMethod<[string, string], Result>,
  'complete_partial_fill' : ActorMethod<[string, string], Result>,
  'create_evm_htlc' : ActorMethod<
    [bigint, string, string, string, bigint, bigint],
    Result_1
  >,
  'create_htlc' : ActorMethod<
    [Principal, bigint, Principal, bigint, ChainType, [] | [string]],
    Result_1
  >,
  'create_partial_fill' : ActorMethod<
    [string, bigint, string, string],
    Result_1
  >,
  'deposit_cycles' : ActorMethod<[], undefined>,
  'get_1inch_order' : ActorMethod<[string], Result_10>,
  'get_active_orders' : ActorMethod<
    [[] | [bigint], [] | [bigint], [] | [bigint], [] | [bigint]],
    Result_1
  >,
  'get_active_resolvers' : ActorMethod<[], Array<Resolver>>,
  'get_chain_config' : ActorMethod<[bigint], Result_9>,
  'get_cycles_balance' : ActorMethod<[], bigint>,
  'get_escrow_factory_address' : ActorMethod<[bigint], Result_1>,
  'get_evm_balance' : ActorMethod<[bigint, string], Result_1>,
  'get_evm_block_number' : ActorMethod<[bigint], Result_8>,
  'get_evm_interaction' : ActorMethod<[string], Result_7>,
  'get_evm_interactions_by_htlc' : ActorMethod<
    [string],
    Array<EvmHtlcInteraction>
  >,
  'get_evm_transaction_receipt' : ActorMethod<[bigint, string], Result_1>,
  'get_htlc' : ActorMethod<[string], Result_6>,
  'get_htlc_partial_fills' : ActorMethod<[string], Result_5>,
  'get_htlcs_by_principal' : ActorMethod<[Principal], Array<HTLC>>,
  'get_order_secrets' : ActorMethod<[string], Result_1>,
  'get_orders_by_maker' : ActorMethod<
    [string, [] | [bigint], [] | [bigint], [] | [bigint], [] | [bigint]],
    Result_1
  >,
  'get_partial_fill' : ActorMethod<[string], Result_4>,
  'get_resolver' : ActorMethod<[string], Result_3>,
  'get_resolvers_for_chain' : ActorMethod<[ChainType], Array<Resolver>>,
  'get_tokens' : ActorMethod<[bigint], Result_1>,
  'greet' : ActorMethod<[string], string>,
  'is_order_active' : ActorMethod<[string], Result_2>,
  'link_1inch_order' : ActorMethod<
    [string, OneInchOrder, boolean, [] | [bigint]],
    Result
  >,
  'parse_order_secrets_for_htlc' : ActorMethod<[string], Result_1>,
  'refund_evm_htlc' : ActorMethod<[bigint, string], Result_1>,
  'refund_htlc' : ActorMethod<[string], Result>,
  'register_resolver' : ActorMethod<[string, Array<ChainType>], Result>,
  'set_htlc_hashlock' : ActorMethod<[string, Uint8Array | number[]], Result>,
  'test_1inch_api' : ActorMethod<[], Result_1>,
  'test_evm_rpc' : ActorMethod<[bigint], Result_1>,
  'test_get_active_orders' : ActorMethod<[], Result_1>,
  'test_http_request' : ActorMethod<[], Result_1>,
  'test_sepolia_contract' : ActorMethod<[], Result_1>,
  'transform' : ActorMethod<
    [{ 'context' : Uint8Array | number[], 'response' : HttpResponseResult }],
    HttpResponseResult
  >,
  'update_chain_config' : ActorMethod<[bigint, EvmChainConfig], Result>,
  'update_resolver_status' : ActorMethod<[string, boolean], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
