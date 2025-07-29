const { ethers } = require("hardhat");
const { ICPClient } = require("./icp-client");

/**
 * Integration Test for Etherlink-ICP Cross-Chain HTLC
 */
async function main() {
    console.log("🚀 Starting Etherlink-ICP Integration Test");
    console.log("==========================================");

    // Configuration
    const ICP_CANISTER_ID = process.env.ICP_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai"; // Default to local canister
    const CHAIN_ID = 42766; // Etherlink mainnet
    const TEST_AMOUNT = ethers.utils.parseEther("0.1");

    try {
        // Initialize ICP Client
        console.log("\n📡 Step 1: Initializing ICP Client...");
        const icpClient = new ICPClient(ICP_CANISTER_ID, {
            host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943"
        });

        // Test connectivity
        console.log("Testing ICP canister connectivity...");
        const connectivityTest = await icpClient.testConnectivity();
        if (!connectivityTest) {
            throw new Error("Failed to connect to ICP canister");
        }

        // Test EVM RPC connectivity
        console.log("Testing EVM RPC connectivity...");
        const evmConnectivityTest = await icpClient.testEVMConnectivity(CHAIN_ID);
        if (!evmConnectivityTest) {
            console.warn("⚠️ EVM RPC connectivity test failed, but continuing with test...");
        }

        // Deploy Etherlink HTLC Contract
        console.log("\n📦 Step 2: Deploying Etherlink HTLC Contract...");
        const [deployer] = await ethers.getSigners();
        
        const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        const etherlinkHTLC = await EtherlinkHTLC.deploy(deployer.address);
        await etherlinkHTLC.deployed();

        console.log("✅ EtherlinkHTLC deployed to:", etherlinkHTLC.address);

        // Set the contract in the ICP client
        icpClient.setEtherlinkContract(etherlinkHTLC);

        // Generate test data
        const secret = ethers.utils.randomBytes(32);
        const secretHex = ethers.utils.hexlify(secret);
        const hashlock = ethers.utils.keccak256(secretHex);
        const recipient = ethers.Wallet.createRandom().address;
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        // Convert chain type for ICP
        const chainType = icpClient.convertChainType("EtherlinkMainnet");

        // Create HTLC on ICP
        console.log("\n🔗 Step 3: Creating HTLC on ICP...");
        console.log("Using chain type:", JSON.stringify(chainType));
        
        // For testing, we'll use a placeholder principal
        // In a real implementation, you'd convert the address to a proper Principal
        const testPrincipal = "2vxsx-fae"; // Anonymous principal for testing
        
        const icpHtlcId = await icpClient.createICPHTLC(
            testPrincipal,
            TEST_AMOUNT.toString(),
            "2vxsx-fae", // Anonymous principal for token canister
            expirationTime,
            chainType,
            recipient
        );

        if (!icpHtlcId) {
            throw new Error("Failed to create HTLC on ICP");
        }

        console.log("✅ HTLC created on ICP with ID:", icpHtlcId);

        // Set hashlock
        console.log("\n🔐 Step 4: Setting hashlock for ICP HTLC...");
        const hashlockSet = await icpClient.setICPHTLCHashlock(icpHtlcId, hashlock);
        if (!hashlockSet) {
            throw new Error("Failed to set hashlock for ICP HTLC");
        }

        // Create HTLC on EVM through ICP
        console.log("\n🔗 Step 5: Creating HTLC on EVM through ICP...");
        const evmInteractionId = await icpClient.createEVMHTLC(
            CHAIN_ID,
            etherlinkHTLC.address,
            hashlock,
            recipient,
            TEST_AMOUNT.toString(),
            expirationTime
        );

        if (!evmInteractionId) {
            throw new Error("Failed to create EVM HTLC through ICP");
        }

        console.log("✅ EVM HTLC creation initiated with interaction ID:", evmInteractionId);

        // Get interaction details
        console.log("\n📋 Step 6: Getting EVM interaction details...");
        const interaction = await icpClient.getEVMInteraction(evmInteractionId);
        if (interaction) {
            console.log("✅ EVM interaction details:", {
                action: interaction.action,
                status: interaction.status,
                evm_htlc_address: interaction.evm_htlc_address
            });
        }

        // Test HTLC status monitoring
        console.log("\n📊 Step 7: Testing HTLC status monitoring...");
        const status = await icpClient.monitorHTLCStatus(icpHtlcId, CHAIN_ID, etherlinkHTLC.address);
        if (status) {
            console.log("✅ HTLC status monitoring successful");
        }

        // Test 1inch order linking (mock data)
        console.log("\n🔗 Step 8: Testing 1inch order linking...");
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
            console.log("✅ 1inch order linked successfully");
        }

        console.log("\n✅ Integration test completed successfully!");
        console.log("==========================================");
        console.log("Summary:");
        console.log("- ICP Canister ID:", ICP_CANISTER_ID);
        console.log("- Etherlink HTLC Contract:", etherlinkHTLC.address);
        console.log("- ICP HTLC ID:", icpHtlcId);
        console.log("- EVM Interaction ID:", evmInteractionId);
        console.log("- Hashlock:", hashlock);
        console.log("- Secret:", secretHex);
        console.log("- Recipient:", recipient);

    } catch (error) {
        console.error("❌ Integration test failed:", error);
        console.error("Stack trace:", error.stack);
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