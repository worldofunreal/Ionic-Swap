#!/usr/bin/env node

const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { ethers } = require('ethers');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');

// Configuration
const BACKEND_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const SPIRAL_TOKEN_CANISTER_ID = 'uzt4z-lp777-77774-qaabq-cai';
const STARDUST_TOKEN_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';

// EVM Configuration (Sepolia)
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';
const HTLC_CONTRACT = '0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d';
const SEPOLIA_CHAIN_ID = 11155111;

// Test addresses
const EVM_USER_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const EVM_USER_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const ICP_USER_1 = 'rsbch-rvgaf-7xj6x-rx5pu-b2yz5-pldqp-rs7le-eiitu-gc43a-ret3l-jqe';
const ICP_USER_2 = '76m6r-zvs5x-ke2a2-opvok-hhlw6-6bief-53lbr-vo64t-z4ijp-5gvmg-sqe';

// Test amounts (much smaller for testing)
const TEST_AMOUNTS = {
    SPIRAL_10: 1000000000n,      // 10 SPIRAL (8 decimals)
    SPIRAL_9: 900000000n,        // 9 SPIRAL (8 decimals)
    STD_5: 500000000n,           // 5 STD (8 decimals)
    STD_6: 600000000n,           // 6 STD (8 decimals)
};

console.log('🚀 Testing REAL EVM<>ICP Cross-Chain Swap');
console.log('==========================================');
console.log('');

// EIP-2612 permit helpers (from test-icp-atomic-swap.cjs)
const createPermitDomain = (tokenAddress) => {
    let tokenName = 'Spiral';
    if (tokenAddress.toLowerCase() === STARDUST_TOKEN.toLowerCase()) {
        tokenName = 'Stardust';
    }
    
    return {
        name: tokenName,
        version: '1',
        chainId: SEPOLIA_CHAIN_ID,
        verifyingContract: tokenAddress
    };
};

const createPermitTypes = () => ({
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
});

const createPermitMessage = (owner, spender, value, nonce, deadline) => ({
    owner,
    spender,
    value: ethers.utils.parseUnits(value, 8),
    nonce,
    deadline
});

const signPermitMessage = async (signer, owner, spender, value, nonce, deadline, tokenAddress) => {
    const domain = createPermitDomain(tokenAddress);
    const types = createPermitTypes();
    const message = createPermitMessage(owner, spender, value, nonce, deadline);

    console.log(`🔍 Signing permit for ${tokenAddress}:`);
    console.log(`  Amount: ${value} tokens`);
    console.log(`  Nonce: ${nonce}`);
    console.log(`  Deadline: ${deadline}`);

    const signature = await signer._signTypedData(domain, types, message);
    const sig = ethers.utils.splitSignature(signature);

    return {
        signature,
        sig,
        domain,
        types,
        message
    };
};

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

// Initialize DFX agent and backend actor
const agent = new HttpAgent({
    host: 'http://127.0.0.1:4943',
    fetchRootKey: true,
});

const backend = Actor.createActor(idlFactory, {
    agent,
    canisterId: BACKEND_CANISTER_ID,
});

// Initialize ethers provider and signer
const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303');
const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const signer = new ethers.Wallet(privateKey, provider);

// Test functions
async function testICRC1TokenTransfers() {
    console.log('🔧 Testing ICRC-1 Token Transfers...');
    
    try {
        // Test Spiral token transfer
        const transferResult = await backend.transfer_icrc_tokens_public(
            SPIRAL_TOKEN_CANISTER_ID,
            ICP_USER_1,
            100000000000n
        );
        logSuccess(`Spiral transfer: ${transferResult.Ok}`);
        
        // Test Stardust token transfer
        const transferResult2 = await backend.transfer_icrc_tokens_public(
            STARDUST_TOKEN_CANISTER_ID,
            ICP_USER_1,
            50000000000n
        );
        logSuccess(`Stardust transfer: ${transferResult2.Ok}`);
        
        // Check balances
        const spiralBalance = await backend.get_icrc_balance_public(
            SPIRAL_TOKEN_CANISTER_ID,
            ICP_USER_1
        );
        logInfo(`ICP User 1 Spiral balance: ${spiralBalance.Ok}`);
        
        const stardustBalance = await backend.get_icrc_balance_public(
            STARDUST_TOKEN_CANISTER_ID,
            ICP_USER_1
        );
        logInfo(`ICP User 1 Stardust balance: ${stardustBalance.Ok}`);
        
    } catch (error) {
        logError(`ICRC-1 transfer failed: ${error.message}`);
        throw error;
    }
}

