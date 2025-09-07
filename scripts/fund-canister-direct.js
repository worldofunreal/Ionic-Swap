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
  TOKENS_TO_TRANSFER: 1000000000, // 10 tokens (8 decimals)
  DEPLOYER_ADDRESS: '6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES',
  DEPLOYER_SPIRAL_TOKEN_ACCOUNT: 'FjUk9eQYP57yodqaHUx21rdKPQHBfDdrPiPVhHuQKfT8',
  DEPLOYER_STARDUST_TOKEN_ACCOUNT: 'DSA6NS3N1QGxhzQbTs6YD99XeyPJubiqvCw6A1GQCqwm',
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

// Transfer SPL tokens directly to canister's token accounts
const transferSplTokensToCanister = async () => {
  console.log('🚀 Funding Canister Token Accounts Directly');
  console.log('============================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  
  console.log(`👤 Alice: ${alice.solAddress}`);
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // We know from the logs that the canister's base address is BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ
  // Let's transfer tokens to the canister's token accounts
  
  console.log(`\n🔄 Transferring tokens from Alice to canister's token accounts...`);
  
  try {
    // Use the deployer's token accounts which have all the tokens
    console.log(`\n📊 Using deployer's token accounts to fund canister...`);
    console.log(`   Deployer: ${TEST_CONFIG.DEPLOYER_ADDRESS}`);
    console.log(`   Deployer Spiral account: ${TEST_CONFIG.DEPLOYER_SPIRAL_TOKEN_ACCOUNT}`);
    console.log(`   Deployer Stardust account: ${TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT}`);
    
    // Check deployer's balances
    try {
      const deployerSpiralBalance = await connection.getTokenAccountBalance(new PublicKey(TEST_CONFIG.DEPLOYER_SPIRAL_TOKEN_ACCOUNT));
      const deployerStardustBalance = await connection.getTokenAccountBalance(new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT));
      console.log(`   Deployer Spiral balance: ${deployerSpiralBalance.value.amount} tokens`);
      console.log(`   Deployer Stardust balance: ${deployerStardustBalance.value.amount} tokens`);
    } catch (error) {
      console.log(`   ⚠️  Could not check deployer's balances: ${error.message}`);
    }
    
    // Use the exact token account addresses that the backend is using
    const canisterSpiralTokenAccount = '2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK'; // From our script
    const canisterStardustTokenAccount = 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av'; // From backend logs
    
    // Transfer both Spiral and Stardust tokens to canister
    console.log(`   Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Spiral tokens...`);
    
    // Use the exact canister token account addresses
    console.log(`   Using canister Spiral token account: ${canisterSpiralTokenAccount}`);
    
    // Check if the canister's Spiral account has any tokens
    try {
      const canisterSpiralBalance = await connection.getTokenAccountBalance(new PublicKey(canisterSpiralTokenAccount));
      console.log(`   📊 Canister Spiral balance: ${canisterSpiralBalance.value.amount} tokens`);
    } catch (error) {
      console.log(`   📊 Canister Spiral account exists but has no tokens yet`);
    }
    
    // Load the deployer's keypair (the correct one that matches the token deployer address)
    const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
    const deployerKeypairData = JSON.parse(require('fs').readFileSync(deployerKeypairPath, 'utf8'));
    const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
    
    console.log(`   🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
    
    // Create the canister's Spiral token account first
    console.log(`   🏗️  Creating canister's Spiral token account...`);
    const canisterSpiralAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      deployerKeypair, // Use deployer as payer for account creation
      new PublicKey(TEST_CONFIG.SPIRAL_SOLANA_MINT),
      new PublicKey('BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ') // Canister base address
    );
    
    console.log(`   ✅ Created canister Spiral token account: ${canisterSpiralAccount.address.toBase58()}`);
    
    // Transfer Spiral tokens from deployer to canister
    const spiralTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_SPIRAL_TOKEN_ACCOUNT),
      canisterSpiralAccount.address,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`   ✅ Spiral transfer signature: ${spiralTransferSignature}`);
    
    console.log(`   Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    
    // Use the exact canister token account addresses
    console.log(`   Using canister Stardust token account: ${canisterStardustTokenAccount}`);
    
    // Check if the canister's Stardust account has any tokens
    try {
      const canisterStardustBalance = await connection.getTokenAccountBalance(new PublicKey(canisterStardustTokenAccount));
      console.log(`   📊 Canister Stardust balance: ${canisterStardustBalance.value.amount} tokens`);
    } catch (error) {
      console.log(`   📊 Canister Stardust account exists but has no tokens yet`);
    }
    
    // Create the canister's Stardust token account first
    console.log(`   🏗️  Creating canister's Stardust token account...`);
    const canisterStardustAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      deployerKeypair, // Use deployer as payer for account creation
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT),
      new PublicKey('BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ') // Canister base address
    );
    
    console.log(`   ✅ Created canister Stardust token account: ${canisterStardustAccount.address.toBase58()}`);
    
    // Transfer Stardust tokens from deployer to canister
    const stardustTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT),
      canisterStardustAccount.address,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`   ✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check the canister's token account balances
    try {
      const canisterSpiralBalance = await connection.getTokenAccountBalance(canisterSpiralAccount.address);
      const canisterStardustBalance = await connection.getTokenAccountBalance(canisterStardustAccount.address);
      console.log(`   📊 Final Canister Spiral balance: ${canisterSpiralBalance.value.amount} tokens`);
      console.log(`   📊 Final Canister Stardust balance: ${canisterStardustBalance.value.amount} tokens`);
    } catch (error) {
      console.log(`   ⚠️  Could not check final canister balances: ${error.message}`);
    }
    
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
