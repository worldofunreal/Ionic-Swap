const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Europa Hub Deployment");
  console.log("=================================");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Deploy HTLC Contract
  console.log("\n📋 Deploying HTLC Contract...");
  const HTLCContract = await ethers.getContractFactory("HTLCContract");
  const htlc = await HTLCContract.deploy(deployer.address); // icpNetworkSigner
  await htlc.deployed();
  console.log("✅ HTLC Contract deployed to:", htlc.address);

  // Deploy Spiral Token
  console.log("\n📋 Deploying Spiral Token...");
  const SpiralToken = await ethers.getContractFactory("SpiralToken");
  const spiralToken = await SpiralToken.deploy();
  await spiralToken.deployed();
  console.log("✅ Spiral Token deployed to:", spiralToken.address);

  // Deploy Stardust Token
  console.log("\n📋 Deploying Stardust Token...");
  const StardustToken = await ethers.getContractFactory("StardustToken");
  const stardustToken = await StardustToken.deploy();
  await stardustToken.deployed();
  console.log("✅ Stardust Token deployed to:", stardustToken.address);

  // Save deployment info
  const deploymentInfo = {
    network: "Europa Testnet",
    chainId: 1444673419,
    deployer: deployer.address,
    contracts: {
      htlc: htlc.address,
      spiralToken: spiralToken.address,
      stardustToken: stardustToken.address
    },
    deploymentTime: new Date().toISOString(),
    explorer: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com"
  };

  console.log("\n📋 Deployment Summary:");
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Explorer:", deploymentInfo.explorer);
  console.log("\nContract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/europa-testnet.json");
  
  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("Next steps:");
  console.log("1. Verify contracts on Europa explorer");
  console.log("2. Update backend constants with new addresses");
  console.log("3. Test HTLC functionality on Europa");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
