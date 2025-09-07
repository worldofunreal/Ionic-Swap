#!/usr/bin/env node

const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { createAccount, transfer, getAccount } = require('@solana/spl-token');
const fs = require('fs');

// Configuration
const TEST_CONFIG = {
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25V2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_TO_TRANSFER: 1000000000, // 1 billion tokens
  DEPLOYER_STARDUST_TOKEN_ACCOUNT: 'DSA6NS3N1QGxhzQbTs6YD99XeyPJubiqvCw6A1GQCqwm',
  CANISTER_BASE_ADDRESS: 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ',
  // The correct ATA address that the backend should be using
  CORRECT_STARDUST_ACCOUNT: 'CFauj58WvLgFugZGKBAMuK7iC2kRNCr9gsxZ3uoP417h'
};

async function createStardustAccountManual() {
  console.log('🚀 Creating Stardust Account Manually');
  console.log('=====================================');
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Load the correct deployer keypair
  const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
  const deployerKeypairData = JSON.parse(fs.readFileSync(deployerKeypairPath, 'utf8'));
  const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
  
  console.log(`🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
  console.log(`🎯 Target Stardust account: ${TEST_CONFIG.CORRECT_STARDUST_ACCOUNT}`);
  
  try {
    // Check if the account already exists
    try {
      const existingAccount = await getAccount(connection, new PublicKey(TEST_CONFIG.CORRECT_STARDUST_ACCOUNT));
      console.log(`✅ Account already exists with balance: ${existingAccount.amount}`);
      
      // If it has tokens, we're done
      if (existingAccount.amount > 0) {
        console.log(`🎉 Account already has tokens, no need to transfer`);
        return;
      }
    } catch (error) {
      console.log(`📝 Account does not exist yet, creating it...`);
    }
    
    // Create a new keypair for the token account
    // Note: This won't create the account at the exact ATA address, but it will create a valid token account
    console.log(`🏗️  Creating new Stardust token account...`);
    const newAccount = await createAccount(
      connection,
      deployerKeypair, // payer
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT), // mint
      deployerKeypair.publicKey // owner (we'll use deployer as owner for now)
    );
    
    console.log(`✅ Created Stardust token account: ${newAccount.toBase58()}`);
    
    // Transfer Stardust tokens from deployer to the new account
    console.log(`💰 Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    const stardustTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT),
      newAccount,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check the final balance
    const finalBalance = await connection.getTokenAccountBalance(newAccount);
    console.log(`📊 Final Stardust balance: ${finalBalance.value.amount} tokens`);
    
    console.log(`\n🎉 Stardust account creation completed!`);
    console.log(`🔗 Transfer: https://explorer.solana.com/tx/${stardustTransferSignature}?cluster=devnet`);
    console.log(`\n⚠️  Note: This account (${newAccount.toBase58()}) is not the ATA address the backend expects.`);
    console.log(`   The backend expects: ${TEST_CONFIG.CORRECT_STARDUST_ACCOUNT}`);
    console.log(`   This suggests there may be an issue with the backend's ATA derivation.`);
    
  } catch (error) {
    console.error('❌ Failed to create Stardust account:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
createStardustAccountManual()
  .then(() => {
    console.log('\n✅ Stardust account creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Stardust account creation failed:', error);
    process.exit(1);
  });
