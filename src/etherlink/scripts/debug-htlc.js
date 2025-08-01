const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging HTLC creation failure...\n");

    // Get signers
    const [deployer] = await ethers.getSigners();
    const user = deployer;

    // Load deployed contract addresses
    const htlcDeployment = JSON.parse(require('fs').readFileSync('./deployments/sepolia-11155111.json', 'utf8'));
    const spiralDeployment = JSON.parse(require('fs').readFileSync('./deployments/spiral-token-sepolia-11155111.json', 'utf8'));
    
    const htlcAddress = htlcDeployment.contractAddress;
    const spiralTokenAddress = spiralDeployment.contractAddress;
    
    console.log("📋 Contract Addresses:");
    console.log("  HTLC Contract:", htlcAddress);
    console.log("  SpiralToken:", spiralTokenAddress);
    console.log("");

    // Get contract instances
    const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);
    const spiralToken = await ethers.getContractAt("SpiralToken", spiralTokenAddress);

    // Test parameters
    const userAmount = ethers.utils.parseUnits("1000", 8);
    const timelock = Math.floor(Date.now() / 1000) + 3600;
    const secret = ethers.utils.randomBytes(32);
    const hashlock = ethers.utils.keccak256(secret);

    console.log("📋 Test Parameters:");
    console.log("  User Amount:", ethers.utils.formatUnits(userAmount, 8), "Spiral");
    console.log("  Timelock:", new Date(timelock * 1000).toISOString());
    console.log("  Hashlock:", hashlock);
    console.log("");

    // Check user's Spiral token balance
    const userBalance = await spiralToken.balanceOf(user.address);
    console.log("💰 User Spiral balance:", ethers.utils.formatUnits(userBalance, 8));

    // Check HTLC contract allowance
    const allowance = await spiralToken.allowance(user.address, htlcAddress);
    console.log("✅ HTLC allowance:", ethers.utils.formatUnits(allowance, 8));

    // Check if HTLC contract is paused
    const isPaused = await htlcContract.paused();
    console.log("⏸️  HTLC contract paused:", isPaused);

    // Check HTLC contract owner
    const owner = await htlcContract.owner();
    console.log("👑 HTLC contract owner:", owner);

    // Check if user has enough balance
    if (userBalance.lt(userAmount)) {
        console.log("❌ User doesn't have enough Spiral tokens!");
        return;
    }

    // Check if allowance is sufficient
    if (allowance.lt(userAmount)) {
        console.log("❌ HTLC contract doesn't have enough allowance!");
        return;
    }

    console.log("✅ All checks passed. The issue might be in the contract logic.");
    console.log("");

    // Try to simulate the transaction
    console.log("🔍 Simulating HTLC creation...");
    try {
        const tx = await htlcContract.connect(user).createHTLCERC20(
            user.address, // recipient (same as sender for testing)
            spiralTokenAddress, // token
            userAmount, // amount
            hashlock, // hashlock
            timelock, // timelock
            1, // sourceChain (Etherlink)
            0, // targetChain (ICP)
            true, // isCrossChain
            "test_order_1" // orderHash
        );
        
        console.log("✅ Transaction simulation successful!");
        console.log("  TX Hash:", tx.hash);
    } catch (error) {
        console.log("❌ Transaction simulation failed:");
        console.log("  Error:", error.message);
        
        // Try to decode the error
        if (error.data) {
            console.log("  Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    }); 