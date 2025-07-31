export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponseResult = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'deposit_cycles' : IDL.Func([], [], []),
    'get_balance' : IDL.Func([IDL.Text], [Result], []),
    'get_claim_fee' : IDL.Func([], [Result], []),
    'get_contract_info' : IDL.Func([], [IDL.Text], ['query']),
    'get_cycles_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'get_icp_network_signer' : IDL.Func([], [Result], []),
    'get_refund_fee' : IDL.Func([], [Result], []),
    'get_sepolia_block_number' : IDL.Func([], [Result], []),
    'get_total_fees' : IDL.Func([], [Result], []),
    'get_transaction_receipt' : IDL.Func([IDL.Text], [Result], []),
    'test_all_contract_functions' : IDL.Func([], [Result], []),
    'test_basic_rpc' : IDL.Func([], [Result], []),
    'test_deployment_transaction' : IDL.Func([], [Result], []),
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
  });
};
export const init = ({ IDL }) => { return []; };
