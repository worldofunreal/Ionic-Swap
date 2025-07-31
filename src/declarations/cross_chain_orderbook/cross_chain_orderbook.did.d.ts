import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Amount = bigint;
export interface CrossChainOrderbook {
  'cancelOrder' : ActorMethod<[OrderId], Result_2>,
  'claimFunds' : ActorMethod<[SwapId, Secret], Result_2>,
  'getActiveSwaps' : ActorMethod<[], Array<HtlcState>>,
  'getOpenOrders' : ActorMethod<[], Array<LimitOrder>>,
  'getOrder' : ActorMethod<[OrderId], [] | [LimitOrder]>,
  'getSwap' : ActorMethod<[SwapId], [] | [HtlcState]>,
  'getTokenCanister' : ActorMethod<[], [] | [Principal]>,
  'getUserOrders' : ActorMethod<[Principal], Array<LimitOrder>>,
  'placeIcpOrder' : ActorMethod<
    [TokenAddress, Amount, TokenAddress, Amount, HashedSecret],
    Result_1
  >,
  'refundFunds' : ActorMethod<[SwapId], Result_2>,
  'setTokenCanister' : ActorMethod<[Principal], Result_2>,
  'submitEvmOrder' : ActorMethod<
    [TokenAddress, Amount, TokenAddress, Amount, HashedSecret, Signature],
    Result_1
  >,
  'takeOrder' : ActorMethod<[OrderId], Result>,
}
export type HashedSecret = string;
export interface HtlcState {
  'hashedSecret' : HashedSecret,
  'status' : SwapStatus,
  'initiator' : Principal,
  'createdAt' : Timestamp,
  'counterparty' : Principal,
  'swapId' : SwapId,
  'timelock' : Timestamp,
}
export interface LimitOrder {
  'hashedSecret' : HashedSecret,
  'status' : OrderStatus,
  'tokenBuy' : TokenAddress,
  'owner' : Principal,
  'orderId' : OrderId,
  'amountSell' : Amount,
  'isEvmUser' : boolean,
  'timestamp' : Timestamp,
  'tokenSell' : TokenAddress,
  'amountBuy' : Amount,
}
export type OrderError = { 'InvalidAmount' : null } |
  { 'OrderNotFound' : null } |
  { 'InvalidSignature' : null } |
  { 'OrderExpired' : null } |
  { 'OrderAlreadyMatched' : null } |
  { 'TimelockExpired' : null } |
  { 'Unauthorized' : null } |
  { 'InvalidSecret' : null } |
  { 'SwapNotFound' : null } |
  { 'InsufficientFunds' : null };
export type OrderId = string;
export type OrderStatus = { 'Open' : null } |
  { 'Matched' : null } |
  { 'Cancelled' : null } |
  { 'Expired' : null };
export type Result = { 'ok' : SwapId } |
  { 'err' : OrderError };
export type Result_1 = { 'ok' : OrderId } |
  { 'err' : OrderError };
export type Result_2 = { 'ok' : null } |
  { 'err' : OrderError };
export type Secret = Uint8Array | number[];
export type Signature = Uint8Array | number[];
export type SwapId = string;
export type SwapStatus = { 'Refunded' : null } |
  { 'Locked' : null } |
  { 'Completed' : null } |
  { 'Expired' : null } |
  { 'Pending' : null };
export type Timestamp = bigint;
export type TokenAddress = string;
export interface _SERVICE extends CrossChainOrderbook {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
