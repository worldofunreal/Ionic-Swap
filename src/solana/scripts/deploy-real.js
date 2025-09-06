const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function deployRealProgram() {
  console.log('🚀 Deploying Real HTLC Program to Solana Devnet');
  console.log('================================================');

  // Network configuration
  const endpoint = 'https://api.devnet.solana.com';
  console.log(`📡 Network: devnet (${endpoint})`);

  // Load keypair
  const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
  let keypair;
  
  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    console.error('❌ Failed to load keypair:', error.message);
    process.exit(1);
  }

  console.log(`👤 Deployer: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 1e9) {
    console.error('❌ Insufficient balance for deployment. Need at least 1 SOL');
    process.exit(1);
  }

  // Generate a new program keypair
  const programKeypair = Keypair.generate();
  console.log(`📋 Program ID: ${programKeypair.publicKey.toString()}`);

  // For now, we'll create a mock deployment since we can't build the actual .so file
  // In a real deployment, you would:
  // 1. Build the program with cargo build-sbf
  // 2. Deploy the actual .so file
  // 3. Get the real program ID

  console.log('\n⚠️  Note: This is a mock deployment for demonstration purposes');
  console.log('   In a real deployment, you would:');
  console.log('   1. Build the program with cargo build-sbf');
  console.log('   2. Deploy the actual .so file');
  console.log('   3. Get the real program ID');

  // Save deployment info
  const deploymentInfo = {
    network: 'devnet',
    programId: programKeypair.publicKey.toString(),
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
  console.log(`📋 Program ID: ${programKeypair.publicKey.toString()}`);
  console.log(`🔗 Explorer: https://explorer.solana.com/address/${programKeypair.publicKey.toString()}?cluster=devnet`);
  console.log('\n📝 Deployment info saved to htlc-deployment.json');

  console.log('\n🚀 Next steps:');
  console.log('   1. Install Solana build tools: cargo install cargo-build-sbf');
  console.log('   2. Build the program: cargo build-sbf --release');
  console.log('   3. Deploy the actual program');
  console.log('   4. Update canister with the real program ID');
  console.log('   5. Test HTLC creation and claiming');

  return programKeypair.publicKey.toString();
}

deployRealProgram().catch(console.error);
