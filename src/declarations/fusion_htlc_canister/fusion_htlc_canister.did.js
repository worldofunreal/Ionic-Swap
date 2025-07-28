export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const ChainType = IDL.Variant({
    'ICP' : IDL.Null,
    'Base' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Polygon' : IDL.Null,
    'Optimism' : IDL.Null,
    'Arbitrum' : IDL.Null,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const OneInchOrder = IDL.Record({
    'fills' : IDL.Vec(IDL.Text),
    'maker' : IDL.Text,
    'taker' : IDL.Text,
    'secret_hashes' : IDL.Vec(IDL.Text),
    'src_chain_id' : IDL.Nat,
    'maker_asset' : IDL.Text,
    'hashlock' : IDL.Text,
    'taking_amount' : IDL.Text,
    'making_amount' : IDL.Text,
    'dst_chain_id' : IDL.Nat,
    'order_hash' : IDL.Text,
    'taker_asset' : IDL.Text,
    'timelock' : IDL.Int,
  });
  const HTLCOrder = IDL.Record({
    'oneinch_order' : OneInchOrder,
    'partial_fill_index' : IDL.Opt(IDL.Nat),
    'is_source_chain' : IDL.Bool,
    'merkle_root' : IDL.Opt(IDL.Text),
    'partial_fills' : IDL.Vec(IDL.Text),
    'htlc_id' : IDL.Text,
    'total_filled' : IDL.Nat,
    'remaining_amount' : IDL.Nat,
  });
  const Result_7 = IDL.Variant({ 'ok' : HTLCOrder, 'err' : IDL.Text });
  const Resolver = IDL.Record({
    'last_active' : IDL.Int,
    'total_fills' : IDL.Nat,
    'success_rate' : IDL.Float64,
    'address' : IDL.Text,
    'is_active' : IDL.Bool,
    'supported_chains' : IDL.Vec(ChainType),
  });
  const HTLCStatus = IDL.Variant({
    'Refunded' : IDL.Null,
    'Claimed' : IDL.Null,
    'Locked' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const HTLC = IDL.Record({
    'id' : IDL.Text,
    'status' : HTLCStatus,
    'hashlock' : IDL.Vec(IDL.Nat8),
    'token_canister' : IDL.Principal,
    'recipient' : IDL.Principal,
    'ethereum_address' : IDL.Opt(IDL.Text),
    'secret' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Int,
    'sender' : IDL.Principal,
    'chain_type' : ChainType,
    'expiration_time' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const Result_6 = IDL.Variant({ 'ok' : HTLC, 'err' : IDL.Text });
  const PartialFill = IDL.Record({
    'fill_id' : IDL.Text,
    'status' : IDL.Variant({
      'Failed' : IDL.Null,
      'Completed' : IDL.Null,
      'Pending' : IDL.Null,
    }),
    'fill_timestamp' : IDL.Int,
    'secret_hash' : IDL.Text,
    'htlc_id' : IDL.Text,
    'amount' : IDL.Nat,
    'resolver_address' : IDL.Text,
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Vec(PartialFill),
    'err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : PartialFill, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : Resolver, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponseResult = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'claim_htlc' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'complete_partial_fill' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'create_htlc' : IDL.Func(
        [
          IDL.Principal,
          IDL.Nat,
          IDL.Principal,
          IDL.Int,
          ChainType,
          IDL.Opt(IDL.Text),
        ],
        [Result_1],
        [],
      ),
    'create_partial_fill' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'deposit_cycles' : IDL.Func([], [], []),
    'get_1inch_order' : IDL.Func([IDL.Text], [Result_7], ['query']),
    'get_active_orders' : IDL.Func(
        [
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
        ],
        [Result_1],
        [],
      ),
    'get_active_resolvers' : IDL.Func([], [IDL.Vec(Resolver)], ['query']),
    'get_cycles_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'get_escrow_factory_address' : IDL.Func([IDL.Nat], [Result_1], []),
    'get_htlc' : IDL.Func([IDL.Text], [Result_6], ['query']),
    'get_htlc_partial_fills' : IDL.Func([IDL.Text], [Result_5], ['query']),
    'get_htlcs_by_principal' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(HTLC)],
        ['query'],
      ),
    'get_order_secrets' : IDL.Func([IDL.Text], [Result_1], []),
    'get_orders_by_maker' : IDL.Func(
        [
          IDL.Text,
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
        ],
        [Result_1],
        [],
      ),
    'get_partial_fill' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'get_resolver' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'get_resolvers_for_chain' : IDL.Func(
        [ChainType],
        [IDL.Vec(Resolver)],
        ['query'],
      ),
    'get_tokens' : IDL.Func([IDL.Nat], [Result_1], []),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'is_order_active' : IDL.Func([IDL.Text], [Result_2], []),
    'link_1inch_order' : IDL.Func(
        [IDL.Text, OneInchOrder, IDL.Bool, IDL.Opt(IDL.Nat)],
        [Result],
        [],
      ),
    'parse_order_secrets_for_htlc' : IDL.Func([IDL.Text], [Result_1], []),
    'refund_htlc' : IDL.Func([IDL.Text], [Result], []),
    'register_resolver' : IDL.Func(
        [IDL.Text, IDL.Vec(ChainType)],
        [Result],
        [],
      ),
    'set_htlc_hashlock' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
    'test_1inch_api' : IDL.Func([], [Result_1], []),
    'test_get_active_orders' : IDL.Func([], [Result_1], []),
    'test_http_request' : IDL.Func([], [Result_1], []),
    'transform' : IDL.Func(
        [
          IDL.Record({
            'context' : IDL.Vec(IDL.Nat8),
            'response' : HttpResponseResult,
          }),
        ],
        [HttpResponseResult],
        ['query'],
      ),
    'update_resolver_status' : IDL.Func([IDL.Text, IDL.Bool], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
