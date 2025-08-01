const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🚀 Starting EtherlinkHTLC Contract Deployment");
    console.log("=============================================");
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    const networkName = chainId === 11155111 ? "sepolia" : "unknown";
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    
    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // For testing, use zero address as ICP network signer
    const icpNetworkSigner = "0x0000000000000000000000000000000000000000";
    console.log(`🔐 ICP Network Signer: ${icpNetworkSigner} (zero address for testing)`);
    console.log("");
    
    // Deploy EtherlinkHTLC contract
    console.log("📦 Deploying EtherlinkHTLC contract...");
    
    try {
        const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        const htlcContract = await EtherlinkHTLC.deploy(icpNetworkSigner);
        await htlcContract.deployed();
        
        console.log("✅ EtherlinkHTLC deployed successfully!");
        console.log(`📍 Contract Address: ${htlcContract.address}`);
        console.log(`🔗 Transaction Hash: ${htlcContract.deployTransaction.hash}`);
        
        // Save deployment info
        const deploymentInfo = {
            network: networkName,
            chainId: chainId,
            contractAddress: htlcContract.address,
            deployer: deployer.address,
            icpNetworkSigner: icpNetworkSigner,
            deploymentTime: new Date().toISOString(),
            transactionHash: htlcContract.deployTransaction.hash,
            blockNumber: htlcContract.deployTransaction.blockNumber,
            gasUsed: htlcContract.deployTransaction.gasLimit.toString(),
            initialState: {
                icpNetworkSigner: icpNetworkSigner,
                htlcCounter: "0",
                crossChainSwapCounter: "0",
                totalFeesCollected: "0",
                claimFee: ethers.utils.formatEther(await htlcContract.claimFee()),
                refundFee: ethers.utils.formatEther(await htlcContract.refundFee())
            }
        };
        
        // Save to file
        const filename = `./deployments/htlc-${networkName}-${chainId}.json`;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`💾 Deployment info saved to: ${filename}`);
        
        console.log("");
        console.log("🎉 Deployment completed successfully!");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 