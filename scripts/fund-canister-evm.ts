import { ethers } from 'ethers';

// Token addresses from deployment
const SPIRAL_TOKEN = '0x4c7c4cE3709602585A426dDdaa4a68e57022E716';
const STD_TOKEN = '0x905403c2fEe3749e7Ec55C5F202a923e421aD226';

// Network configuration
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303';

// Deployer private key from .env
const DEPLOYER_PRIVATE_KEY = '070aa443aeda06f91b621683def7fce7ecc09eb456678adef14bdb3cb58611bd';

// Canister Ethereum address
const CANISTER_ADDRESS = '0xfd907d203bf7876d977a18ff4e90285c411b5977';

// ERC20 ABI (minimal for transfer)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

const fundCanister = async () => {
  console.log('🏦 Funding Canister with ERC20 Tokens');
  console.log('=====================================');
  
  // Setup provider and deployer wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 Deployer: ${deployerWallet.address}`);
  console.log(`🏦 Canister: ${CANISTER_ADDRESS}`);
  
  // Check canister balances before funding
  console.log('\n📊 Checking Canister Balances BEFORE Funding:');
  
  const spiralContract = new ethers.Contract(SPIRAL_TOKEN, ERC20_ABI, deployerWallet);
  const stdContract = new ethers.Contract(STD_TOKEN, ERC20_ABI, deployerWallet);
  
  try {
    const spiralBalance = await spiralContract.balanceOf(CANISTER_ADDRESS);
    const spiralDecimals = await spiralContract.decimals();
    console.log(`   SPIRAL: ${ethers.formatUnits(spiralBalance, spiralDecimals)} SPIRAL`);
  } catch (error) {
    console.log(`   SPIRAL: Error checking balance`);
  }
  
  try {
    const stdBalance = await stdContract.balanceOf(CANISTER_ADDRESS);
    const stdDecimals = await stdContract.decimals();
    console.log(`   STD: ${ethers.formatUnits(stdBalance, stdDecimals)} STD`);
  } catch (error) {
    console.log(`   STD: Error checking balance`);
  }
  
  // Fund canister with SPIRAL tokens
  try {
    console.log('\n🪙 Funding Canister with SPIRAL tokens...');
    const transferAmount = ethers.parseUnits('10000', 8); // 10,000 SPIRAL tokens
    
    const tx = await spiralContract.transfer(CANISTER_ADDRESS, transferAmount);
    console.log(`   📝 SPIRAL transfer tx: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ SPIRAL transferred: ${tx.hash}`);
  } catch (error) {
    console.log(`   ❌ SPIRAL funding failed: ${error}`);
  }
  
  // Fund canister with STD tokens
  try {
    console.log('\n⭐ Funding Canister with STD tokens...');
    const transferAmount = ethers.parseUnits('10000', 8); // 10,000 STD tokens
    
    const tx = await stdContract.transfer(CANISTER_ADDRESS, transferAmount);
    console.log(`   📝 STD transfer tx: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ STD transferred: ${tx.hash}`);
  } catch (error) {
    console.log(`   ❌ STD funding failed: ${error}`);
  }
  
  // Check canister balances after funding
  console.log('\n📊 Checking Canister Balances AFTER Funding:');
  
  try {
    const spiralBalance = await spiralContract.balanceOf(CANISTER_ADDRESS);
    const spiralDecimals = await spiralContract.decimals();
    console.log(`   SPIRAL: ${ethers.formatUnits(spiralBalance, spiralDecimals)} SPIRAL`);
  } catch (error) {
    console.log(`   SPIRAL: Error checking balance`);
  }
  
  try {
    const stdBalance = await stdContract.balanceOf(CANISTER_ADDRESS);
    const stdDecimals = await stdContract.decimals();
    console.log(`   STD: ${ethers.formatUnits(stdBalance, stdDecimals)} STD`);
  } catch (error) {
    console.log(`   STD: Error checking balance`);
  }
  
  console.log('\n🎉 Canister Funding Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Canister now has liquidity for swaps');
  console.log('   2. Users can sign EIP-2612 permits');
  console.log('   3. Canister executes gasless transactions');
  console.log('   4. Canister pays all gas fees!');
};

fundCanister().catch(console.error);

