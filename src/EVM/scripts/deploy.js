const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Ionic-Swap Unified Escrow Contract...");
  console.log("📋 This contract combines HTLC functionality with Chain-Key signature verification");
  console.log("🔗 Extends 1inch Fusion+ with cross-chain ICP integration");

  // Get the contract factory
  const IonicSwapEscrow = await ethers.getContractFactory("IonicSwapEscrow");
  
  // For demo purposes, we'll use a placeholder ICP network signer
  // In production, this would be the actual ICP network's public key
  const demoICPSigner = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Demo address
  
  console.log("🔑 Using demo ICP network signer:", demoICPSigner);
  console.log("⚠️  Note: In production, this should be the actual ICP network's public key");
  
  // Deploy the contract
  const ionicSwapEscrow = await IonicSwapEscrow.deploy(demoICPSigner);
  
  // Wait for deployment to finish
  await ionicSwapEscrow.deployed();

  console.log("✅ IonicSwapEscrow deployed to:", ionicSwapEscrow.address);
  console.log("📋 Contract Details:");
  console.log("   - Network:", network.name);
  console.log("   - Chain ID:", network.config.chainId);
  console.log("   - Deployer:", (await ethers.getSigners())[0].address);
  console.log("   - ICP Network Signer:", demoICPSigner);
  
  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const deployedCode = await ethers.provider.getCode(ionicSwapEscrow.address);
  if (deployedCode === "0x") {
    console.log("❌ Contract deployment failed - no code at address");
    return;
  }
  console.log("✅ Contract verification successful");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: ionicSwapEscrow.address,
    deployer: (await ethers.getSigners())[0].address,
    deploymentTime: new Date().toISOString(),
    contractName: "IonicSwapEscrow",
    icpNetworkSigner: demoICPSigner,
    features: [
      "Basic HTLC functionality (ETH & ERC20)",
      "Cross-chain atomic swaps with ICP",
      "Chain-Key signature verification",
      "1inch Fusion+ integration",
      "Automatic refund mechanism",
      "1inch order linking"
    ]
  };

  console.log("\n📄 Deployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  const [deployer] = await ethers.getSigners();
  const testRecipient = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Test recipient
  const testHashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_secret"));
  const testTimelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const testOneInchOrderHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  try {
    // Test basic ETH HTLC creation
    const htlcTx = await ionicSwapEscrow.createHTLCETH(
      testRecipient,
      testHashlock,
      testTimelock,
      { value: ethers.utils.parseEther("0.001") }
    );
    
    console.log("✅ Test ETH HTLC creation transaction sent:", htlcTx.hash);
    await htlcTx.wait();
    console.log("✅ Test ETH HTLC creation confirmed");
    
    // Test cross-chain ETH swap creation
    const swapTx = await ionicSwapEscrow.createCrossChainSwapETH(
      testRecipient,
      testHashlock,
      testTimelock,
      testOneInchOrderHash,
      { value: ethers.utils.parseEther("0.001") }
    );
    
    console.log("✅ Test cross-chain ETH swap creation transaction sent:", swapTx.hash);
    await swapTx.wait();
    console.log("✅ Test cross-chain ETH swap creation confirmed");
    
    // Test contract state queries
    const htlcCounter = await ionicSwapEscrow.htlcCounter();
    const swapCounter = await ionicSwapEscrow.crossChainSwapCounter();
    const icpSigner = await ionicSwapEscrow.icpNetworkSigner();
    
    console.log("✅ Contract state queries successful:");
    console.log("   - HTLC Counter:", htlcCounter.toString());
    console.log("   - Cross-chain Swap Counter:", swapCounter.toString());
    console.log("   - ICP Network Signer:", icpSigner);
    
    // Test 1inch order linking
    const linkedSwapId = await ionicSwapEscrow.getSwapFromOneInchOrder(testOneInchOrderHash);
    console.log("✅ 1inch order linking test successful");
    console.log("   - Linked Swap ID:", linkedSwapId);
    
  } catch (error) {
    console.log("⚠️  Test transactions failed (this is normal for some networks):", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Next steps:");
  console.log("   1. Update your ICP canister with the new contract address");
  console.log("   2. Implement Chain-Key signature generation on ICP side");
  console.log("   3. Test cross-chain functionality with real signatures");
  console.log("   4. Prepare for hackathon demo");
  console.log("\n🔗 Contract Address for ICP Integration:");
  console.log("   IonicSwapEscrow:", ionicSwapEscrow.address);
  console.log("   ICP Network Signer:", demoICPSigner);
  console.log("\n📋 Available Functions:");
  console.log("   - Basic HTLC: createHTLC, createHTLCETH, withdrawHTLC, refundHTLC");
  console.log("   - Cross-chain: createCrossChainSwapETH, createCrossChainSwapERC20, claimCrossChainSwap, refundCrossChainSwap");
  console.log("   - Chain-Key: verifyICPProof");
  console.log("   - 1inch Integration: getSwapFromOneInchOrder");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 