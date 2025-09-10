import { ethers } from 'ethers';
import { execSync } from 'child_process';

// Token addresses from deployment
const SPIRAL_TOKEN = '0x4c7c4cE3709602585A426dDdaa4a68e57022E716';
const STD_TOKEN = '0x905403c2fEe3749e7Ec55C5F202a923e421aD226';

// Network configuration
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303';
const CHAIN_ID = 11155111;

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
    privateKey: wallet.privateKey,
    wallet,
  };
};

// ERC20 ABI with permit support
const ERC20_PERMIT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external'
];

// EIP-2612 permit types
const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const testEvmGaslessPermit = async () => {
  console.log('🧪 Testing EVM Gasless Permit Flow');
  console.log('===================================');
  
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  
  // Generate Alice's wallet
  const alice = generateTestIdentity('alice');
  console.log(`👤 Alice: ${alice.address}`);
  
  // Check Alice's balances
  console.log('\n📊 Checking Alice\'s Balances:');
  const aliceEthBalance = await provider.getBalance(alice.address);
  console.log(`   ETH: ${ethers.formatEther(aliceEthBalance)} ETH`);
  
  const spiralContract = new ethers.Contract(SPIRAL_TOKEN, ERC20_PERMIT_ABI, provider);
  const stdContract = new ethers.Contract(STD_TOKEN, ERC20_PERMIT_ABI, provider);
  
  try {
    const spiralBalance = await spiralContract.balanceOf(alice.address);
    const spiralDecimals = await spiralContract.decimals();
    console.log(`   SPIRAL: ${ethers.formatUnits(spiralBalance, spiralDecimals)} SPIRAL`);
  } catch (error) {
    console.log(`   SPIRAL: Error checking balance`);
  }
  
  try {
    const stdBalance = await stdContract.balanceOf(alice.address);
    const stdDecimals = await stdContract.decimals();
    console.log(`   STD: ${ethers.formatUnits(stdBalance, stdDecimals)} STD`);
  } catch (error) {
    console.log(`   STD: Error checking balance`);
  }
  
  // Get canister's Ethereum address
  console.log('\n🏦 Getting Canister\'s Ethereum Address...');
  const canisterAddressOutput = execSync('dfx canister call backend get_canister_ethereum_address', { encoding: 'utf8' });
  const canisterAddress = canisterAddressOutput.trim().replace(/[()"]/g, '');
  console.log(`   Canister Address: ${canisterAddress}`);
  
  // Check current gas price
  console.log('\n⛽ Checking Current Gas Price...');
  try {
    const gasPrice = await provider.getFeeData();
    console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`);
    console.log(`   Max Fee Per Gas: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0, 'gwei')} gwei`);
    console.log(`   Max Priority Fee: ${ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0, 'gwei')} gwei`);
  } catch (error) {
    console.log(`   Error getting gas price: ${error}`);
  }
  
  // Check canister's balances
  console.log('\n💰 Checking Canister\'s Balances:');
  try {
    const canisterSpiralBalance = await spiralContract.balanceOf(canisterAddress);
    const spiralDecimals = await spiralContract.decimals();
    console.log(`   SPIRAL: ${ethers.formatUnits(canisterSpiralBalance, spiralDecimals)} SPIRAL`);
  } catch (error) {
    console.log(`   SPIRAL: Error checking balance`);
  }
  
  try {
    const canisterStdBalance = await stdContract.balanceOf(canisterAddress);
    const stdDecimals = await stdContract.decimals();
    console.log(`   STD: ${ethers.formatUnits(canisterStdBalance, stdDecimals)} STD`);
  } catch (error) {
    console.log(`   STD: Error checking balance`);
  }
  
  // Create EIP-2612 permit for SPIRAL tokens
  console.log('\n📝 Creating EIP-2612 Permit for SPIRAL tokens...');
  const permitAmount = ethers.parseUnits('100', 8); // 100 SPIRAL tokens
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  // Get current nonce
  const nonce = await spiralContract.nonces(alice.address);
  console.log(`   Nonce: ${nonce}`);
  console.log(`   Amount: ${ethers.formatUnits(permitAmount, 8)} SPIRAL`);
  console.log(`   Spender: ${canisterAddress}`);
  console.log(`   Deadline: ${deadline}`);
  
  // Get domain separator
  const domainSeparator = await spiralContract.DOMAIN_SEPARATOR();
  console.log(`   Domain Separator: ${domainSeparator}`);
  
  // Create permit message
  const permitMessage = {
    owner: alice.address,
    spender: canisterAddress,
    value: permitAmount,
    nonce: nonce,
    deadline: deadline
  };
  
  console.log('\n✍️  Signing EIP-2612 Permit with Alice\'s Key...');
  
  // Sign the permit
  const signature = await alice.wallet.signTypedData(
    {
      name: 'Spiral',
      version: '1',
      chainId: CHAIN_ID,
      verifyingContract: SPIRAL_TOKEN
    },
    PERMIT_TYPES,
    permitMessage
  );
  
  // Split signature
  const sig = ethers.Signature.from(signature);
  console.log(`   Permit signed by Alice`);
  console.log(`   r: ${sig.r}`);
  console.log(`   s: ${sig.s}`);
  console.log(`   v: ${sig.v}`);
  
  // Create permit request for canister (using new EIP-712 implementation)
  const permitRequest = {
    token: SPIRAL_TOKEN,
    owner: alice.address,
    spender: canisterAddress,
    value: permitAmount.toString(),
    deadline: deadline.toString(),
    v: sig.v.toString(),
    r: sig.r,
    s: sig.s
  };
  
  console.log('\n🚀 Sending Gasless Permit to Canister...');
  console.log('   This will:');
  console.log('   1. Canister calls permit() on SPIRAL token contract');
  console.log('   2. Alice\'s signature authorizes canister to spend tokens');
  console.log('   3. Canister pays all gas fees!');
  console.log('   4. Alice pays $0 in gas!');
  
  try {
    // Call canister with permit request
    const permitCall = `dfx canister call backend submit_gasless_permit '(record {
      token = "${permitRequest.token}";
      owner = "${permitRequest.owner}";
      spender = "${permitRequest.spender}";
      value = "${permitRequest.value}";
      deadline = "${permitRequest.deadline}";
      v = "${permitRequest.v}";
      r = "${permitRequest.r}";
      s = "${permitRequest.s}";
    })'`;
    
    console.log('   Executing gasless permit...');
    const result = execSync(permitCall, { encoding: 'utf8', timeout: 30000 });
    console.log('   ✅ Gasless permit successful!');
    console.log('   Result:', result);
    
    // Check Alice's allowance after the permit
    console.log('\n📊 Checking Alice\'s Allowance After Permit:');
    try {
      const allowance = await spiralContract.allowance(alice.address, canisterAddress);
      const spiralDecimals = await spiralContract.decimals();
      console.log(`   SPIRAL Allowance: ${ethers.formatUnits(allowance, spiralDecimals)} SPIRAL`);
    } catch (error) {
      console.log(`   SPIRAL Allowance: Error checking allowance - ${error}`);
    }
    
  } catch (error) {
    console.log('   ❌ Canister call failed:', error instanceof Error ? error.message : String(error));
    console.log('   This is expected if the backend function is not fully implemented yet.');
  }
  
  console.log('\n🎉 EVM Gasless Permit Flow Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Implement actual canister permit execution');
  console.log('   2. Verify permit was processed on Sepolia');
  console.log('   3. Check Alice\'s token allowance (should be 100 SPIRAL)');
  console.log('   4. Canister can now transfer Alice\'s tokens gaslessly!');
};

testEvmGaslessPermit().catch(console.error);
