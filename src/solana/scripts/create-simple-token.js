const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout } = require('@solana/spl-token');
const { createInitializeMintInstruction, createAssociatedTokenAccountInstruction, createMintToInstruction, getAssociatedTokenAddress, createInitializeMint2Instruction } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to deploy to (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .option('--name <name>', 'Token name', 'Ionic Token')
  .option('--symbol <symbol>', 'Token symbol', 'IONIC')
  .option('--decimals <number>', 'Token decimals', '8')
  .option('--initial-supply <number>', 'Initial supply (in smallest units)', '100000000000000000')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🪙 Creating Ionic Token on Solana (SPL Token)');
  console.log('=============================================');

  // Network configuration
  const network = options.network;
  const endpoint = network === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.testnet.solana.com';
  
  console.log(`📡 Network: ${network} (${endpoint})`);

  // Load keypair
  const keypairPath = options.keypair.replace('~', process.env.HOME);
  let keypair;
  
  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    console.error('❌ Failed to load keypair:', error.message);
    process.exit(1);
  }

  console.log(`👤 Creator: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  // Token configuration
  const tokenConfig = {
    name: options.name,
    symbol: options.symbol,
    decimals: parseInt(options.decimals),
    initialSupply: options.initialSupply,
    uri: `https://ionic-swap.io/metadata/${options.symbol.toLowerCase()}.json`,
  };

  console.log('\n📊 Token Configuration:');
  console.log(`   Name: ${tokenConfig.name}`);
  console.log(`   Symbol: ${tokenConfig.symbol}`);
  console.log(`   Decimals: ${tokenConfig.decimals}`);
  console.log(`   Initial Supply: ${tokenConfig.initialSupply}`);
  console.log(`   Metadata URI: ${tokenConfig.uri}`);

  // Create mint account
  console.log('\n🔨 Creating mint account...');
  const mintKeypair = Keypair.generate();
  const mintPublicKey = mintKeypair.publicKey;

  // Calculate rent for mint account
  const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

  // Create mint account transaction
  const createMintAccountTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: keypair.publicKey,
      newAccountPubkey: mintPublicKey,
      space: MintLayout.span,
      lamports: mintRent,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  try {
    await sendAndConfirmTransaction(
      connection,
      createMintAccountTx,
      [keypair, mintKeypair]
    );
    console.log(`✅ Mint account created: ${mintPublicKey.toString()}`);
  } catch (error) {
    console.error('❌ Failed to create mint account:', error.message);
    process.exit(1);
  }

  // Initialize mint
  console.log('\n🔧 Initializing mint...');
  const initializeMintTx = new Transaction().add(
    createInitializeMint2Instruction(
      mintPublicKey,
      tokenConfig.decimals,
      keypair.publicKey,
      keypair.publicKey
    )
  );

  try {
    await sendAndConfirmTransaction(
      connection,
      initializeMintTx,
      [keypair]
    );
    console.log('✅ Mint initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize mint:', error.message);
    process.exit(1);
  }

  // Create associated token account for the creator
  console.log('\n🏦 Creating associated token account...');
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    keypair.publicKey
  );

  const createATATx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      keypair.publicKey,
      associatedTokenAccount,
      keypair.publicKey,
      mintPublicKey
    )
  );

  try {
    await sendAndConfirmTransaction(
      connection,
      createATATx,
      [keypair]
    );
    console.log(`✅ Associated token account created: ${associatedTokenAccount.toString()}`);
  } catch (error) {
    console.error('❌ Failed to create associated token account:', error.message);
    process.exit(1);
  }

  // Mint initial supply
  console.log('\n💰 Minting initial supply...');
  const mintToTx = new Transaction().add(
    createMintToInstruction(
      mintPublicKey,
      associatedTokenAccount,
      keypair.publicKey,
      tokenConfig.initialSupply
    )
  );

  try {
    await sendAndConfirmTransaction(
      connection,
      mintToTx,
      [keypair]
    );
    console.log(`✅ Initial supply minted: ${tokenConfig.initialSupply} tokens`);
  } catch (error) {
    console.error('❌ Failed to mint initial supply:', error.message);
    process.exit(1);
  }

  // Save token info
  const tokenInfo = {
    network,
    mintAddress: mintPublicKey.toString(),
    associatedTokenAccount: associatedTokenAccount.toString(),
    creator: keypair.publicKey.toString(),
    name: tokenConfig.name,
    symbol: tokenConfig.symbol,
    decimals: tokenConfig.decimals,
    initialSupply: tokenConfig.initialSupply,
    metadataUri: tokenConfig.uri,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, '../token-info.json'),
    JSON.stringify(tokenInfo, null, 2)
  );

  console.log('\n🎉 Ionic Token created successfully!');
  console.log('=====================================');
  console.log(`📋 Mint Address: ${mintPublicKey.toString()}`);
  console.log(`🏦 Associated Token Account: ${associatedTokenAccount.toString()}`);
  console.log(`🔗 Explorer: https://explorer.solana.com/address/${mintPublicKey.toString()}?cluster=${network}`);
  console.log('\n📝 Token info saved to token-info.json');

  // Display token details
  console.log('\n📊 Token Details:');
  console.log(`   Name: ${tokenConfig.name}`);
  console.log(`   Symbol: ${tokenConfig.symbol}`);
  console.log(`   Decimals: ${tokenConfig.decimals}`);
  console.log(`   Total Supply: ${tokenConfig.initialSupply}`);
  console.log(`   Creator Balance: ${tokenConfig.initialSupply} ${tokenConfig.symbol}`);

  console.log('\n🚀 Next steps:');
  console.log('   1. Add this token to your frontend');
  console.log('   2. Test transfers between accounts');
  console.log('   3. Integrate with Ionic Swap platform');
}

main().catch(console.error);
