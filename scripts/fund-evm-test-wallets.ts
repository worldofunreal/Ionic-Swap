import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Token addresses from deployment
const SPIRAL_TOKEN = '0x4c7c4cE3709602585A426dDdaa4a68e57022E716';
const STD_TOKEN = '0x905403c2fEe3749e7Ec55C5F202a923e421aD226';

// Network configuration
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303';
const CHAIN_ID = 11155111;

// Deployer private key from .env
const DEPLOYER_PRIVATE_KEY = '070aa443aeda06f91b621683def7fce7ecc09eb456678adef14bdb3cb58611bd';

// Generate consistent mnemonic (same as test implementation)
const generateMnemonic = (name: string): string => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  const entropy = seed.padEnd(64, '0');
  return ethers.Mnemonic.entropyToPhrase('0x' + entropy);
};

// Generate test identity
const generateTestIdentity = (name: string) => {
  const mnemonic = generateMnemonic(name);
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    name,
    address: wallet.address,
    wallet,
  };
};

// ERC20 ABI (minimal for transfer)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)'
];

const fundEvmTestWallets = async () => {
  console.log('💰 Funding EVM Test Wallets with ERC20 Tokens');
  console.log('==============================================');
  
  // Setup provider and deployer wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 Deployer: ${deployerWallet.address}`);
  
  // Generate test wallets
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  const wallets = [alice, bob, charlie];
  
  // Check deployer balances
  console.log('\n📊 Checking Deployer Balances:');
  const deployerEthBalance = await provider.getBalance(deployerWallet.address);
  console.log(`   ETH: ${ethers.formatEther(deployerEthBalance)} ETH`);
  
  // Check token balances
  const spiralContract = new ethers.Contract(SPIRAL_TOKEN, ERC20_ABI, deployerWallet);
  const stdContract = new ethers.Contract(STD_TOKEN, ERC20_ABI, deployerWallet);
  
  try {
    const spiralBalance = await spiralContract.balanceOf(deployerWallet.address);
    const spiralDecimals = await spiralContract.decimals();
    console.log(`   SPIRAL: ${ethers.formatUnits(spiralBalance, spiralDecimals)} SPIRAL`);
  } catch (error) {
    console.log(`   SPIRAL: Error checking balance`);
  }
  
  try {
    const stdBalance = await stdContract.balanceOf(deployerWallet.address);
    const stdDecimals = await stdContract.decimals();
    console.log(`   STD: ${ethers.formatUnits(stdBalance, stdDecimals)} STD`);
  } catch (error) {
    console.log(`   STD: Error checking balance`);
  }
  
  // Fund each wallet
  for (const wallet of wallets) {
    console.log(`\n👤 Funding ${wallet.name.toUpperCase()}:`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   ⚠️  NO ETH - Testing true gasless permits!`);
    
    // 1. Fund with SPIRAL tokens
    try {
      console.log('   🪙 Setting up SPIRAL tokens...');
      const transferAmount = ethers.parseUnits('1000', 8); // 1000 SPIRAL tokens
      
      const tx = await spiralContract.transfer(wallet.address, transferAmount);
      console.log(`   📝 SPIRAL transfer tx: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ SPIRAL transferred: ${tx.hash}`);
    } catch (error) {
      console.log(`   ❌ SPIRAL setup failed: ${error}`);
    }
    
    // 2. Fund with STD tokens
    try {
      console.log('   ⭐ Setting up STD tokens...');
      const transferAmount = ethers.parseUnits('1000', 8); // 1000 STD tokens
      
      const tx = await stdContract.transfer(wallet.address, transferAmount);
      console.log(`   📝 STD transfer tx: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ STD transferred: ${tx.hash}`);
    } catch (error) {
      console.log(`   ❌ STD setup failed: ${error}`);
    }
  }
  
  console.log('\n🎉 Funding Complete!');
  console.log('\n📋 Summary:');
  console.log('   Each wallet should now have:');
  console.log('   - 0 ETH (testing true gasless permits!)');
  console.log('   - 1000 SPIRAL tokens');
  console.log('   - 1000 STD tokens');
  console.log('\n💡 Next Steps:');
  console.log('   1. Verify token balances');
  console.log('   2. Sign EIP-2612 permits off-chain (no gas needed)');
  console.log('   3. Call canister to execute gasless transactions');
  console.log('   4. Canister pays all gas fees!');
};

fundEvmTestWallets().catch(console.error);

