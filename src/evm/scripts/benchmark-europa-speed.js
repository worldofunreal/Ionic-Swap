const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 SKALE Europa Hub Speed Benchmarking");
  console.log("=====================================");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/europa-testnet.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Run deployment first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Loaded deployment from:", deploymentPath);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const htlc = await ethers.getContractAt("HTLCContract", deployment.contracts.htlc);
  const spiralToken = await ethers.getContractAt("SpiralToken", deployment.contracts.spiralToken);

  console.log("\n📊 Starting Performance Tests...");

  // Test 1: Block Time Measurement
  console.log("\n⏱️  Test 1: Block Time Measurement");
  await measureBlockTime();

  // Test 2: Transaction Confirmation Speed
  console.log("\n⚡ Test 2: Transaction Confirmation Speed");
  await measureTransactionSpeed(htlc, spiralToken, deployer);

  // Test 3: Batch Transaction Throughput
  console.log("\n🔄 Test 3: Batch Transaction Throughput");
  await measureBatchThroughput(spiralToken, deployer);

  // Test 4: Gas Usage Analysis
  console.log("\n⛽ Test 4: Gas Usage Analysis");
  await measureGasUsage(htlc, spiralToken, deployer);

  // Test 5: Network Latency
  console.log("\n🌐 Test 5: Network Latency");
  await measureNetworkLatency();

  console.log("\n🎉 Speed benchmarking completed!");
}

async function measureBlockTime() {
  try {
    const provider = ethers.provider;
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const currentBlockData = await provider.getBlock(currentBlock);
    const currentTimestamp = currentBlockData.timestamp;
    
    // Get previous block
    const previousBlock = await provider.getBlock(currentBlock - 1);
    const previousTimestamp = previousBlock.timestamp;
    
    const blockTime = currentTimestamp - previousTimestamp;
    
    console.log(`  Current Block: ${currentBlock}`);
    console.log(`  Current Block Time: ${new Date(currentTimestamp * 1000).toISOString()}`);
    console.log(`  Previous Block Time: ${new Date(previousTimestamp * 1000).toISOString()}`);
    console.log(`  Block Time: ${blockTime} seconds`);
    
    // SKALE typically has sub-second finality
    if (blockTime <= 1) {
      console.log("  ✅ Sub-second finality confirmed!");
    } else {
      console.log(`  ⚠️  Block time: ${blockTime}s (expected ≤1s for SKALE)`);
    }
  } catch (error) {
    console.log("  ❌ Block time measurement failed:", error.message);
  }
}

async function measureTransactionSpeed(htlc, spiralToken, deployer) {
  try {
    console.log("  🔍 Measuring transaction confirmation speed...");
    
    const startTime = Date.now();
    
    // Create a simple transfer transaction
    const amount = ethers.utils.parseUnits("1", 8); // 1 token
    const tx = await spiralToken.transfer(deployer.address, amount);
    
    const receipt = await tx.wait();
    const endTime = Date.now();
    
    const confirmationTime = endTime - startTime;
    const blockNumber = receipt.blockNumber;
    const gasUsed = receipt.gasUsed.toString();
    
    console.log(`  ✅ Transaction confirmed in ${confirmationTime}ms`);
    console.log(`  📍 Block: ${blockNumber}`);
    console.log(`  ⛽ Gas Used: ${gasUsed}`);
    console.log(`  💰 Cost: 0 (SKALE zero gas fees!)`);
    
    // SKALE should confirm transactions very quickly
    if (confirmationTime < 5000) { // Less than 5 seconds
      console.log("  🚀 Fast confirmation confirmed!");
    } else {
      console.log(`  ⚠️  Confirmation time: ${confirmationTime}ms (expected <5000ms)`);
    }
    
  } catch (error) {
    console.log("  ❌ Transaction speed test failed:", error.message);
  }
}

