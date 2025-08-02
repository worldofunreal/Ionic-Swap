const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');

// Configuration
const BACKEND_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Token canister IDs (local deployment)
const STARDUST_TOKEN_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
const SPIRAL_TOKEN_CANISTER_ID = 'uzt4z-lp777-77774-qaabq-cai';

// EVM contract addresses
const SPIRAL_TOKEN_EVM = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const HTLC_CONTRACT = '0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d';

// Test amounts (small quantities)
const TEST_AMOUNTS = {
    STD_5: 500000000n,    // 5 STD (8 decimals)
    SPIRAL_10: 1000000000n, // 10 SPIRAL (8 decimals)
    STD_5_APPROVAL: 600000000n, // 6 STD for approval (extra buffer)
};

// ICP user principal (for testing) - Using Alice's identity
const ICP_USER = '4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe'; // Alice's principal

async function main() {
    console.log("🚀 Testing ICP→EVM Cross-Chain Swap");
    console.log("====================================");
    
    // Create agent and actor
    const agent = new HttpAgent({ 
        host: LOCAL_HOST,
        fetchRootKey: true,
    });
    
    await agent.fetchRootKey();
    
    const backend = Actor.createActor(idlFactory, {
        agent,
        canisterId: BACKEND_CANISTER_ID,
    });

    try {
        // Step 1: Initialize nonce from blockchain
        console.log("\n📋 Step 1: Initializing nonce from blockchain...");
        const nonceResult = await backend.initialize_nonce();
        if ('Ok' in nonceResult) {
            console.log("✅ Nonce initialized:", nonceResult.Ok);
        } else {
            console.log("❌ Failed to initialize nonce:", nonceResult.Err);
            return;
        }
        
        // Step 2: Approve backend canister to spend ICP tokens (ICRC-2)
        console.log("\n📋 Step 2: Approving backend canister to spend ICP tokens...");
        const { execSync } = require('child_process');
        
        try {
            // Use dfx to call icrc2_approve directly (Alice's identity)
            const approveCommand = `dfx canister call stardust_token icrc2_approve '(
                record {
                    amount = ${TEST_AMOUNTS.STD_5_APPROVAL} : nat;
                    spender = record {
                        owner = principal "uxrrr-q7777-77774-qaaaq-cai";
                        subaccount = null;
                    };
                }
            )'`;
            
            const approveResult = execSync(approveCommand, { encoding: 'utf8' });
            console.log("✅ ICRC-2 approval successful:", approveResult.trim());
        } catch (error) {
            console.log("❌ Failed to approve backend:", error.message);
            return;
        }
        
        // Step 3: Create atomic swap order (ICP→EVM)
        console.log("\n📋 Step 3: Creating atomic swap order (ICP→EVM)...");
        const orderResult = await backend.create_atomic_swap_order(
            ICP_USER,           // maker (ICP user)
            BACKEND_CANISTER_ID, // taker (backend canister ID)
            STARDUST_TOKEN_CANISTER_ID, // source token (ICP)
            SPIRAL_TOKEN_EVM,    // destination token (EVM)
            TEST_AMOUNTS.STD_5.toString(),     // source amount
            TEST_AMOUNTS.SPIRAL_10.toString(), // destination amount
            3600                 // timelock duration (1 hour)
        );
        
        if ('Ok' in orderResult) {
            const orderId = orderResult.Ok;
            console.log("✅ Atomic swap order created:", orderId);
            
            // Step 4: Get order details
            console.log("\n📋 Step 4: Getting order details...");
            const orderDetails = await backend.get_atomic_swap_order(orderId);
            if (orderDetails.length > 0) {
                const order = orderDetails[0];
                console.log("✅ Order details:");
                console.log("  Hashlock:", order.hashlock);
                console.log("  Secret:", order.secret);
                console.log("  Status:", JSON.stringify(order.status));
                console.log("  Timelock:", new Date(Number(order.timelock) * 1000).toISOString());
                
                // Step 5: Create ICP HTLC (this should transfer tokens to escrow)
                console.log("\n📋 Step 5: Creating ICP HTLC...");
                const icpHtlcResult = await backend.create_icp_htlc_public(
                    orderId,
                    STARDUST_TOKEN_CANISTER_ID,
                    BACKEND_CANISTER_ID, // recipient (backend canister as escrow)
                    TEST_AMOUNTS.STD_5,   // amount
                    order.hashlock,
                    order.timelock
                );
                
                if ('Ok' in icpHtlcResult) {
                    console.log("✅ ICP HTLC created:", icpHtlcResult.Ok);
                    
                    // Step 6: Create EVM HTLC
                    console.log("\n📋 Step 6: Creating EVM HTLC...");
                    const evmHtlcResult = await backend.create_evm_htlc(orderId, false);
                    
                    if ('Ok' in evmHtlcResult) {
                        console.log("✅ EVM HTLC created:", evmHtlcResult.Ok);
                        
                        // Step 7: Claim ICP HTLC
                        console.log("\n📋 Step 7: Claiming ICP HTLC...");
                        const icpClaimResult = await backend.claim_icp_htlc_public(
                            orderId,
                            icpHtlcResult.Ok,
                            order.secret
                        );
                        
                        if ('Ok' in icpClaimResult) {
                            console.log("✅ ICP HTLC claimed:", icpClaimResult.Ok);
                            
                            // Step 8: Claim EVM HTLC
                            console.log("\n📋 Step 8: Claiming EVM HTLC...");
                            const evmClaimResult = await backend.claim_evm_htlc(
                                orderId,
                                evmHtlcResult.Ok
                            );
                            
                            if ('Ok' in evmClaimResult) {
                                console.log("✅ EVM HTLC claimed:", evmClaimResult.Ok);
                                console.log("\n🎉 Complete ICP→EVM Cross-Chain Swap Successfully Executed!");
                                
                                console.log('\n📋 Complete Transaction Summary:');
                                console.log(`  ✅ Order Creation: ${orderId}`);
                                console.log(`  ✅ ICRC-2 Approval: Automated via dfx`);
                                console.log(`  ✅ ICP HTLC Creation: ${icpHtlcResult.Ok}`);
                                console.log(`  ✅ EVM HTLC Creation: ${evmHtlcResult.Ok}`);
                                console.log(`  ✅ ICP HTLC Claim: ${icpClaimResult.Ok}`);
                                console.log(`  ✅ EVM HTLC Claim: ${evmClaimResult.Ok}`);
                                
                                return;
                            } else {
                                console.log("❌ Failed to claim EVM HTLC:", evmClaimResult.Err);
                            }
                        } else {
                            console.log("❌ Failed to claim ICP HTLC:", icpClaimResult.Err);
                        }
                    } else {
                        console.log("❌ Failed to create EVM HTLC:", evmHtlcResult.Err);
                    }
                } else {
                    console.log("❌ Failed to create ICP HTLC:", icpHtlcResult.Err);
                }
            } else {
                console.log("❌ Failed to get order details");
            }
        } else {
            console.log("❌ Failed to create atomic swap order:", orderResult.Err);
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
    
    console.log("\n🏁 Test completed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 