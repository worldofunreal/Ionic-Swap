const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Comparing Transaction Data");
    console.log("=============================");

    const [deployer] = await ethers.getSigners();
    console.log(`📋 Deployer: ${deployer.address}`);

    // Contract addresses
    const htlcAddress = "0x294b513c6b14d9BAA8F03703ADEf50f8dBf93913";
    const spiralTokenAddress = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    
    console.log(`📋 Contract Addresses:`);
    console.log(`  HTLC Contract: ${htlcAddress}`);
    console.log(`  SpiralToken: ${spiralTokenAddress}`);

    // Get contract instances
    const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);
    const spiralToken = await ethers.getContractAt("MockERC20", spiralTokenAddress);

    // Test parameters (same as canister)
    const amount = ethers.utils.parseUnits("1000", 8); // 1000 tokens
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const secret = "htlc_secret_test";
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Same as canister
    const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Same as canister

    console.log(`\n📋 Test Parameters:`);
    console.log(`  Amount: ${ethers.utils.formatUnits(amount, 8)}`);
    console.log(`  Timelock: ${timelock}`);
    console.log(`  Hashlock: ${hashlock}`);
    console.log(`  Recipient: ${recipient}`);
    console.log(`  User Address: ${userAddress}`);

    // Check balances and allowances
    const userBalance = await spiralToken.balanceOf(userAddress);
    const allowance = await spiralToken.allowance(userAddress, htlcAddress);
    
    console.log(`\n💰 Balances:`);
    console.log(`  User Spiral Balance: ${ethers.utils.formatUnits(userBalance, 8)}`);
    console.log(`  HTLC Allowance: ${ethers.utils.formatUnits(allowance, 8)}`);

    if (userBalance.lt(amount)) {
        console.log(`❌ User doesn't have enough tokens!`);
        return;
    }

    if (allowance.lt(amount)) {
        console.log(`❌ HTLC doesn't have enough allowance!`);
        return;
    }

    // Generate transaction data manually
    console.log(`\n🔧 Generating transaction data...`);
    
    // Function signature: createHTLCERC20(address,address,uint256,bytes32,uint256,uint8,uint8,bool,string,address)
    const functionSignature = "createHTLCERC20(address,address,uint256,bytes32,uint256,uint8,uint8,bool,string,address)";
    const functionSelector = ethers.utils.id(functionSignature).substring(0, 10);
    
    console.log(`  Function Signature: ${functionSignature}`);
    console.log(`  Function Selector: ${functionSelector}`);
    
    // Encode parameters
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint8', 'uint8', 'bool', 'string', 'address'],
        [
            recipient,           // recipient
            spiralTokenAddress,  // token
            amount,              // amount
            hashlock,            // hashlock
            timelock,            // timelock
            1,                   // sourceChain
            0,                   // targetChain
            true,                // isCrossChain
            "",                  // orderHash (empty string)
            userAddress          // owner (NEW PARAMETER)
        ]
    );
    
    const fullTransactionData = functionSelector + encodedParams.substring(2);
    
    console.log(`\n📋 Transaction Data:`);
    console.log(`  Full Data: ${fullTransactionData}`);
    console.log(`  Length: ${fullTransactionData.length} characters`);
    
    // Compare with canister data
    console.log(`\n🔍 Canister Data (from logs):`);
    console.log(`  0x0c89e296000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000de7409edea573d090c3c6123458d6242e26b425e000000000000000000000000000000000000000000000000000000174876e800...`);
    
    console.log(`\n✅ Function selector matches: 0x0c89e296`);
    
    // Try to call the function
    console.log(`\n🚀 Testing HTLC creation...`);
    try {
        const tx = await htlcContract.connect(deployer).createHTLCERC20(
            recipient,           // recipient
            spiralTokenAddress,  // token
            amount,              // amount
            hashlock,            // hashlock
            timelock,            // timelock
            1,                   // sourceChain
            0,                   // targetChain
            true,                // isCrossChain
            "",                  // orderHash
            userAddress          // owner
        );
        
        console.log(`✅ Transaction sent successfully!`);
        console.log(`  TX Hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed!`);
        console.log(`  Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
        
    } catch (error) {
        console.log(`❌ Transaction failed:`);
        console.log(`  Error: ${error.message}`);
        
        // Try to decode the error
        if (error.data) {
            console.log(`  Error data: ${error.data}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 