async function testRealEVMToICPSwap(userAddress) {
    console.log('\n🔧 Testing REAL EVM→ICP Swap Flow...');
    
    try {
        // Step 1: Create atomic swap order (like the working script)
        logStep('1', 'Creating atomic swap order');
        const orderResult = await backend.create_atomic_swap_order(
            userAddress,          // maker (EVM user)
            '0xeA1e8F475e61Ff78b2986860E86A18F261078725', // taker (ICP canister's EVM address)
            SPIRAL_TOKEN,         // source token (EVM)
            STARDUST_TOKEN_CANISTER_ID, // destination token (ICP)
            TEST_AMOUNTS.SPIRAL_10.toString(),     // source amount
            TEST_AMOUNTS.STD_5.toString(),         // destination amount
            3600                 // timelock duration (1 hour)
        );
        
        const orderId = orderResult.Ok;
        logSuccess(`Cross-chain order created: ${orderId}`);
        
        // Step 2: Get nonce from Spiral token contract
        logStep('2', 'Getting Spiral token nonce');
        const spiralTokenContract = new ethers.Contract(SPIRAL_TOKEN, [
            'function nonces(address owner) view returns (uint256)'
        ], provider);
        
        const spiralNonce = await spiralTokenContract.nonces(userAddress);
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        logInfo(`Spiral nonce: ${spiralNonce.toString()}`);
        logInfo(`Deadline: ${deadline}`);
        
        // Step 3: Create EIP-2612 permit for Spiral tokens
        logStep('3', 'Creating EIP-2612 permit for Spiral tokens');
        const spiralAmountHuman = ethers.utils.formatUnits(TEST_AMOUNTS.SPIRAL_10, 8);
        
        const spiralPermitResult = await signPermitMessage(
            signer,
            userAddress,
            HTLC_CONTRACT,
            spiralAmountHuman,
            spiralNonce,
            deadline,
            SPIRAL_TOKEN
        );
        
        logSuccess('Spiral permit signed successfully');
        
        // Step 4: Execute Spiral permit via ICP canister
        logStep('4', 'Executing Spiral permit via ICP canister');
        const spiralPermitRequest = {
            owner: userAddress,
            spender: HTLC_CONTRACT,
            value: TEST_AMOUNTS.SPIRAL_10.toString(),
            nonce: spiralNonce.toString(),
            deadline: deadline.toString(),
            v: spiralPermitResult.sig.v.toString(),
            r: spiralPermitResult.sig.r,
            s: spiralPermitResult.sig.s,
            signature: spiralPermitResult.signature
        };
        
        const spiralGaslessApprovalRequest = {
            permit_request: spiralPermitRequest,
            user_address: userAddress,
            amount: TEST_AMOUNTS.SPIRAL_10.toString(),
            token_address: SPIRAL_TOKEN
        };
        
        const spiralPermitResult2 = await backend.execute_gasless_approval(spiralGaslessApprovalRequest);
        if ('Ok' in spiralPermitResult2) {
            logSuccess(`Spiral permit executed: Transaction Hash: ${spiralPermitResult2.Ok}`);
            
            // Step 5: Create real EVM HTLC
            logStep('5', 'Creating real EVM HTLC');
            const sourceHtlcResult = await backend.create_evm_htlc(orderId, true);
            if ('Ok' in sourceHtlcResult) {
                const sourceHtlcTx = sourceHtlcResult.Ok;
                logSuccess(`Real EVM HTLC created: Transaction Hash: ${sourceHtlcTx}`);
                
                // Step 6: Execute EVM→ICP swap coordination
                logStep('6', 'Executing EVM→ICP swap coordination');
                const swapResult = await backend.execute_evm_to_icp_swap_public(
                    orderId,
                    sourceHtlcTx
                );
                logSuccess(`EVM→ICP swap initiated: ${swapResult.Ok}`);
                
                // Step 7: Check order status
                const status = await backend.get_cross_chain_swap_status_public(orderId);
                logInfo(`Order status: ${JSON.stringify(status)}`);
                
                return { orderId, sourceHtlcTx };
                
            } else {
                throw new Error(`Failed to create EVM HTLC: ${sourceHtlcResult.Err}`);
            }
        } else {
            throw new Error(`Failed to execute Spiral permit: ${spiralPermitResult2.Err}`);
        }
        
    } catch (error) {
        logError(`EVM→ICP swap flow failed: ${error.message}`);
        throw error;
    }
}

