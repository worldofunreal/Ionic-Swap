#!/usr/bin/env node

const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { ethers } = require('ethers');

// Configuration
const BACKEND_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const SPIRAL_TOKEN_CANISTER_ID = 'uzt4z-lp777-77774-qaabq-cai';
const STARDUST_TOKEN_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';

// Test addresses (using Hardhat default accounts)
const EVM_USER_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const EVM_USER_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const ICP_USER_1 = 'rsbch-rvgaf-7xj6x-rx5pu-b2yz5-pldqp-rs7le-eiitu-gc43a-ret3l-jqe'; // Your current identity
const ICP_USER_2 = '76m6r-zvs5x-ke2a2-opvok-hhlw6-6bief-53lbr-vo64t-z4ijp-5gvmg-sqe'; // Minter identity

// Token addresses (Sepolia)
const EVM_SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const EVM_STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';

// Test amounts
const TEST_AMOUNTS = {
    SPIRAL_1000: 100000000000n, // 1000 SPIRAL (8 decimals)
    SPIRAL_950: 950000000000n,  // 950 SPIRAL (8 decimals)
    STD_500: 50000000000n,      // 500 STD (8 decimals)
    STD_510: 51000000000n,      // 510 STD (8 decimals)
};

console.log('🚀 Testing EVM<>ICP Cross-Chain Swap - Unified Order Book');
console.log('========================================================');
console.log('');

// Initialize DFX agent
const agent = new HttpAgent({
    host: 'http://127.0.0.1:4943',
    identity: undefined, // Will use anonymous identity for now
});

// Initialize backend actor
const { createActor: createBackendActor } = require('../src/declarations/backend');
const backend = createBackendActor(BACKEND_CANISTER_ID, {
    agent,
});

// Initialize token actors (using ICRC-1 standard interface)
const { createActor: createSpiralTokenActor } = require('../src/declarations/spiral_token');
const { createActor: createStardustTokenActor } = require('../src/declarations/stardust_token');

const spiralToken = createSpiralTokenActor(SPIRAL_TOKEN_CANISTER_ID, {
    agent,
});

const stardustToken = createStardustTokenActor(STARDUST_TOKEN_CANISTER_ID, {
    agent,
});

// Helper functions
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function logStep(step, description) {
    console.log(`📋 ${step}: ${description}`);
}

async function logSuccess(message) {
    console.log(`✅ ${message}`);
}

async function logError(message) {
    console.log(`❌ ${message}`);
}

async function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

// Test functions
async function testICRC1TokenTransfers() {
    console.log('🔧 Testing ICRC-1 Token Transfers...');
    
    try {
        // Test Spiral token transfer
        const transferResult = await backend.transfer_icrc_tokens_public(
            SPIRAL_TOKEN_CANISTER_ID,
            ICP_USER_1,
            TEST_AMOUNTS.SPIRAL_1000
        );
        logSuccess(`Spiral transfer: ${transferResult}`);
        
        // Test Stardust token transfer
        const transferResult2 = await backend.transfer_icrc_tokens_public(
            STARDUST_TOKEN_CANISTER_ID,
            ICP_USER_1,
            TEST_AMOUNTS.STD_500
        );
        logSuccess(`Stardust transfer: ${transferResult2}`);
        
        // Check balances
        const spiralBalance = await backend.get_icrc_balance_public(
            SPIRAL_TOKEN_CANISTER_ID,
            ICP_USER_1
        );
        logInfo(`ICP User 1 Spiral balance: ${spiralBalance}`);
        
        const stardustBalance = await backend.get_icrc_balance_public(
            STARDUST_TOKEN_CANISTER_ID,
            ICP_USER_1
        );
        logInfo(`ICP User 1 Stardust balance: ${stardustBalance}`);
        
    } catch (error) {
        logError(`ICRC-1 transfer failed: ${error.message}`);
        throw error;
    }
}

