const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to deploy to (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🚀 Deploying Solana HTLC Program (Simple)');
  console.log('==========================================');

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
    console.log('💡 Create a keypair with: node scripts/create-keypair.js');
    process.exit(1);
  }

  console.log(`👤 Deployer: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 1e9) { // Need at least 1 SOL for deployment
    console.error('❌ Insufficient balance for deployment. Need at least 1 SOL');
    console.log('💡 Try airdropping more SOL: solana airdrop 2');
    process.exit(1);
  }

  // For now, we'll create a mock program ID since we can't build the actual program
  // In a real deployment, this would be the actual program ID
  const programId = Keypair.generate();
  
  console.log('\n📋 Mock Program ID:', programId.publicKey.toString());
  console.log('⚠️  Note: This is a mock deployment for demonstration purposes');
  console.log('   In a real deployment, you would:');
  console.log('   1. Build the program with cargo build-sbf');
  console.log('   2. Deploy the actual .so file');
  console.log('   3. Get the real program ID');

  // Save deployment info
  const deploymentInfo = {
    network,
    programId: programId.publicKey.toString(),
    deployer: keypair.publicKey.toString(),
    deployedAt: new Date().toISOString(),
    endpoint,
    note: 'Mock deployment - program not actually deployed',
  };

  fs.writeFileSync(
    path.join(__dirname, '../htlc-deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\n🎉 Mock HTLC Program deployment completed!');
  console.log('==========================================');
  console.log(`📋 Program ID: ${programId.publicKey.toString()}`);
  console.log(`🔗 Explorer: https://explorer.solana.com/address/${programId.publicKey.toString()}?cluster=${network}`);
  console.log('\n📝 Deployment info saved to htlc-deployment.json');

  console.log('\n🚀 Next steps:');
  console.log('   1. Install Solana build tools: cargo install cargo-build-sbf');
  console.log('   2. Build the program: cargo build-sbf --release');
  console.log('   3. Deploy the actual program');
  console.log('   4. Update canister with the real program ID');
  console.log('   5. Test HTLC creation and claiming');

  console.log('\n💡 For now, you can test the canister integration with this mock program ID');
}

main().catch(console.error);
