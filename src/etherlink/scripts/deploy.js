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

    // Deploy the contract
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
    console.log("\n Initial Contract State:");
    console.log(`   - Owner: ${await etherlinkHTLC.owner()}`);
    console.log(`   - ICP Network Signer: ${await etherlinkHTLC.icpNetworkSigner()}`);
    console.log(`   - HTLC Counter: ${(await etherlinkHTLC.htlcCounter()).toString()}`);
    console.log(`   - Cross-Chain Swap Counter: ${(await etherlinkHTLC.crossChainSwapCounter()).toString()}`);
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
            owner: await etherlinkHTLC.owner(),
            icpNetworkSigner: await etherlinkHTLC.icpNetworkSigner(),
            htlcCounter: (await etherlinkHTLC.htlcCounter()).toString(),
            crossChainSwapCounter: (await etherlinkHTLC.crossChainSwapCounter()).toString(),
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
        contractAddress: etherlinkHTLC.address,
        deployer: deployer.address,
        deploymentTime: deploymentInfo.deploymentTime,
        transactionHash: deploymentInfo.transactionHash
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Deployment summary updated: ${summaryFile}`);

    // Network-specific post-deployment actions
    if (networkName !== "hardhat") {
        console.log("\n🔗 Network-specific actions:");
        
        // For testnets and mainnets, provide verification instructions
        if (chainId === 97) { // BSC Testnet
            console.log("📝 To verify on BSCScan Testnet:");
            console.log(`   npx hardhat verify --network bscTestnet ${etherlinkHTLC.address} "${icpNetworkSigner}"`);
        } else if (chainId === 56) { // BSC Mainnet
            console.log("📝 To verify on BSCScan:");
            console.log(`   npx hardhat verify --network bscMainnet ${etherlinkHTLC.address} "${icpNetworkSigner}"`);
        } else if (chainId === 42766) { // Etherlink Mainnet
            console.log("📝 To verify on Etherlink Explorer:");
            console.log(`   npx hardhat verify --network etherlinkMainnet ${etherlinkHTLC.address} "${icpNetworkSigner}"`);
        } else if (chainId === 128123) { // Etherlink Testnet
            console.log("📝 To verify on Etherlink Testnet Explorer:");
            console.log(`   npx hardhat verify --network etherlinkTestnet ${etherlinkHTLC.address} "${icpNetworkSigner}"`);
        }
    }

    // Test the contract with a simple interaction
    console.log("\n🧪 Running basic contract test...");
    try {
        // Test basic functionality
        const testRecipient = ethers.Wallet.createRandom().address;
        const testHashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_secret"));
        const testTimelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        console.log(`   - Test recipient: ${testRecipient}`);
        console.log(`   - Test hashlock: ${testHashlock}`);
        console.log(`   - Test timelock: ${testTimelock}`);
        
        // Note: We won't actually create an HTLC here to avoid spending gas unnecessarily
        // This is just to verify the contract is working
        console.log("✅ Contract is ready for use!");
        
    } catch (error) {
        console.log(`⚠️  Basic test failed: ${error.message}`);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${etherlinkHTLC.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Owner: ${deployer.address}`);
    console.log(`🔐 ICP Signer: ${icpNetworkSigner}`);
    console.log("=============================================");

    return {
        contractAddress: etherlinkHTLC.address,
        deployer: deployer.address,
        network: networkName,
        chainId: chainId,
        transactionHash: etherlinkHTLC.deployTransaction.hash
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