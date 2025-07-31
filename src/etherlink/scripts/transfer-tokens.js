const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔄 Spiral Token Transfer Script");
    console.log("================================");

    // Load deployment info
    const deploymentFile = path.join(__dirname, "..", "deployments", "spiral-token-sepolia-11155111.json");
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    
    const tokenAddress = deploymentInfo.contractAddress;
    console.log(`📋 Token Address: ${tokenAddress}`);

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // Load the SpiralToken contract
    const SpiralToken = await ethers.getContractFactory("SpiralToken");
    const spiralToken = SpiralToken.attach(tokenAddress);

    // Check deployer balance
    const deployerBalance = await spiralToken.balanceOf(deployer.address);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatUnits(deployerBalance, 8)} SPIRAL`);

    // Transfer tokens to another address
    const recipientAddress = "0xRECIPIENT_ADDRESS_HERE"; // Replace with actual address
    const transferAmount = ethers.utils.parseUnits("1000", 8); // 1000 SPIRAL tokens

    console.log(`\n📤 Transferring ${ethers.utils.formatUnits(transferAmount, 8)} SPIRAL to: ${recipientAddress}`);

    try {
        const tx = await spiralToken.transfer(recipientAddress, transferAmount);
        console.log(`⏳ Transaction hash: ${tx.hash}`);
        
        await tx.wait();
        console.log("✅ Transfer completed successfully!");

        // Check new balances
        const newDeployerBalance = await spiralToken.balanceOf(deployer.address);
        const recipientBalance = await spiralToken.balanceOf(recipientAddress);
        
        console.log(`\n📊 Updated Balances:`);
        console.log(`   Deployer: ${ethers.utils.formatUnits(newDeployerBalance, 8)} SPIRAL`);
        console.log(`   Recipient: ${ethers.utils.formatUnits(recipientBalance, 8)} SPIRAL`);

    } catch (error) {
        console.error("❌ Transfer failed:", error.message);
    }
}

// Handle errors
main()
    .then(() => {
        console.log("\n✅ Transfer script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Transfer script failed:");
        console.error(error);
        process.exit(1);
    }); 