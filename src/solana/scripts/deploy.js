const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to deploy to (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🚀 Starting Solana Token Deployment');
  console.log('====================================');

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
    console.log('💡 Make sure you have a valid keypair file or create one with: solana-keygen new');
    process.exit(1);
  }

  console.log(`👤 Deployer: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 0.1 * 1e9) {
    console.log('⚠️  Low balance. Consider airdropping SOL:');
    console.log(`   solana airdrop 2 ${keypair.publicKey.toString()} --url ${endpoint}`);
  }

  // Build the program
  console.log('\n🔨 Building Solana program...');
  try {
    execSync('cargo build --release', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }

  // Deploy the program
  console.log('\n📦 Deploying program...');
  const programPath = path.join(__dirname, '../target/release/libionic_solana_token.dylib');
  
  if (!fs.existsSync(programPath)) {
    console.error('❌ Program binary not found. Build failed.');
    process.exit(1);
  }

  const programData = fs.readFileSync(programPath);
  const programKeypair = Keypair.generate();
  
  try {
    const deployTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: keypair.publicKey,
        newAccountPubkey: programKeypair.publicKey,
        space: programData.length,
        lamports: await connection.getMinimumBalanceForRentExemption(programData.length),
        programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
      }),
      SystemProgram.assign({
        accountPubkey: programKeypair.publicKey,
        programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
      }),
      SystemProgram.deploy({
        programId: programKeypair.publicKey,
        programData: programData,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      deployTransaction,
      [keypair, programKeypair]
    );

    console.log(`✅ Program deployed successfully!`);
    console.log(`📋 Program ID: ${programKeypair.publicKey.toString()}`);
    console.log(`🔗 Transaction: https://explorer.solana.com/tx/${signature}?cluster=${network}`);

    // Save deployment info
    const deploymentInfo = {
      network,
      programId: programKeypair.publicKey.toString(),
      deployer: keypair.publicKey.toString(),
      transaction: signature,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(__dirname, '../deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n📝 Deployment info saved to deployment.json');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
