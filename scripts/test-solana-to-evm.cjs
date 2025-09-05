const { Actor, HttpAgent } = require("@dfinity/agent");
const { Principal } = require("@dfinity/principal");
const { ethers } = require("ethers");

// Configuration
const BACKEND_CANISTER_ID = "be2us-64aaa-aaaaa-qaabq-cai"; // Replace with your canister ID
const LOCAL_HOST = "http://127.0.0.1:4943";
const SEPOLIA_RPC = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"; // Replace with your RPC
const SEPOLIA_CHAIN_ID = 11155111;

// Token addresses (replace with actual testnet addresses)
const SPIRAL_TOKEN_EVM = "0x1234567890123456789012345678901234567890"; // Replace with actual Spiral token on Sepolia
const SPIRAL_TOKEN_SOLANA = "So11111111111111111111111111111111111111112"; // Replace with actual Spiral token on Solana

// Test user addresses
const SOLANA_USER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"; // Replace with actual Solana testnet address
const EVM_USER = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Replace with actual EVM address

// Test amounts
const TEST_AMOUNTS = {
    solana: 1000000, // 1 SPL token (assuming 6 decimals)
    evm: "1000000000000000000" // 1 EVM token (18 decimals)
};

// Initialize the backend actor
async function initBackendActor() {
    const agent = new HttpAgent({ host: LOCAL_HOST });
    await agent.fetchRootKey();
    
    const backendIdl = await fetch(`${LOCAL_HOST}/canister/${BACKEND_CANISTER_ID}/did`)
        .then(response => response.text());
    
    return Actor.createActor(backendIdl, {
        agent,
        canisterId: BACKEND_CANISTER_ID,
    });
}

