const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting StardustToken Deployment");
    console.log("===================================");

    // Get the network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "hardhat" : network.name;
    const chainId = network.chainId;
    
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // Deploy the StardustToken contract
    console.log("\n📦 Deploying StardustToken contract...");
    
    const StardustToken = await ethers.getContractFactory("StardustToken");
    const stardustToken = await StardustToken.deploy();
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await stardustToken.deployed();
    
    console.log(`✅ StardustToken deployed to: ${stardustToken.address}`);
    console.log(`📋 Transaction hash: ${stardustToken.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(stardustToken.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Get initial contract state
    console.log("\n📊 Initial Contract State:");
    console.log(`   - Name: ${await stardustToken.name()}`);
    console.log(`   - Symbol: ${await stardustToken.symbol()}`);
    console.log(`   - Decimals: ${await stardustToken.decimals()}`);
    console.log(`   - Total Supply: ${ethers.utils.formatUnits(await stardustToken.totalSupply(), await stardustToken.decimals())} STARDUST`);
    console.log(`   - Deployer Balance: ${ethers.utils.formatUnits(await stardustToken.balanceOf(deployer.address), await stardustToken.decimals())} STARDUST`);

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: stardustToken.address,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: stardustToken.deployTransaction.hash,
        blockNumber: stardustToken.deployTransaction.blockNumber,
        gasUsed: stardustToken.deployTransaction.gasLimit?.toString(),
        tokenInfo: {
            name: await stardustToken.name(),
            symbol: await stardustToken.symbol(),
            decimals: await stardustToken.decimals(),
            totalSupply: ethers.utils.formatUnits(await stardustToken.totalSupply(), await stardustToken.decimals()),
            deployerBalance: ethers.utils.formatUnits(await stardustToken.balanceOf(deployer.address), await stardustToken.decimals())
        }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `stardust-token-${networkName}-${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    // Network-specific post-deployment actions
    if (networkName !== "hardhat") {
        console.log("\n🔗 Network-specific actions:");
        
        // For testnets and mainnets, provide verification instructions
        if (chainId === 11155111) { // Sepolia
            console.log("📝 To verify on Sepolia Etherscan:");
            console.log(`   npx hardhat verify --network sepolia ${stardustToken.address}`);
        }
    }

    // Test the contract with a simple interaction
    console.log("\n🧪 Running basic contract test...");
    try {
        // Test basic functionality - check if we can read the contract state
        const name = await stardustToken.name();
        const symbol = await stardustToken.symbol();
        const decimals = await stardustToken.decimals();
        const totalSupply = await stardustToken.totalSupply();
        
        console.log(`   ✅ Name: ${name}`);
        console.log(`   ✅ Symbol: ${symbol}`);
        console.log(`   ✅ Decimals: ${decimals}`);
        console.log(`   ✅ Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)} STARDUST`);
        
        console.log("✅ Contract is ready for use!");
        
    } catch (error) {
        console.log(`⚠️  Basic test failed: ${error.message}`);
    }

    console.log("\n🎉 Token deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${stardustToken.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🪙 Token: ${await stardustToken.name()} (${await stardustToken.symbol()})`);
    console.log(`🔢 Decimals: ${await stardustToken.decimals()}`);
    console.log("=============================================");

    return {
        contractAddress: stardustToken.address,
        deployer: deployer.address,
        network: networkName,
        chainId: chainId,
        transactionHash: stardustToken.deployTransaction.hash,
        tokenInfo: {
            name: await stardustToken.name(),
            symbol: await stardustToken.symbol(),
            decimals: await stardustToken.decimals()
        }
    };
}

// Handle errors
main()
    .then((result) => {
        console.log("\n✅ Token deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Token deployment failed:");
        console.error(error);
        process.exit(1);
    });
