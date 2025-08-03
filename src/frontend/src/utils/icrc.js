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
export const createICRCActor = async (canisterId, identity) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const host = isDevelopment ? 'http://127.0.0.1:4943' : 'https://ic0.app';
  
  const agent = new HttpAgent({ 
    identity,
    host,
    fetchRootKey: isDevelopment
  });
  
  // In development, we need to configure the agent for local replica
  if (isDevelopment) {
    await agent.fetchRootKey();
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

    const actor = await createICRCActor(canisterId, identity);
    
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

    const actor = await createICRCActor(canisterId, identity);
    
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

// ICRC-2 approval function for ICP tokens
export const approveICRCToken = async (canisterId, spenderPrincipal, amount, identity) => {
  try {
    // Validate that we have an identity
    if (!identity) {
      throw new Error('No identity provided for ICRC approval. User must be authenticated.');
    }
    
    console.log('Using identity for ICRC approval:', identity.getPrincipal().toText());
    console.log('Spender principal:', spenderPrincipal);
    console.log('Amount to approve:', amount);
    
    // Create actor for the token canister
    const { Actor, HttpAgent } = await import('@dfinity/agent');
    
    // Map canister IDs to their declaration paths
    let idlFactory;
    if (canisterId === 'ulvla-h7777-77774-qaacq-cai') {
      const { idlFactory: stardustIdl } = await import('../../../declarations/stardust_token/stardust_token.did.js');
      idlFactory = stardustIdl;
    } else if (canisterId === 'umunu-kh777-77774-qaaca-cai') {
      const { idlFactory: spiralIdl } = await import('../../../declarations/spiral_token/spiral_token.did.js');
      idlFactory = spiralIdl;
    } else {
      throw new Error(`Unknown canister ID: ${canisterId}`);
    }
    
    // Create agent with proper host configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const host = isDevelopment ? 'http://127.0.0.1:4943' : 'https://ic0.app';
    
    const agent = new HttpAgent({ 
      host,
      fetchRootKey: isDevelopment,
      identity: identity
    });
    
    // Fetch root key in development
    if (isDevelopment) {
      await agent.fetchRootKey();
    }
    
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterId,
    });

    // Check user's balance first - use the identity's principal (owner)
    const userAccount = {
      owner: identity.getPrincipal(),
      subaccount: []
    };
    
    console.log('Checking balance for user account:', userAccount);
    console.log('User principal from identity:', identity.getPrincipal().toText());
    
    try {
      const balance = await actor.icrc1_balance_of(userAccount);
      console.log('User ICRC balance:', balance.toString());
      console.log('Amount to approve:', amount);
      console.log('Balance comparison:', balance < BigInt(amount) ? 'INSUFFICIENT' : 'SUFFICIENT');
      
      if (balance < BigInt(amount)) {
        throw new Error(`Insufficient balance. User has ${balance.toString()} but trying to approve ${amount}. Please ensure you have sufficient tokens.`);
      }
    } catch (balanceError) {
      console.error('Failed to check balance:', balanceError);
      // Continue anyway, the approval will fail with a better error message
    }

    // Call icrc2_approve with the required parameters
    // The amount should already be in the correct format (8 decimals)
    // Add extra amount for fees (like the test script does)
    const allowanceWithFees = BigInt(amount) + BigInt(10000);
    
    console.log('Approval amount (with fees):', allowanceWithFees.toString());
    console.log('User should have at least this balance to approve');
    
    const approveArgs = {
      amount: allowanceWithFees,
      spender: {
        owner: Principal.fromText(spenderPrincipal), // Backend canister (spender)
        subaccount: [] // opt blob - use empty array for null
      },
      fee: [], // opt nat - use empty array for null
      memo: [], // opt blob - use empty array for null
      from_subaccount: [], // opt blob - use empty array for null
      created_at_time: [], // opt Timestamp - use empty array for null
      expected_allowance: [], // opt nat - use empty array for null
      expires_at: [] // opt Timestamp - use empty array for null
    };
    
    console.log('ICRC-2 approval args:', approveArgs);
    
    const result = await actor.icrc2_approve(approveArgs);

    console.log('ICRC-2 approval result:', result);
    
    // Check if result is an error
    if (result && typeof result === 'object' && 'Err' in result) {
      console.error('ICRC Error details:', result.Err);
      
      // Convert BigInt values to strings for error message
      const errorDetails = {};
      for (const [key, value] of Object.entries(result.Err)) {
        if (typeof value === 'bigint') {
          errorDetails[key] = value.toString();
        } else if (value && typeof value === 'object') {
          errorDetails[key] = Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : v])
          );
        } else {
          errorDetails[key] = value;
        }
      }
      
      throw new Error(`ICRC approval failed: ${JSON.stringify(errorDetails)}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to approve ICRC token:', error);
    
    // Check if it's an ICRC error result
    if (error && typeof error === 'object' && 'Err' in error) {
      console.error('ICRC Error details:', error.Err);
      throw new Error(`ICRC approval failed: ${JSON.stringify(error.Err)}`);
    }
    
    throw error;
  }
};

// Get ICRC-2 allowance for a token
export const getICRC2Allowance = async (canisterId, ownerPrincipal, spenderPrincipal, identity) => {
  try {
    const { Actor, HttpAgent } = await import('@dfinity/agent');
    
    // Map canister IDs to their declaration paths
    let idlFactory;
    if (canisterId === 'ulvla-h7777-77774-qaacq-cai') {
      const { idlFactory: stardustIdl } = await import('../../../declarations/stardust_token/stardust_token.did.js');
      idlFactory = stardustIdl;
    } else if (canisterId === 'umunu-kh777-77774-qaaca-cai') {
      const { idlFactory: spiralIdl } = await import('../../../declarations/spiral_token/spiral_token.did.js');
      idlFactory = spiralIdl;
    } else {
      throw new Error(`Unknown canister ID: ${canisterId}`);
    }
    
    // Create agent with proper host configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const host = isDevelopment ? 'http://127.0.0.1:4943' : 'https://ic0.app';
    
    const agent = new HttpAgent({ 
      host,
      fetchRootKey: isDevelopment,
      identity: identity
    });
    
    // Fetch root key in development
    if (isDevelopment) {
      await agent.fetchRootKey();
    }
    
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterId,
    });

    const result = await actor.icrc2_allowance({
      account: {
        owner: Principal.fromText(ownerPrincipal),
        subaccount: [] // opt blob - use empty array for null
      },
      spender: {
        owner: Principal.fromText(spenderPrincipal),
        subaccount: [] // opt blob - use empty array for null
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to get ICRC-2 allowance:', error);
    throw error;
  }
}; 