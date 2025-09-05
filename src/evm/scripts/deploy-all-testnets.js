const { ethers } = require("hardhat");

// ============================================================================
// DEPLOY ALL TESTNETS SCRIPT
// ============================================================================
// This script deploys our core contracts to all configured testnet networks
// ============================================================================

async function main() {
  console.log("🚀 Starting deployment to all testnet networks...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  // Define all testnet networks
  const testnets = [
    { name: "Sepolia", network: "sepolia" },
    { name: "Holesky", network: "holesky" },
    { name: "Mumbai", network: "mumbai" },
    { name: "Amoy", network: "amoy" },
    { name: "BSC Testnet", network: "bscTestnet" },
    { name: "Arbitrum Sepolia", network: "arbitrumSepolia" },
    { name: "Optimism Sepolia", network: "optimismSepolia" },
    { name: "Base Sepolia", network: "baseSepolia" }
  ];

  const deploymentResults = {};

  for (const testnet of testnets) {
    try {
      console.log(`🌐 Deploying to ${testnet.name}...`);
      
      // Switch to the testnet network
      await hre.changeNetwork(testnet.network);
      
      // Deploy HTLC contract
      const HTLC = await ethers.getContractFactory("HTLC");
      const htlc = await HTLC.deploy();
      await htlc.deployed();
      
      // Deploy Spiral Token
      const SpiralToken = await ethers.getContractFactory("SpiralToken");
      const spiralToken = await SpiralToken.deploy("Spiral Token", "SPIRAL");
      await spiralToken.deployed();
      
      // Deploy Stardust Token
      const StardustToken = await ethers.getContractFactory("StardustToken");
      const stardustToken = await StardustToken.deploy("Stardust Token", "STARDUST");
      await stardustToken.deployed();
      
      // Deploy Escrow Factory
      const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
      const escrowFactory = await EscrowFactory.deploy();
      await escrowFactory.deployed();
      
      // Deploy Bridgeless Token
      const BridgelessToken = await ethers.getContractFactory("BridgelessToken");
      const bridgelessToken = await BridgelessToken.deploy();
      await bridgelessToken.deployed();
      
      // Store deployment results
      deploymentResults[testnet.network] = {
        network: testnet.name,
        htlc: htlc.address,
        spiralToken: spiralToken.address,
        stardustToken: stardustToken.address,
        escrowFactory: escrowFactory.address,
        bridgelessToken: bridgelessToken.address,
        txHash: htlc.deployTransaction.hash
      };
      
      console.log(`✅ ${testnet.name} deployment successful!`);
      console.log(`   HTLC: ${htlc.address}`);
      console.log(`   Spiral Token: ${spiralToken.address}`);
      console.log(`   Stardust Token: ${stardustToken.address}`);
      console.log(`   Escrow Factory: ${escrowFactory.address}`);
      console.log(`   Bridgeless Token: ${bridgelessToken.address}\n`);
      
    } catch (error) {
      console.log(`❌ ${testnet.name} deployment failed: ${error.message}\n`);
      deploymentResults[testnet.network] = {
        network: testnet.name,
        error: error.message
      };
    }
  }

  // Print deployment summary
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=====================");
  
  for (const [network, result] of Object.entries(deploymentResults)) {
    if (result.error) {
      console.log(`❌ ${result.network}: FAILED - ${result.error}`);
    } else {
      console.log(`✅ ${result.network}: SUCCESS`);
      console.log(`   HTLC: ${result.htlc}`);
      console.log(`   Spiral: ${result.spiralToken}`);
      console.log(`   Stardust: ${result.stardustToken}`);
      console.log(`   Factory: ${result.escrowFactory}`);
      console.log(`   Bridgeless: ${result.bridgelessToken}`);
    }
    console.log("");
  }

  // Save deployment results to file
  const fs = require("fs");
  const deploymentFile = `deployments/all-testnets-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));
  console.log(`💾 Deployment results saved to: ${deploymentFile}`);

  // Generate environment file template
  let envTemplate = "# ============================================================================\n";
  envTemplate += "# DEPLOYMENT RESULTS - COPY TO .env\n";
  envTemplate += "# ============================================================================\n\n";
  
  for (const [network, result] of Object.entries(deploymentResults)) {
    if (!result.error) {
      const networkUpper = network.toUpperCase();
      envTemplate += `# ${result.network}\n`;
      envTemplate += `${networkUpper}_HTLC_ADDRESS=${result.htlc}\n`;
      envTemplate += `${networkUpper}_SPIRAL_TOKEN_ADDRESS=${result.spiralToken}\n`;
      envTemplate += `${networkUpper}_STARDUST_TOKEN_ADDRESS=${result.stardustToken}\n`;
      envTemplate += `${networkUpper}_ESCROW_FACTORY_ADDRESS=${result.escrowFactory}\n`;
      envTemplate += `${networkUpper}_BRIDGELESS_TOKEN_ADDRESS=${result.bridgelessToken}\n\n`;
    }
  }
  
  const envFile = `deployments/env-template-${Date.now()}.txt`;
  fs.writeFileSync(envFile, envTemplate);
  console.log(`📝 Environment template saved to: ${envFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

