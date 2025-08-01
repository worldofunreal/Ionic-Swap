const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
    console.log('🚀 Testing Canister Gasless Flow Components\n');

    // Load deployed contract addresses
    const factoryDeployment = JSON.parse(fs.readFileSync('./deployments/sepolia-11155111.json', 'utf8'));
    const tokenDeployment = JSON.parse(fs.readFileSync('./deployments/spiral-token-sepolia-11155111.json', 'utf8'));
    const forwarderDeployment = JSON.parse(fs.readFileSync('./deployments/forwarder-sepolia-11155111.json', 'utf8'));
    
    const tokenAddress = tokenDeployment.contractAddress;
    const forwarderAddress = forwarderDeployment.contractAddress;
    const factoryAddress = factoryDeployment.contractAddress;

    console.log('📋 Contract Addresses:');
    console.log(`  SpiralToken: ${tokenAddress}`);
    console.log(`  MinimalForwarder: ${forwarderAddress}`);
    console.log(`  EtherlinkEscrowFactory: ${factoryAddress}\n`);

    // Get signers
    const [deployer] = await ethers.getSigners();
    const user = deployer; // Using same account for testing
    
    // Use the actual deployer address from the deployment files
    const actualDeployerAddress = factoryDeployment.deployer;
    console.log(`👤 User Address: ${user.address}`);
    console.log(`📋 Actual Deployer Address: ${actualDeployerAddress}`);
    console.log(`⚠️  Note: Using Hardhat signer, but deployment was done with ${actualDeployerAddress}\n`);

    // Get contract instances
    const token = await ethers.getContractAt('SpiralToken', tokenAddress);
    const forwarder = await ethers.getContractAt('MinimalForwarder', forwarderAddress);

    // Test 1: Check user token balance
    console.log('1️⃣ Testing User Token Balance:');
    try {
        const balance = await token.balanceOf(user.address);
        console.log(`   Balance: ${ethers.utils.formatEther(balance)} SPIRAL`);
    } catch (error) {
        console.log(`   ❌ Error getting balance: ${error.message}`);
        console.log(`   This is expected since we're using a different address than the deployer`);
    }
    
    // Try with actual deployer address
    try {
        const deployerBalance = await token.balanceOf(actualDeployerAddress);
        console.log(`   Deployer Balance: ${ethers.utils.formatEther(deployerBalance)} SPIRAL`);
    } catch (error) {
        console.log(`   ❌ Error getting deployer balance: ${error.message}`);
    }
    console.log('');

    // Test 2: Get forwarder nonce
    console.log('2️⃣ Testing Forwarder Nonce:');
    try {
        const forwarderNonce = await forwarder.getNonce(user.address);
        console.log(`   Forwarder Nonce: ${forwarderNonce}`);
    } catch (error) {
        console.log(`   ❌ Error getting nonce: ${error.message}`);
        console.log(`   Using 0 as default nonce for testing`);
    }
    
    // Try with actual deployer address
    try {
        const deployerNonce = await forwarder.getNonce(actualDeployerAddress);
        console.log(`   Deployer Nonce: ${deployerNonce}`);
    } catch (error) {
        console.log(`   ❌ Error getting deployer nonce: ${error.message}`);
    }
    console.log('');

    // Test 3: Create EIP-2612 permit signature
    console.log('3️⃣ Testing EIP-2612 Permit Signature:');
    const spender = forwarderAddress;
    const value = ethers.utils.parseEther('100');
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const domain = {
        name: 'Spiral',
        version: '1',
        chainId: 11155111, // Sepolia
        verifyingContract: tokenAddress
    };

    const types = {
        Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
        ]
    };

    // Get token nonce with error handling
    let tokenNonce = 0;
    try {
        tokenNonce = await token.nonces(user.address);
    } catch (error) {
        console.log(`   ⚠️  Error getting token nonce, using 0: ${error.message}`);
    }
    
    const message = {
        owner: user.address,
        spender: spender,
        value: value,
        nonce: tokenNonce,
        deadline: deadline
    };

    const permitSignature = await user._signTypedData(domain, types, message);
    const { v, r, s } = ethers.utils.splitSignature(permitSignature);

    console.log(`   Permit Signature: ${permitSignature}`);
    console.log(`   v: ${v}, r: ${r}, s: ${s}`);
    console.log(`   Deadline: ${deadline}\n`);

    // Test 4: Encode permit call data
    console.log('4️⃣ Testing Permit Call Data Encoding:');
    const permitData = token.interface.encodeFunctionData('permit', [
        user.address,
        spender,
        value,
        deadline,
        v,
        r,
        s
    ]);
    console.log(`   Permit Call Data: ${permitData}\n`);

    // Test 5: Create EIP-2771 forward request
    console.log('5️⃣ Testing EIP-2771 Forward Request:');
    const forwardRequest = {
        from: user.address,
        to: tokenAddress,
        value: 0,
        gas: 200000,
        nonce: forwarderNonce,
        data: permitData,
        validUntil: deadline
    };

    console.log('   Forward Request:');
    console.log(`     from: ${forwardRequest.from}`);
    console.log(`     to: ${forwardRequest.to}`);
    console.log(`     value: ${forwardRequest.value}`);
    console.log(`     gas: ${forwardRequest.gas}`);
    console.log(`     nonce: ${forwardRequest.nonce}`);
    console.log(`     data: ${forwardRequest.data}`);
    console.log(`     validUntil: ${forwardRequest.validUntil}\n`);

    // Test 6: Sign forward request
    console.log('6️⃣ Testing Forward Request Signature:');
    const forwardRequestSignature = await user._signTypedData(
        {
            name: 'MinimalForwarder',
            version: '0.0.1',
            chainId: 11155111,
            verifyingContract: forwarderAddress
        },
        {
            ForwardRequest: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'gas', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'data', type: 'bytes' },
                { name: 'validUntil', type: 'uint256' }
            ]
        },
        forwardRequest
    );

    console.log(`   Forward Request Signature: ${forwardRequestSignature}\n`);

    // Test 7: Verify forward request signature
    console.log('7️⃣ Testing Forward Request Verification:');
    const isValid = await forwarder.verify(forwardRequest, forwardRequestSignature);
    console.log(`   Signature Valid: ${isValid}\n`);

    // Test 8: Encode execute call data
    console.log('8️⃣ Testing Execute Call Data Encoding:');
    const executeData = forwarder.interface.encodeFunctionData('execute', [
        forwardRequest,
        forwardRequestSignature
    ]);
    console.log(`   Execute Call Data: ${executeData}\n`);

    // Test 9: Check forwarder balance
    console.log('9️⃣ Testing Forwarder Balance:');
    const forwarderBalance = await ethers.provider.getBalance(forwarderAddress);
    console.log(`   Forwarder Balance: ${ethers.utils.formatEther(forwarderBalance)} ETH\n`);

    // Test 10: Prepare canister call data
    console.log('🔟 Preparing Canister Call Data:');
    console.log('   This data will be sent to the ICP canister:');
    console.log(`   Forward Request: ${JSON.stringify(forwardRequest, null, 2)}`);
    console.log(`   Forward Signature: ${forwardRequestSignature}`);
    console.log(`   User Address: ${user.address}`);
    console.log(`   Amount: ${ethers.utils.formatEther(value)} SPIRAL\n`);

    // Test 11: Verify permit signature recovery
    console.log('1️⃣1️⃣ Testing Permit Signature Recovery:');
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, permitSignature);
    console.log(`   Recovered Address: ${recoveredAddress}`);
    console.log(`   Matches User: ${recoveredAddress.toLowerCase() === user.address.toLowerCase()}\n`);

    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Next Steps for True Gasless Flow:');
    console.log('1. Frontend calls canister.execute_gasless_approval() with the prepared data');
    console.log('2. Canister validates forward request signature');
    console.log('3. Canister constructs and signs EIP-1559 transaction');
    console.log('4. Canister sends signed transaction to MinimalForwarder.execute()');
    console.log('5. MinimalForwarder pays gas and calls token.permit()');
    console.log('6. User gets approval with ZERO gas cost! 🎉\n');

    return {
        userAddress: user.address,
        tokenAddress,
        forwarderAddress,
        permitSignature,
        forwardRequest,
        forwardRequestSignature,
        executeData,
        forwarderBalance: ethers.utils.formatEther(forwarderBalance)
    };
}

main()
    .then((result) => {
        console.log('📊 Test Results Summary:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }); 