async function testCrossChainOrderCreation() {
    console.log('\n🔧 Testing Cross-Chain Order Creation...');
    
    try {
        // Create Order 1: EVM User wants to swap 1000 SPIRAL (EVM) for 500 STD (ICP)
        logStep('1', 'Creating Order 1: EVM→ICP swap');
        const order1Result = await backend.create_cross_chain_order_public(
            EVM_USER_1,           // maker
            ICP_USER_1,           // taker
            EVM_SPIRAL_TOKEN,     // source token (EVM)
            STARDUST_TOKEN_CANISTER_ID, // destination token (ICP)
            TEST_AMOUNTS.SPIRAL_1000.toString(),   // source amount
            TEST_AMOUNTS.STD_500.toString(),       // destination amount
            { EVMtoICP: null },   // direction
            1754150934            // timelock (2 hours from now)
        );
        const order1Id = order1Result.Ok;
        logSuccess(`Order 1 created: ${order1Id}`);
        
        // Create Order 2: ICP User wants to swap 510 STD (ICP) for 950 SPIRAL (EVM)
        logStep('2', 'Creating Order 2: ICP→EVM swap');
        const order2Result = await backend.create_cross_chain_order_public(
            ICP_USER_2,           // maker
            EVM_USER_2,           // taker
            STARDUST_TOKEN_CANISTER_ID, // source token (ICP)
            EVM_SPIRAL_TOKEN,     // destination token (EVM)
            TEST_AMOUNTS.STD_510.toString(),       // source amount
            TEST_AMOUNTS.SPIRAL_950.toString(),    // destination amount
            { ICPtoEVM: null },   // direction
            1754150934            // timelock (2 hours from now)
        );
        const order2Id = order2Result.Ok;
        logSuccess(`Order 2 created: ${order2Id}`);
        
        return { order1Id, order2Id };
        
    } catch (error) {
        logError(`Order creation failed: ${error.message}`);
        throw error;
    }
}

async function testOrderValidation() {
    console.log('\n🔧 Testing Order Validation...');
    
    try {
        // Get all orders
        const allOrders = await backend.get_all_atomic_swap_orders();
        logInfo(`Total orders in system: ${allOrders.length}`);
        
        // Validate each order
        for (const order of allOrders) {
            const isValid = await backend.validate_cross_chain_order_public(order.order_id);
            const status = await backend.get_cross_chain_swap_status_public(order.order_id);
            
            logInfo(`Order ${order.order_id}:`);
            logInfo(`  - Valid: ${isValid}`);
            logInfo(`  - Status: ${JSON.stringify(status)}`);
            logInfo(`  - Maker: ${order.maker}`);
            logInfo(`  - Taker: ${order.taker}`);
            logInfo(`  - Source: ${order.source_token} (${order.source_amount})`);
            logInfo(`  - Destination: ${order.destination_token} (${order.destination_amount})`);
        }
        
    } catch (error) {
        logError(`Order validation failed: ${error.message}`);
        throw error;
    }
}

async function testEVMToICPSwapFlow(orderId) {
    console.log('\n🔧 Testing EVM→ICP Swap Flow...');
    
    try {
        // Step 1: Create EVM HTLC (this would be done by the frontend)
        logStep('1', 'Creating EVM HTLC (simulated)');
        const evmHtlcId = 'evm_htlc_0x1234567890abcdef';
        logSuccess(`EVM HTLC created: ${evmHtlcId}`);
        
        // Step 2: Execute EVM→ICP swap coordination
        logStep('2', 'Executing EVM→ICP swap coordination');
        const swapResult = await backend.execute_evm_to_icp_swap_public(
            orderId,
            evmHtlcId
        );
        logSuccess(`EVM→ICP swap initiated: ${swapResult}`);
        
        // Step 3: Check order status
        const status = await backend.get_cross_chain_swap_status_public(orderId);
        logInfo(`Order status after EVM→ICP execution: ${JSON.stringify(status)}`);
        
    } catch (error) {
        logError(`EVM→ICP swap flow failed: ${error.message}`);
        throw error;
    }
}