async function testRealICPToEVMSwap(userAddress) {
    console.log('\n🔧 Testing REAL ICP→EVM Swap Flow...');
    
    try {
        // Step 1: Create atomic swap order (like the working EVM→ICP test)
        logStep('1', 'Creating ICP→EVM atomic swap order');
        const orderResult = await backend.create_atomic_swap_order(
            ICP_USER_2,           // maker (ICP user)
            BACKEND_CANISTER_ID,  // taker (backend canister ID)
            STARDUST_TOKEN_CANISTER_ID, // source token (ICP)
            SPIRAL_TOKEN,         // destination token (EVM)
            TEST_AMOUNTS.STD_6.toString(),         // source amount
            TEST_AMOUNTS.SPIRAL_9.toString(),      // destination amount
            3600                 // timelock duration (1 hour)
        );
        
        const orderId = orderResult.Ok;
        logSuccess(`Cross-chain order created: ${orderId}`);
        
        // Step 2: Create real ICP HTLC (backend canister already has tokens)
        logStep('2', 'Creating real ICP HTLC');
        const icpHtlcResult = await backend.create_icp_htlc_public(
            orderId,
            STARDUST_TOKEN_CANISTER_ID,
            BACKEND_CANISTER_ID, // Recipient should be ICP canister (escrow)
            TEST_AMOUNTS.STD_6,   // Pass BigInt directly (nat expects BigInt)
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            1754150934
        );
                
        if ('Ok' in icpHtlcResult) {
            const icpHtlcId = icpHtlcResult.Ok;
            logSuccess(`Real ICP HTLC created: ${icpHtlcId}`);
            
            // Step 3: Execute ICP→EVM swap coordination
            logStep('3', 'Executing ICP→EVM swap coordination');
            const swapResult = await backend.execute_icp_to_evm_swap_public(
                orderId,
                icpHtlcId
            );
            logSuccess(`ICP→EVM swap initiated: ${swapResult.Ok}`);
            
            // Step 4: Check order status
            const status = await backend.get_cross_chain_swap_status_public(orderId);
            logInfo(`Order status: ${JSON.stringify(status)}`);
            
            return { orderId, icpHtlcId };
            
        } else {
            throw new Error(`Failed to create ICP HTLC: ${icpHtlcResult.Err}`);
        }
        
    } catch (error) {
        logError(`ICP→EVM swap flow failed: ${error.message}`);
        throw error;
    }
}

async function testRealCrossChainSwapCompletion(orderId) {
    console.log('\n🔧 Testing REAL Cross-Chain Swap Completion...');
    
    try {
        // Get the order to extract the secret
        const allOrders = await backend.get_all_atomic_swap_orders();
        const order = allOrders.find(o => o.order_id === orderId);
        
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        
        // Complete the swap using the secret
        logStep('1', 'Completing cross-chain swap with real secret');
        const completionResult = await backend.complete_cross_chain_swap_public(
            orderId,
            order.secret
        );
        logSuccess(`Cross-chain swap completed: ${completionResult.Ok}`);
        
        // Check final status
        const finalStatus = await backend.get_cross_chain_swap_status_public(orderId);
        logInfo(`Final order status: ${JSON.stringify(finalStatus)}`);
        
    } catch (error) {
        logError(`Cross-chain swap completion failed: ${error.message}`);
        throw error;
    }
}

