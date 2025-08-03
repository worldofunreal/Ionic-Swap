import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// ICRC-1 Interface Definition
const ICRC1Interface = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
  });

  const TransferArgs = IDL.Record({
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64)
  });

  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
      BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
      InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
      TooOld: IDL.Null,
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
      TemporarilyUnavailable: IDL.Null,
      GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text })
    })
  });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ['query']),
    icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Variant({ Nat: IDL.Nat, Int: IDL.Int, Text: IDL.Text, Blob: IDL.Vec(IDL.Nat8) })))], ['query']),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_minting_account: IDL.Func([], [IDL.Opt(Account)], ['query']),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], [])
  });
};

// Create ICRC token actor
export const createICRCActor = (canisterId, identity) => {
  const agent = new HttpAgent({ 
    identity,
    host: process.env.NODE_ENV === 'development' ? 'http://localhost:4943' : 'https://ic0.app'
  });
  
  // In development, we need to configure the agent for local replica
  if (process.env.NODE_ENV === 'development') {
    agent.fetchRootKey();
  }

  return Actor.createActor(ICRC1Interface, {
    agent,
    canisterId
  });
};

// Fetch ICRC balance
export const fetchICRCBalance = async (canisterId, principal, identity) => {
  try {
    if (!identity) {
      console.error('No identity available for ICRC balance fetch');
      return '0';
    }

    const actor = createICRCActor(canisterId, identity);
    
    // Create account object
    const account = {
      owner: Principal.fromText(principal),
      subaccount: []
    };

    // Get balance
    const balance = await actor.icrc1_balance_of(account);
    
    // Get decimals for proper formatting
    const decimals = await actor.icrc1_decimals();
    
    // Convert from nat to human readable
    const balanceInTokens = Number(balance) / Math.pow(10, decimals);
    return balanceInTokens.toFixed(2);
  } catch (error) {
    console.error(`Failed to fetch ICRC balance for ${canisterId}:`, error);
    return '0';
  }
};

// Get ICRC token metadata
export const getICRCMetadata = async (canisterId, identity) => {
  try {
    if (!identity) {
      console.error('No identity available for ICRC metadata fetch');
      return null;
    }

    const actor = createICRCActor(canisterId, identity);
    
    const [name, symbol, decimals] = await Promise.all([
      actor.icrc1_name(),
      actor.icrc1_symbol(),
      actor.icrc1_decimals()
    ]);

    return { name, symbol, decimals };
  } catch (error) {
    console.error(`Failed to fetch ICRC metadata for ${canisterId}:`, error);
    return null;
  }
}; 