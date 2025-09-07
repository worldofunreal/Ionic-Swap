import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createMint, createAccount, mintTo, getAccount, transfer, getAssociatedTokenAddress } from '@solana/spl-token';
import * as bip39 from 'bip39';

// Test configuration
const TEST_CONFIG = {
  SPIRAL_SOLANA_MINT: 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_PER_USER: 1000000000, // 10 tokens (8 decimals)
};

// Generate consistent mnemonic (same as test implementation)
const generateMnemonic = (name: string): string => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  return bip39.entropyToMnemonic(seed.padEnd(32, '0'));
};

// Generate test identity
const generateTestIdentity = (name: string) => {
  const mnemonic = generateMnemonic(name);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Generate Solana keypair
  const solKeypair = Keypair.fromSeed(seed.slice(0, 32));
  const solAddress = solKeypair.publicKey.toBase58();
  
  return {
    name,
    solAddress,
    solKeypair,
  };
};

// Check Solana token balance
const checkSolanaBalance = async (publicKey: string, mintAddress: string): Promise<bigint> => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    const tokenAccount = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(publicKey)
    );
    
    const accountInfo = await getAccount(connection, tokenAccount);
    return BigInt(accountInfo.amount.toString());
  } catch (error) {
    // Account might not exist, return 0
    return BigInt(0);
  }
};

// Main function
const transferTokensToTestUsers = async () => {
  console.log('🚀 Starting Solana Token Distribution to Test Accounts');
  console.log('======================================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Accounts:`);
  console.log(`   Alice: ${alice.solAddress}`);
  console.log(`   Bob: ${bob.solAddress}`);
  console.log(`   Charlie: ${charlie.solAddress}`);
  
  const users = [alice, bob, charlie];
  const tokens = [
    { name: 'Spiral', mint: TEST_CONFIG.SPIRAL_SOLANA_MINT },
    { name: 'Stardust', mint: TEST_CONFIG.STARDUST_SOLANA_MINT }
  ];
  
  // Check initial balances
  console.log(`\n📊 Initial Balances:`);
  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.solAddress}):`);
    for (const token of tokens) {
      try {
        const balance = await checkSolanaBalance(user.solAddress, token.mint);
        console.log(`   ${token.name}: ${balance.toString()} tokens`);
      } catch (error) {
        console.log(`   ${token.name}: Error checking balance`);
      }
    }
  }
  
  console.log(`\n💰 To transfer tokens, you need to:`);
  console.log(`   1. Fund the deployer account (6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES) with SOL`);
  console.log(`   2. Ensure the deployer has SPL tokens to transfer`);
  console.log(`   3. Use Solana CLI or a script to transfer tokens`);
  
  console.log(`\n📋 Manual Transfer Commands (using Solana CLI):`);
  for (const user of users) {
    for (const token of tokens) {
      console.log(`   spl-token transfer ${token.mint} ${TEST_CONFIG.TOKENS_PER_USER} ${user.solAddress} --from 6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES`);
    }
  }
  
  console.log(`\n🔗 Alternative: Use the existing test script which will handle token creation if needed`);
};

// Run the distribution
transferTokensToTestUsers()
  .then(() => {
    console.log('\n✅ Solana token distribution script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Solana token distribution failed:', error);
    process.exit(1);
  });
