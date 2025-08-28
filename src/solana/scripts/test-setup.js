const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testSetup() {
  console.log('🧪 Testing Solana Setup');
  console.log('=======================');

  // Test 1: Check if Solana CLI is installed
  console.log('\n1️⃣ Checking Solana CLI...');
  try {
    const solanaVersion = execSync('solana --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Solana CLI installed: ${solanaVersion}`);
  } catch (error) {
    console.log('❌ Solana CLI not found');
    console.log('💡 Install with: sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"');
    return false;
  }

  // Test 2: Check Solana configuration
  console.log('\n2️⃣ Checking Solana configuration...');
  try {
    const config = execSync('solana config get', { encoding: 'utf8' });
    console.log('✅ Solana configuration:');
    console.log(config);
  } catch (error) {
    console.log('❌ Failed to get Solana configuration');
    return false;
  }

  // Test 3: Check if keypair exists
  console.log('\n3️⃣ Checking wallet keypair...');
  const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
  if (fs.existsSync(keypairPath)) {
    console.log(`✅ Keypair found: ${keypairPath}`);
  } else {
    console.log('❌ Keypair not found');
    console.log('💡 Create with: solana-keygen new --outfile ~/.config/solana/id.json');
    return false;
  }

  // Test 4: Check SOL balance
  console.log('\n4️⃣ Checking SOL balance...');
  try {
    const balance = execSync('solana balance', { encoding: 'utf8' }).trim();
    console.log(`✅ Balance: ${balance}`);
    
    const balanceNum = parseFloat(balance.split(' ')[0]);
    if (balanceNum < 0.1) {
      console.log('⚠️  Low balance. Consider airdropping:');
      console.log('   solana airdrop 2');
    }
  } catch (error) {
    console.log('❌ Failed to get balance');
    return false;
  }

  // Test 5: Check Rust installation
  console.log('\n5️⃣ Checking Rust installation...');
  try {
    const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Rust installed: ${rustVersion}`);
  } catch (error) {
    console.log('❌ Rust not found');
    console.log('💡 Install with: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh');
    return false;
  }

  // Test 6: Check Cargo installation
  console.log('\n6️⃣ Checking Cargo installation...');
  try {
    const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Cargo installed: ${cargoVersion}`);
  } catch (error) {
    console.log('❌ Cargo not found');
    return false;
  }

  // Test 7: Check Solana SBF tools
  console.log('\n7️⃣ Checking Solana SBF tools...');
  try {
    const sbfVersion = execSync('cargo build-sbf --help', { encoding: 'utf8' });
    console.log('✅ Solana SBF tools available');
  } catch (error) {
    console.log('❌ Solana SBF tools not found');
    console.log('💡 Install with: cargo install cargo-build-sbf');
    return false;
  }

  // Test 8: Check Node.js dependencies
  console.log('\n8️⃣ Checking Node.js dependencies...');
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json found');
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log('✅ node_modules found');
    } else {
      console.log('⚠️  node_modules not found');
      console.log('💡 Install with: npm install');
    }
  } else {
    console.log('❌ package.json not found');
    return false;
  }

  // Test 9: Test Solana connection
  console.log('\n9️⃣ Testing Solana connection...');
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const slot = await connection.getSlot();
    console.log(`✅ Connected to Solana devnet (slot: ${slot})`);
  } catch (error) {
    console.log('❌ Failed to connect to Solana');
    console.log('💡 Check your internet connection');
    return false;
  }

  console.log('\n🎉 All tests passed! Your Solana setup is ready.');
  console.log('\n📋 Next steps:');
  console.log('   1. npm run build:release');
  console.log('   2. npm run deploy:devnet');
  console.log('   3. npm run create-token');
  
  return true;
}

// Run the test
testSetup().catch(console.error);