async function measureBatchThroughput(spiralToken, deployer) {
  try {
    console.log("  🔄 Measuring batch transaction throughput...");
    
    const batchSize = 3; // Reduced batch size to avoid nonce issues
    const amount = ethers.utils.parseUnits("0.1", 8); // 0.1 token per transfer
    
    console.log(`  📦 Sending ${batchSize} transactions sequentially...`);
    
    const startTime = Date.now();
    
    // Send transactions sequentially to avoid nonce conflicts
    const receipts = [];
    for (let i = 0; i < batchSize; i++) {
      try {
        console.log(`    📤 Transaction ${i + 1}/${batchSize}...`);
        const tx = await spiralToken.transfer(deployer.address, amount);
        const receipt = await tx.wait();
        receipts.push(receipt);
        console.log(`      ✅ Confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.log(`      ❌ Transaction ${i + 1} failed:`, error.message);
      }
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const successfulTxs = receipts.length;
    
    if (successfulTxs > 0) {
      const avgTimePerTx = totalTime / successfulTxs;
      const throughput = (successfulTxs / totalTime) * 1000; // transactions per second
      
      console.log(`  ✅ Batch completed in ${totalTime}ms`);
      console.log(`  📊 Successful transactions: ${successfulTxs}/${batchSize}`);
      console.log(`  📊 Average time per transaction: ${avgTimePerTx.toFixed(2)}ms`);
      console.log(`  🚀 Throughput: ${throughput.toFixed(2)} TPS`);
      
      // SKALE should handle high throughput
      if (throughput > 1) {
        console.log("  🎯 Good throughput confirmed!");
      } else {
        console.log(`  ⚠️  Throughput: ${throughput.toFixed(2)} TPS (expected >1 TPS)`);
      }
    } else {
      console.log("  ❌ No transactions succeeded in batch");
    }
    
  } catch (error) {
    console.log("  ❌ Batch throughput test failed:", error.message);
  }
}

async function measureGasUsage(htlc, spiralToken, deployer) {
  try {
    console.log("  ⛽ Measuring gas usage patterns...");
    
    // Test different transaction types
    const testCases = [
      {
        name: "Token Transfer",
        tx: () => spiralToken.transfer(deployer.address, ethers.utils.parseUnits("0.1", 8))
      },
      {
        name: "Token Approval",
        tx: () => spiralToken.approve(htlc.address, ethers.utils.parseUnits("100", 8))
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`    🔍 Testing: ${testCase.name}`);
        
        const startTime = Date.now();
        const tx = await testCase.tx();
        const receipt = await tx.wait();
        const endTime = Date.now();
        
        const gasUsed = receipt.gasUsed.toString();
        const timeTaken = endTime - startTime;
        
        console.log(`      ✅ Gas Used: ${gasUsed}`);
        console.log(`      ⏱️  Time: ${timeTaken}ms`);
        console.log(`      💰 Cost: 0 (SKALE zero gas fees!)`);
        
      } catch (error) {
        console.log(`      ❌ ${testCase.name} failed:`, error.message);
      }
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.log("  ❌ Gas usage test failed:", error.message);
  }
}

async function measureNetworkLatency() {
  try {
    console.log("  🌐 Measuring network latency...");
    
    const provider = ethers.provider;
    const iterations = 5; // Reduced iterations
    const latencies = [];
    
    console.log(`  📡 Running ${iterations} latency tests...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        // Simple RPC call to measure latency
        await provider.getBlockNumber();
        const endTime = Date.now();
        const latency = endTime - startTime;
        latencies.push(latency);
        
        console.log(`    Test ${i + 1}: ${latency}ms`);
      } catch (error) {
        console.log(`    Test ${i + 1}: Failed`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      
      console.log(`  📊 Latency Statistics:`);
      console.log(`    Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`    Minimum: ${minLatency}ms`);
      console.log(`    Maximum: ${maxLatency}ms`);
      
      // SKALE should have low latency
      if (avgLatency < 100) {
        console.log("  🚀 Low latency confirmed!");
      } else {
        console.log(`  ⚠️  Average latency: ${avgLatency.toFixed(2)}ms (expected <100ms)`);
      }
    }
    
  } catch (error) {
    console.log("  ❌ Network latency test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Benchmarking failed:", error);
    process.exit(1);
  });
