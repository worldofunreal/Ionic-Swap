#!/usr/bin/env node

const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { createAccount, transfer, getAccount } = require('@solana/spl-token');
const { PublicKey: SolanaPublicKey } = require('@solana/web3.js');
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

// SPL Token program ID
const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
// Associated Token Program ID
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Function to derive ATA address (same as backend)
function getAssociatedTokenAddress(walletAddress, mintAddress) {
  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mintAddress);
  
  // Find the associated token account address
  const [ataAddress] = PublicKey.findProgramAddressSync(
    [
      walletPubkey.toBuffer(),
      SPL_TOKEN_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  return ataAddress;
}

async function createExactStardustAccount() {
  console.log('🚀 Creating Exact Stardust Token Account');
  console.log('=======================================');
  
  const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
  
  // Load the correct deployer keypair
  const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
  const deployerKeypairData = JSON.parse(fs.readFileSync(deployerKeypairPath, 'utf8'));
  const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
  
  console.log(`🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
  console.log(`🎯 Expected Stardust account: ${TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT}`);
  
  try {
    // Derive the ATA address using the same method as the backend
    const derivedAtaAddress = getAssociatedTokenAddress(
      TEST_CONFIG.CANISTER_BASE_ADDRESS,
      TEST_CONFIG.STARDUST_SOLANA_MINT
    );
    
    console.log(`🔍 Derived ATA address: ${derivedAtaAddress.toBase58()}`);
    
    // Check if the derived address matches what the backend expects
    if (derivedAtaAddress.toBase58() === TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT) {
      console.log(`🎉 Perfect! Derived address matches backend expectation`);
    } else {
      console.log(`⚠️  Address mismatch! Backend expects: ${TEST_CONFIG.EXPECTED_STARDUST_ACCOUNT}`);
      console.log(`   Derived address: ${derivedAtaAddress.toBase58()}`);
      console.log(`   This suggests the backend is using a different canister address or derivation method`);
    }
    
    // Check if the account already exists
    try {
      const existingAccount = await getAccount(connection, derivedAtaAddress);
      console.log(`✅ Account already exists with balance: ${existingAccount.amount}`);
      return;
    } catch (error) {
      console.log(`📝 Account does not exist yet, creating it...`);
    }
    
    // Create the account at the exact derived address
    console.log(`🏗️  Creating Stardust token account at exact address...`);
    const newAccount = await createAccount(
      connection,
      deployerKeypair, // payer
      new PublicKey(TEST_CONFIG.STARDUST_SOLANA_MINT), // mint
      derivedAtaAddress, // account (the exact address we want)
      deployerKeypair // owner
    );
    
    console.log(`✅ Created Stardust token account: ${newAccount.toBase58()}`);
    
    // Transfer Stardust tokens from deployer to canister
    console.log(`💰 Transferring ${TEST_CONFIG.TOKENS_TO_TRANSFER} Stardust tokens...`);
    const stardustTransferSignature = await transfer(
      connection,
      deployerKeypair,
      new PublicKey(TEST_CONFIG.DEPLOYER_STARDUST_TOKEN_ACCOUNT),
      derivedAtaAddress,
      deployerKeypair,
      TEST_CONFIG.TOKENS_TO_TRANSFER
    );
    
    console.log(`✅ Stardust transfer signature: ${stardustTransferSignature}`);
    
    // Check the final balance
    const finalBalance = await connection.getTokenAccountBalance(derivedAtaAddress);
    console.log(`📊 Final Canister Stardust balance: ${finalBalance.value.amount} tokens`);
    
    console.log(`\n🎉 Stardust account creation and funding completed!`);
    console.log(`🔗 Transfer: https://explorer.solana.com/tx/${stardustTransferSignature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Failed to create Stardust account:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
createExactStardustAccount()
  .then(() => {
    console.log('\n✅ Stardust account creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Stardust account creation failed:', error);
    process.exit(1);
  });
