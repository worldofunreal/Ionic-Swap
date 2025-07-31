const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Meta-Transaction contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MetaTransaction contract first
  console.log("Deploying MetaTransaction contract...");
  const MetaTransaction = await ethers.getContractFactory("MetaTransaction");
  const metaTransaction = await MetaTransaction.deploy();
  await metaTransaction.waitForDeployment();
  console.log("MetaTransaction deployed to:", await metaTransaction.getAddress());

  // Deploy HTLC contract with meta-transaction support
  console.log("Deploying EtherlinkHTLCWithMetaTx contract...");
  const EtherlinkHTLCWithMetaTx = await ethers.getContractFactory("EtherlinkHTLCWithMetaTx");
  
  // For demo purposes, use deployer as ICP network signer
  // In production, this should be a proper ICP network signer address
  const icpNetworkSigner = deployer.address;
  
  const htlcContract = await EtherlinkHTLCWithMetaTx.deploy(icpNetworkSigner);
  await htlcContract.waitForDeployment();
  console.log("EtherlinkHTLCWithMetaTx deployed to:", await htlcContract.getAddress());

  // Deploy test token if needed
  console.log("Deploying MockERC20 token...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Test Token", "TEST");
  await mockToken.waitForDeployment();
  console.log("MockERC20 deployed to:", await mockToken.getAddress());

  // Mint some tokens to deployer for testing
  const mintAmount = ethers.parseEther("1000000"); // 1M tokens
  await mockToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${ethers.formatEther(mintAmount)} tokens to deployer`);

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      metaTransaction: await metaTransaction.getAddress(),
      htlcContract: await htlcContract.getAddress(),
      mockToken: await mockToken.getAddress(),
      icpNetworkSigner: icpNetworkSigner
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("MetaTransaction:", deploymentInfo.contracts.metaTransaction);
  console.log("HTLC Contract:", deploymentInfo.contracts.htlcContract);
  console.log("Mock Token:", deploymentInfo.contracts.mockToken);
  console.log("ICP Network Signer:", deploymentInfo.contracts.icpNetworkSigner);

  // Verify contracts on Etherscan (if on public network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: await metaTransaction.getAddress(),
        constructorArguments: [],
      });
      console.log("MetaTransaction verified on Etherscan");
    } catch (error) {
      console.log("MetaTransaction verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await htlcContract.getAddress(),
        constructorArguments: [icpNetworkSigner],
      });
      console.log("EtherlinkHTLCWithMetaTx verified on Etherscan");
    } catch (error) {
      console.log("EtherlinkHTLCWithMetaTx verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await mockToken.getAddress(),
        constructorArguments: ["Test Token", "TEST"],
      });
      console.log("MockERC20 verified on Etherscan");
    } catch (error) {
      console.log("MockERC20 verification failed:", error.message);
    }
  }

  // Test basic functionality
  console.log("\n=== Testing Basic Functionality ===");
  
  // Test getting nonce
  const nonce = await htlcContract.getNonce(deployer.address);
  console.log("Initial nonce for deployer:", nonce.toString());

  // Test getting claim fee
  const claimFee = await htlcContract.claimFee();
  console.log("Claim fee:", ethers.formatEther(claimFee), "ETH");

  // Test getting refund fee
  const refundFee = await htlcContract.refundFee();
  console.log("Refund fee:", ethers.formatEther(refundFee), "ETH");

  // Test getting ICP network signer
  const signer = await htlcContract.icpNetworkSigner();
  console.log("ICP Network Signer:", signer);

  console.log("\n=== Deployment Complete ===");
  console.log("Update your frontend configuration with these addresses:");
  console.log(`HTLC_CONTRACT_ADDRESS: "${await htlcContract.getAddress()}"`);
  console.log(`TEST_TOKEN_ADDRESS: "${await mockToken.getAddress()}"`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 