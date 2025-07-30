const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Etherlink HTLC Contract Deployment");
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
    // For testing, we'll use a placeholder address
    const icpNetworkSigner = process.env.ICP_NETWORK_SIGNER_ADDRESS || deployer.address;
    console.log(`🔐 ICP Network Signer: ${icpNetworkSigner}`);

    // Rescue delays for source and destination chains
    const rescueDelaySrc = process.env.RESCUE_DELAY_SRC || 86400; // 1 day default
    const rescueDelayDst = process.env.RESCUE_DELAY_DST || 86400; // 1 day default
    console.log(`⏰ Rescue Delay Src: ${rescueDelaySrc} seconds`);
    console.log(`⏰ Rescue Delay Dst: ${rescueDelayDst} seconds`);

    // Deploy the EtherlinkEscrowFactory contract
    console.log("\n📦 Deploying EtherlinkEscrowFactory contract...");
    
    const EtherlinkEscrowFactory = await ethers.getContractFactory("EtherlinkEscrowFactory");
    const etherlinkEscrowFactory = await EtherlinkEscrowFactory.deploy(
        icpNetworkSigner,
        rescueDelaySrc,
        rescueDelayDst
    );
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await etherlinkEscrowFactory.deployed();
    
    console.log(`✅ EtherlinkEscrowFactory deployed to: ${etherlinkEscrowFactory.address}`);
    console.log(`📋 Transaction hash: ${etherlinkEscrowFactory.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(etherlinkEscrowFactory.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Get initial contract state
    console.log("\n📊 Initial Contract State:");
    console.log(`   - ICP Network Signer: ${await etherlinkEscrowFactory.icpNetworkSigner()}`);
    console.log(`   - ESCROW_SRC_IMPLEMENTATION: ${await etherlinkEscrowFactory.ESCROW_SRC_IMPLEMENTATION()}`);
    console.log(`   - ESCROW_DST_IMPLEMENTATION: ${await etherlinkEscrowFactory.ESCROW_DST_IMPLEMENTATION()}`);
    console.log(`   - Claim Fee: ${ethers.utils.formatEther(await etherlinkEscrowFactory.claimFee())} ETH`);
    console.log(`   - Refund Fee: ${ethers.utils.formatEther(await etherlinkEscrowFactory.refundFee())} ETH`);
    console.log(`   - Total Fees Collected: ${ethers.utils.formatEther(await etherlinkEscrowFactory.totalFeesCollected())} ETH`);

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: etherlinkEscrowFactory.address,
        deployer: deployer.address,
        icpNetworkSigner: icpNetworkSigner,
        rescueDelaySrc: rescueDelaySrc,
        rescueDelayDst: rescueDelayDst,
        deploymentTime: new Date().toISOString(),
        transactionHash: etherlinkEscrowFactory.deployTransaction.hash,
        blockNumber: etherlinkEscrowFactory.deployTransaction.blockNumber,
        gasUsed: etherlinkEscrowFactory.deployTransaction.gasLimit?.toString(),
        initialState: {
            icpNetworkSigner: await etherlinkEscrowFactory.icpNetworkSigner(),
            escrowSrcImplementation: await etherlinkEscrowFactory.ESCROW_SRC_IMPLEMENTATION(),
            escrowDstImplementation: await etherlinkEscrowFactory.ESCROW_DST_IMPLEMENTATION(),
            claimFee: ethers.utils.formatEther(await etherlinkEscrowFactory.claimFee()),
            refundFee: ethers.utils.formatEther(await etherlinkEscrowFactory.refundFee()),
            totalFeesCollected: ethers.utils.formatEther(await etherlinkEscrowFactory.totalFeesCollected())
        }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}-${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    // Create a summary file
    const summaryFile = path.join(deploymentsDir, "deployment-summary.json");
    let summary = {};
    if (fs.existsSync(summaryFile)) {
        summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
    }
    
    summary[`${networkName}-${chainId}`] = {
        contractAddress: etherlinkEscrowFactory.address,
        deployer: deployer.address,
        deploymentTime: deploymentInfo.deploymentTime,
        transactionHash: deploymentInfo.transactionHash,
        icpNetworkSigner: icpNetworkSigner
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Deployment summary updated: ${summaryFile}`);

    // Network-specific post-deployment actions
    if (networkName !== "hardhat") {
        console.log("\n🔗 Network-specific actions:");
        
        // For testnets and mainnets, provide verification instructions
        if (chainId === 11155111) { // Sepolia
            console.log("📝 To verify on Sepolia Etherscan:");
            console.log(`   npx hardhat verify --network sepolia ${etherlinkEscrowFactory.address} "${icpNetworkSigner}" ${rescueDelaySrc} ${rescueDelayDst}`);
        } else if (chainId === 128123) { // Etherlink Testnet
            console.log("📝 To verify on Etherlink Testnet Explorer:");
            console.log(`   npx hardhat verify --network etherlinkTestnet ${etherlinkEscrowFactory.address} "${icpNetworkSigner}" ${rescueDelaySrc} ${rescueDelayDst}`);
        } else if (chainId === 42766) { // Etherlink Mainnet
            console.log("📝 To verify on Etherlink Mainnet Explorer:");
            console.log(`   npx hardhat verify --network etherlinkMainnet ${etherlinkEscrowFactory.address} "${icpNetworkSigner}" ${rescueDelaySrc} ${rescueDelayDst}`);
        }
    }

    // Test the contract with a simple interaction
    console.log("\n🧪 Running basic contract test...");
    try {
        // Test basic functionality - check if we can read the contract state
        const icpSigner = await etherlinkEscrowFactory.icpNetworkSigner();
        const srcImpl = await etherlinkEscrowFactory.ESCROW_SRC_IMPLEMENTATION();
        const dstImpl = await etherlinkEscrowFactory.ESCROW_DST_IMPLEMENTATION();
        
        console.log(`   ✅ ICP Network Signer: ${icpSigner}`);
        console.log(`   ✅ Source Implementation: ${srcImpl}`);
        console.log(`   ✅ Destination Implementation: ${dstImpl}`);
        
        console.log("✅ Contract is ready for use!");
        
    } catch (error) {
        console.log(`⚠️  Basic test failed: ${error.message}`);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${etherlinkEscrowFactory.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🔐 ICP Signer: ${icpNetworkSigner}`);
    console.log(`⏰ Rescue Delay Src: ${rescueDelaySrc} seconds`);
    console.log(`⏰ Rescue Delay Dst: ${rescueDelayDst} seconds`);
    console.log("=============================================");

    return {
        contractAddress: etherlinkEscrowFactory.address,
        deployer: deployer.address,
        network: networkName,
        chainId: chainId,
        transactionHash: etherlinkEscrowFactory.deployTransaction.hash,
        icpNetworkSigner: icpNetworkSigner
    };
}

// Handle errors
main()
    .then((result) => {
        console.log("\n✅ Deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    }); 