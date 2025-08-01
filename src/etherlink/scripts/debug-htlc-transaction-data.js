const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🔍 Debugging HTLC Transaction Data");
    console.log("===================================");

    const [deployer] = await ethers.getSigners();
    console.log(`📋 Deployer: ${deployer.address}`);

    // Load deployed contract addresses
    const htlcDeployment = JSON.parse(fs.readFileSync('./deployments/htlc-sepolia-11155111.json', 'utf8'));
    const spiralDeployment = JSON.parse(fs.readFileSync('./deployments/spiral-token-sepolia-11155111.json', 'utf8'));
    
    const htlcAddress = htlcDeployment.contractAddress;
    const spiralTokenAddress = spiralDeployment.contractAddress;
    const stardustTokenAddress = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90";
    
    console.log(`📋 Contract Addresses:`);
    console.log(`  HTLC Contract: ${htlcAddress}`);
    console.log(`  SpiralToken: ${spiralTokenAddress}`);
    console.log(`  StardustToken: ${stardustTokenAddress}`);

    // Get contract instances
    const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);
    const spiralToken = await ethers.getContractAt("SpiralToken", spiralTokenAddress);
    const stardustToken = await ethers.getContractAt("StardustToken", stardustTokenAddress);

    // Test parameters
    const amount = ethers.utils.parseUnits("1000", 8); // 1000 tokens
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const secret = "htlc_secret_debug_test";
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    const recipient = deployer.address;

    console.log(`\n📋 Test Parameters:`);
    console.log(`  Amount: ${ethers.utils.formatUnits(amount, 8)}`);
    console.log(`  Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
    console.log(`  Secret: ${secret}`);
    console.log(`  Hashlock: ${hashlock}`);
    console.log(`  Recipient: ${recipient}`);

    // Check balances
    const deployerSpiralBalance = await spiralToken.balanceOf(deployer.address);
    console.log(`\n💰 Deployer Spiral Balance: ${ethers.utils.formatUnits(deployerSpiralBalance, 8)}`);

    // Step 1: Approve HTLC contract to spend tokens
    console.log(`\n🔐 Step 1: Approving HTLC contract to spend tokens...`);
    const approvalTx = await spiralToken.connect(deployer).approve(htlcAddress, amount);
    console.log(`  Approval TX Hash: ${approvalTx.hash}`);
    
    // Get approval transaction data
    const approvalData = approvalTx.data;
    console.log(`  Approval Data: ${approvalData}`);
    
    // Decode approval data
    const approvalInterface = new ethers.utils.Interface([
        "function approve(address spender, uint256 amount)"
    ]);
    const approvalDecoded = approvalInterface.parseTransaction({ data: approvalData });
    console.log(`  Approval Decoded:`);
    console.log(`    Spender: ${approvalDecoded.args[0]}`);
    console.log(`    Amount: ${approvalDecoded.args[1].toString()}`);

    await approvalTx.wait();
    console.log(`  ✅ Approval confirmed`);

    // Step 2: Create HTLC
    console.log(`\n🔒 Step 2: Creating HTLC...`);
    
    // Get current nonce
    const nonce = await deployer.getTransactionCount();
    console.log(`  Current Nonce: ${nonce}`);
    
    // Get gas price
    const gasPrice = await deployer.provider.getGasPrice();
    console.log(`  Gas Price: ${gasPrice.toString()}`);
    
    // Create HTLC transaction
    const htlcTx = await htlcContract.connect(deployer).createHTLCERC20(
        recipient, // recipient
        spiralTokenAddress, // token
        amount, // amount
        hashlock, // hashlock
        timelock, // timelock
        1, // sourceChain (Etherlink)
        0, // targetChain (ICP)
        true, // isCrossChain
        "", // orderHash
        { gasLimit: 500000 }
    );
    
    console.log(`  HTLC TX Hash: ${htlcTx.hash}`);
    console.log(`  HTLC Data: ${htlcTx.data}`);
    
    // Decode HTLC creation data
    const htlcInterface = new ethers.utils.Interface([
        "function createHTLCERC20(address recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock, uint8 sourceChain, uint8 targetChain, bool isCrossChain, string orderHash)"
    ]);
    const htlcDecoded = htlcInterface.parseTransaction({ data: htlcTx.data });
    console.log(`  HTLC Decoded:`);
    console.log(`    Recipient: ${htlcDecoded.args[0]}`);
    console.log(`    Token: ${htlcDecoded.args[1]}`);
    console.log(`    Amount: ${htlcDecoded.args[2].toString()}`);
    console.log(`    Hashlock: ${htlcDecoded.args[3]}`);
    console.log(`    Timelock: ${htlcDecoded.args[4].toString()}`);
    console.log(`    SourceChain: ${htlcDecoded.args[5]}`);
    console.log(`    TargetChain: ${htlcDecoded.args[6]}`);
    console.log(`    IsCrossChain: ${htlcDecoded.args[7]}`);
    console.log(`    OrderHash: ${htlcDecoded.args[8]}`);

    // Wait for transaction
    const receipt = await htlcTx.wait();
    console.log(`  ✅ HTLC created successfully!`);
    console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`  Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);

    // Get HTLC ID from logs
    if (receipt.logs.length > 0) {
        console.log(`\n📋 Transaction Logs:`);
        receipt.logs.forEach((log, index) => {
            console.log(`  Log ${index}:`);
            console.log(`    Address: ${log.address}`);
            console.log(`    Topics: ${log.topics.join(', ')}`);
            console.log(`    Data: ${log.data}`);
        });
    }

    // Verify HTLC was created
    const htlcId = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'bytes32', 'uint256'],
            [deployer.address, spiralTokenAddress, amount, hashlock, timelock]
        )
    );
    console.log(`\n🔍 HTLC ID: ${htlcId}`);
    
    // Get HTLC details
    const htlcDetails = await htlcContract.getHTLC(htlcId);
    console.log(`\n📋 HTLC Details:`);
    console.log(`  Recipient: ${htlcDetails.recipient}`);
    console.log(`  Token: ${htlcDetails.token}`);
    console.log(`  Amount: ${htlcDetails.amount.toString()}`);
    console.log(`  Hashlock: ${htlcDetails.hashlock}`);
    console.log(`  Timelock: ${htlcDetails.timelock.toString()}`);
    console.log(`  Status: ${htlcDetails.status}`);
    console.log(`  Secret: ${htlcDetails.secret}`);

    console.log(`\n🎉 Debug complete!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 