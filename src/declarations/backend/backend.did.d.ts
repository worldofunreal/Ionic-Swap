import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type CommitmentLevel = { 'finalized' : null } |
  { 'confirmed' : null } |
  { 'processed' : null };
export interface CreateEscrowWithPermitArgs {
  'permit_signature' : Uint8Array | number[],
  'deadline' : bigint,
  'expiry_timestamp' : bigint,
  'nonce' : bigint,
  'order_id' : Uint8Array | number[],
  'user_pubkey' : string,
  'amount' : bigint,
  'token_mint' : string,
}
export type Ed25519KeyName = { 'MainnetTestKey1' : null } |
  { 'LocalDevelopment' : null } |
  { 'MainnetProdKey1' : null };
export interface HttpHeader { 'value' : string, 'name' : string }
export interface InitArg {
  'solana_commitment_level' : [] | [CommitmentLevel],
  'ed25519_key_name' : [] | [Ed25519KeyName],
  'solana_network' : [] | [SolanaNetwork],
  'sol_rpc_canister_id' : [] | [Principal],
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export interface RpcEndpoint {
  'url' : string,
  'headers' : [] | [Array<HttpHeader>],
}
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Custom' : RpcEndpoint } |
  { 'Devnet' : null };
export interface _SERVICE {
  'create_escrow_with_permit' : ActorMethod<
    [CreateEscrowWithPermitArgs],
    Result
  >,
  'create_transfer_message' : ActorMethod<
    [[] | [Principal], string, bigint],
    Uint8Array | number[]
  >,
  'get_balance' : ActorMethod<[[] | [string]], bigint>,
  'send_sol' : ActorMethod<[[] | [Principal], string, bigint], string>,
  'sign_transaction' : ActorMethod<
    [[] | [Principal], Uint8Array | number[]],
    string
  >,
  'solana_account' : ActorMethod<[[] | [Principal]], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