// Test Solana → EVM swap
async function testSolanaToEvmSwap() {
    console.log("🚀 Starting Solana → EVM swap test...");
    
    try {
        const backend = await initBackendActor();
        
        // Step 1: Get canister's Solana address
        console.log("\n📋 Step 1: Getting canister's Solana address...");
        const canisterSolanaAddress = await backend.get_canister_solana_address_public();
        console.log("✅ Canister Solana address:", canisterSolanaAddress);
        
        // Step 2: Create Solana → EVM order
        console.log("\n📋 Step 2: Creating Solana → EVM order...");
        const orderResult = await backend.create_solana_to_evm_order(
            SOLANA_USER,                    // user_solana_address
            SPIRAL_TOKEN_SOLANA,           // source_token_mint
            SPIRAL_TOKEN_EVM,              // destination_token_address
            TEST_AMOUNTS.solana,           // source_amount
            TEST_AMOUNTS.evm,              // destination_amount
            EVM_USER,                      // evm_destination_address
            3600                           // timelock_duration (1 hour)
        );
        console.log("✅ Order created:", orderResult);
        
        // Extract order ID from result
        const orderIdMatch = orderResult.match(/Order ID: ([a-f0-9-]+)/);
        if (!orderIdMatch) {
            throw new Error("Could not extract order ID from result");
        }
        const orderId = orderIdMatch[1];
        console.log("📝 Order ID:", orderId);
        
        // Step 3: Get order details
        console.log("\n📋 Step 3: Getting order details...");
        const orderDetails = await backend.get_atomic_swap_order(orderId);
        console.log("✅ Order details:", JSON.stringify(orderDetails, null, 2));
        
        // Step 4: Check if order was automatically paired
        if (orderDetails.counter_order_id) {
            console.log("🎯 Order was automatically paired with:", orderDetails.counter_order_id);
            
            // Get counter order details
            const counterOrderDetails = await backend.get_atomic_swap_order(orderDetails.counter_order_id);
            console.log("✅ Counter order details:", JSON.stringify(counterOrderDetails, null, 2));
        } else {
            console.log("⏳ Order is waiting for a compatible counter-order");
        }
        
        // Step 5: List all Solana HTLCs
        console.log("\n📋 Step 5: Listing all Solana HTLCs...");
        const solanaHtlcs = await backend.list_solana_htlcs_public();
        console.log("✅ Solana HTLCs:", JSON.stringify(solanaHtlcs, null, 2));
        
        // Step 6: Get Solana HTLC status
        if (orderDetails.source_htlc_id) {
            console.log("\n📋 Step 6: Getting Solana HTLC status...");
            const htlcStatus = await backend.get_solana_htlc_status_public(orderDetails.source_htlc_id);
            console.log("✅ Solana HTLC status:", htlcStatus);
        }
        
        // Step 7: Test HTLC claiming (if we have a secret)
        if (orderDetails.secret) {
            console.log("\n📋 Step 7: Testing HTLC claiming...");
            try {
                const claimResult = await backend.claim_solana_htlc_public(
                    orderId,
                    orderDetails.source_htlc_id,
                    orderDetails.secret
                );
                console.log("✅ HTLC claimed:", claimResult);
            } catch (error) {
                console.log("⚠️ HTLC claim failed (expected if not paired):", error.message);
            }
        }
        
        console.log("\n🎉 Solana → EVM swap test completed successfully!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Test EVM → Solana swap
async function testEvmToSolanaSwap() {
    console.log("\n🚀 Starting EVM → Solana swap test...");
    
    try {
        const backend = await initBackendActor();
        
        // Step 1: Create EVM → Solana order (this would require a signed permit)
        console.log("\n📋 Step 1: Creating EVM → Solana order...");
        
        // Note: In a real implementation, you would need to:
        // 1. Sign an EIP-2612 permit for the canister to spend your ERC20 tokens
        // 2. Pass the signed permit to this function
        
        // For testing, we'll create a mock permit structure
        const mockPermit = {
            domain: {
                name: "Spiral Token",
                version: "1",
                chainId: SEPOLIA_CHAIN_ID,
                verifyingContract: SPIRAL_TOKEN_EVM
            },
            types: {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            },
            value: {
                owner: EVM_USER,
                spender: "0x0000000000000000000000000000000000000000", // Canister address
                value: TEST_AMOUNTS.evm,
                nonce: 0,
                deadline: Math.floor(Date.now() / 1000) + 3600
            },
            signature: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" // Mock signature
        };
        
        try {
            const orderResult = await backend.create_evm_to_solana_order(
                EVM_USER,                    // user_address
                SPIRAL_TOKEN_EVM,           // source_token_address
                SPIRAL_TOKEN_SOLANA,        // destination_token_mint
                TEST_AMOUNTS.evm,           // source_amount
                TEST_AMOUNTS.solana,        // destination_amount
                SOLANA_USER,                // solana_destination_address
                3600,                       // timelock_duration
                mockPermit                  // permit_request
            );
            console.log("✅ Order created:", orderResult);
        } catch (error) {
            console.log("⚠️ EVM → Solana order creation failed (expected without real permit):", error.message);
        }
        
        console.log("\n🎉 EVM → Solana swap test completed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Test ICP → Solana swap
async function testIcpToSolanaSwap() {
    console.log("\n🚀 Starting ICP → Solana swap test...");
    
    try {
        const backend = await initBackendActor();
        
        // Step 1: Create ICP → Solana order
        console.log("\n📋 Step 1: Creating ICP → Solana order...");
        
        // Note: In a real implementation, you would need to:
        // 1. Approve the canister to spend your ICRC tokens
        // 2. Have sufficient ICRC token balance
        
        const orderResult = await backend.create_icp_to_solana_order(
            "rdmx6-jaaaa-aaaah-qcaiq-cai",  // user_principal (replace with actual)
            "rdmx6-jaaaa-aaaah-qcaiq-cai",  // source_token_canister (replace with actual ICRC token)
            SPIRAL_TOKEN_SOLANA,            // destination_token_mint
            TEST_AMOUNTS.evm,               // source_amount (ICRC tokens)
            TEST_AMOUNTS.solana,            // destination_amount (SPL tokens)
            SOLANA_USER,                    // solana_destination_address
            3600                            // timelock_duration
        );
        console.log("✅ Order created:", orderResult);
        
        console.log("\n🎉 ICP → Solana swap test completed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Test Solana → ICP swap
async function testSolanaToIcpSwap() {
    console.log("\n🚀 Starting Solana → ICP swap test...");
    
    try {
        const backend = await initBackendActor();
        
        // Step 1: Create Solana → ICP order
        console.log("\n📋 Step 1: Creating Solana → ICP order...");
        
        const orderResult = await backend.create_solana_to_icp_order(
            SOLANA_USER,                    // user_solana_address
            SPIRAL_TOKEN_SOLANA,           // source_token_mint
            "rdmx6-jaaaa-aaaah-qcaiq-cai",  // destination_token_canister (replace with actual ICRC token)
            TEST_AMOUNTS.solana,           // source_amount (SPL tokens)
            TEST_AMOUNTS.evm,              // destination_amount (ICRC tokens)
            "rdmx6-jaaaa-aaaah-qcaiq-cai",  // icp_destination_principal (replace with actual)
            3600                           // timelock_duration
        );
        console.log("✅ Order created:", orderResult);
        
        console.log("\n🎉 Solana → ICP swap test completed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Main test function
async function runAllTests() {
    console.log("🧪 Starting comprehensive Solana cross-chain tests...\n");
    
    try {
        // Test all swap directions
        await testSolanaToEvmSwap();
        await testEvmToSolanaSwap();
        await testIcpToSolanaSwap();
        await testSolanaToIcpSwap();
        
        console.log("\n🎉 All Solana cross-chain tests completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testSolanaToEvmSwap,
    testEvmToSolanaSwap,
    testIcpToSolanaSwap,
    testSolanaToIcpSwap,
    runAllTests
};
