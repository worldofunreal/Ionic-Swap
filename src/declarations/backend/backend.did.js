export const idlFactory = ({ IDL }) => {
  const PermitRequest = IDL.Record({
    'r' : IDL.Text,
    's' : IDL.Text,
    'v' : IDL.Text,
    'signature' : IDL.Text,
    'value' : IDL.Text,
    'owner' : IDL.Text,
    'deadline' : IDL.Text,
    'nonce' : IDL.Text,
    'spender' : IDL.Text,
  });
  const GaslessApprovalRequest = IDL.Record({
    'user_address' : IDL.Text,
    'permit_request' : PermitRequest,
    'amount' : IDL.Text,
  });
  const SwapOrderStatus = IDL.Variant({
    'DestinationHTLCClaimed' : IDL.Null,
    'SourceHTLCCreated' : IDL.Null,
    'SourceHTLCClaimed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Created' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
    'DestinationHTLCCreated' : IDL.Null,
  });
  const AtomicSwapOrder = IDL.Record({
    'maker' : IDL.Text,
    'status' : SwapOrderStatus,
    'taker' : IDL.Text,
    'destination_htlc_id' : IDL.Opt(IDL.Text),
    'destination_amount' : IDL.Text,
    'hashlock' : IDL.Text,
    'secret' : IDL.Text,
    'created_at' : IDL.Nat64,
    'source_htlc_id' : IDL.Opt(IDL.Text),
    'order_id' : IDL.Text,
    'source_amount' : IDL.Text,
    'source_token' : IDL.Text,
    'expires_at' : IDL.Nat64,
    'destination_token' : IDL.Text,
    'timelock' : IDL.Nat64,
  });
  return IDL.Service({
    'claim_evm_htlc' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'create_atomic_swap_order' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'create_evm_htlc' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'execute_atomic_swap' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'execute_gasless_approval' : IDL.Func(
        [GaslessApprovalRequest],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_all_atomic_swap_orders' : IDL.Func([], [IDL.Vec(AtomicSwapOrder)], []),
    'get_atomic_swap_order' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(AtomicSwapOrder)],
        [],
      ),
    'get_balance' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_claim_fee' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_contract_info' : IDL.Func([], [IDL.Text], []),
    'get_ethereum_address' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_icp_network_signer' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_public_key' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_refund_fee' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_sepolia_block_number' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_total_fees' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_transaction_receipt' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'send_raw_transaction' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'sign_transaction' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'test_all_contract_functions' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'test_basic_rpc' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'test_deployment_transaction' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
