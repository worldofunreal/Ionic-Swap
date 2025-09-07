#!/usr/bin/env node

const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const fs = require('fs');

// Configuration
const TEST_CONFIG = {
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25V2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_TO_TRANSFER: 1000000000, // 1 billion tokens
  DEPLOYER_STARDUST_TOKEN_ACCOUNT: 'DSA6NS3N1QGxhzQbTs6YD99XeyPJubiqvCw6A1GQCqwm',
  CANISTER_BASE_ADDRESS: 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ',
  EXPECTED_STARDUST_ACCOUNT: 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av'
};

async function createStardustAccount() {
  console.log('🚀 Creating Canister Stardust Token Account');
  console.log('==========================================');
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Load the correct deployer keypair
  const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
  const deployerKeypairData = JSON.parse(fs.readFileSync(deployerKeypairPath, 'utf8'));
  const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
  
  console.log(`🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
  console.log(`🎯 Expected Stardust account: ${TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT}`);
  
  try {
    // Create the canister's Stardust token account
    console.log(`🏗️  Creating canister's Stardust token account...`);
    const canisterStardustAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      deployerKeypair, // Use deployer as payer for account creation
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT),
      new PublicKey(TEST_CONFIG.CANISTER_BASE_ADDRESS) // Canister base address
    );
    
    console.log(`✅ Created canister Stardust token account: ${canisterStardustAccount.address.toBase58()}`);
    
    // Check if the created account matches what the backend expects
    if (canisterStardustAccount.address.toBase58() === TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT) {
      console.log(`🎉 Perfect! Account matches backend expectation`);
    } else {
      console.log(`⚠️  Account mismatch! Backend expects: ${TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT}`);
      console.log(`   Created account: ${canisterStardustAccount.address.toBase58()}`);
    }
    
    // Transfer Stardust tokens from deployer to canister
    console.log(`💰 Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    const stardustTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT),
      canisterStardustAccount.address,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check the final balance
    const finalBalance = await connection.getTokenAccountBalance(canisterStardustAccount.address);
    console.log(`📊 Final Canister Stardust balance: ${finalBalance.value.amount} tokens`);
    
    console.log(`\n🎉 Stardust account creation and funding completed!`);
    console.log(`🔗 Transfer: https://explorer.solana.com/tx/${stardustTransferSignature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Failed to create Stardust account:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
createStardustAccount()
  .then(() => {
    console.log('\n✅ Stardust account creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Stardust account creation failed:', error);
    process.exit(1);
  });
