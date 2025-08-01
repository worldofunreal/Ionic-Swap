const { ethers } = require('hardhat');

async function main() {
  console.log('🧪 Testing ICP Canister Execute Function...\n');

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

  // Test 1: Create a valid forward request
  console.log('\n📋 Test 1: Creating forward request...');
  try {
    const forwarderNonce = await forwarder.getNonce(user.address);
    const tokenNonce = await spiralToken.nonces(user.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    console.log('Forwarder nonce:', forwarderNonce.toString());
    console.log('Token nonce:', tokenNonce.toString());
    console.log('Deadline:', deadline);

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

    console.log('✅ Permit signature created');

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
      value: "0",
      gas: "200000",
      nonce: forwarderNonce.toString(),
      data: permitData,
      validUntil: deadline.toString()
    };

    console.log('✅ Forward request created');
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

    console.log('✅ Forward request signed');
    console.log('Signature:', forwarderSignature);

    // Verify the signature locally
    const isValid = await forwarder.verify(forwardRequest, forwarderSignature);
    console.log('✅ Local signature verification:', isValid);

    // Test 2: Prepare data for ICP canister
    console.log('\n📋 Test 2: Preparing data for ICP canister...');
    
    const gaslessApprovalRequest = {
      forward_request: forwardRequest,
      forward_signature: forwarderSignature,
      user_address: user.address,
      amount: "100"
    };

    console.log('✅ Gasless approval request prepared');
    console.log('Request structure:', {
      forward_request: gaslessApprovalRequest.forward_request,
      forward_signature: gaslessApprovalRequest.forward_signature.substring(0, 20) + '...',
      user_address: gaslessApprovalRequest.user_address,
      amount: gaslessApprovalRequest.amount
    });

    console.log('\n🎉 Test data ready for ICP canister!');
    console.log('\n📝 Next steps:');
    console.log('1. Call execute_gasless_approval() on ICP canister with this data');
    console.log('2. ICP canister will call execute() on MinimalForwarder');
    console.log('3. MinimalForwarder will pay gas for permit() call');
    console.log('4. User gets TRUE gasless approval!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Error details:', error);
  }

  console.log('\n🔍 Test complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 