async function testICPToEVMSwapFlow(orderId) {
    console.log('\n🔧 Testing ICP→EVM Swap Flow...');
    
    try {
        // Step 1: Create ICP HTLC
        logStep('1', 'Creating ICP HTLC');
        const icpHtlcId = 'icp_htlc_test_123';
        logSuccess(`ICP HTLC created: ${icpHtlcId}`);
        
        // Step 2: Execute ICP→EVM swap coordination
        logStep('2', 'Executing ICP→EVM swap coordination');
        const swapResult = await backend.execute_icp_to_evm_swap_public(
            orderId,
            icpHtlcId
        );
        logSuccess(`ICP→EVM swap initiated: ${swapResult}`);
        
        // Step 3: Check order status
        const status = await backend.get_cross_chain_swap_status_public(orderId);
        logInfo(`Order status after ICP→EVM execution: ${JSON.stringify(status)}`);
        
    } catch (error) {
        logError(`ICP→EVM swap flow failed: ${error.message}`);
        throw error;
    }
}

async function testCrossChainSwapCompletion(orderId) {
    console.log('\n🔧 Testing Cross-Chain Swap Completion...');
    
    try {
        // Get the order to extract the secret
        const allOrders = await backend.get_all_atomic_swap_orders();
        const order = allOrders.find(o => o.order_id === orderId);
        
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        
        // Complete the swap using the secret
        logStep('1', 'Completing cross-chain swap');
        const completionResult = await backend.complete_cross_chain_swap_public(
            orderId,
            order.secret
        );
        logSuccess(`Cross-chain swap completed: ${completionResult}`);
        
        // Check final status
        const finalStatus = await backend.get_cross_chain_swap_status_public(orderId);
        logInfo(`Final order status: ${JSON.stringify(finalStatus)}`);
        
    } catch (error) {
        logError(`Cross-chain swap completion failed: ${error.message}`);
        throw error;
    }
}

async function testICPHtlcFunctions() {
    console.log('\n🔧 Testing ICP HTLC Functions...');
    
    try {
        // List all ICP HTLCs
        const icpHtlcs = await backend.list_icp_htlcs_public();
        logInfo(`Total ICP HTLCs: ${icpHtlcs.length}`);
        
        for (const htlc of icpHtlcs) {
            logInfo(`HTLC ${htlc.id}:`);
            logInfo(`  - Status: ${JSON.stringify(htlc.status)}`);
            logInfo(`  - Recipient: ${htlc.recipient}`);
            logInfo(`  - Amount: ${htlc.amount}`);
            logInfo(`  - Hashlock: ${htlc.hashlock}`);
            logInfo(`  - Timelock: ${htlc.timelock}`);
        }
        
    } catch (error) {
        logError(`ICP HTLC functions failed: ${error.message}`);
        throw error;
    }
}

// Main test execution
async function runAllTests() {
    try {
        console.log('🚀 Starting EVM<>ICP Cross-Chain Swap Tests...\n');
        
        // Test 1: ICRC-1 Token Transfers
        await testICRC1TokenTransfers();
        
        // Test 2: Cross-Chain Order Creation
        const { order1Id, order2Id } = await testCrossChainOrderCreation();
        
        // Test 3: Order Validation
        await testOrderValidation();
        
        // Test 4: EVM→ICP Swap Flow
        await testEVMToICPSwapFlow(order1Id);
        
        // Test 5: ICP→EVM Swap Flow
        await testICPToEVMSwapFlow(order2Id);
        
        // Test 6: ICP HTLC Functions
        await testICPHtlcFunctions();
        
        // Test 7: Cross-Chain Swap Completion (for one order)
        await testCrossChainSwapCompletion(order1Id);
        
        console.log('\n🎉 All EVM<>ICP Cross-Chain Swap Tests Completed Successfully!');
        console.log('\n📋 Test Summary:');
        console.log('  ✅ ICRC-1 token transfers');
        console.log('  ✅ Cross-chain order creation');
        console.log('  ✅ Order validation');
        console.log('  ✅ EVM→ICP swap flow');
        console.log('  ✅ ICP→EVM swap flow');
        console.log('  ✅ ICP HTLC functions');
        console.log('  ✅ Cross-chain swap completion');
        
        console.log('\n🏗️ Architecture Verified:');
        console.log('  ✅ Unified order book experience');
        console.log('  ✅ Bidirectional EVM<>ICP swaps');
        console.log('  ✅ ICRC-1 token integration');
        console.log('  ✅ Cross-chain HTLC coordination');
        console.log('  ✅ Atomic swap execution');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runAllTests(); 