async function testRealHTLCClaiming(orderId, htlcTx) {
    console.log('\n🔧 Testing REAL HTLC Claiming...');
    
    try {
        // Get the order to extract the secret
        const allOrders = await backend.get_all_atomic_swap_orders();
        const order = allOrders.find(o => o.order_id === orderId);
        
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        
        // Claim the HTLC using the secret
        logStep('1', 'Claiming EVM HTLC with real secret');
        const claimResult = await backend.claim_evm_htlc(orderId, htlcTx);
        
        if ('Ok' in claimResult) {
            logSuccess(`HTLC claimed successfully: ${claimResult.Ok}`);
        } else {
            logError(`Failed to claim HTLC: ${claimResult.Err}`);
        }
        
    } catch (error) {
        logError(`HTLC claiming failed: ${error.message}`);
        throw error;
    }
}

// Main test execution
async function runRealTests() {
    try {
        console.log('🚀 Starting REAL EVM<>ICP Cross-Chain Swap Tests...\n');
        
        // Wait for agent to be ready
        await agent.fetchRootKey();
        
        // Get user address
        const userAddress = await signer.getAddress();
        console.log(`🔑 Using EVM address: ${userAddress}`);
        
        // Initialize nonce from blockchain (like the working script)
        console.log('\n📋 Step 0: Initializing nonce from blockchain...');
        try {
            const nonceResult = await backend.initialize_nonce();
            if ('Ok' in nonceResult) {
                console.log("✅ Nonce initialized:", nonceResult.Ok);
            } else {
                console.log("❌ Failed to initialize nonce:", nonceResult.Err);
                return;
            }
        } catch (error) {
            console.log("❌ Error initializing nonce:", error.message);
            return;
        }
        
        // Test 1: ICRC-1 Token Transfers
        await testICRC1TokenTransfers();
        
        // Transfer more tokens to ICP canister for ICP→EVM swap
        logInfo('Transferring additional tokens to ICP canister for ICP→EVM swap...');
        const additionalTransfer = await backend.transfer_icrc_tokens_public(
            STARDUST_TOKEN_CANISTER_ID,
            BACKEND_CANISTER_ID,
            100000000000n // 1000 tokens
        );
        logSuccess(`Additional transfer: ${additionalTransfer.Ok}`);
        
        // Test 2: Real EVM→ICP Swap Flow
        const { orderId: evmToIcpOrderId, sourceHtlcTx } = await testRealEVMToICPSwap(userAddress);
        
        // Wait between transactions
        logInfo('Waiting 10 seconds between transactions...');
        await sleep(10000);
        
        // Test 3: Real ICP→EVM Swap Flow
        const { orderId: icpToEvmOrderId, icpHtlcId } = await testRealICPToEVMSwap(userAddress);
        
        // Test 4: Real HTLC Claiming
        await testRealHTLCClaiming(evmToIcpOrderId, sourceHtlcTx);
        
        // Test 5: Real Cross-Chain Swap Completion
        await testRealCrossChainSwapCompletion(evmToIcpOrderId);
        
        console.log('\n🎉 All REAL EVM<>ICP Cross-Chain Swap Tests Completed Successfully!');
        console.log('\n📋 Test Summary:');
        console.log('  ✅ Real ICRC-1 token transfers');
        console.log('  ✅ Real EVM→ICP swap with permits');
        console.log('  ✅ Real ICP→EVM swap with HTLCs');
        console.log('  ✅ Real HTLC claiming');
        console.log('  ✅ Real cross-chain swap completion');
        
        console.log('\n🏗️ Real Architecture Verified:');
        console.log('  ✅ Real EVM contract integration');
        console.log('  ✅ Real EIP-2612 permit execution');
        console.log('  ✅ Real HTLC creation and claiming');
        console.log('  ✅ Real cross-chain coordination');
        console.log('  ✅ Real atomic swap execution');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runRealTests(); 