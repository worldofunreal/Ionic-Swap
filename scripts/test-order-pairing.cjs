const { Actor, HttpAgent } = require("@dfinity/agent");
const { Principal } = require("@dfinity/principal");

// Configuration
const BACKEND_CANISTER_ID = "be2us-64aaa-aaaaa-qaabq-cai"; // Replace with your canister ID
const LOCAL_HOST = "http://127.0.0.1:4943";

// Test configuration
const TEST_CONFIG = {
    // EVM addresses
    evmUser1: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    evmUser2: "0x8ba1f109551bD432803012645Hac136c0c8b3c9",
    
    // ICP principals
    icpUser1: "rdmx6-jaaaa-aaaah-qcaiq-cai",
    icpUser2: "rrkah-fqaaa-aaaah-qcaiq-cai",
    
    // Solana addresses
    solanaUser1: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    solanaUser2: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    
    // Token addresses
    spiralTokenEVM: "0x1234567890123456789012345678901234567890",
    spiralTokenICP: "rdmx6-jaaaa-aaaah-qcaiq-cai",
    spiralTokenSolana: "So11111111111111111111111111111111111111112",
    
    // Test amounts
    amount: "1000000000000000000", // 1 token (18 decimals)
    solanaAmount: 1000000, // 1 token (6 decimals)
    
    // Timelock
    timelock: 3600 // 1 hour
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

// Test EVM ↔ ICP order pairing
async function testEvmIcpPairing() {
    console.log("🧪 Testing EVM ↔ ICP order pairing...");
    
    try {
        const backend = await initBackendActor();
        
        // Create EVM → ICP order
        console.log("\n📋 Step 1: Creating EVM → ICP order...");
        const evmToIcpResult = await backend.create_evm_to_icp_order(
            TEST_CONFIG.evmUser1,           // user_address
            TEST_CONFIG.spiralTokenEVM,     // source_token_address
            TEST_CONFIG.spiralTokenICP,     // destination_token_canister
            TEST_CONFIG.amount,             // source_amount
            TEST_CONFIG.amount,             // destination_amount
            TEST_CONFIG.icpUser1,           // icp_destination_principal
            TEST_CONFIG.timelock,           // timelock_duration
            {
                domain: {
                    name: "Spiral Token",
                    version: "1",
                    chainId: 11155111,
                    verifyingContract: TEST_CONFIG.spiralTokenEVM
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
                    owner: TEST_CONFIG.evmUser1,
                    spender: "0x0000000000000000000000000000000000000000",
                    value: TEST_CONFIG.amount,
                    nonce: 0,
                    deadline: Math.floor(Date.now() / 1000) + 3600
                },
                signature: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            }
        );
        console.log("✅ EVM → ICP order created:", evmToIcpResult);
        
        // Extract order ID
        const evmToIcpOrderId = evmToIcpResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (evmToIcpOrderId) {
            console.log("📝 EVM → ICP Order ID:", evmToIcpOrderId);
            
            // Get order details
            const evmToIcpOrder = await backend.get_atomic_swap_order(evmToIcpOrderId);
            console.log("📋 EVM → ICP Order details:", JSON.stringify(evmToIcpOrder, null, 2));
        }
        
        // Create ICP → EVM order
        console.log("\n📋 Step 2: Creating ICP → EVM order...");
        const icpToEvmResult = await backend.create_icp_to_evm_order(
            TEST_CONFIG.icpUser2,           // user_principal
            TEST_CONFIG.spiralTokenICP,     // source_token_canister
            TEST_CONFIG.spiralTokenEVM,     // destination_token_address
            TEST_CONFIG.amount,             // source_amount
            TEST_CONFIG.amount,             // destination_amount
            TEST_CONFIG.evmUser2,           // evm_destination_address
            TEST_CONFIG.timelock            // timelock_duration
        );
        console.log("✅ ICP → EVM order created:", icpToEvmResult);
        
        // Extract order ID
        const icpToEvmOrderId = icpToEvmResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (icpToEvmOrderId) {
            console.log("📝 ICP → EVM Order ID:", icpToEvmOrderId);
            
            // Get order details
            const icpToEvmOrder = await backend.get_atomic_swap_order(icpToEvmOrderId);
            console.log("📋 ICP → EVM Order details:", JSON.stringify(icpToEvmOrder, null, 2));
            
            // Check if orders were paired
            if (icpToEvmOrder.counter_order_id) {
                console.log("🎯 Orders were automatically paired!");
                console.log("📝 Counter order ID:", icpToEvmOrder.counter_order_id);
            } else {
                console.log("⏳ Orders are waiting for pairing");
            }
        }
        
    } catch (error) {
        console.error("❌ EVM ↔ ICP pairing test failed:", error);
        throw error;
    }
}

// Test EVM ↔ Solana order pairing
async function testEvmSolanaPairing() {
    console.log("\n🧪 Testing EVM ↔ Solana order pairing...");
    
    try {
        const backend = await initBackendActor();
        
        // Create EVM → Solana order
        console.log("\n📋 Step 1: Creating EVM → Solana order...");
        const evmToSolanaResult = await backend.create_evm_to_solana_order(
            TEST_CONFIG.evmUser1,           // user_address
            TEST_CONFIG.spiralTokenEVM,     // source_token_address
            TEST_CONFIG.spiralTokenSolana,  // destination_token_mint
            TEST_CONFIG.amount,             // source_amount
            TEST_CONFIG.solanaAmount,       // destination_amount
            TEST_CONFIG.solanaUser1,        // solana_destination_address
            TEST_CONFIG.timelock,           // timelock_duration
            {
                domain: {
                    name: "Spiral Token",
                    version: "1",
                    chainId: 11155111,
                    verifyingContract: TEST_CONFIG.spiralTokenEVM
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
                    owner: TEST_CONFIG.evmUser1,
                    spender: "0x0000000000000000000000000000000000000000",
                    value: TEST_CONFIG.amount,
                    nonce: 0,
                    deadline: Math.floor(Date.now() / 1000) + 3600
                },
                signature: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            }
        );
        console.log("✅ EVM → Solana order created:", evmToSolanaResult);
        
        // Extract order ID
        const evmToSolanaOrderId = evmToSolanaResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (evmToSolanaOrderId) {
            console.log("📝 EVM → Solana Order ID:", evmToSolanaOrderId);
        }
        
        // Create Solana → EVM order
        console.log("\n📋 Step 2: Creating Solana → EVM order...");
        const solanaToEvmResult = await backend.create_solana_to_evm_order(
            TEST_CONFIG.solanaUser2,        // user_solana_address
            TEST_CONFIG.spiralTokenSolana,  // source_token_mint
            TEST_CONFIG.spiralTokenEVM,     // destination_token_address
            TEST_CONFIG.solanaAmount,       // source_amount
            TEST_CONFIG.amount,             // destination_amount
            TEST_CONFIG.evmUser2,           // evm_destination_address
            TEST_CONFIG.timelock            // timelock_duration
        );
        console.log("✅ Solana → EVM order created:", solanaToEvmResult);
        
        // Extract order ID
        const solanaToEvmOrderId = solanaToEvmResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (solanaToEvmOrderId) {
            console.log("📝 Solana → EVM Order ID:", solanaToEvmOrderId);
            
            // Get order details
            const solanaToEvmOrder = await backend.get_atomic_swap_order(solanaToEvmOrderId);
            console.log("📋 Solana → EVM Order details:", JSON.stringify(solanaToEvmOrder, null, 2));
            
            // Check if orders were paired
            if (solanaToEvmOrder.counter_order_id) {
                console.log("🎯 Orders were automatically paired!");
                console.log("📝 Counter order ID:", solanaToEvmOrder.counter_order_id);
            } else {
                console.log("⏳ Orders are waiting for pairing");
            }
        }
        
    } catch (error) {
        console.error("❌ EVM ↔ Solana pairing test failed:", error);
        throw error;
    }
}

// Test ICP ↔ Solana order pairing
async function testIcpSolanaPairing() {
    console.log("\n🧪 Testing ICP ↔ Solana order pairing...");
    
    try {
        const backend = await initBackendActor();
        
        // Create ICP → Solana order
        console.log("\n📋 Step 1: Creating ICP → Solana order...");
        const icpToSolanaResult = await backend.create_icp_to_solana_order(
            TEST_CONFIG.icpUser1,           // user_principal
            TEST_CONFIG.spiralTokenICP,     // source_token_canister
            TEST_CONFIG.spiralTokenSolana,  // destination_token_mint
            TEST_CONFIG.amount,             // source_amount
            TEST_CONFIG.solanaAmount,       // destination_amount
            TEST_CONFIG.solanaUser1,        // solana_destination_address
            TEST_CONFIG.timelock            // timelock_duration
        );
        console.log("✅ ICP → Solana order created:", icpToSolanaResult);
        
        // Extract order ID
        const icpToSolanaOrderId = icpToSolanaResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (icpToSolanaOrderId) {
            console.log("📝 ICP → Solana Order ID:", icpToSolanaOrderId);
        }
        
        // Create Solana → ICP order
        console.log("\n📋 Step 2: Creating Solana → ICP order...");
        const solanaToIcpResult = await backend.create_solana_to_icp_order(
            TEST_CONFIG.solanaUser2,        // user_solana_address
            TEST_CONFIG.spiralTokenSolana,  // source_token_mint
            TEST_CONFIG.spiralTokenICP,     // destination_token_canister
            TEST_CONFIG.solanaAmount,       // source_amount
            TEST_CONFIG.amount,             // destination_amount
            TEST_CONFIG.icpUser2,           // icp_destination_principal
            TEST_CONFIG.timelock            // timelock_duration
        );
        console.log("✅ Solana → ICP order created:", solanaToIcpResult);
        
        // Extract order ID
        const solanaToIcpOrderId = solanaToIcpResult.match(/Order ID: ([a-f0-9-]+)/)?.[1];
        if (solanaToIcpOrderId) {
            console.log("📝 Solana → ICP Order ID:", solanaToIcpOrderId);
            
            // Get order details
            const solanaToIcpOrder = await backend.get_atomic_swap_order(solanaToIcpOrderId);
            console.log("📋 Solana → ICP Order details:", JSON.stringify(solanaToIcpOrder, null, 2));
            
            // Check if orders were paired
            if (solanaToIcpOrder.counter_order_id) {
                console.log("🎯 Orders were automatically paired!");
                console.log("📝 Counter order ID:", solanaToIcpOrder.counter_order_id);
            } else {
                console.log("⏳ Orders are waiting for pairing");
            }
        }
        
    } catch (error) {
        console.error("❌ ICP ↔ Solana pairing test failed:", error);
        throw error;
    }
}

// Test order compatibility checking
async function testOrderCompatibility() {
    console.log("\n🧪 Testing order compatibility checking...");
    
    try {
        const backend = await initBackendActor();
        
        // Get all orders
        console.log("\n📋 Getting all orders...");
        const allOrders = await backend.get_all_atomic_swap_orders();
        console.log("✅ Total orders found:", allOrders.length);
        
        if (allOrders.length >= 2) {
            // Test compatibility between first two orders
            const order1 = allOrders[0];
            const order2 = allOrders[1];
            
            console.log("\n📋 Testing compatibility between orders:");
            console.log("  Order 1:", order1.order_id);
            console.log("    Source:", order1.source_token, "→ Destination:", order1.destination_token);
            console.log("    Amount:", order1.source_amount);
            
            console.log("  Order 2:", order2.order_id);
            console.log("    Source:", order2.source_token, "→ Destination:", order2.destination_token);
            console.log("    Amount:", order2.source_amount);
            
            // Check if they're compatible
            const compatible = await backend.is_compatible_orders(order1.order_id, order2.order_id);
            console.log("✅ Orders compatible:", compatible);
        }
        
    } catch (error) {
        console.error("❌ Order compatibility test failed:", error);
        throw error;
    }
}

// Test order status tracking
async function testOrderStatusTracking() {
    console.log("\n🧪 Testing order status tracking...");
    
    try {
        const backend = await initBackendActor();
        
        // Get orders by status
        console.log("\n📋 Getting orders by status...");
        const createdOrders = await backend.get_orders_by_status("Created");
        console.log("✅ Created orders:", createdOrders.length);
        
        const sourceHtlcCreatedOrders = await backend.get_orders_by_status("SourceHTLCCreated");
        console.log("✅ Source HTLC created orders:", sourceHtlcCreatedOrders.length);
        
        const completedOrders = await backend.get_orders_by_status("Completed");
        console.log("✅ Completed orders:", completedOrders.length);
        
        // Get compatible orders
        console.log("\n📋 Getting compatible orders...");
        const allOrders = await backend.get_all_atomic_swap_orders();
        if (allOrders.length > 0) {
            const compatibleOrders = await backend.get_compatible_orders(allOrders[0].order_id);
            console.log("✅ Compatible orders found:", compatibleOrders.length);
        }
        
    } catch (error) {
        console.error("❌ Order status tracking test failed:", error);
        throw error;
    }
}

// Main test function
async function runOrderPairingTests() {
    console.log("🧪 Starting order pairing comprehensive tests...\n");
    
    try {
        // Test all pairing scenarios
        await testEvmIcpPairing();
        await testEvmSolanaPairing();
        await testIcpSolanaPairing();
        
        // Test order management
        await testOrderCompatibility();
        await testOrderStatusTracking();
        
        console.log("\n🎉 All order pairing tests completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runOrderPairingTests();
}

module.exports = {
    testEvmIcpPairing,
    testEvmSolanaPairing,
    testIcpSolanaPairing,
    testOrderCompatibility,
    testOrderStatusTracking,
    runOrderPairingTests
};
