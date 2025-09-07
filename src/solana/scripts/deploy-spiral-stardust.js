const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { createMint, createAccount, mintTo, getAccount } = require('@solana/spl-token');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to deploy to (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🚀 Deploying Spiral & Stardust Tokens on Solana');
  console.log('===============================================');

  // Network configuration
  const network = options.network;
  const endpoint = network === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.testnet.solana.com';
  
  console.log(`📡 Network: ${network} (${endpoint})`);

  // Load keypair from .env
  require('dotenv').config();
  
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env file');
    console.log('💡 Run: npm run generate:deployer');
    process.exit(1);
  }
  
  // Parse the private key from .env
  const privateKeyArray = process.env.DEPLOYER_PRIVATE_KEY.split(',').map(Number);
  const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

  console.log(`👤 Deployer: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 1e9) { // Need at least 1 SOL for token creation
    console.error('❌ Insufficient balance for token creation. Need at least 1 SOL');
    console.log('💡 Try airdropping more SOL: solana airdrop 2');
    process.exit(1);
  }

  const tokenInfo = {
    network,
    deployer: keypair.publicKey.toString(),
    timestamp: new Date().toISOString(),
    tokens: {}
  };

  // Create Spiral Token (SPIRAL)
  console.log('\n🪙 Creating Spiral Token (SPIRAL)...');
  try {
    const spiralMint = await createMint(
      connection,
      keypair,
      keypair.publicKey, // mint authority
      keypair.publicKey, // freeze authority
      8 // decimals
    );

    console.log(`✅ Spiral Token mint created: ${spiralMint.toString()}`);

    // Create associated token account for the deployer
    const spiralTokenAccount = await createAccount(
      connection,
      keypair,
      spiralMint,
      keypair.publicKey
    );

    console.log(`✅ Spiral Token account created: ${spiralTokenAccount.toString()}`);

    // Mint initial supply (100,000,000 tokens with 8 decimals)
    const initialSupply = 100000000 * Math.pow(10, 8); // 100M tokens
    await mintTo(
      connection,
      keypair,
      spiralMint,
      spiralTokenAccount,
      keypair,
      initialSupply
    );

    console.log(`✅ Spiral Token minted: ${initialSupply / Math.pow(10, 8)} SPIRAL`);

    tokenInfo.tokens.spiral = {
      name: 'Spiral',
      symbol: 'SPIRAL',
      mint: spiralMint.toString(),
      tokenAccount: spiralTokenAccount.toString(),
      decimals: 8,
      initialSupply: initialSupply,
      initialSupplyFormatted: '100,000,000'
    };

  } catch (error) {
    console.error('❌ Failed to create Spiral Token:', error.message);
    process.exit(1);
  }

  // Create Stardust Token (STD)
  console.log('\n🪙 Creating Stardust Token (STD)...');
  try {
    const stardustMint = await createMint(
      connection,
      keypair,
      keypair.publicKey, // mint authority
      keypair.publicKey, // freeze authority
      8 // decimals
    );

    console.log(`✅ Stardust Token mint created: ${stardustMint.toString()}`);

    // Create associated token account for the deployer
    const stardustTokenAccount = await createAccount(
      connection,
      keypair,
      stardustMint,
      keypair.publicKey
    );

    console.log(`✅ Stardust Token account created: ${stardustTokenAccount.toString()}`);

    // Mint initial supply (100,000,000 tokens with 8 decimals)
    const initialSupply = 100000000 * Math.pow(10, 8); // 100M tokens
    await mintTo(
      connection,
      keypair,
      stardustMint,
      stardustTokenAccount,
      keypair,
      initialSupply
    );

    console.log(`✅ Stardust Token minted: ${initialSupply / Math.pow(10, 8)} STD`);

    tokenInfo.tokens.stardust = {
      name: 'Stardust',
      symbol: 'STD',
      mint: stardustMint.toString(),
      tokenAccount: stardustTokenAccount.toString(),
      decimals: 8,
      initialSupply: initialSupply,
      initialSupplyFormatted: '100,000,000'
    };

  } catch (error) {
    console.error('❌ Failed to create Stardust Token:', error.message);
    process.exit(1);
  }

  // Save token info
  fs.writeFileSync(
    path.join(__dirname, '../spiral-stardust-tokens.json'),
    JSON.stringify(tokenInfo, null, 2)
  );

  console.log('\n🎉 Token Deployment Complete!');
  console.log('==============================');
  console.log('');
  console.log('📋 Deployment Summary:');
  console.log(`   Network: ${network}`);
  console.log(`   Deployer: ${keypair.publicKey.toString()}`);
  console.log('');
  console.log('🪙 Spiral Token (SPIRAL):');
  console.log(`   Mint: ${tokenInfo.tokens.spiral.mint}`);
  console.log(`   Token Account: ${tokenInfo.tokens.spiral.tokenAccount}`);
  console.log(`   Initial Supply: ${tokenInfo.tokens.spiral.initialSupplyFormatted} SPIRAL`);
  console.log(`   Decimals: ${tokenInfo.tokens.spiral.decimals}`);
  console.log('');
  console.log('🪙 Stardust Token (STD):');
  console.log(`   Mint: ${tokenInfo.tokens.stardust.mint}`);
  console.log(`   Token Account: ${tokenInfo.tokens.stardust.tokenAccount}`);
  console.log(`   Initial Supply: ${tokenInfo.tokens.stardust.initialSupplyFormatted} STD`);
  console.log(`   Decimals: ${tokenInfo.tokens.stardust.decimals}`);
  console.log('');
  console.log('🔗 Explorer URLs:');
  console.log(`   Spiral Token: https://explorer.solana.com/address/${tokenInfo.tokens.spiral.mint}?cluster=${network}`);
  console.log(`   Stardust Token: https://explorer.solana.com/address/${tokenInfo.tokens.stardust.mint}?cluster=${network}`);
  console.log('');
  console.log('📝 Token info saved to spiral-stardust-tokens.json');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Update backend canister with these token addresses');
  console.log('   2. Test cross-chain token transfers between ICP and Solana');
  console.log('   3. Integrate with token program for secure transfers');
}

main().catch(console.error);
