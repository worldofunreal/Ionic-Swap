const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting SpiralToken Deployment");
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

    // Deploy the SpiralToken contract
    console.log("\n📦 Deploying SpiralToken contract...");
    
    const SpiralToken = await ethers.getContractFactory("SpiralToken");
    const spiralToken = await SpiralToken.deploy();
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await spiralToken.deployed();
    
    console.log(`✅ SpiralToken deployed to: ${spiralToken.address}`);
    console.log(`📋 Transaction hash: ${spiralToken.deployTransaction.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    const deployedCode = await ethers.provider.getCode(spiralToken.address);
    if (deployedCode === "0x") {
        throw new Error("Contract deployment failed - no code at address");
    }
    
    console.log("✅ Contract code verified successfully");

    // Get initial contract state
    console.log("\n📊 Initial Contract State:");
    console.log(`   - Name: ${await spiralToken.name()}`);
    console.log(`   - Symbol: ${await spiralToken.symbol()}`);
    console.log(`   - Decimals: ${await spiralToken.decimals()}`);
    console.log(`   - Total Supply: ${ethers.utils.formatUnits(await spiralToken.totalSupply(), await spiralToken.decimals())} SPIRAL`);
    console.log(`   - Deployer Balance: ${ethers.utils.formatUnits(await spiralToken.balanceOf(deployer.address), await spiralToken.decimals())} SPIRAL`);

    // Save deployment information
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        contractAddress: spiralToken.address,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: spiralToken.deployTransaction.hash,
        blockNumber: spiralToken.deployTransaction.blockNumber,
        gasUsed: spiralToken.deployTransaction.gasLimit?.toString(),
        tokenInfo: {
            name: await spiralToken.name(),
            symbol: await spiralToken.symbol(),
            decimals: await spiralToken.decimals(),
            totalSupply: ethers.utils.formatUnits(await spiralToken.totalSupply(), await spiralToken.decimals()),
            deployerBalance: ethers.utils.formatUnits(await spiralToken.balanceOf(deployer.address), await spiralToken.decimals())
        }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `spiral-token-${networkName}-${chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    // Network-specific post-deployment actions
    if (networkName !== "hardhat") {
        console.log("\n🔗 Network-specific actions:");
        
        // For testnets and mainnets, provide verification instructions
        if (chainId === 11155111) { // Sepolia
            console.log("📝 To verify on Sepolia Etherscan:");
            console.log(`   npx hardhat verify --network sepolia ${spiralToken.address}`);
        } else if (chainId === 128123) { // Etherlink Testnet
            console.log("📝 To verify on Etherlink Testnet Explorer:");
            console.log(`   npx hardhat verify --network etherlinkTestnet ${spiralToken.address}`);
        } else if (chainId === 42766) { // Etherlink Mainnet
            console.log("📝 To verify on Etherlink Mainnet Explorer:");
            console.log(`   npx hardhat verify --network etherlinkMainnet ${spiralToken.address}`);
        }
    }

    // Test the contract with a simple interaction
    console.log("\n🧪 Running basic contract test...");
    try {
        // Test basic functionality - check if we can read the contract state
        const name = await spiralToken.name();
        const symbol = await spiralToken.symbol();
        const decimals = await spiralToken.decimals();
        const totalSupply = await spiralToken.totalSupply();
        
        console.log(`   ✅ Name: ${name}`);
        console.log(`   ✅ Symbol: ${symbol}`);
        console.log(`   ✅ Decimals: ${decimals}`);
        console.log(`   ✅ Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)} SPIRAL`);
        
        console.log("✅ Contract is ready for use!");
        
    } catch (error) {
        console.log(`⚠️  Basic test failed: ${error.message}`);
    }

    console.log("\n🎉 Token deployment completed successfully!");
    console.log("=============================================");
    console.log(`📋 Contract Address: ${spiralToken.address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🪙 Token: ${await spiralToken.name()} (${await spiralToken.symbol()})`);
    console.log(`🔢 Decimals: ${await spiralToken.decimals()}`);
    console.log("=============================================");

    return {
        contractAddress: spiralToken.address,
        deployer: deployer.address,
        network: networkName,
        chainId: chainId,
        transactionHash: spiralToken.deployTransaction.hash,
        tokenInfo: {
            name: await spiralToken.name(),
            symbol: await spiralToken.symbol(),
            decimals: await spiralToken.decimals()
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