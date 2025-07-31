const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking MinimalForwarder Contract");
    console.log("=====================================");

    // Forwarder contract address
    const FORWARDER_ADDRESS = "0x3C78EB288802D35EB158e4f699481d66613348Fa";
    
    console.log(`📦 Forwarder Address: ${FORWARDER_ADDRESS}`);
    
    // Check if contract exists
    const contractCode = await ethers.provider.getCode(FORWARDER_ADDRESS);
    console.log(`📋 Contract code exists: ${contractCode !== '0x'}`);
    console.log(`📏 Contract code length: ${contractCode.length}`);
    
    if (contractCode === '0x') {
        console.log("❌ No contract code found at address");
        return;
    }
    
    // Check balance
    const balance = await ethers.provider.getBalance(FORWARDER_ADDRESS);
    console.log(`💰 Contract balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Try to call getNonce function
    try {
        const forwarder = new ethers.Contract(FORWARDER_ADDRESS, [
            "function getNonce(address from) view returns (uint256)"
        ], ethers.provider);
        
        const [deployer] = await ethers.getSigners();
        const nonce = await forwarder.getNonce(deployer.address);
        console.log(`✅ getNonce function works: ${nonce.toString()}`);
    } catch (err) {
        console.log(`❌ getNonce function failed: ${err.message}`);
    }
    
    console.log("✅ Contract check completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Check failed:", error);
        process.exit(1);
    }); 