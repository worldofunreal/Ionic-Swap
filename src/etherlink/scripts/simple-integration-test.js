const { ethers } = require("hardhat");
const { ICPClient } = require("./icp-client");
require("dotenv").config({ path: "./test.env" });

/**
 * Simplified Integration Test for Etherlink-ICP Cross-Chain HTLC
 * 
 * This test focuses on:
 * 1. EVM contract deployment and basic functionality
 * 2. ICP client initialization (without actual ICP connection)
 * 3. HTLC creation and operations on EVM
 * 4. Cross-chain data structures and validation
 */
async function main() {
    console.log("🚀 Starting Simplified Etherlink-ICP Integration Test");
    console.log("=====================================================");

    // Configuration
    const CHAIN_ID = 42766; // Etherlink mainnet
    const TEST_AMOUNT = ethers.utils.parseEther("0.01"); // Smaller amount for testing

    let testResults = {
        contractDeployment: false,
        basicHtlcCreation: false,
        htlcClaim: false,
        htlcRefund: false,
        crossChainDataStructures: false,
        icpClientInitialization: false
    };

    try {
        // Step 1: Deploy Etherlink HTLC Contract
        console.log("\n📦 Step 1: Deploying Etherlink HTLC Contract...");
        const [deployer, sender, recipient] = await ethers.getSigners();
        
        const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        const etherlinkHTLC = await EtherlinkHTLC.deploy(deployer.address);
        await etherlinkHTLC.deployed();

        testResults.contractDeployment = true;
        console.log("✅ EtherlinkHTLC deployed to:", etherlinkHTLC.address);
        console.log("   Owner:", deployer.address);
        console.log("   ICP Network Signer:", await etherlinkHTLC.icpNetworkSigner());

        // Step 2: Initialize ICP Client (mock mode)
        console.log("\n📡 Step 2: Initializing ICP Client (Mock Mode)...");
        const icpClient = new ICPClient("rrkah-fqaaa-aaaaa-aaaaq-cai", {
            host: "http://localhost:4943",
            mockMode: true // Add mock mode for testing without ICP
        });

        testResults.icpClientInitialization = true;
        console.log("✅ ICP Client initialized in mock mode");

        // Step 3: Generate test data
        console.log("\n🔐 Step 3: Generating test data...");
        const secret = "my_secret_123_" + Math.random().toString(36).substring(7);
        const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const orderHash = "0x" + ethers.utils.randomBytes(32).toString('hex');

        console.log("Generated test data:");
        console.log("- Secret:", secret);
        console.log("- Hashlock:", hashlock);
        console.log("- Recipient:", recipient.address);
        console.log("- Expiration:", new Date(expirationTime * 1000).toISOString());
        console.log("- Order Hash:", orderHash);

        // Step 4: Create HTLC on EVM contract
        console.log("\n🔗 Step 4: Creating HTLC on EVM Contract...");
        
        const createTx = await etherlinkHTLC.connect(sender).createHTLCETH(
            recipient.address,
            hashlock,
            expirationTime,
            1, // ICP
            2, // Etherlink
            true, // isCrossChain
            orderHash,
            { value: TEST_AMOUNT }
        );
        await createTx.wait();

        testResults.basicHtlcCreation = true;
        console.log("✅ HTLC created on EVM contract");

        // Step 5: Verify HTLC creation
        console.log("\n📋 Step 5: Verifying HTLC creation...");
        const htlcCounter = await etherlinkHTLC.htlcCounter();
        console.log("   HTLC Counter:", htlcCounter.toString());

        const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
        console.log("   User HTLCs:", userHTLCs.length);

        if (userHTLCs.length > 0) {
            const htlcId = userHTLCs[0];
            const htlc = await etherlinkHTLC.getHTLC(htlcId);
            console.log("   HTLC Details:");
            console.log("     - Sender:", htlc.sender);
            console.log("     - Recipient:", htlc.recipient);
            console.log("     - Amount:", ethers.utils.formatEther(htlc.amount), "ETH");
            console.log("     - Hashlock:", htlc.hashlock);
            console.log("     - Timelock:", new Date(htlc.timelock.toNumber() * 1000).toISOString());
            console.log("     - Status:", htlc.status.toString());
            console.log("     - Is Cross-Chain:", htlc.isCrossChain);
            console.log("     - Order Hash:", htlc.orderHash);
        }

        // Step 6: Test HTLC claim
        console.log("\n💰 Step 6: Testing HTLC claim...");
        
        const claimTx = await etherlinkHTLC.connect(recipient).claimHTLC(
            userHTLCs[0],
            secret
        );
        await claimTx.wait();

        testResults.htlcClaim = true;
        console.log("✅ HTLC claimed successfully");

        // Step 7: Create another HTLC for refund test
        console.log("\n🔄 Step 7: Creating HTLC for refund test...");
        
        const secret2 = "my_secret_456_" + Math.random().toString(36).substring(7);
        const hashlock2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret2));
        const expirationTime2 = Math.floor(Date.now() / 1000) + 60; // 1 minute from now (will expire)
        const orderHash2 = "0x" + ethers.utils.randomBytes(32).toString('hex');

        const createTx2 = await etherlinkHTLC.connect(sender).createHTLCETH(
            recipient.address,
            hashlock2,
            expirationTime2,
            1, // ICP
            2, // Etherlink
            true, // isCrossChain
            orderHash2,
            { value: TEST_AMOUNT }
        );
        await createTx2.wait();

        const userHTLCs2 = await etherlinkHTLC.getUserHTLCs(sender.address);
        const htlcId2 = userHTLCs2[userHTLCs2.length - 1]; // Get the latest HTLC

        // Wait for expiration
        console.log("   Waiting for HTLC to expire...");
        await new Promise(resolve => setTimeout(resolve, 70000)); // Wait 70 seconds

        // Test refund
        const refundTx = await etherlinkHTLC.connect(sender).refundHTLC(htlcId2);
        await refundTx.wait();

        testResults.htlcRefund = true;
        console.log("✅ HTLC refunded successfully");

        // Step 8: Test cross-chain data structures
        console.log("\n🔗 Step 8: Testing cross-chain data structures...");
        
        // Test chain type conversion
        const chainType = icpClient.convertChainType("EtherlinkMainnet");
        console.log("   Chain Type Conversion:", JSON.stringify(chainType));

        // Test cross-chain swap creation
        const remoteHtlcId = ethers.utils.randomBytes(32);
        const crossChainSwapTx = await etherlinkHTLC.connect(sender).createCrossChainSwap(
            recipient.address,
            TEST_AMOUNT,
            hashlock,
            expirationTime,
            1, // ICP
            orderHash,
            remoteHtlcId,
            { value: TEST_AMOUNT }
        );
        await crossChainSwapTx.wait();

        testResults.crossChainDataStructures = true;
        console.log("✅ Cross-chain swap created successfully");

        // Print test results summary
        console.log("\n📊 Test Results Summary");
        console.log("=======================");
        Object.entries(testResults).forEach(([test, passed]) => {
            const status = passed ? "✅ PASS" : "❌ FAIL";
            const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`${status} ${testName}`);
        });

        const passedTests = Object.values(testResults).filter(Boolean).length;
        const totalTests = Object.keys(testResults).length;
        const successRate = (passedTests / totalTests) * 100;

        console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);

        if (successRate >= 80) {
            console.log("🎉 Simplified integration test completed successfully!");
        } else {
            console.log("⚠️ Simplified integration test completed with some failures. Please review the results.");
        }

        // Print important information
        console.log("\n📋 Important Information");
        console.log("=======================");
        console.log("- Etherlink HTLC Contract:", etherlinkHTLC.address);
        console.log("- Deployer:", deployer.address);
        console.log("- Sender:", sender.address);
        console.log("- Recipient:", recipient.address);
        console.log("- Hashlock:", hashlock);
        console.log("- Secret:", secret);
        console.log("- Order Hash:", orderHash);

        console.log("\n🔗 Next Steps for Full Integration:");
        console.log("1. Install and configure dfx for ICP development");
        console.log("2. Deploy the fusion_htlc_canister to ICP");
        console.log("3. Update ICP_CANISTER_ID in test.env");
        console.log("4. Run the full integration test with actual ICP connection");

    } catch (error) {
        console.error("❌ Simplified integration test failed:", error);
        console.error("Stack trace:", error.stack);
        
        // Print partial results
        console.log("\n📊 Partial Test Results");
        console.log("=======================");
        Object.entries(testResults).forEach(([test, passed]) => {
            const status = passed ? "✅ PASS" : "❌ FAIL";
            const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`${status} ${testName}`);
        });
        
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main }; 