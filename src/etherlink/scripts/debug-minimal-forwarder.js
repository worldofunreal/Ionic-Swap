const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Debugging MinimalForwarder Signature Issues...\n');

  // Get signers
  const [deployer] = await ethers.getSigners();
  const user = deployer;
  console.log('User:', user.address);

  // Contract addresses
  const SPIRAL_TOKEN = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
  const HTLC_FACTORY = "0x5e8b5b36F81A723Cdf42771e7aAc943b360c4751";
  const MINIMAL_FORWARDER = "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC";

  // Get contracts
  const spiralToken = await ethers.getContractAt('SpiralToken', SPIRAL_TOKEN);
  const forwarder = await ethers.getContractAt('MinimalForwarder', MINIMAL_FORWARDER);

  console.log('✅ Contracts loaded successfully');

  // Test 1: Check MinimalForwarder domain
  console.log('\n📋 Test 1: Checking MinimalForwarder domain...');
  try {
    // Get the domain separator from the contract
    const domainSeparator = await forwarder.DOMAIN_SEPARATOR();
    console.log('Domain separator:', domainSeparator);
    
    // Recreate the domain locally
    const localDomain = {
      name: 'MinimalForwarder',
      version: '0.0.1',
      chainId: 11155111,
      verifyingContract: MINIMAL_FORWARDER
    };
    
    const localDomainSeparator = ethers.utils._TypedDataEncoder.hashDomain(localDomain);
    console.log('Local domain separator:', localDomainSeparator);
    console.log('Domain match:', domainSeparator === localDomainSeparator);
    
  } catch (error) {
    console.log('❌ Domain check failed:', error.message);
  }

  // Test 2: Test simple forward request without permit
  console.log('\n📋 Test 2: Testing simple forward request...');
  try {
    const forwarderNonce = await forwarder.getNonce(user.address);
    console.log('Forwarder nonce:', forwarderNonce.toString());

    // Create a simple forward request (just call a view function)
    const simpleData = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("test"));
    
    const forwardRequest = {
      from: user.address,
      to: SPIRAL_TOKEN,
      value: 0,
      gas: 100000,
      nonce: forwarderNonce.toNumber(),
      data: simpleData,
      validUntil: Math.floor(Date.now() / 1000) + 3600
    };

    console.log('Forward request:', forwardRequest);

    // Sign the forward request
    const forwarderSignature = await user._signTypedData(
      {
        name: "MinimalForwarder",
        version: "0.0.1",
        chainId: 11155111,
        verifyingContract: MINIMAL_FORWARDER
      },
      {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "validUntil", type: "uint256" }
        ]
      },
      forwardRequest
    );

    console.log('✅ Simple forward request signed:', forwarderSignature);

    // Verify the signature
    const isValid = await forwarder.verify(forwardRequest, forwarderSignature);
    console.log('✅ Signature verification result:', isValid);

  } catch (error) {
    console.log('❌ Simple forward request failed:', error.message);
  }

  // Test 3: Test permit data encoding
  console.log('\n📋 Test 3: Testing permit data encoding...');
  try {
    const tokenNonce = await spiralToken.nonces(user.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    // Sign permit message
    const permitDomain = {
      name: 'Spiral',
      version: '1',
      chainId: 11155111,
      verifyingContract: SPIRAL_TOKEN
    };

    const permitTypes = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const permitMessage = {
      owner: user.address,
      spender: HTLC_FACTORY,
      value: ethers.utils.parseUnits("100", 8),
      nonce: tokenNonce,
      deadline: deadline
    };

    const permitSignature = await user._signTypedData(permitDomain, permitTypes, permitMessage);
    const sig = ethers.utils.splitSignature(permitSignature);

    console.log('✅ Permit signature created');
    console.log('   v:', sig.v);
    console.log('   r:', sig.r);
    console.log('   s:', sig.s);

    // Encode permit function call
    const permitInterface = new ethers.utils.Interface([
      "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)"
    ]);
    
    const permitData = permitInterface.encodeFunctionData("permit", [
      user.address,
      HTLC_FACTORY,
      ethers.utils.parseUnits("100", 8),
      deadline,
      sig.v,
      sig.r,
      sig.s
    ]);

    console.log('✅ Permit data encoded:', permitData);

  } catch (error) {
    console.log('❌ Permit data encoding failed:', error.message);
  }

  // Test 4: Test complete forward request with permit
  console.log('\n📋 Test 4: Testing complete forward request with permit...');
  try {
    const forwarderNonce = await forwarder.getNonce(user.address);
    const tokenNonce = await spiralToken.nonces(user.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    // Create permit signature
    const permitDomain = {
      name: 'Spiral',
      version: '1',
      chainId: 11155111,
      verifyingContract: SPIRAL_TOKEN
    };

    const permitTypes = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const permitMessage = {
      owner: user.address,
      spender: HTLC_FACTORY,
      value: ethers.utils.parseUnits("100", 8),
      nonce: tokenNonce,
      deadline: deadline
    };

    const permitSignature = await user._signTypedData(permitDomain, permitTypes, permitMessage);
    const sig = ethers.utils.splitSignature(permitSignature);

    // Encode permit function call
    const permitInterface = new ethers.utils.Interface([
      "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)"
    ]);
    
    const permitData = permitInterface.encodeFunctionData("permit", [
      user.address,
      HTLC_FACTORY,
      ethers.utils.parseUnits("100", 8),
      deadline,
      sig.v,
      sig.r,
      sig.s
    ]);

    // Create forward request
    const forwardRequest = {
      from: user.address,
      to: SPIRAL_TOKEN,
      value: 0,
      gas: 200000,
      nonce: forwarderNonce.toNumber(),
      data: permitData,
      validUntil: deadline
    };

    console.log('Forward request with permit:');
    console.log('  from:', forwardRequest.from);
    console.log('  to:', forwardRequest.to);
    console.log('  value:', forwardRequest.value);
    console.log('  gas:', forwardRequest.gas);
    console.log('  nonce:', forwardRequest.nonce);
    console.log('  data length:', forwardRequest.data.length);
    console.log('  validUntil:', forwardRequest.validUntil);

    // Sign the forward request
    const forwarderSignature = await user._signTypedData(
      {
        name: "MinimalForwarder",
        version: "0.0.1",
        chainId: 11155111,
        verifyingContract: MINIMAL_FORWARDER
      },
      {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "validUntil", type: "uint256" }
        ]
      },
      forwardRequest
    );

    console.log('✅ Forward request signed:', forwarderSignature);

    // Verify the signature
    const isValid = await forwarder.verify(forwardRequest, forwarderSignature);
    console.log('✅ Signature verification result:', isValid);

    if (isValid) {
      console.log('🎉 SUCCESS: Forward request signature is valid!');
    } else {
      console.log('❌ FAILED: Forward request signature is invalid');
    }

  } catch (error) {
    console.log('❌ Complete forward request failed:', error.message);
    console.log('Error details:', error);
  }

  console.log('\n🔍 Debugging complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 