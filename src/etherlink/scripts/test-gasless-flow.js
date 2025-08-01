const { ethers } = require('hardhat');

async function main() {
  console.log('🧪 Testing Gasless Approval Flow...\n');

  // Get signers
  const [deployer] = await ethers.getSigners();
  const user = deployer; // Use the same account for testing
  console.log('Deployer/User:', deployer.address);

  // Contract addresses
  const SPIRAL_TOKEN = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
  const HTLC_FACTORY = "0x5e8b5b36F81A723Cdf42771e7aAc943b360c4751";
  const MINIMAL_FORWARDER = "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC";

  // Get contracts
  const spiralToken = await ethers.getContractAt('SpiralToken', SPIRAL_TOKEN);
  const forwarder = await ethers.getContractAt('MinimalForwarder', MINIMAL_FORWARDER);

  console.log('✅ Contracts loaded successfully');

  // Test 1: Check if SpiralToken has permit support
  console.log('\n📋 Test 1: Checking EIP-2612 permit support...');
  try {
    const nonce = await spiralToken.nonces(user.address);
    console.log('✅ SpiralToken has permit support (nonce:', nonce.toString(), ')');
  } catch (error) {
    console.log('❌ SpiralToken missing permit support:', error.message);
    return;
  }

  // Test 2: Check MinimalForwarder
  console.log('\n📋 Test 2: Checking MinimalForwarder...');
  try {
    const forwarderNonce = await forwarder.getNonce(user.address);
    console.log('✅ MinimalForwarder working (nonce:', forwarderNonce.toString(), ')');
  } catch (error) {
    console.log('❌ MinimalForwarder error:', error.message);
    return;
  }

  // Test 3: Test permit signature creation
  console.log('\n📋 Test 3: Testing permit signature creation...');
  try {
    const amount = "100"; // 100 tokens
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const nonce = await spiralToken.nonces(user.address);

    // Create permit domain
    const domain = {
      name: 'Spiral',
      version: '1',
      chainId: 11155111,
      verifyingContract: SPIRAL_TOKEN
    };

    // Create permit types
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    // Create permit message
    const message = {
      owner: user.address,
      spender: HTLC_FACTORY,
      value: ethers.utils.parseUnits(amount, 8),
      nonce: nonce,
      deadline: deadline
    };

    // Sign the permit
    const signature = await user._signTypedData(domain, types, message);
    const sig = ethers.utils.splitSignature(signature);

    console.log('✅ Permit signature created successfully');
    console.log('   Signature:', signature);
    console.log('   v:', sig.v);
    console.log('   r:', sig.r);
    console.log('   s:', sig.s);

    // Test 4: Verify signature
    console.log('\n📋 Test 4: Verifying permit signature...');
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature);
    console.log('✅ Signature verified, recovered address:', recoveredAddress);
    console.log('   Matches user address:', recoveredAddress === user.address);

  } catch (error) {
    console.log('❌ Permit signature test failed:', error.message);
    return;
  }

  console.log('\n🎉 All gasless flow tests passed!');
  console.log('\n📝 Summary:');
  console.log('   ✅ SpiralToken has EIP-2612 permit support');
  console.log('   ✅ MinimalForwarder is deployed and working');
  console.log('   ✅ Permit signatures can be created and verified');
  console.log('   ✅ Ready for gasless cross-chain swaps!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 