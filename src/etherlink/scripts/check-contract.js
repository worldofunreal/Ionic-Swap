const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking deployed HTLC contract functions...\n");

    // Load deployed contract address
    const htlcDeployment = JSON.parse(require('fs').readFileSync('./deployments/sepolia-11155111.json', 'utf8'));
    const htlcAddress = htlcDeployment.contractAddress;
    
    console.log("📋 HTLC Contract Address:", htlcAddress);
    console.log("");

    // Try to get contract instance
    try {
        const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);
        console.log("✅ Successfully connected to HTLC contract");
        
        // Try to call basic functions
        console.log("\n🔍 Testing basic functions...");
        
        try {
            const htlcCounter = await htlcContract.htlcCounter();
            console.log("  htlcCounter():", htlcCounter.toString());
        } catch (error) {
            console.log("  ❌ htlcCounter() failed:", error.message);
        }
        
        try {
            const icpNetworkSigner = await htlcContract.icpNetworkSigner();
            console.log("  icpNetworkSigner():", icpNetworkSigner);
        } catch (error) {
            console.log("  ❌ icpNetworkSigner() failed:", error.message);
        }
        
        try {
            const claimFee = await htlcContract.claimFee();
            console.log("  claimFee():", ethers.utils.formatEther(claimFee));
        } catch (error) {
            console.log("  ❌ claimFee() failed:", error.message);
        }
        
        try {
            const owner = await htlcContract.owner();
            console.log("  owner():", owner);
        } catch (error) {
            console.log("  ❌ owner() failed:", error.message);
        }
        
        try {
            const isPaused = await htlcContract.paused();
            console.log("  paused():", isPaused);
        } catch (error) {
            console.log("  ❌ paused() failed:", error.message);
        }
        
    } catch (error) {
        console.log("❌ Failed to connect to HTLC contract:", error.message);
        
        // Try to get contract code
        const code = await ethers.provider.getCode(htlcAddress);
        if (code === "0x") {
            console.log("❌ No contract code found at address");
        } else {
            console.log("✅ Contract code exists at address");
            console.log("  Code length:", code.length, "characters");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Check failed:", error);
        process.exit(1);
    }); 