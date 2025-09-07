#!/usr/bin/env node

const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer, getAccount } = require('@solana/spl-token');
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

async function fundCorrectStardustAccount() {
  console.log('🚀 Funding Correct Stardust Token Account');
  console.log('=========================================');
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Load the correct deployer keypair
  const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
  const deployerKeypairData = JSON.parse(fs.readFileSync(deployerKeypairPath, 'utf8'));
  const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
  
  console.log(`🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
  console.log(`🎯 Correct Stardust account: ${TEST_CONFIG.CORRECT_STARDUST_ACCOUNT}`);
  
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
    
    // Create the account using getOrCreateAssociatedTokenAccount
    console.log(`🏗️  Creating Stardust token account...`);
    const stardustAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      deployerKeypair, // payer
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT), // mint
      new PublicKey(TEST_CONFIG.CANISTER_BASE_ADDRESS) // owner (canister)
    );
    
    console.log(`✅ Created Stardust token account: ${stardustAccount.address.toBase58()}`);
    
    // Check if the created account matches what we expect
    if (stardustAccount.address.toBase58() === TEST_CONFIG.CORRECT_STARDUST_ACCOUNT) {
      console.log(`🎉 Perfect! Account matches expected address`);
    } else {
      console.log(`⚠️  Account mismatch! Expected: ${TEST_CONFIG.CORRECT_STARDUST_ACCOUNT}`);
      console.log(`   Created: ${stardustAccount.address.toBase58()}`);
    }
    
    // Transfer Stardust tokens from deployer to canister
    console.log(`💰 Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    const stardustTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT),
      stardustAccount.address,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check the final balance
    const finalBalance = await connection.getTokenAccountBalance(stardustAccount.address);
    console.log(`📊 Final Stardust balance: ${finalBalance.value.amount} tokens`);
    
    console.log(`\n🎉 Stardust account funding completed!`);
    console.log(`🔗 Transfer: https://explorer.solana.com/tx/${stardustTransferSignature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Failed to fund Stardust account:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
fundCorrectStardustAccount()
  .then(() => {
    console.log('\n✅ Stardust account funding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Stardust account funding failed:', error);
    process.exit(1);
  });
