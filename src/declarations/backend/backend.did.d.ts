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
export type Error = { 'InvalidInput' : string } |
  { 'UsernameTaken' : null } |
  { 'Unauthorized' : null } |
  { 'InternalError' : string } |
  { 'UserNotFound' : null };
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'status_code' : number,
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
export type UserResult = { 'Ok' : User } |
  { 'Err' : Error };
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
  'delete_account' : ActorMethod<[], { 'Ok' : null } | { 'Err' : Error }>,
  'finalize_upload' : ActorMethod<
    [string],
    { 'Ok' : string } |
      { 'Err' : Error }
  >,
  'follow_user' : ActorMethod<[Principal], UserResult>,
  'get_all_usernames' : ActorMethod<[], Array<string>>,
  'get_followers' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_following' : ActorMethod<[Principal], Array<CompactProfile>>,
  'get_user' : ActorMethod<[Principal], UserResult>,
  'get_user_by_username' : ActorMethod<[string], UserResult>,
  'get_user_count' : ActorMethod<[], bigint>,
  'get_user_personal' : ActorMethod<
    [Principal, Principal],
    { 'Ok' : PersonalUser } |
      { 'Err' : Error }
  >,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'init_upload' : ActorMethod<
    [string, bigint, [] | [bigint], string],
    { 'Ok' : null } |
      { 'Err' : Error }
  >,
  'is_following' : ActorMethod<[Principal, Principal], boolean>,
  'is_username_available' : ActorMethod<[string], boolean>,
  'search_users' : ActorMethod<
    [string, number],
    { 'Ok' : Array<CompactProfile> } |
      { 'Err' : Error }
  >,
  'search_users_personal' : ActorMethod<
    [string, number, Principal],
    { 'Ok' : Array<CompactProfile> } |
      { 'Err' : Error }
  >,
  'signup' : ActorMethod<
    [string, [] | [string], [] | [string], [] | [string]],
    UserResult
  >,
  'store_chunk' : ActorMethod<
    [bigint, Uint8Array | number[], string],
    { 'Ok' : null } |
      { 'Err' : Error }
  >,
  'unfollow_user' : ActorMethod<[Principal], UserResult>,
  'update_avatar' : ActorMethod<[string], UserResult>,
  'update_banner' : ActorMethod<[string], UserResult>,
  'update_bio' : ActorMethod<[string], UserResult>,
  'update_bitcoin_address' : ActorMethod<[string], UserResult>,
  'update_display_name' : ActorMethod<[string], UserResult>,
  'update_evm_address' : ActorMethod<[string], UserResult>,
  'update_location' : ActorMethod<[string], UserResult>,
  'update_profile' : ActorMethod<[UserUpdate], UserResult>,
  'update_solana_address' : ActorMethod<[string], UserResult>,
  'update_website' : ActorMethod<[string], UserResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
