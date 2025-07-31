const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Funding MinimalForwarder Contract");
    console.log("=====================================");

    // Get the network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "hardhat" : network.name;
    const chainId = network.chainId;
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // Forwarder contract address (from deployment)
    const FORWARDER_ADDRESS = "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC";
    
    console.log(`📦 Forwarder Address: ${FORWARDER_ADDRESS}`);
    
    // Check current forwarder balance
    const forwarderBalance = await ethers.provider.getBalance(FORWARDER_ADDRESS);
    console.log(`💰 Current Forwarder Balance: ${ethers.utils.formatEther(forwarderBalance)} ETH`);
    
    // Amount to send (0.1 ETH)
    const amountToSend = ethers.utils.parseEther("0.1");
    console.log(`💸 Sending: ${ethers.utils.formatEther(amountToSend)} ETH`);
    
    // Send ETH to forwarder
    const tx = await deployer.sendTransaction({
        to: FORWARDER_ADDRESS,
        value: amountToSend,
        gasLimit: 21000
    });
    
    console.log(`⏳ Waiting for transaction confirmation...`);
    console.log(`📋 Transaction hash: ${tx.hash}`);
    
    await tx.wait();
    
    // Check new forwarder balance
    const newForwarderBalance = await ethers.provider.getBalance(FORWARDER_ADDRESS);
    console.log(`💰 New Forwarder Balance: ${ethers.utils.formatEther(newForwarderBalance)} ETH`);
    
    console.log("✅ Forwarder funding completed successfully!");
    console.log("=============================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Funding failed:", error);
        process.exit(1);
    }); 