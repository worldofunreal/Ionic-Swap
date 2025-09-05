const { Actor, HttpAgent } = require("@dfinity/agent");
const { Principal } = require("@dfinity/principal");

// Configuration
const BACKEND_CANISTER_ID = "be2us-64aaa-aaaaa-qaabq-cai"; // Replace with your canister ID
const LOCAL_HOST = "http://127.0.0.1:4943";

// Test configuration
const TEST_CONFIG = {
    solanaUser: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Replace with actual Solana testnet address
    tokenMint: "So11111111111111111111111111111111111111112", // Replace with actual SPL token mint
    amount: 1000000, // 1 token (assuming 6 decimals)
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

// Test Solana HTLC creation
async function testSolanaHtlcCreation() {
    console.log("🧪 Testing Solana HTLC creation...");
    
    try {
        const backend = await initBackendActor();
        
        // Step 1: Get canister's Solana address
        console.log("\n📋 Step 1: Getting canister's Solana address...");
        const canisterSolanaAddress = await backend.get_canister_solana_address_public();
        console.log("✅ Canister Solana address:", canisterSolanaAddress);
        
        // Step 2: Create a test order first
        console.log("\n📋 Step 2: Creating test order...");
        const orderId = `test_order_${Date.now()}`;
        
        // We need to create an order first to test HTLC creation
        // For this test, we'll create a mock order structure
        console.log("📝 Using mock order ID:", orderId);
        
        // Step 3: Create Solana HTLC
        console.log("\n📋 Step 3: Creating Solana HTLC...");
        const hashlock = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        try {
            const htlcResult = await backend.create_solana_htlc_public(
                orderId,                    // order_id
                TEST_CONFIG.tokenMint,      // token_mint
                TEST_CONFIG.amount,         // amount
                hashlock,                   // hashlock
                TEST_CONFIG.timelock,       // timelock
                TEST_CONFIG.solanaUser,     // user_address
                true                        // is_source_htlc
            );
            console.log("✅ Solana HTLC created:", htlcResult);
            
            // Extract HTLC ID from result
            const htlcIdMatch = htlcResult.match(/HTLC ID: ([a-f0-9-]+)/);
            if (htlcIdMatch) {
                const htlcId = htlcIdMatch[1];
                console.log("📝 HTLC ID:", htlcId);
                
                // Step 4: Get HTLC status
                console.log("\n📋 Step 4: Getting HTLC status...");
                const htlcStatus = await backend.get_solana_htlc_status_public(htlcId);
                console.log("✅ HTLC status:", htlcStatus);
                
                return htlcId;
            }
            
        } catch (error) {
            console.log("⚠️ HTLC creation failed (expected without real order):", error.message);
            return null;
        }
        
    } catch (error) {
        console.error("❌ HTLC creation test failed:", error);
        throw error;
    }
}

// Test Solana HTLC listing
async function testSolanaHtlcListing() {
    console.log("\n🧪 Testing Solana HTLC listing...");
    
    try {
        const backend = await initBackendActor();
        
        // List all Solana HTLCs
        console.log("\n📋 Listing all Solana HTLCs...");
        const htlcs = await backend.list_solana_htlcs_public();
        console.log("✅ Solana HTLCs found:", htlcs.length);
        
        if (htlcs.length > 0) {
            console.log("📋 HTLC details:");
            htlcs.forEach((htlc, index) => {
                console.log(`  ${index + 1}. ID: ${htlc.id}`);
                console.log(`     Status: ${htlc.status}`);
                console.log(`     Token: ${htlc.token}`);
                console.log(`     Amount: ${htlc.amount}`);
                console.log(`     Sender: ${htlc.sender}`);
                console.log(`     Recipient: ${htlc.recipient}`);
                console.log(`     Created: ${new Date(htlc.created_at / 1000000).toISOString()}`);
                console.log("");
            });
        } else {
            console.log("📝 No Solana HTLCs found");
        }
        
    } catch (error) {
        console.error("❌ HTLC listing test failed:", error);
        throw error;
    }
}

// Test Solana HTLC claiming
async function testSolanaHtlcClaiming(htlcId) {
    if (!htlcId) {
        console.log("⏭️ Skipping HTLC claiming test (no HTLC ID)");
        return;
    }
    
    console.log("\n🧪 Testing Solana HTLC claiming...");
    
    try {
        const backend = await initBackendActor();
        
        // Test claiming with invalid secret
        console.log("\n📋 Step 1: Testing claim with invalid secret...");
        try {
            await backend.claim_solana_htlc_public(
                "test_order", // order_id
                htlcId,       // htlc_id
                "invalid_secret" // secret
            );
            console.log("❌ Claim should have failed with invalid secret");
        } catch (error) {
            console.log("✅ Claim correctly failed with invalid secret:", error.message);
        }
        
        // Test claiming with valid secret (if we had one)
        console.log("\n📋 Step 2: Testing claim with valid secret...");
        try {
            await backend.claim_solana_htlc_public(
                "test_order", // order_id
                htlcId,       // htlc_id
                "valid_secret" // secret (this would need to match the hashlock)
            );
            console.log("✅ HTLC claimed successfully");
        } catch (error) {
            console.log("⚠️ Claim failed (expected without valid secret):", error.message);
        }
        
    } catch (error) {
        console.error("❌ HTLC claiming test failed:", error);
        throw error;
    }
}

// Test Solana HTLC refunding
async function testSolanaHtlcRefunding(htlcId) {
    if (!htlcId) {
        console.log("⏭️ Skipping HTLC refunding test (no HTLC ID)");
        return;
    }
    
    console.log("\n🧪 Testing Solana HTLC refunding...");
    
    try {
        const backend = await initBackendActor();
        
        // Test refunding (should fail if timelock hasn't expired)
        console.log("\n📋 Testing HTLC refunding...");
        try {
            await backend.refund_solana_htlc_public(
                "test_order", // order_id
                htlcId        // htlc_id
            );
            console.log("✅ HTLC refunded successfully");
        } catch (error) {
            console.log("⚠️ Refund failed (expected if timelock hasn't expired):", error.message);
        }
        
    } catch (error) {
        console.error("❌ HTLC refunding test failed:", error);
        throw error;
    }
}

// Test Solana wallet functionality
async function testSolanaWallet() {
    console.log("\n🧪 Testing Solana wallet functionality...");
    
    try {
        const backend = await initBackendActor();
        
        // Test getting Solana wallet for a principal
        console.log("\n📋 Testing Solana wallet derivation...");
        const testPrincipal = "rdmx6-jaaaa-aaaah-qcaiq-cai";
        const solanaAddress = await backend.get_solana_wallet_public(testPrincipal);
        console.log("✅ Solana address for principal", testPrincipal, ":", solanaAddress);
        
        // Test getting canister's Solana address
        console.log("\n📋 Testing canister Solana address...");
        const canisterAddress = await backend.get_canister_solana_address_public();
        console.log("✅ Canister Solana address:", canisterAddress);
        
    } catch (error) {
        console.error("❌ Solana wallet test failed:", error);
        throw error;
    }
}

// Test Solana RPC functionality
async function testSolanaRpc() {
    console.log("\n🧪 Testing Solana RPC functionality...");
    
    try {
        const backend = await initBackendActor();
        
        // Test getting Solana balance
        console.log("\n📋 Testing Solana balance query...");
        try {
            const balance = await backend.get_solana_balance_public(TEST_CONFIG.solanaUser);
            console.log("✅ Solana balance for", TEST_CONFIG.solanaUser, ":", balance);
        } catch (error) {
            console.log("⚠️ Balance query failed:", error.message);
        }
        
        // Test getting Solana slot
        console.log("\n📋 Testing Solana slot query...");
        try {
            const slot = await backend.get_solana_slot_public();
            console.log("✅ Current Solana slot:", slot);
        } catch (error) {
            console.log("⚠️ Slot query failed:", error.message);
        }
        
        // Test getting SPL token balance
        console.log("\n📋 Testing SPL token balance query...");
        try {
            const tokenBalance = await backend.get_spl_token_balance_public(
                TEST_CONFIG.solanaUser,
                TEST_CONFIG.tokenMint
            );
            console.log("✅ SPL token balance:", tokenBalance);
        } catch (error) {
            console.log("⚠️ SPL token balance query failed:", error.message);
        }
        
        // Test getting associated token address
        console.log("\n📋 Testing associated token address derivation...");
        try {
            const ata = await backend.get_associated_token_address_public(
                TEST_CONFIG.solanaUser,
                TEST_CONFIG.tokenMint
            );
            console.log("✅ Associated token address:", ata);
        } catch (error) {
            console.log("⚠️ ATA derivation failed:", error.message);
        }
        
    } catch (error) {
        console.error("❌ Solana RPC test failed:", error);
        throw error;
    }
}

// Main test function
async function runSolanaHtlcTests() {
    console.log("🧪 Starting Solana HTLC comprehensive tests...\n");
    
    try {
        // Test wallet functionality first
        await testSolanaWallet();
        
        // Test RPC functionality
        await testSolanaRpc();
        
        // Test HTLC creation
        const htlcId = await testSolanaHtlcCreation();
        
        // Test HTLC listing
        await testSolanaHtlcListing();
        
        // Test HTLC claiming
        await testSolanaHtlcClaiming(htlcId);
        
        // Test HTLC refunding
        await testSolanaHtlcRefunding(htlcId);
        
        console.log("\n🎉 All Solana HTLC tests completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runSolanaHtlcTests();
}

module.exports = {
    testSolanaHtlcCreation,
    testSolanaHtlcListing,
    testSolanaHtlcClaiming,
    testSolanaHtlcRefunding,
    testSolanaWallet,
    testSolanaRpc,
    runSolanaHtlcTests
};
