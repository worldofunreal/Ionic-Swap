const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');
const { ethers } = require('ethers');

// Configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Contract addresses
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const HTLC_CONTRACT = '0x288AA4c267408adE0e01463fBD5DECC824e96E8D';
const SEPOLIA_CHAIN_ID = 11155111;

// EIP-2612 permit helpers (from gaslessUtils.js)
const createPermitDomain = () => ({
  name: 'Spiral',
  version: '1',
  chainId: SEPOLIA_CHAIN_ID,
  verifyingContract: SPIRAL_TOKEN
});

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
  value: ethers.utils.parseUnits(value, 8), // Spiral has 8 decimals
  nonce,
  deadline
});

const signPermitMessage = async (signer, owner, spender, value, nonce, deadline) => {
  const domain = createPermitDomain();
  const types = createPermitTypes();
  const message = createPermitMessage(owner, spender, value, nonce, deadline);

  console.log('Signing permit message:', { domain, types, message });

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

async function main() {
    console.log("🚀 Testing ICP Atomic Swap Functionality with Permit Allowance");
    console.log("=============================================================");
    
    // Create agent and actor
    const agent = new HttpAgent({ 
        host: LOCAL_HOST,
        fetchRootKey: true, // Required for local development
    });
    
    // Wait for agent to be ready
    await agent.fetchRootKey();
    
    const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
    });

    // Setup ethers provider and signer (for permit signing)
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303'); // Public Alchemy endpoint
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default hardhat account
    const signer = new ethers.Wallet(privateKey, provider);
    const userAddress = await signer.getAddress();
    
    try {
        // Test 1: Create atomic swap order
        console.log("\n📋 Test 1: Creating atomic swap order...");
        const maker = userAddress;
        const taker = userAddress; // Same for testing
        const sourceToken = SPIRAL_TOKEN;
        const destinationToken = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90"; // StardustToken
        const sourceAmount = "100000000000"; // 1000 tokens (8 decimals)
        const destinationAmount = "50000000000"; // 500 tokens (8 decimals)
        const timelockDuration = 3600; // 1 hour
        
        const orderResult = await actor.create_atomic_swap_order(
            maker,
            taker,
            sourceToken,
            destinationToken,
            sourceAmount,
            destinationAmount,
            BigInt(timelockDuration)
        );
        
        if ('Ok' in orderResult) {
            const orderId = orderResult.Ok;
            console.log("✅ Atomic swap order created successfully!");
            console.log("  Order ID:", orderId);
            
            // Test 2: Get order details
            console.log("\n📋 Test 2: Getting order details...");
            const orderDetails = await actor.get_atomic_swap_order(orderId);
            if (orderDetails.length > 0) {
                const order = orderDetails[0];
                console.log("✅ Order details retrieved:");
                console.log("  Maker:", order.maker);
                console.log("  Taker:", order.taker);
                console.log("  Source Token:", order.source_token);
                console.log("  Destination Token:", order.destination_token);
                console.log("  Source Amount:", order.source_amount);
                console.log("  Destination Amount:", order.destination_amount);
                console.log("  Secret:", order.secret);
                console.log("  Hashlock:", order.hashlock);
                console.log("  Status:", order.status);
                console.log("  Created At:", new Date(Number(order.created_at) * 1000).toISOString());
                console.log("  Expires At:", new Date(Number(order.expires_at) * 1000).toISOString());
                
                // Test 3: Create EIP-2612 permit for HTLC allowance
                console.log("\n📋 Test 3: Creating EIP-2612 permit for HTLC allowance...");
                
                // Get nonce from token contract
                const tokenContract = new ethers.Contract(SPIRAL_TOKEN, [
                    'function nonces(address owner) view returns (uint256)'
                ], provider);
                
                const nonce = await tokenContract.nonces(userAddress);
                const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
                const permitAmount = order.source_amount; // Use the same amount as the swap
                
                console.log("  Permit details:");
                console.log("    Owner:", userAddress);
                console.log("    Spender:", HTLC_CONTRACT);
                console.log("    Amount:", permitAmount);
                console.log("    Nonce:", nonce.toString());
                console.log("    Deadline:", deadline);
                
                // Sign the permit
                const permitResult = await signPermitMessage(
                    signer,
                    userAddress,
                    HTLC_CONTRACT,
                    permitAmount,
                    nonce,
                    deadline
                );
                
                console.log("✅ Permit signed successfully!");
                console.log("  Signature:", permitResult.signature);
                console.log("  V:", permitResult.sig.v);
                console.log("  R:", permitResult.sig.r);
                console.log("  S:", permitResult.sig.s);
                
                // Test 4: Execute permit via ICP canister (EIP-2771)
                console.log("\n📋 Test 4: Executing permit via ICP canister...");
                
                const permitRequest = {
                    owner: userAddress,
                    spender: HTLC_CONTRACT,
                    value: permitAmount,
                    nonce: nonce.toString(),
                    deadline: deadline.toString(),
                    v: permitResult.sig.v.toString(),
                    r: permitResult.sig.r,
                    s: permitResult.sig.s,
                    signature: permitResult.signature
                };
                
                const gaslessApprovalRequest = {
                    permit_request: permitRequest,
                    user_address: userAddress,
                    amount: permitAmount
                };
                
                const permitResult2 = await actor.execute_gasless_approval(gaslessApprovalRequest);
                if ('Ok' in permitResult2) {
                    console.log("✅ Permit executed successfully!");
                    console.log("  Transaction Hash:", permitResult2.Ok);
                    
                    // Test 5: Create source HTLC (now with allowance)
                    console.log("\n📋 Test 5: Creating source HTLC...");
                    const sourceHtlcResult = await actor.create_evm_htlc(orderId, true);
                    if ('Ok' in sourceHtlcResult) {
                        const sourceHtlcTx = sourceHtlcResult.Ok;
                        console.log("✅ Source HTLC created successfully!");
                        console.log("  Transaction Hash:", sourceHtlcTx);
                        
                        // Test 6: Create destination HTLC
                        console.log("\n📋 Test 6: Creating destination HTLC...");
                        const destHtlcResult = await actor.create_evm_htlc(orderId, false);
                        if ('Ok' in destHtlcResult) {
                            const destHtlcTx = destHtlcResult.Ok;
                            console.log("✅ Destination HTLC created successfully!");
                            console.log("  Transaction Hash:", destHtlcTx);
                            
                            // Test 7: Claim source HTLC
                            console.log("\n📋 Test 7: Claiming source HTLC...");
                            const sourceClaimResult = await actor.claim_evm_htlc(orderId, sourceHtlcTx);
                            if ('Ok' in sourceClaimResult) {
                                const sourceClaimTx = sourceClaimResult.Ok;
                                console.log("✅ Source HTLC claimed successfully!");
                                console.log("  Transaction Hash:", sourceClaimTx);
                                
                                // Test 8: Claim destination HTLC
                                console.log("\n📋 Test 8: Claiming destination HTLC...");
                                const destClaimResult = await actor.claim_evm_htlc(orderId, destHtlcTx);
                                if ('Ok' in destClaimResult) {
                                    const destClaimTx = destClaimResult.Ok;
                                    console.log("✅ Destination HTLC claimed successfully!");
                                    console.log("  Transaction Hash:", destClaimTx);
                                    
                                    console.log("\n🎉 Complete atomic swap executed successfully!");
                                } else {
                                    console.log("❌ Failed to claim destination HTLC:", destClaimResult.Err);
                                }
                            } else {
                                console.log("❌ Failed to claim source HTLC:", sourceClaimResult.Err);
                            }
                        } else {
                            console.log("❌ Failed to create destination HTLC:", destHtlcResult.Err);
                        }
                    } else {
                        console.log("❌ Failed to create source HTLC:", sourceHtlcResult.Err);
                    }
                } else {
                    console.log("❌ Failed to execute permit:", permitResult2.Err);
                }
            } else {
                console.log("❌ Failed to get order details");
            }
        } else {
            console.log("❌ Failed to create atomic swap order:", orderResult.Err);
        }
        
        // Test 9: Get all atomic swap orders
        console.log("\n📋 Test 9: Getting all atomic swap orders...");
        const allOrders = await actor.get_all_atomic_swap_orders();
        console.log("✅ Total orders:", allOrders.length);
        allOrders.forEach((order, index) => {
            console.log(`  Order ${index + 1}: ${order.order_id} - ${JSON.stringify(order.status)}`);
        });
        
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