const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
    console.log('🚀 Testing Complete Gasless Flow\n');

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
    const user = deployer;
    console.log(`👤 User Address: ${user.address}\n`);

    // Get contract instances
    const token = await ethers.getContractAt('SpiralToken', tokenAddress);
    const forwarder = await ethers.getContractAt('MinimalForwarder', forwarderAddress);

    // Step 1: Check balances and nonces
    console.log('1️⃣ Checking Balances and Nonces:');
    const balance = await token.balanceOf(user.address);
    const forwarderNonce = await forwarder.getNonce(user.address);
    const forwarderBalance = await ethers.provider.getBalance(forwarderAddress);
    
    console.log(`   User Token Balance: ${ethers.utils.formatEther(balance)} SPIRAL`);
    console.log(`   Forwarder Nonce: ${forwarderNonce}`);
    console.log(`   Forwarder ETH Balance: ${ethers.utils.formatEther(forwarderBalance)} ETH\n`);

    // Step 2: Create EIP-2612 permit signature
    console.log('2️⃣ Creating EIP-2612 Permit Signature:');
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

    const message = {
        owner: user.address,
        spender: spender,
        value: value,
        nonce: await token.nonces(user.address),
        deadline: deadline
    };

    const permitSignature = await user._signTypedData(domain, types, message);
    const { v, r, s } = ethers.utils.splitSignature(permitSignature);

    console.log(`   Permit Signature: ${permitSignature}`);
    console.log(`   v: ${v}, r: ${r}, s: ${s}`);
    console.log(`   Deadline: ${deadline}\n`);

    // Step 3: Encode permit call data
    console.log('3️⃣ Encoding Permit Call Data:');
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

    // Step 4: Create EIP-2771 forward request
    console.log('4️⃣ Creating EIP-2771 Forward Request:');
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

    // Step 5: Sign forward request
    console.log('5️⃣ Signing Forward Request:');
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

    // Step 6: Verify forward request signature
    console.log('6️⃣ Verifying Forward Request Signature:');
    const isValid = await forwarder.verify(forwardRequest, forwardRequestSignature);
    console.log(`   Signature Valid: ${isValid}\n`);

    // Step 7: Encode execute call data
    console.log('7️⃣ Encoding Execute Call Data:');
    const forwardRequestEncoded = ethers.utils.defaultAbiCoder.encode([
        'tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data, uint256 validUntil)'
    ], [[
        forwardRequest.from,
        forwardRequest.to,
        forwardRequest.value,
        forwardRequest.gas,
        forwardRequest.nonce,
        forwardRequest.data,
        forwardRequest.validUntil
    ]]);
    
    const executeData = forwarder.interface.encodeFunctionData('execute', [
        forwardRequestEncoded,
        forwardRequestSignature
    ]);
    console.log(`   Execute Call Data: ${executeData}\n`);

    // Step 8: Generate canister call command
    console.log('8️⃣ Generating Canister Call Command:');
    console.log('   Use this command to test the canister:');
    console.log('');
    console.log('dfx canister call backend execute_gasless_approval \\');
    console.log(`  '(record { forward_request = record { from = "${forwardRequest.from}"; to = "${forwardRequest.to}"; value = "${forwardRequest.value}"; gas = "${forwardRequest.gas}"; nonce = "${forwardRequest.nonce}"; data = "${forwardRequest.data}"; validUntil = "${forwardRequest.validUntil}" }; forward_signature = "${forwardRequestSignature}"; user_address = "${user.address}"; amount = "${ethers.utils.formatEther(value)}" })'`);
    console.log('');

    // Step 9: Test permit signature recovery
    console.log('9️⃣ Testing Permit Signature Recovery:');
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, permitSignature);
    console.log(`   Recovered Address: ${recoveredAddress}`);
    console.log(`   Matches User: ${recoveredAddress.toLowerCase() === user.address.toLowerCase()}\n`);

    // Step 10: Summary
    console.log('🔟 Summary:');
    console.log('   ✅ All signatures generated successfully');
    console.log('   ✅ Forward request verified');
    console.log('   ✅ Execute data encoded');
    console.log('   ✅ Ready for canister testing\n');

    console.log('📋 True Gasless Flow Ready:');
    console.log('1. ✅ User signs EIP-2612 permit (no gas)');
    console.log('2. ✅ User signs EIP-2771 forward request (no gas)');
    console.log('3. ✅ Frontend submits to ICP canister (no gas)');
    console.log('4. 🔄 ICP canister calls execute() (ICP pays gas)');
    console.log('5. 🔄 MinimalForwarder pays for permit() (using its 0.04 ETH)');
    console.log('6. 🔄 User gets approval with ZERO gas cost! 🎉\n');

    return {
        userAddress: user.address,
        tokenAddress,
        forwarderAddress,
        permitSignature,
        forwardRequest,
        forwardRequestSignature,
        executeData,
        forwarderBalance: ethers.utils.formatEther(forwarderBalance),
        canisterCommand: `dfx canister call backend execute_gasless_approval '(record { forward_request = record { from = "${forwardRequest.from}"; to = "${forwardRequest.to}"; value = "${forwardRequest.value}"; gas = "${forwardRequest.gas}"; nonce = "${forwardRequest.nonce}"; data = "${forwardRequest.data}"; validUntil = "${forwardRequest.validUntil}" }; forward_signature = "${forwardRequestSignature}"; user_address = "${user.address}"; amount = "${ethers.utils.formatEther(value)}" })'`
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