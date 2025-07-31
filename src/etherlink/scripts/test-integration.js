const { ethers } = require("hardhat");
const { ICPClient } = require("./icp-client");
require("dotenv").config({ path: "./test.env" });

/**
 * Comprehensive Integration Test for Etherlink-ICP Cross-Chain HTLC
 * 
 * This test covers:
 * 1. ICP canister connectivity
 * 2. EVM RPC connectivity through ICP
 * 3. Etherlink HTLC contract deployment
 * 4. HTLC creation on both ICP and EVM
 * 5. Cross-chain communication
 * 6. 1inch order integration
 */
async function main() {
    console.log("🚀 Starting Comprehensive Etherlink-ICP Integration Test");
    console.log("==========================================================");

    // Configuration
    const ICP_CANISTER_ID = process.env.ICP_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai";
    const CHAIN_ID = 42766; // Etherlink mainnet
    const TEST_AMOUNT = ethers.utils.parseEther("0.01"); // Smaller amount for testing

    let testResults = {
        icpConnectivity: false,
        evmRpcConnectivity: false,
        contractDeployment: false,
        icpHtlcCreation: false,
        evmHtlcCreation: false,
        crossChainCommunication: false,
        oneinchIntegration: false
    };

    try {
        // Step 1: Initialize ICP Client
        console.log("\n📡 Step 1: Initializing ICP Client...");
        const icpClient = new ICPClient(ICP_CANISTER_ID, {
            host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943"
        });

        // Test ICP connectivity
        console.log("Testing ICP canister connectivity...");
        const connectivityTest = await icpClient.testConnectivity();
        if (connectivityTest) {
            testResults.icpConnectivity = true;
            console.log("✅ ICP connectivity test passed");
        } else {
            throw new Error("ICP connectivity test failed");
        }

        // Test EVM RPC connectivity
        console.log("Testing EVM RPC connectivity through ICP...");
        const evmConnectivityTest = await icpClient.testEVMConnectivity(CHAIN_ID);
        if (evmConnectivityTest) {
            testResults.evmRpcConnectivity = true;
            console.log("✅ EVM RPC connectivity test passed");
        } else {
            console.warn("⚠️ EVM RPC connectivity test failed, but continuing...");
        }

        // Step 2: Deploy Etherlink HTLC Contract
        console.log("\n📦 Step 2: Deploying Etherlink HTLC Contract...");
        const [deployer] = await ethers.getSigners();
        
        const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        const etherlinkHTLC = await EtherlinkHTLC.deploy(deployer.address);
        await etherlinkHTLC.deployed();

        testResults.contractDeployment = true;
        console.log("✅ EtherlinkHTLC deployed to:", etherlinkHTLC.address);

        // Set the contract in the ICP client
        icpClient.setEtherlinkContract(etherlinkHTLC);

        // Step 3: Generate test data
        console.log("\n🔐 Step 3: Generating test data...");
        const secret = ethers.utils.randomBytes(32);
        const secretHex = ethers.utils.hexlify(secret);
        const hashlock = ethers.utils.keccak256(secretHex);
        const recipient = ethers.Wallet.createRandom().address;
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        console.log("Generated test data:");
        console.log("- Secret:", secretHex);
        console.log("- Hashlock:", hashlock);
        console.log("- Recipient:", recipient);
        console.log("- Expiration:", new Date(expirationTime * 1000).toISOString());

        // Convert chain type for ICP
        const chainType = icpClient.convertChainType("EtherlinkMainnet");
        console.log("- Chain Type:", JSON.stringify(chainType));

        // Step 4: Create HTLC on ICP
        console.log("\n🔗 Step 4: Creating HTLC on ICP...");
        
        // For testing, we'll use a placeholder principal
        const testPrincipal = "2vxsx-fae"; // Anonymous principal for testing
        
        const icpHtlcId = await icpClient.createICPHTLC(
            testPrincipal,
            TEST_AMOUNT.toString(),
            "2vxsx-fae", // Anonymous principal for token canister
            expirationTime,
            chainType,
            recipient
        );

        if (icpHtlcId) {
            testResults.icpHtlcCreation = true;
            console.log("✅ HTLC created on ICP with ID:", icpHtlcId);
        } else {
            throw new Error("Failed to create HTLC on ICP");
        }

        // Step 5: Set hashlock for ICP HTLC
        console.log("\n🔐 Step 5: Setting hashlock for ICP HTLC...");
        const hashlockSet = await icpClient.setICPHTLCHashlock(icpHtlcId, hashlock);
        if (!hashlockSet) {
            throw new Error("Failed to set hashlock for ICP HTLC");
        }
        console.log("✅ Hashlock set successfully");

        // Step 6: Create HTLC on EVM through ICP
        console.log("\n🔗 Step 6: Creating HTLC on EVM through ICP...");
        const evmInteractionId = await icpClient.createEVMHTLC(
            CHAIN_ID,
            etherlinkHTLC.address,
            hashlock,
            recipient,
            TEST_AMOUNT.toString(),
            expirationTime
        );

        if (evmInteractionId) {
            testResults.evmHtlcCreation = true;
            console.log("✅ EVM HTLC creation initiated with interaction ID:", evmInteractionId);
        } else {
            throw new Error("Failed to create EVM HTLC through ICP");
        }

        // Step 7: Get EVM interaction details
        console.log("\n📋 Step 7: Getting EVM interaction details...");
        const interaction = await icpClient.getEVMInteraction(evmInteractionId);
        if (interaction) {
            console.log("✅ EVM interaction details:", {
                action: interaction.action,
                status: interaction.status,
                evm_htlc_address: interaction.evm_htlc_address
            });
        }

        // Step 8: Test cross-chain communication
        console.log("\n🔄 Step 8: Testing cross-chain communication...");
        const status = await icpClient.monitorHTLCStatus(icpHtlcId, CHAIN_ID, etherlinkHTLC.address);
        if (status) {
            testResults.crossChainCommunication = true;
            console.log("✅ Cross-chain communication test passed");
        }

        // Step 9: Test 1inch order integration
        console.log("\n🔗 Step 9: Testing 1inch order integration...");
        const mockOneInchOrder = {
            order_hash: "0x" + ethers.utils.randomBytes(32).toString('hex'),
            hashlock: hashlock,
            timelock: BigInt(expirationTime),
            maker: deployer.address,
            taker: recipient,
            maker_asset: "0x0000000000000000000000000000000000000000", // ETH
            taker_asset: "0x0000000000000000000000000000000000000000", // ETH
            making_amount: TEST_AMOUNT.toString(),
            taking_amount: TEST_AMOUNT.toString(),
            src_chain_id: BigInt(CHAIN_ID),
            dst_chain_id: BigInt(CHAIN_ID),
            secret_hashes: [],
            fills: []
        };

        const orderLinked = await icpClient.link1inchOrder(icpHtlcId, mockOneInchOrder, true);
        if (orderLinked) {
            testResults.oneinchIntegration = true;
            console.log("✅ 1inch order integration test passed");
        }

        // Step 10: Test HTLC operations on EVM contract directly
        console.log("\n🔧 Step 10: Testing direct EVM contract operations...");
        
        // Test creating HTLC directly on EVM contract
        try {
            const tx = await etherlinkHTLC.createHTLCETH(
                recipient,
                hashlock,
                expirationTime,
                1, // ICP
                2, // Etherlink
                true, // isCrossChain
                "", // orderHash
                { value: TEST_AMOUNT }
            );
            await tx.wait();
            console.log("✅ Direct EVM HTLC creation successful");
        } catch (error) {
            console.warn("⚠️ Direct EVM HTLC creation failed:", error.message);
        }

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
            console.log("🎉 Integration test completed successfully!");
        } else {
            console.log("⚠️ Integration test completed with some failures. Please review the results.");
        }

        // Print important information
        console.log("\n📋 Important Information");
        console.log("=======================");
        console.log("- ICP Canister ID:", ICP_CANISTER_ID);
        console.log("- Etherlink HTLC Contract:", etherlinkHTLC.address);
        console.log("- ICP HTLC ID:", icpHtlcId);
        console.log("- EVM Interaction ID:", evmInteractionId);
        console.log("- Hashlock:", hashlock);
        console.log("- Secret:", secretHex);
        console.log("- Recipient:", recipient);
        console.log("- Deployer:", deployer.address);

    } catch (error) {
        console.error("❌ Integration test failed:", error);
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