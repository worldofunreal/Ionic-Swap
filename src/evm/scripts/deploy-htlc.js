const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting EtherlinkHTLC Contract Deployment");
    console.log("=============================================");

    // Get the network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "hardhat" : network.name;
    const chainId = network.chainId;
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // ICP Network Signer Address (placeholder - should be updated with actual ICP signer)
    const icpNetworkSigner = process.env.ICP_NETWORK_SIGNER_ADDRESS || deployer.address;
    console.log(`🔐 ICP Network Signer: ${icpNetworkSigner}`);

    // Deploy the EtherlinkHTLC contract
    console.log("\n📦 Deploying EtherlinkHTLC contract...");
    
    const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
    const etherlinkHTLC = await EtherlinkHTLC.deploy(icpNetworkSigner);
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await etherlinkHTLC.deployed();
    
    console.log(`✅ EtherlinkHTLC deployed to: ${etherlinkHTLC.address}`);
    console.log(`📋 Transaction hash: ${etherlinkHTLC.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(etherlinkHTLC.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Get initial contract state
    console.log("\n📊 Initial Contract State:");
    console.log(`   - ICP Network Signer: ${await etherlinkHTLC.icpNetworkSigner()}`);
    console.log(`   - Claim Fee: ${ethers.utils.formatEther(await etherlinkHTLC.claimFee())} ETH`);
    console.log(`   - Refund Fee: ${ethers.utils.formatEther(await etherlinkHTLC.refundFee())} ETH`);
    console.log(`   - Total Fees Collected: ${ethers.utils.formatEther(await etherlinkHTLC.totalFeesCollected())} ETH`);

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: etherlinkHTLC.address,
        deployer: deployer.address,
        icpNetworkSigner: icpNetworkSigner,
        deploymentTime: new Date().toISOString(),
        transactionHash: etherlinkHTLC.deployTransaction.hash,
        blockNumber: etherlinkHTLC.deployTransaction.blockNumber,
        gasUsed: etherlinkHTLC.deployTransaction.gasLimit?.toString(),
        initialState: {
            icpNetworkSigner: await etherlinkHTLC.icpNetworkSigner(),
            claimFee: ethers.utils.formatEther(await etherlinkHTLC.claimFee()),
            refundFee: ethers.utils.formatEther(await etherlinkHTLC.refundFee()),
            totalFeesCollected: ethers.utils.formatEther(await etherlinkHTLC.totalFeesCollected())
        }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `htlc-${networkName}-${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    // Update deployment summary
    const summaryFile = path.join(deploymentsDir, "deployment-summary.json");
    let summary = {};
    if (fs.existsSync(summaryFile)) {
        summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    }
    
    summary[`${networkName}-${chainId}`] = {
        ...summary[`${networkName}-${chainId}`],
        htlcContract: deploymentInfo
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Deployment summary updated: ${summaryFile}`);

    console.log("\n🔗 Network-specific actions:");
    console.log(`📝 To verify on ${networkName === 'sepolia' ? 'Sepolia' : networkName} Etherscan:`);
    console.log(`   npx hardhat verify --network ${networkName} ${etherlinkHTLC.address} "${icpNetworkSigner}"`);

    console.log("\n🧪 Running basic contract test...");
    console.log(`   ✅ ICP Network Signer: ${await etherlinkHTLC.icpNetworkSigner()}`);
    console.log(`   ✅ Claim Fee: ${ethers.utils.formatEther(await etherlinkHTLC.claimFee())} ETH`);
    console.log(`   ✅ Refund Fee: ${ethers.utils.formatEther(await etherlinkHTLC.refundFee())} ETH`);
    console.log("✅ Contract is ready for use!");

    console.log("\n🎉 Deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${etherlinkHTLC.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🔐 ICP Signer: ${icpNetworkSigner}`);
    console.log("=============================================");

    console.log("\n✅ Deployment script completed successfully");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 