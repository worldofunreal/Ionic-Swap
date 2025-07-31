const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Withdrawing Funds from Old Forwarder Contracts");
    console.log("================================================");

    // Get the network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "hardhat" : network.name;
    const chainId = network.chainId;
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // Forwarder contract addresses to check
    const FORWARDERS = [
        "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC"
    ];
    
    for (const forwarderAddress of FORWARDERS) {
        console.log(`\n🔍 Checking forwarder: ${forwarderAddress}`);
        
        // Check if contract exists
        const contractCode = await ethers.provider.getCode(forwarderAddress);
        if (contractCode === '0x') {
            console.log(`❌ No contract at ${forwarderAddress}`);
            continue;
        }
        
        // Check balance
        const balance = await ethers.provider.getBalance(forwarderAddress);
        console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
        
        if (balance.gt(0)) {
            console.log(`💸 Attempting to withdraw ${ethers.utils.formatEther(balance)} ETH...`);
            
            try {
                // Try to call withdrawFunds if it exists
                const forwarder = new ethers.Contract(forwarderAddress, [
                    "function withdrawFunds(address payable recipient, uint256 amount) external",
                    "function deployer() view returns (address)"
                ], deployer);
                
                const contractDeployer = await forwarder.deployer();
                console.log(`📋 Contract deployer: ${contractDeployer}`);
                
                if (contractDeployer.toLowerCase() === deployer.address.toLowerCase()) {
                    const tx = await forwarder.withdrawFunds(deployer.address, balance);
                    console.log(`⏳ Waiting for withdrawal transaction...`);
                    console.log(`📋 Transaction hash: ${tx.hash}`);
                    
                    await tx.wait();
                    console.log(`✅ Withdrawal successful!`);
                } else {
                    console.log(`❌ You are not the deployer of this contract`);
                }
            } catch (err) {
                console.log(`❌ Withdrawal failed: ${err.message}`);
                console.log(`💡 This contract may not have a withdrawal function`);
            }
        } else {
            console.log(`ℹ️ No funds to withdraw`);
        }
    }
    
    console.log("\n✅ Fund withdrawal check completed!");
    console.log("=====================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Withdrawal failed:", error);
        process.exit(1);
    }); 