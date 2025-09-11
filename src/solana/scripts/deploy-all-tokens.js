const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { createMint, createAccount, mintTo, getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to deploy to (devnet, testnet)', 'devnet')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🚀 Deploying All Cryptocurrency SPL Tokens on Solana');
  console.log('==================================================');

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

  if (balance < 5e9) { // Need at least 5 SOL for multiple token creation
    console.error('❌ Insufficient balance for token creation. Need at least 5 SOL');
    console.log('💡 Try airdropping more SOL: solana airdrop 5');
    process.exit(1);
  }

  // Define all tokens to deploy
  const tokens = [
    { name: 'Bitcoin', symbol: 'BTC', decimals: 8, supply: 21000000 },
    { name: 'Ethereum', symbol: 'ETH', decimals: 18, supply: 120000000 },
    { name: 'XRP', symbol: 'XRP', decimals: 6, supply: 100000000000 },
    { name: 'Tether', symbol: 'USDT', decimals: 6, supply: 1000000000000 },
    { name: 'BNB', symbol: 'BNB', decimals: 18, supply: 200000000 },
    { name: 'USD Coin', symbol: 'USDC', decimals: 6, supply: 1000000000000 },
    { name: 'Dogecoin', symbol: 'DOGE', decimals: 8, supply: 1000000000000 },
    { name: 'Cardano', symbol: 'ADA', decimals: 6, supply: 45000000000 },
    { name: 'TRON', symbol: 'TRX', decimals: 6, supply: 1000000000000 },
  ];

  const tokenInfo = {
    network,
    deployer: keypair.publicKey.toString(),
    timestamp: new Date().toISOString(),
    tokens: {}
  };

  // Deploy each token
  for (const token of tokens) {
    console.log(`\n🪙 Creating ${token.name} Token (${token.symbol})...`);
    
    try {
      // Create mint
      const mint = await createMint(
        connection,
        keypair,
        keypair.publicKey, // mint authority
        keypair.publicKey, // freeze authority
        token.decimals
      );

      console.log(`   ✅ ${token.symbol} mint created: ${mint.toString()}`);

      // Create associated token account for the deployer
      const tokenAccount = await createAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
      );

      console.log(`   ✅ ${token.symbol} token account created: ${tokenAccount.toString()}`);

      // Mint initial supply (1000 tokens for testing)
      const initialSupply = 1000 * Math.pow(10, token.decimals);
      await mintTo(
        connection,
        keypair,
        mint,
        tokenAccount,
        keypair,
        initialSupply
      );

      const formattedSupply = initialSupply / Math.pow(10, token.decimals);
      console.log(`   ✅ ${token.symbol} minted: ${formattedSupply} ${token.symbol}`);

      tokenInfo.tokens[token.symbol.toLowerCase()] = {
        name: token.name,
        symbol: token.symbol,
        mint: mint.toString(),
        tokenAccount: tokenAccount.toString(),
        decimals: token.decimals,
        initialSupply: initialSupply,
        initialSupplyFormatted: formattedSupply.toLocaleString(),
        maxSupply: token.supply,
        maxSupplyFormatted: token.supply.toLocaleString()
      };

      // Wait a bit between deployments to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ Failed to create ${token.name} Token:`, error.message);
    }
  }

  // Save token info
  const outputFile = path.join(__dirname, '../all-tokens-solana.json');
  fs.writeFileSync(outputFile, JSON.stringify(tokenInfo, null, 2));

  console.log('\n🎉 All Token Deployments Complete!');
  console.log('==================================');
  console.log('');
  console.log('📋 Deployment Summary:');
  console.log(`   Network: ${network}`);
  console.log(`   Deployer: ${keypair.publicKey.toString()}`);
  console.log(`   Tokens Deployed: ${Object.keys(tokenInfo.tokens).length}`);
  console.log('');
  
  console.log('🪙 Token Addresses:');
  Object.entries(tokenInfo.tokens).forEach(([key, token]) => {
    console.log(`   ${token.symbol}: ${token.mint}`);
  });

  console.log('');
  console.log('🔗 Explorer URLs:');
  Object.entries(tokenInfo.tokens).forEach(([key, token]) => {
    console.log(`   ${token.symbol}: https://explorer.solana.com/address/${token.mint}?cluster=${network}`);
  });

  console.log('');
  console.log(`📝 Token info saved to: ${outputFile}`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Update backend canister with these token addresses');
  console.log('   2. Test cross-chain token transfers between ICP and Solana');
  console.log('   3. Integrate with token program for secure transfers');
}

main().catch(console.error);
