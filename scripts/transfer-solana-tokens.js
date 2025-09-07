#!/usr/bin/env node

const { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createMint, createAccount, mintTo, getAccount, transfer, getAssociatedTokenAddress } = require('@solana/spl-token');
const bip39 = require('bip39');

// Test configuration
const TEST_CONFIG = {
  SPIRAL_SOLANA_MINT: 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_PER_USER: 1000000000, // 10 tokens (8 decimals)
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
const checkSolanaBalance = async (publicKey, mintAddress) => {
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

// Transfer SPL tokens
const transferSplTokens = async (fromKeypair, toPublicKey, mintAddress, amount) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    
    // Get source token account
    const fromTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      fromKeypair.publicKey
    );
    
    // Get destination token account
    const toTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(toPublicKey)
    );
    
    // Check if destination token account exists, create if not
    try {
      await getAccount(connection, toTokenAccount);
    } catch (error) {
      console.log(`   Creating token account for ${toPublicKey}...`);
      const createAccountTx = new Transaction().add(
        await createAccount(
          connection,
          fromKeypair,
          fromKeypair.publicKey,
          new PublicKey(mintAddress),
          new PublicKey(toPublicKey)
        )
      );
      await sendAndConfirmTransaction(connection, createAccountTx, [fromKeypair]);
    }
    
    // Transfer tokens
    const transferTx = new Transaction().add(
      transfer(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        amount
      )
    );
    
    const signature = await sendAndConfirmTransaction(connection, transferTx, [fromKeypair]);
    return signature;
  } catch (error) {
    console.error(`❌ Failed to transfer tokens:`, error);
    throw error;
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
  
  // Create a source keypair (we'll need to fund this first)
  const sourceKeypair = Keypair.generate();
  const sourceAddress = sourceKeypair.publicKey.toBase58();
  console.log(`\n💰 Source Account: ${sourceAddress}`);
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Check if we have a funded account to transfer from
  // For now, let's try to use the deployer account from the token info
  const deployerAddress = '6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES';
  console.log(`\n🏦 Using deployer account: ${deployerAddress}`);
  
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
  
  console.log(`\n💰 Attempting to transfer ${TEST_CONFIG.TOKENS_PER_USER} tokens to each user...`);
  console.log(`⚠️  Note: This requires the source account to have tokens and SOL for transaction fees`);
  
  // For now, let's just show what we would do
  console.log(`\n🔗 Next Steps:`);
  console.log(`   1. Fund the deployer account with SOL for transaction fees`);
  console.log(`   2. Ensure the deployer account has SPL tokens to transfer`);
  console.log(`   3. Run the actual token transfers`);
  console.log(`   4. Verify balances after transfers`);
  
  console.log(`\n📋 Transfer Commands (to run manually):`);
  for (const user of users) {
    for (const token of tokens) {
      console.log(`   Transfer ${TEST_CONFIG.TOKENS_PER_USER} ${token.name} to ${user.name} (${user.solAddress})`);
    }
  }
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
