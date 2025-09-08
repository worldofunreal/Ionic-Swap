export const idlFactory = ({ IDL }) => {
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
  const CreateEscrowWithPermitArgs = IDL.Record({
    'permit_signature' : IDL.Vec(IDL.Nat8),
    'deadline' : IDL.Nat64,
    'expiry_timestamp' : IDL.Nat64,
    'nonce' : IDL.Nat64,
    'order_id' : IDL.Vec(IDL.Nat8),
    'user_pubkey' : IDL.Text,
    'amount' : IDL.Nat64,
    'token_mint' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'create_escrow_with_permit' : IDL.Func(
        [CreateEscrowWithPermitArgs],
        [Result],
        [],
      ),
    'create_transfer_message' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Nat],
        [IDL.Vec(IDL.Nat8)],
        [],
      ),
    'get_balance' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Nat], []),
    'send_sol' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'sign_transaction' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'solana_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => {
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
  return [InitArg];
};
