#!/usr/bin/env node

const { Keypair, Connection, PublicKey, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const bip39 = require('bip39');

// Test configuration
const TEST_CONFIG = {
  SPIRAL_SOLANA_MINT: 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_PER_USER: 1000000000, // 10 tokens (8 decimals)
  DEPLOYER_ADDRESS: '6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES',
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

// Get SPL token balance
const getSplTokenBalance = async (publicKey, mintAddress) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      Keypair.generate(), // Dummy keypair for read-only operations
      new PublicKey(mintAddress),
      new PublicKey(publicKey)
    );
    
    const accountInfo = await connection.getTokenAccountBalance(tokenAccount.address);
    return BigInt(accountInfo.value.amount);
  } catch (error) {
    return BigInt(0);
  }
};

// Transfer SPL tokens from deployer
const transferSplTokensFromDeployer = async (toPublicKey, mintAddress, amount) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    
    // We need the deployer's private key to sign transactions
    // For now, let's try to use a different approach - request tokens from the deployer
    console.log(`   ⚠️  Cannot transfer from deployer without private key`);
    console.log(`   💡 Alternative: Use Solana CLI or get deployer's private key`);
    
    return null;
  } catch (error) {
    console.error(`❌ Failed to transfer SPL tokens:`, error);
    throw error;
  }
};

// Main function
const transferSplTokens = async () => {
  console.log('🚀 Starting SPL Token Transfer from Deployer');
  console.log('=============================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Accounts:`);
  console.log(`   Alice: ${alice.solAddress}`);
  console.log(`   Bob: ${bob.solAddress}`);
  console.log(`   Charlie: ${charlie.solAddress}`);
  
  console.log(`\n🏦 Deployer Account: ${TEST_CONFIG.DEPLOYER_ADDRESS}`);
  
  const users = [alice, bob, charlie];
  const tokens = [
    { name: 'Spiral', mint: TEST_CONFIG.SPIRAL_SOLANA_MINT },
    { name: 'Stardust', mint: TEST_CONFIG.STARDUST_SOLANA_MINT }
  ];
  
  // Check deployer's SPL token balances
  console.log(`\n📊 Deployer SPL Token Balances:`);
  for (const token of tokens) {
    const balance = await getSplTokenBalance(TEST_CONFIG.DEPLOYER_ADDRESS, token.mint);
    console.log(`   ${token.name}: ${balance.toString()} tokens`);
  }
  
  // Check current user balances
  console.log(`\n📊 Current User Balances:`);
  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.solAddress}):`);
    for (const token of tokens) {
      const balance = await getSplTokenBalance(user.solAddress, token.mint);
      console.log(`   ${token.name}: ${balance.toString()} tokens`);
    }
  }
  
  console.log(`\n⚠️  To transfer SPL tokens, we need the deployer's private key`);
  console.log(`   Options:`);
  console.log(`   1. Get the deployer's private key from the deployment`);
  console.log(`   2. Use Solana CLI with the deployer's keypair`);
  console.log(`   3. Create new tokens with a known mint authority`);
  
  console.log(`\n🔗 Manual Transfer Commands (using Solana CLI):`);
  console.log(`   # First, get the deployer's keypair file`);
  console.log(`   # Then run these commands:`);
  
  for (const user of users) {
    for (const token of tokens) {
      console.log(`   spl-token transfer ${token.mint} ${TEST_CONFIG.TOKENS_PER_USER} ${user.solAddress} --from <deployer-keypair-file>`);
    }
  }
  
  console.log(`\n💡 Alternative: Create a new token with known mint authority`);
  console.log(`   This would allow us to mint tokens directly to test accounts`);
};

// Run the transfer
transferSplTokens()
  .then(() => {
    console.log('\n✅ SPL token transfer analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ SPL token transfer failed:', error);
    process.exit(1);
  });
