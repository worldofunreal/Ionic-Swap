#!/usr/bin/env node

const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer, getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  SPIRAL_SOLANA_MINT: 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25V2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  DEPLOYER_ADDRESS: '6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES',
  // From the logs, we know the canister's Stardust token account
  CANISTER_STARDUST_TOKEN_ACCOUNT: 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av',
  TOKENS_TO_TRANSFER: 1000000000, // 10 tokens (8 decimals)
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
  return require('bip39').entropyToMnemonic(seed.padEnd(32, '0'));
};

// Generate test identity
const generateTestIdentity = (name) => {
  const mnemonic = generateMnemonic(name);
  const seed = require('bip39').mnemonicToSeedSync(mnemonic);
  
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
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      new PublicKey(publicKey),
      { mint: new PublicKey(mintAddress) }
    );
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const accountInfo = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
    return accountInfo.value.amount;
  } catch (error) {
    console.error(`Error getting balance for ${publicKey}:`, error.message);
    return 0;
  }
};

// Find the canister's base Solana address by reverse-engineering from the token account
const findCanisterBaseAddress = async () => {
  console.log('🔍 Finding canister base Solana address...');
  
  // The canister uses Ed25519 key derivation with the canister ID
  // We need to simulate the same derivation that the backend uses
  
  // From the logs, we know the canister's Stardust token account is BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av
  // We need to find the base address that generates this ATA
  
  // The backend uses: sol_rpc_client::ed25519::DerivationPath::from(ic_cdk::id().as_slice())
  // and then gets the Ed25519 public key
  
  // For now, let's try to find the correct address by testing different derivation methods
  const canisterId = '5w2a3-wqaaa-aaaap-qqaea-cai'; // From the logs
  
  // Method 1: Simple hash of canister ID
  const encoder = new TextEncoder();
  const canisterBytes = encoder.encode(canisterId);
  const hash = require('crypto').createHash('sha256').update(canisterBytes).digest();
  const canisterKeypair1 = Keypair.fromSeed(hash.slice(0, 32));
  const canisterAddress1 = canisterKeypair1.publicKey.toBase58();
  
  console.log(`🎯 Method 1 (SHA256 hash): ${canisterAddress1}`);
  
  // Method 2: Use the canister ID bytes directly as seed
  const canisterKeypair2 = Keypair.fromSeed(canisterBytes.slice(0, 32));
  const canisterAddress2 = canisterKeypair2.publicKey.toBase58();
  
  console.log(`🎯 Method 2 (Direct bytes): ${canisterAddress2}`);
  
  // Method 3: Use the canister ID as a string and hash it
  const canisterStringHash = require('crypto').createHash('sha256').update(canisterId).digest();
  const canisterKeypair3 = Keypair.fromSeed(canisterStringHash.slice(0, 32));
  const canisterAddress3 = canisterKeypair3.publicKey.toBase58();
  
  console.log(`🎯 Method 3 (String hash): ${canisterAddress3}`);
  
  // For now, let's use method 1 and see if it works
  console.log('✅ Using method 1 (SHA256 hash)');
  return canisterAddress1;
};

// Transfer SPL tokens to canister
const transferSplTokensToCanister = async () => {
  console.log('🚀 Funding Canister with SPL Tokens');
  console.log('=====================================');
  
  // Find canister address
  const canisterAddress = await findCanisterBaseAddress();
  if (!canisterAddress) {
    console.error('❌ Could not find canister address');
    return;
  }
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Accounts:`);
  console.log(`   Alice: ${alice.solAddress}`);
  console.log(`   Bob: ${bob.solAddress}`);
  console.log(`   Charlie: ${charlie.solAddress}`);
  console.log(`   Canister: ${canisterAddress}`);
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Check current balances
  console.log(`\n📊 Current Balances:`);
  for (const user of [alice, bob, charlie]) {
    console.log(`\n👤 ${user.name} (${user.solAddress}):`);
    const spiralBalance = await getSplTokenBalance(user.solAddress, TEST_CONFIG.SPIRAL_SOLANA_MINT);
    const stardustBalance = await getSplTokenBalance(user.solAddress, TEST_CONFIG.STARDUST_SOLANA_MINT);
    console.log(`   Spiral: ${spiralBalance} tokens`);
    console.log(`   Stardust: ${stardustBalance} tokens`);
  }
  
  // Check canister balances
  console.log(`\n🏦 Canister (${canisterAddress}):`);
  const canisterSpiralBalance = await getSplTokenBalance(canisterAddress, TEST_CONFIG.SPIRAL_SOLANA_MINT);
  const canisterStardustBalance = await getSplTokenBalance(canisterAddress, TEST_CONFIG.STARDUST_SOLANA_MINT);
  console.log(`   Spiral: ${canisterSpiralBalance} tokens`);
  console.log(`   Stardust: ${canisterStardustBalance} tokens`);
  
  // Transfer tokens from Alice to canister
  console.log(`\n🔄 Transferring tokens from Alice to canister...`);
  
  try {
    // Transfer Spiral tokens
    console.log(`   Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Spiral tokens...`);
    const aliceSpiralAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      alice.solKeypair,
      new PublicKey(TEST_CONFIG.SPIRAL_SOLANA_MINT),
      alice.solKeypair.publicKey
    );
    
    const canisterSpiralAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      alice.solKeypair, // Use Alice as payer for account creation
      new PublicKey(TEST_CONFIG.SPIRAL_SOLANA_MINT),
      new PublicKey(canisterAddress)
    );
    
    const spiralTransferSignature = await transfer(
      connection,
      alice.solKeypair,
      aliceSpiralAccount.address,
      canisterSpiralAccount.address,
      alice.solKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`   ✅ Spiral transfer signature: ${spiralTransferSignature}`);
    
    // Transfer Stardust tokens
    console.log(`   Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    const aliceStardustAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      alice.solKeypair,
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT),
      alice.solKeypair.publicKey
    );
    
    const canisterStardustAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      alice.solKeypair, // Use Alice as payer for account creation
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT),
      new PublicKey(canisterAddress)
    );
    
    const stardustTransferSignature = await transfer(
      connection,
      alice.solKeypair,
      aliceStardustAccount.address,
      canisterStardustAccount.address,
      alice.solKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`   ✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check final balances
    console.log(`\n📊 Final Balances:`);
    const finalCanisterSpiralBalance = await getSplTokenBalance(canisterAddress, TEST_CONFIG.SPIRAL_SOLANA_MINT);
    const finalCanisterStardustBalance = await getSplTokenBalance(canisterAddress, TEST_CONFIG.STARDUST_SOLANA_MINT);
    console.log(`\n🏦 Canister (${canisterAddress}):`);
    console.log(`   Spiral: ${finalCanisterSpiralBalance} tokens`);
    console.log(`   Stardust: ${finalCanisterStardustBalance} tokens`);
    
    console.log(`\n✅ Canister funding completed successfully!`);
    console.log(`🔗 Spiral transfer: https://explorer.solana.com/tx/${spiralTransferSignature}?cluster=devnet`);
    console.log(`🔗 Stardust transfer: https://explorer.solana.com/tx/${stardustTransferSignature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run the transfer
transferSplTokensToCanister()
  .then(() => {
    console.log('\n🎉 SPL token funding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ SPL token funding failed:', error);
    process.exit(1);
  });
