import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { execSync } from 'child_process';
import { idlFactory as spiralTokenIdlFactory } from '../src/declarations/spiral_token/spiral_token.did.js';
import { idlFactory as stardustTokenIdlFactory } from '../src/declarations/stardust_token/stardust_token.did.js';
import { idlFactory as backendIdlFactory } from '../src/declarations/backend/backend.did.js';

// Token canister IDs
const SPIRAL_TOKEN_ID = 'uzt4z-lp777-77774-qaabq-cai';
const STD_TOKEN_ID = 'umunu-kh777-77774-qaaca-cai';
const BACKEND_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Generate deterministic identity from name
const generateDeterministicIdentity = (name: string) => {
  // Generate consistent seed (same as other scripts)
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seedBytes[i] = parseInt(seed[i % seed.length] || '0', 16);
  }
  
  // Create Ed25519 identity from seed (deterministic)
  const identity = Ed25519KeyIdentity.generate(seedBytes);
  const principal = identity.getPrincipal().toText();
  
  return {
    name,
    identity,
    principal,
    seedHex: Array.from(seedBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
};

// Check token balance using dfx
const checkTokenBalance = (tokenCanisterId: string, principal: string): bigint => {
  try {
    const result = execSync(
      `dfx canister call ${tokenCanisterId} icrc1_balance_of '(record { owner = principal "${principal}"; subaccount = null })'`,
      { encoding: 'utf8' }
    );
    // Parse result like "(1_000_000_000_000 : nat)"
    const match = result.match(/\(([0-9_]+)\s*:\s*nat\)/);
    if (match) {
      return BigInt(match[1].replace(/_/g, ''));
    }
    return 0n;
  } catch (error) {
    console.log(`   Error checking balance: ${error}`);
    return 0n;
  }
};

// Fund wallet using dfx
const fundWallet = (tokenCanisterId: string, principal: string, amount: bigint) => {
  try {
    const result = execSync(
      `dfx canister call ${tokenCanisterId} icrc1_transfer '(record { 
        to = record { owner = principal "${principal}"; subaccount = null }; 
        amount = ${amount}; 
        fee = null; 
        memo = null; 
        from_subaccount = null; 
        created_at_time = null 
      })'`,
      { encoding: 'utf8' }
    );
    console.log(`   ✅ Funded: ${result.trim()}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Funding failed: ${error}`);
    return false;
  }
};

const testIcpFlow = async () => {
  console.log('🧪 Testing Complete ICP Gasless Permit Flow');
  console.log('==========================================');

  // 1. Generate deterministic identities
  console.log('\n🔑 Step 1: Generating Deterministic Identities');
  const alice = generateDeterministicIdentity('alice');
  const bob = generateDeterministicIdentity('bob');
  const charlie = generateDeterministicIdentity('charlie');

  console.log(`👤 Alice: ${alice.principal}`);
  console.log(`👤 Bob: ${bob.principal}`);
  console.log(`👤 Charlie: ${charlie.principal}`);

  // 2. Check balances and fund if needed
  console.log('\n💰 Step 2: Checking Balances and Funding if Needed');
  
  const requiredAmount = 1000000000000n; // 1000 tokens (8 decimals)
  const wallets = [alice, bob, charlie];
  
  for (const wallet of wallets) {
    console.log(`\n👤 Checking ${wallet.name.toUpperCase()}:`);
    
    // Check SPIRAL balance
    const spiralBalance = checkTokenBalance(SPIRAL_TOKEN_ID, wallet.principal);
    console.log(`   SPIRAL Balance: ${spiralBalance} (${Number(spiralBalance) / 100000000} tokens)`);
    
    if (spiralBalance < requiredAmount) {
      console.log(`   💸 Funding SPIRAL tokens...`);
      fundWallet(SPIRAL_TOKEN_ID, wallet.principal, requiredAmount);
    } else {
      console.log(`   ✅ SPIRAL balance sufficient`);
    }
    
    // Check STD balance
    const stdBalance = checkTokenBalance(STD_TOKEN_ID, wallet.principal);
    console.log(`   STD Balance: ${stdBalance} (${Number(stdBalance) / 100000000} tokens)`);
    
    if (stdBalance < requiredAmount) {
      console.log(`   💸 Funding STD tokens...`);
      fundWallet(STD_TOKEN_ID, wallet.principal, requiredAmount);
    } else {
      console.log(`   ✅ STD balance sufficient`);
    }
  }

  // 3. Run gasless permit flow with Alice
  console.log('\n🚀 Step 3: Running Gasless Permit Flow with Alice');
  
  // Create agent with Alice's identity
  const agent = new HttpAgent({ 
    host: LOCAL_HOST,
    identity: alice.identity,
  });
  
  await agent.fetchRootKey();

  // Create actors
  const spiralToken = Actor.createActor(spiralTokenIdlFactory, {
    agent,
    canisterId: SPIRAL_TOKEN_ID,
  });

  const backend = Actor.createActor(backendIdlFactory, {
    agent,
    canisterId: BACKEND_CANISTER_ID,
  });

  try {
    // Check Alice's final balance
    console.log('\n📊 Alice\'s Final Balances:');
    const aliceSpiralBalance = await spiralToken.icrc1_balance_of({
      owner: Principal.fromText(alice.principal),
      subaccount: []
    });
    console.log(`   SPIRAL: ${aliceSpiralBalance} (${Number(aliceSpiralBalance) / 100000000} tokens)`);

    const permitAmount = 100000000000n; // 100 SPIRAL tokens (8 decimals)
    const tokenFee = 10000n; // SPIRAL token fee
    const approvalAmount = permitAmount + tokenFee; // Amount + fee for allowance

    console.log('\n🔐 Step 3a: Alice Approving Canister for SPIRAL tokens...');
    console.log(`   Permit Amount: ${permitAmount} (100 SPIRAL tokens)`);
    console.log(`   Token Fee: ${tokenFee}`);
    console.log(`   Approval Amount: ${approvalAmount}`);
    console.log(`   Spender: ${BACKEND_CANISTER_ID}`);

    // Alice calls icrc2_approve
    const approveResult = await spiralToken.icrc2_approve({
      from_subaccount: [],
      spender: {
        owner: Principal.fromText(BACKEND_CANISTER_ID),
        subaccount: []
      },
      amount: approvalAmount,
      expected_allowance: [],
      fee: [tokenFee], // Fee for the approval transaction
      memo: [],
      created_at_time: [],
      expires_at: []
    });

    console.log('   ✅ Alice\'s icrc2_approve result:', approveResult);

    // Check allowance
    const allowance = await spiralToken.icrc2_allowance({
      account: {
        owner: Principal.fromText(alice.principal),
        subaccount: []
      },
      spender: {
        owner: Principal.fromText(BACKEND_CANISTER_ID),
        subaccount: []
      }
    });
    console.log(`   📊 SPIRAL Allowance: ${(allowance as any).allowance}`);

    console.log('\n🚀 Step 3b: Canister Pulling Tokens from Alice...');
    
    // Canister calls submit_icp_gasless_permit
    const permitRequest = {
      token: SPIRAL_TOKEN_ID,
      owner: alice.principal,
      spender: BACKEND_CANISTER_ID,
      amount: permitAmount.toString(),
      deadline: "0",
      v: "0", 
      r: "0x0000000000000000000000000000000000000000000000000000000000000000", 
      s: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const pullResult = await backend.submit_icp_gasless_permit(permitRequest);
    console.log('   ✅ Canister pull result:', pullResult);

    // Check final balances
    console.log('\n📊 Final Balances After Transfer:');
    const aliceFinalBalance = await spiralToken.icrc1_balance_of({
      owner: Principal.fromText(alice.principal),
      subaccount: []
    });
    console.log(`   Alice SPIRAL: ${aliceFinalBalance} (${Number(aliceFinalBalance) / 100000000} tokens)`);

    const canisterBalance = await spiralToken.icrc1_balance_of({
      owner: Principal.fromText(BACKEND_CANISTER_ID),
      subaccount: []
    });
    console.log(`   Canister SPIRAL: ${canisterBalance} (${Number(canisterBalance) / 100000000} tokens)`);

    console.log('\n🎉 ICP Gasless Permit Flow Complete!');

  } catch (error) {
    console.error('❌ Gasless permit flow failed:', error);
  }
};

testIcpFlow().catch(console.error);
