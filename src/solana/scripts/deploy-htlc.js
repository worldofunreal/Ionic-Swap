const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
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
  console.log('🚀 Deploying Solana HTLC Program');
  console.log('=================================');

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
    console.log('💡 Create a keypair with: solana-keygen new --outfile ~/.config/solana/id.json');
    process.exit(1);
  }

  console.log(`👤 Deployer: ${keypair.publicKey.toString()}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 2e9) { // Need at least 2 SOL for deployment
    console.error('❌ Insufficient balance for deployment. Need at least 2 SOL');
    console.log('💡 Try airdropping more SOL: solana airdrop 2');
    process.exit(1);
  }

  // Build the program
  console.log('\n🔨 Building HTLC program...');
  try {
    execSync('cargo build-sbf -- -Znext-lockfile-bump', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
    console.log('✅ Program built successfully');
  } catch (error) {
    console.error('❌ Failed to build program:', error.message);
    process.exit(1);
  }

  // Deploy the program
  console.log('\n📤 Deploying program...');
  try {
    const programPath = path.join(__dirname, '../target/sbf-solana-solana/release/ionic_solana_htlc.so');
    
    if (!fs.existsSync(programPath)) {
      console.error('❌ Program binary not found:', programPath);
      process.exit(1);
    }

    const programData = fs.readFileSync(programPath);
    const programKeypair = Keypair.generate();
    
    console.log(`📋 Program ID: ${programKeypair.publicKey.toString()}`);

    // Create program account
    const programAccountTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: keypair.publicKey,
        newAccountPubkey: programKeypair.publicKey,
        space: programData.length,
        lamports: await connection.getMinimumBalanceForRentExemption(programData.length),
        programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
      })
    );

    await sendAndConfirmTransaction(connection, programAccountTx, [keypair, programKeypair]);
    console.log('✅ Program account created');

    // Deploy the program
    const deployTx = new Transaction().add({
      keys: [
        { pubkey: programKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: keypair.publicKey, isSigner: true, isWritable: false },
      ],
      programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
      data: Buffer.concat([
        Buffer.from([0, 0, 0, 0]), // 4-byte instruction discriminator for "Write"
        programData,
      ]),
    });

    await sendAndConfirmTransaction(connection, deployTx, [keypair, programKeypair]);
    console.log('✅ Program deployed successfully');

    // Save deployment info
    const deploymentInfo = {
      network,
      programId: programKeypair.publicKey.toString(),
      deployer: keypair.publicKey.toString(),
      deployedAt: new Date().toISOString(),
      endpoint,
    };

    fs.writeFileSync(
      path.join(__dirname, '../htlc-deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n🎉 HTLC Program deployed successfully!');
    console.log('=====================================');
    console.log(`📋 Program ID: ${programKeypair.publicKey.toString()}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${programKeypair.publicKey.toString()}?cluster=${network}`);
    console.log('\n📝 Deployment info saved to htlc-deployment.json');

    console.log('\n🚀 Next steps:');
    console.log('   1. Update canister with the program ID');
    console.log('   2. Test HTLC creation and claiming');
    console.log('   3. Integrate with cross-chain swaps');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
