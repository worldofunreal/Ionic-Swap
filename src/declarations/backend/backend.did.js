export const idlFactory = ({ IDL }) => {
  const Error = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'UsernameTaken' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'InternalError' : IDL.Text,
    'UserNotFound' : IDL.Null,
  });
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
  const UserResult = IDL.Variant({ 'Ok' : User, 'Err' : Error });
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
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'status_code' : IDL.Nat16,
  });
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
    'delete_account' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error })],
        [],
      ),
    'finalize_upload' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : Error })],
        [],
      ),
    'follow_user' : IDL.Func([IDL.Principal], [UserResult], []),
    'get_all_usernames' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'get_followers' : IDL.Func([IDL.Principal], [IDL.Vec(CompactProfile)], []),
    'get_following' : IDL.Func([IDL.Principal], [IDL.Vec(CompactProfile)], []),
    'get_user' : IDL.Func([IDL.Principal], [UserResult], []),
    'get_user_by_username' : IDL.Func([IDL.Text], [UserResult], []),
    'get_user_count' : IDL.Func([], [IDL.Nat64], []),
    'get_user_personal' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Variant({ 'Ok' : PersonalUser, 'Err' : Error })],
        [],
      ),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], []),
    'init_upload' : IDL.Func(
        [IDL.Text, IDL.Nat64, IDL.Opt(IDL.Nat64), IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error })],
        [],
      ),
    'is_following' : IDL.Func([IDL.Principal, IDL.Principal], [IDL.Bool], []),
    'is_username_available' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'search_users' : IDL.Func(
        [IDL.Text, IDL.Nat32],
        [IDL.Variant({ 'Ok' : IDL.Vec(CompactProfile), 'Err' : Error })],
        [],
      ),
    'search_users_personal' : IDL.Func(
        [IDL.Text, IDL.Nat32, IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Vec(CompactProfile), 'Err' : Error })],
        [],
      ),
    'signup' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [UserResult],
        [],
      ),
    'store_chunk' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Nat8), IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error })],
        [],
      ),
    'unfollow_user' : IDL.Func([IDL.Principal], [UserResult], []),
    'update_avatar' : IDL.Func([IDL.Text], [UserResult], []),
    'update_banner' : IDL.Func([IDL.Text], [UserResult], []),
    'update_bio' : IDL.Func([IDL.Text], [UserResult], []),
    'update_bitcoin_address' : IDL.Func([IDL.Text], [UserResult], []),
    'update_display_name' : IDL.Func([IDL.Text], [UserResult], []),
    'update_evm_address' : IDL.Func([IDL.Text], [UserResult], []),
    'update_location' : IDL.Func([IDL.Text], [UserResult], []),
    'update_profile' : IDL.Func([UserUpdate], [UserResult], []),
    'update_solana_address' : IDL.Func([IDL.Text], [UserResult], []),
    'update_website' : IDL.Func([IDL.Text], [UserResult], []),
  });
};
export const init = ({ IDL }) => { return []; };
