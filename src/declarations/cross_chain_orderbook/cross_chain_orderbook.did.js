export const idlFactory = ({ IDL }) => {
  const OrderId = IDL.Text;
  const OrderError = IDL.Variant({
    'InvalidAmount' : IDL.Null,
    'OrderNotFound' : IDL.Null,
    'InvalidSignature' : IDL.Null,
    'OrderExpired' : IDL.Null,
    'OrderAlreadyMatched' : IDL.Null,
    'TimelockExpired' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'InvalidSecret' : IDL.Null,
    'SwapNotFound' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : OrderError });
  const SwapId = IDL.Text;
  const Secret = IDL.Vec(IDL.Nat8);
  const HashedSecret = IDL.Text;
  const SwapStatus = IDL.Variant({
    'Refunded' : IDL.Null,
    'Locked' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Timestamp = IDL.Int;
  const HtlcState = IDL.Record({
    'hashedSecret' : HashedSecret,
    'status' : SwapStatus,
    'initiator' : IDL.Principal,
    'createdAt' : Timestamp,
    'counterparty' : IDL.Principal,
    'swapId' : SwapId,
    'timelock' : Timestamp,
  });
  const OrderStatus = IDL.Variant({
    'Open' : IDL.Null,
    'Matched' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const TokenAddress = IDL.Text;
  const Amount = IDL.Nat;
  const LimitOrder = IDL.Record({
    'hashedSecret' : HashedSecret,
    'status' : OrderStatus,
    'tokenBuy' : TokenAddress,
    'owner' : IDL.Principal,
    'orderId' : OrderId,
    'amountSell' : Amount,
    'isEvmUser' : IDL.Bool,
    'timestamp' : Timestamp,
    'tokenSell' : TokenAddress,
    'amountBuy' : Amount,
  });
  const Result_1 = IDL.Variant({ 'ok' : OrderId, 'err' : OrderError });
  const Signature = IDL.Vec(IDL.Nat8);
  const Result = IDL.Variant({ 'ok' : SwapId, 'err' : OrderError });
  const CrossChainOrderbook = IDL.Service({
    'cancelOrder' : IDL.Func([OrderId], [Result_2], []),
    'claimFunds' : IDL.Func([SwapId, Secret], [Result_2], []),
    'getActiveSwaps' : IDL.Func([], [IDL.Vec(HtlcState)], ['query']),
    'getOpenOrders' : IDL.Func([], [IDL.Vec(LimitOrder)], ['query']),
    'getOrder' : IDL.Func([OrderId], [IDL.Opt(LimitOrder)], ['query']),
    'getSwap' : IDL.Func([SwapId], [IDL.Opt(HtlcState)], ['query']),
    'getTokenCanister' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'getUserOrders' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(LimitOrder)],
        ['query'],
      ),
    'placeIcpOrder' : IDL.Func(
        [TokenAddress, Amount, TokenAddress, Amount, HashedSecret],
        [Result_1],
        [],
      ),
    'refundFunds' : IDL.Func([SwapId], [Result_2], []),
    'setTokenCanister' : IDL.Func([IDL.Principal], [Result_2], []),
    'submitEvmOrder' : IDL.Func(
        [TokenAddress, Amount, TokenAddress, Amount, HashedSecret, Signature],
        [Result_1],
        [],
      ),
    'takeOrder' : IDL.Func([OrderId], [Result], []),
  });
  return CrossChainOrderbook;
};
export const init = ({ IDL }) => { return []; };
