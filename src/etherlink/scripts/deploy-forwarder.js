const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting MinimalForwarder Deployment");
    console.log("=========================================");

    // Get the network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "hardhat" : network.name;
    const chainId = network.chainId;
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // Deploy the MinimalForwarder contract
    console.log("\n📦 Deploying MinimalForwarder contract...");
    
    const MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
    const forwarder = await MinimalForwarder.deploy();
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await forwarder.deployed();
    
    console.log(`✅ MinimalForwarder deployed to: ${forwarder.address}`);
    console.log(`📋 Transaction hash: ${forwarder.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(forwarder.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Test the forwarder
    console.log("\n🧪 Testing forwarder functionality...");
    try {
        const nonce = await forwarder.getNonce(deployer.address);
        console.log(`✅ Nonce for deployer: ${nonce}`);
        console.log("✅ Forwarder is ready for meta-transactions!");
    } catch (error) {
        console.log(`⚠️ Forwarder test failed: ${error.message}`);
    }

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: forwarder.address,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: forwarder.deployTransaction.hash,
        blockNumber: forwarder.deployTransaction.blockNumber,
        gasUsed: forwarder.deployTransaction.gasLimit?.toString(),
        contractType: "MinimalForwarder",
        purpose: "EIP-2771 meta-transaction forwarder for gasless approvals"
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `forwarder-${networkName}-${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    console.log("\n🎉 Forwarder deployment completed successfully!");
    console.log("================================================");
    console.log(`📋 Contract Address: ${forwarder.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🔧 Purpose: EIP-2771 meta-transaction forwarder`);
    console.log("================================================");

    return {
        contractAddress: forwarder.address,
        deployer: deployer.address,
        network: networkName,
        chainId: chainId,
        transactionHash: forwarder.deployTransaction.hash
    };
}

// Handle errors
main()
    .then((result) => {
        console.log("\n✅ Forwarder deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Forwarder deployment failed:");
        console.error(error);
        process.exit(1);
    }); 