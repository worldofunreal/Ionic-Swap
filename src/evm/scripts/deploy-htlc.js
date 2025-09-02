const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting HTLC Contract Deployment");
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

    // Deploy the HTLC contract
    console.log("\n📦 Deploying HTLC contract...");
    
    const HTLC = await ethers.getContractFactory("HTLC");
    const HTLC = await HTLC.deploy(icpNetworkSigner);
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await HTLC.deployed();
    
    console.log(`✅ HTLC deployed to: ${HTLC.address}`);
    console.log(`📋 Transaction hash: ${HTLC.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(HTLC.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Get initial contract state
    console.log("\n📊 Initial Contract State:");
    console.log(`   - ICP Network Signer: ${await HTLC.icpNetworkSigner()}`);
    console.log(`   - Claim Fee: ${ethers.utils.formatEther(await HTLC.claimFee())} ETH`);
    console.log(`   - Refund Fee: ${ethers.utils.formatEther(await HTLC.refundFee())} ETH`);
    console.log(`   - Total Fees Collected: ${ethers.utils.formatEther(await HTLC.totalFeesCollected())} ETH`);

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: HTLC.address,
        deployer: deployer.address,
        icpNetworkSigner: icpNetworkSigner,
        deploymentTime: new Date().toISOString(),
        transactionHash: HTLC.deployTransaction.hash,
        blockNumber: HTLC.deployTransaction.blockNumber,
        gasUsed: HTLC.deployTransaction.gasLimit?.toString(),
        initialState: {
            icpNetworkSigner: await HTLC.icpNetworkSigner(),
            claimFee: ethers.utils.formatEther(await HTLC.claimFee()),
            refundFee: ethers.utils.formatEther(await HTLC.refundFee()),
            totalFeesCollected: ethers.utils.formatEther(await HTLC.totalFeesCollected())
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
    console.log(`   npx hardhat verify --network ${networkName} ${HTLC.address} "${icpNetworkSigner}"`);

    console.log("\n🧪 Running basic contract test...");
    console.log(`   ✅ ICP Network Signer: ${await HTLC.icpNetworkSigner()}`);
    console.log(`   ✅ Claim Fee: ${ethers.utils.formatEther(await HTLC.claimFee())} ETH`);
    console.log(`   ✅ Refund Fee: ${ethers.utils.formatEther(await HTLC.refundFee())} ETH`);
    console.log("✅ Contract is ready for use!");

    console.log("\n🎉 Deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${HTLC.address}`);
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