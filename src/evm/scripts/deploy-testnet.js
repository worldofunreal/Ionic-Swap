const { ethers } = require("hardhat");

// ============================================================================
// DEPLOY TO SPECIFIC TESTNET SCRIPT
// ============================================================================
// Usage: npx hardhat run scripts/deploy-testnet.js --network <network_name>
// Example: npx hardhat run scripts/deploy-testnet.js --network mumbai
// ============================================================================

async function main() {
  const networkName = hre.network.name;
  console.log(`🚀 Deploying contracts to ${networkName}...\n`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  try {
    // Deploy HTLC contract
    console.log("📦 Deploying HTLC contract...");
    const HTLC = await ethers.getContractFactory("HTLC");
    const htlc = await HTLC.deploy();
    await htlc.deployed();
    console.log(`✅ HTLC deployed to: ${htlc.address}`);

    // Deploy Spiral Token
    console.log("📦 Deploying Spiral Token...");
    const SpiralToken = await ethers.getContractFactory("SpiralToken");
    const spiralToken = await SpiralToken.deploy("Spiral Token", "SPIRAL");
    await spiralToken.deployed();
    console.log(`✅ Spiral Token deployed to: ${spiralToken.address}`);

    // Deploy Stardust Token
    console.log("📦 Deploying Stardust Token...");
    const StardustToken = await ethers.getContractFactory("StardustToken");
    const stardustToken = await StardustToken.deploy("Stardust Token", "STARDUST");
    await stardustToken.deployed();
    console.log(`✅ Stardust Token deployed to: ${stardustToken.address}`);

    // Deploy Escrow Factory
    console.log("📦 Deploying Escrow Factory...");
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    const escrowFactory = await EscrowFactory.deploy();
    await escrowFactory.deployed();
    console.log(`✅ Escrow Factory deployed to: ${escrowFactory.address}`);

    // Deploy Bridgeless Token
    console.log("📦 Deploying Bridgeless Token...");
    const BridgelessToken = await ethers.getContractFactory("BridgelessToken");
    const bridgelessToken = await BridgelessToken.deploy();
    await bridgelessToken.deployed();
    console.log(`✅ Bridgeless Token deployed to: ${bridgelessToken.address}`);

    // Print deployment summary
    console.log("\n📊 DEPLOYMENT SUMMARY");
    console.log("=====================");
    console.log(`Network: ${networkName}`);
    console.log(`HTLC: ${htlc.address}`);
    console.log(`Spiral Token: ${spiralToken.address}`);
    console.log(`Stardust Token: ${stardustToken.address}`);
    console.log(`Escrow Factory: ${escrowFactory.address}`);
    console.log(`Bridgeless Token: ${bridgelessToken.address}`);

    // Save deployment results
    const fs = require("fs");
    const deploymentData = {
      network: networkName,
      timestamp: new Date().toISOString(),
      contracts: {
        htlc: htlc.address,
        spiralToken: spiralToken.address,
        stardustToken: stardustToken.address,
        escrowFactory: escrowFactory.address,
        bridgelessToken: bridgelessToken.address
      },
      deployer: deployer.address,
      txHash: htlc.deployTransaction.hash
    };

    const deploymentFile = `deployments/${networkName}-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment results saved to: ${deploymentFile}`);

    // Generate environment variables
    const networkUpper = networkName.toUpperCase();
    let envVars = `# ${networkName} Deployment Results\n`;
    envVars += `${networkUpper}_HTLC_ADDRESS=${htlc.address}\n`;
    envVars += `${networkUpper}_SPIRAL_TOKEN_ADDRESS=${spiralToken.address}\n`;
    envVars += `${networkUpper}_STARDUST_TOKEN_ADDRESS=${stardustToken.address}\n`;
    envVars += `${networkUpper}_ESCROW_FACTORY_ADDRESS=${escrowFactory.address}\n`;
    envVars += `${networkUpper}_BRIDGELESS_TOKEN_ADDRESS=${bridgelessToken.address}\n`;

    const envFile = `deployments/${networkName}-env-${Date.now()}.txt`;
    fs.writeFileSync(envFile, envVars);
    console.log(`📝 Environment variables saved to: ${envFile}`);

  } catch (error) {
    console.error(`❌ Deployment to ${networkName} failed:`, error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

