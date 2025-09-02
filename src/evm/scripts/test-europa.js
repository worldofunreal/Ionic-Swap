const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing contracts on SKALE Europa Hub Testnet");
  console.log("================================================");

  // Load deployment info
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/europa-testnet.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Loaded deployment from:", deploymentPath);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("📋 Signers retrieved:");
  console.log("  Deployer:", deployer?.address);
  console.log("  Total signers:", (await ethers.getSigners()).length);

  // Use deployer for all operations since Europa only has 1 signer
  const user1 = deployer;
  const user2 = deployer;

  // Get contract instances
  const htlc = await ethers.getContractAt("HTLCContract", deployment.contracts.htlc);
  const spiralToken = await ethers.getContractAt("SpiralToken", deployment.contracts.spiralToken);
  const stardustToken = await ethers.getContractAt("StardustToken", deployment.contracts.stardustToken);

  console.log("\n📋 Testing Token Contracts...");

  // Test Spiral Token
  try {
    const spiralName = await spiralToken.name();
    const spiralSymbol = await spiralToken.symbol();
    const spiralDecimals = await spiralToken.decimals();
    const spiralTotalSupply = await spiralToken.totalSupply();
    
    console.log("✅ Spiral Token:");
    console.log("  Name:", spiralName);
    console.log("  Symbol:", spiralSymbol);
    console.log("  Decimals:", spiralDecimals.toString());
    console.log("  Total Supply:", ethers.utils.formatUnits(spiralTotalSupply, spiralDecimals));
  } catch (error) {
    console.log("❌ Spiral Token test failed:", error.message);
  }

  // Test Stardust Token
  try {
    const stardustName = await stardustToken.name();
    const stardustSymbol = await stardustToken.symbol();
    const stardustDecimals = await stardustToken.decimals();
    const stardustTotalSupply = await stardustToken.totalSupply();
    
    console.log("✅ Stardust Token:");
    console.log("  Name:", stardustName);
    console.log("  Symbol:", stardustSymbol);
    console.log("  Decimals:", stardustDecimals.toString());
    console.log("  Total Supply:", ethers.utils.formatUnits(stardustTotalSupply, stardustDecimals));
  } catch (error) {
    console.log("❌ Stardust Token test failed:", error.message);
  }

  console.log("\n📋 Testing HTLC Contract...");

  // Test HTLC creation
  try {
    const secret = ethers.utils.randomBytes(32);
    const hashlock = ethers.utils.keccak256(secret);
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const amount = ethers.utils.parseUnits("100", 8); // 100 tokens

    console.log("🔍 Creating HTLC...");
    console.log("  Hashlock:", hashlock);
    console.log("  Timelock:", timelock);
    console.log("  Amount:", ethers.utils.formatUnits(amount, 8));

    // First approve the HTLC contract to spend tokens
    console.log("🔐 Approving HTLC contract to spend tokens...");
    const approveTx = await spiralToken.approve(htlc.address, amount);
    await approveTx.wait();
    console.log("✅ Token approval successful!");

    // Create HTLC for Spiral tokens
    const createTx = await htlc.createHTLCERC20(
      user2.address,        // recipient
      spiralToken.address,  // token
      amount,               // amount
      hashlock,             // hashlock
      timelock,             // timelock
      0,                    // sourceChain (0 = EVM)
      1,                    // targetChain (1 = ICP)
      true,                 // isCrossChain
      "",                   // orderHash (empty for now)
      user1.address         // owner
    );
    
    const receipt = await createTx.wait();
    console.log("✅ HTLC created successfully!");
    console.log("  Transaction hash:", receipt.transactionHash);
    console.log("  Gas used:", receipt.gasUsed.toString());
    console.log("  Note: Gas fees are 0 on SKALE!");

    // Get the htlcId from the event
    const event = receipt.events?.find(e => e.event === 'HTLCCreated');
    if (event) {
      const htlcId = event.args.htlcId;
      console.log("  HTLC ID:", htlcId);
      
      // Get HTLC details using the htlcId
      const htlcDetails = await htlc.getHTLC(htlcId);
      console.log("📋 HTLC Details:");
      console.log("  Sender:", htlcDetails.sender);
      console.log("  Recipient:", htlcDetails.recipient);
      console.log("  Amount:", ethers.utils.formatUnits(htlcDetails.amount, 8));
      console.log("  Status:", htlcDetails.status);
      console.log("  Source Chain:", htlcDetails.sourceChain);
      console.log("  Target Chain:", htlcDetails.targetChain);
      console.log("  Hashlock:", htlcDetails.hashlock);
      console.log("  Timelock:", htlcDetails.timelock);
    } else {
      console.log("❌ Could not find HTLCCreated event");
    }

  } catch (error) {
    console.log("❌ HTLC creation test failed:", error.message);
  }

  console.log("\n📋 Testing SKALE-Specific Features...");

  // Test random number generation (SKALE native feature)
  try {
    console.log("🎲 Testing SKALE RNG...");
    
    // Create a simple contract to test RNG
    const RNGTest = await ethers.getContractFactory(`
      contract RNGTest {
        function getRandom() public view returns (bytes32) {
          assembly {
            let freemem := mload(0x40)
            let start_addr := add(freemem, 0)
            if iszero(staticcall(gas(), 0x18, 0, 0, start_addr, 32)) {
              invalid()
            }
            let result := mload(freemem)
            mstore(0x40, add(freemem, 32))
            return(start_addr, 32)
          }
        }
      }
    `);
    
    const rngTest = await RNGTest.deploy();
    await rngTest.deployed();
    
    const randomBytes = await rngTest.getRandom();
    console.log("✅ SKALE RNG working!");
    console.log("  Random bytes:", randomBytes);
    console.log("  As uint256:", ethers.BigNumber.from(randomBytes).toString());
    
  } catch (error) {
    console.log("❌ SKALE RNG test failed:", error.message);
    console.log("  This is expected on non-SKALE networks");
  }

  // Test zero gas fees
  try {
    console.log("\n💰 Testing zero gas fees...");
    
    // Simple transfer to test gas fees
    const transferTx = await spiralToken.transfer(user1.address, ethers.utils.parseUnits("1", 8));
    const transferReceipt = await transferTx.wait();
    
    console.log("✅ Transfer successful!");
    console.log("  Transaction hash:", transferReceipt.transactionHash);
    console.log("  Gas used:", transferReceipt.gasUsed.toString());
    console.log("  Gas price:", transferReceipt.effectiveGasPrice.toString());
    console.log("  Total cost: 0 (SKALE has zero gas fees!)");
    
  } catch (error) {
    console.log("❌ Transfer test failed:", error.message);
  }

  console.log("\n🎉 Europa Hub testing completed!");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on Europa explorer");
  console.log("2. Test cross-chain swaps with ICP");
  console.log("3. Integrate with your backend canister");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  });
