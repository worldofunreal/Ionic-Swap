#!/usr/bin/env node

const { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint, createAccount, mintTo, getAccount, transfer, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const bip39 = require('bip39');

// Test configuration
const TEST_CONFIG = {
  SPIRAL_SOLANA_MINT: 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
  STARDUST_SOLANA_MINT: 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  TOKENS_PER_USER: 1000000000, // 10 tokens (8 decimals)
  SOL_PER_USER: 0.1, // 0.1 SOL for transaction fees
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

// Get SOL balance
const getSolBalance = async (publicKey) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    return 0;
  }
};

// Get SPL token balance
const getSplTokenBalance = async (publicKey, mintAddress) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    const tokenAccount = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(publicKey)
    );
    
    const accountInfo = await getAccount(connection, tokenAccount);
    return BigInt(accountInfo.amount.toString());
  } catch (error) {
    return BigInt(0);
  }
};

// Request SOL from faucet
const requestSolFromFaucet = async (publicKey) => {
  try {
    const response = await fetch('https://api.devnet.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'requestAirdrop',
        params: [publicKey, LAMPORTS_PER_SOL * 2], // Request 2 SOL
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.result;
  } catch (error) {
    console.error(`❌ Failed to request SOL from faucet:`, error);
    throw error;
  }
};

// Transfer SOL
const transferSol = async (fromKeypair, toPublicKey, amount) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: new PublicKey(toPublicKey),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    return signature;
  } catch (error) {
    console.error(`❌ Failed to transfer SOL:`, error);
    throw error;
  }
};

// Transfer SPL tokens
const transferSplTokens = async (fromKeypair, toPublicKey, mintAddress, amount) => {
  try {
    const connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
    
    // Get or create source token account
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      new PublicKey(mintAddress),
      fromKeypair.publicKey
    );
    
    // Get or create destination token account
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      new PublicKey(mintAddress),
      new PublicKey(toPublicKey)
    );
    
    // Transfer tokens
    const transferTx = new Transaction().add(
      transfer(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromKeypair.publicKey,
        amount
      )
    );
    
    const signature = await sendAndConfirmTransaction(connection, transferTx, [fromKeypair]);
    return signature;
  } catch (error) {
    console.error(`❌ Failed to transfer SPL tokens:`, error);
    throw error;
  }
};

// Main function
const fundSolanaTestAccounts = async () => {
  console.log('🚀 Starting Solana Account Funding');
  console.log('==================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Accounts:`);
  console.log(`   Alice: ${alice.solAddress}`);
  console.log(`   Bob: ${bob.solAddress}`);
  console.log(`   Charlie: ${charlie.solAddress}`);
  
  // Create a source keypair for funding
  const sourceKeypair = Keypair.generate();
  const sourceAddress = sourceKeypair.publicKey.toBase58();
  console.log(`\n💰 Source Account: ${sourceAddress}`);
  
  // Request SOL from faucet for source account
  console.log(`\n🚰 Requesting SOL from faucet for source account...`);
  try {
    const airdropSignature = await requestSolFromFaucet(sourceAddress);
    console.log(`   ✅ Airdrop signature: ${airdropSignature}`);
    
    // Wait a bit for the airdrop to be processed
    console.log(`   ⏳ Waiting for airdrop to be processed...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const sourceBalance = await getSolBalance(sourceAddress);
    console.log(`   💰 Source account balance: ${sourceBalance} SOL`);
    
    if (sourceBalance < 1) {
      throw new Error('Insufficient SOL in source account');
    }
  } catch (error) {
    console.error(`❌ Failed to get SOL from faucet:`, error);
    console.log(`\n🔗 Manual Steps:`);
    console.log(`   1. Go to https://faucet.solana.com/`);
    console.log(`   2. Enter address: ${sourceAddress}`);
    console.log(`   3. Request 2 SOL`);
    console.log(`   4. Run this script again`);
    return;
  }
  
  const users = [alice, bob, charlie];
  const tokens = [
    { name: 'Spiral', mint: TEST_CONFIG.SPIRAL_SOLANA_MINT },
    { name: 'Stardust', mint: TEST_CONFIG.STARDUST_SOLANA_MINT }
  ];
  
  // Check initial balances
  console.log(`\n📊 Initial Balances:`);
  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.solAddress}):`);
    const solBalance = await getSolBalance(user.solAddress);
    console.log(`   SOL: ${solBalance}`);
    for (const token of tokens) {
      const balance = await getSplTokenBalance(user.solAddress, token.mint);
      console.log(`   ${token.name}: ${balance.toString()} tokens`);
    }
  }
  
  // Transfer SOL to each user
  console.log(`\n💰 Transferring ${TEST_CONFIG.SOL_PER_USER} SOL to each user...`);
  for (const user of users) {
    try {
      const signature = await transferSol(sourceKeypair, user.solAddress, TEST_CONFIG.SOL_PER_USER);
      console.log(`   ✅ Transferred SOL to ${user.name}: ${signature}`);
    } catch (error) {
      console.error(`   ❌ Failed to transfer SOL to ${user.name}:`, error);
    }
  }
  
  // Wait for SOL transfers to be processed
  console.log(`\n⏳ Waiting for SOL transfers to be processed...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check SOL balances after transfer
  console.log(`\n📊 SOL Balances After Transfer:`);
  for (const user of users) {
    const solBalance = await getSolBalance(user.solAddress);
    console.log(`   ${user.name}: ${solBalance} SOL`);
  }
  
  // Now we need to mint/transfer SPL tokens
  // For now, let's check if the source account has any SPL tokens
  console.log(`\n🔍 Checking source account SPL token balances...`);
  for (const token of tokens) {
    const balance = await getSplTokenBalance(sourceAddress, token.mint);
    console.log(`   ${token.name}: ${balance.toString()} tokens`);
  }
  
  console.log(`\n⚠️  Note: SPL token transfers require the source account to have tokens`);
  console.log(`   If the source account has 0 tokens, you'll need to:`);
  console.log(`   1. Get SPL tokens from the token mint authority`);
  console.log(`   2. Or use a different funded account`);
  
  // Try to transfer SPL tokens if source has them
  for (const user of users) {
    for (const token of tokens) {
      try {
        const sourceBalance = await getSplTokenBalance(sourceAddress, token.mint);
        if (sourceBalance > BigInt(TEST_CONFIG.TOKENS_PER_USER)) {
          const signature = await transferSplTokens(
            sourceKeypair, 
            user.solAddress, 
            token.mint, 
            BigInt(TEST_CONFIG.TOKENS_PER_USER)
          );
          console.log(`   ✅ Transferred ${token.name} to ${user.name}: ${signature}`);
        } else {
          console.log(`   ⚠️  Insufficient ${token.name} balance in source account`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to transfer ${token.name} to ${user.name}:`, error);
      }
    }
  }
  
  // Final balance check
  console.log(`\n📊 Final Balances:`);
  for (const user of users) {
    console.log(`\n👤 ${user.name} (${user.solAddress}):`);
    const solBalance = await getSolBalance(user.solAddress);
    console.log(`   SOL: ${solBalance}`);
    for (const token of tokens) {
      const balance = await getSplTokenBalance(user.solAddress, token.mint);
      console.log(`   ${token.name}: ${balance.toString()} tokens`);
    }
  }
  
  console.log(`\n✅ Solana account funding completed!`);
};

// Run the funding
fundSolanaTestAccounts()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Funding failed:', error);
    process.exit(1);
  });
