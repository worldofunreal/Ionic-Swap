#!/usr/bin/env node

const { Actor, HttpAgent } = require('@dfinity/agent');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const bip39 = require('bip39');
const { ethers } = require('ethers');

// Test configuration
const TEST_CONFIG = {
  SPIRAL_ICRC_CANISTER_ID: 'ej2n5-qaaaa-aaaap-qqc3a-cai',
  STARDUST_ICRC_CANISTER_ID: 'eo3lj-5yaaa-aaaap-qqc3q-cai',
  TOKENS_PER_USER: 100000000000, // 1000 tokens (8 decimals)
};

// Generate consistent mnemonic (same as test implementation)
const generateMnemonic = (name) => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  return bip39.entropyToMnemonic(seed.padEnd(32, '0'));
};

// Generate test identity
const generateTestIdentity = (name) => {
  const mnemonic = generateMnemonic(name);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Generate ICP identity
  const identity = Ed25519KeyIdentity.generate(seed.slice(0, 32));
  const principal = identity.getPrincipal().toText();
  
  return {
    name,
    principal,
    identity,
  };
};

// Create token actor
const createTokenActor = async (canisterId, identity) => {
  const agent = new HttpAgent({
    identity,
    host: 'https://ic0.app',
  });
  
  await agent.fetchRootKey();
  
  // Simple token interface for minting
  const tokenInterface = {
    icrc1_mint: async (args) => {
      return await agent.call(canisterId, 'icrc1_mint', args);
    },
    icrc1_balance_of: async (args) => {
      return await agent.call(canisterId, 'icrc1_balance_of', args);
    }
  };
  
  return tokenInterface;
};

// Mint tokens to a user
const mintTokens = async (tokenActor, toPrincipal, amount) => {
  try {
    const mintArgs = {
      to: {
        owner: toPrincipal,
        subaccount: null
      },
      amount: amount,
      memo: null,
      created_at_time: null
    };
    
    const result = await tokenActor.icrc1_mint(mintArgs);
    return result;
  } catch (error) {
    console.error(`❌ Failed to mint tokens:`, error);
    throw error;
  }
};

// Check balance
const checkBalance = async (tokenActor, principal) => {
  try {
    const balanceArgs = {
      owner: principal,
      subaccount: null
    };
    
    const result = await tokenActor.icrc1_balance_of(balanceArgs);
    return result;
  } catch (error) {
    console.error(`❌ Failed to check balance:`, error);
    return null;
  }
};

// Main function
const distributeTokens = async () => {
  console.log('🚀 Starting Token Distribution to Test Accounts');
  console.log('==================================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Accounts:`);
  console.log(`   Alice: ${alice.principal}`);
  console.log(`   Bob: ${bob.principal}`);
  console.log(`   Charlie: ${charlie.principal}`);
  
  // Create minting identity (current user)
  const mintingIdentity = Ed25519KeyIdentity.generate();
  const mintingPrincipal = mintingIdentity.getPrincipal().toText();
  console.log(`\n💰 Minting Account: ${mintingPrincipal}`);
  
  // Create token actors
  console.log(`\n🏦 Creating token actors...`);
  const spiralActor = await createTokenActor(TEST_CONFIG.SPIRAL_ICRC_CANISTER_ID, mintingIdentity);
  const stardustActor = await createTokenActor(TEST_CONFIG.STARDUST_ICRC_CANISTER_ID, mintingIdentity);
  
  const users = [alice, bob, charlie];
  const tokens = [
    { name: 'Spiral', actor: spiralActor, canisterId: TEST_CONFIG.SPIRAL_ICRC_CANISTER_ID },
    { name: 'Stardust', actor: stardustActor, canisterId: TEST_CONFIG.STARDUST_ICRC_CANISTER_ID }
  ];
  
  // Distribute tokens
  console.log(`\n💰 Distributing ${TEST_CONFIG.TOKENS_PER_USER} tokens to each user...`);
  
  for (const user of users) {
    console.log(`\n👤 Distributing tokens to ${user.name} (${user.principal}):`);
    
    for (const token of tokens) {
      try {
        // Check initial balance
        const initialBalance = await checkBalance(token.actor, user.principal);
        console.log(`   ${token.name} initial balance: ${initialBalance || 0}`);
        
        // Mint tokens
        console.log(`   Minting ${TEST_CONFIG.TOKENS_PER_USER} ${token.name} tokens...`);
        const mintResult = await mintTokens(token.actor, user.principal, TEST_CONFIG.TOKENS_PER_USER);
        
        if (mintResult && mintResult.Ok) {
          console.log(`   ✅ Minted ${TEST_CONFIG.TOKENS_PER_USER} ${token.name} tokens`);
        } else {
          console.log(`   ❌ Failed to mint ${token.name} tokens:`, mintResult);
        }
        
        // Check final balance
        const finalBalance = await checkBalance(token.actor, user.principal);
        console.log(`   ${token.name} final balance: ${finalBalance || 0}`);
        
      } catch (error) {
        console.log(`   ❌ Error with ${token.name}:`, error.message);
      }
    }
  }
  
  console.log(`\n🎉 Token distribution completed!`);
  console.log(`\n📊 Final Balances:`);
  
  // Check final balances
  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.principal}):`);
    for (const token of tokens) {
      try {
        const balance = await checkBalance(token.actor, user.principal);
        console.log(`   ${token.name}: ${balance || 0} tokens`);
      } catch (error) {
        console.log(`   ${token.name}: Error checking balance`);
      }
    }
  }
  
  console.log(`\n🔗 Next Steps:`);
  console.log(`   1. Run the cross-chain swap tests with real tokens`);
  console.log(`   2. Verify actual token transfers between accounts`);
  console.log(`   3. Test balance changes after swaps`);
};

// Run the distribution
distributeTokens()
  .then(() => {
    console.log('\n✅ Token distribution script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Token distribution failed:', error);
    process.exit(1);
  });
