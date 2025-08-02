const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');
const { ethers } = require('ethers');

// Configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Contract addresses
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const HTLC_CONTRACT = '0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d';
const SEPOLIA_CHAIN_ID = 11155111;

// EIP-2612 permit helpers (from gaslessUtils.js)
const createPermitDomain = (tokenAddress) => {
  // Determine token name based on address
  let tokenName = 'Spiral'; // Default
  if (tokenAddress.toLowerCase() === '0x6ca99fc9bded10004fe9cc6ce40914b98490dc90') {
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
  value: ethers.utils.parseUnits(value, 8), // Both tokens have 8 decimals
  nonce,
  deadline
});

const signPermitMessage = async (signer, owner, spender, value, nonce, deadline, tokenAddress) => {
  const domain = createPermitDomain(tokenAddress);
  const types = createPermitTypes();
  const message = createPermitMessage(owner, spender, value, nonce, deadline);

  console.log('🔍 Signing permit message:');
  console.log('  Domain:', JSON.stringify(domain, null, 2));
  console.log('  Types:', JSON.stringify(types, null, 2));
  console.log('  Message:', JSON.stringify(message, null, 2));
  console.log('  Token Address:', tokenAddress);

  const signature = await signer._signTypedData(domain, types, message);
  const sig = ethers.utils.splitSignature(signature);

  console.log('✅ Permit signature created:');
  console.log('  Full signature:', signature);
  console.log('  v:', sig.v);
  console.log('  r:', sig.r);
  console.log('  s:', sig.s);

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
    
    // Initialize nonce from blockchain
    console.log("\n📋 Step 0: Initializing nonce from blockchain...");
    try {
        const nonceResult = await actor.initialize_nonce();
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
                
                // Test 3: Create EIP-2612 permit for Spiral tokens (source)
                console.log("\n📋 Test 3: Creating EIP-2612 permit for Spiral tokens (source)...");
                
                // Get nonce from Spiral token contract
                const spiralTokenContract = new ethers.Contract(SPIRAL_TOKEN, [
                    'function nonces(address owner) view returns (uint256)'
                ], provider);
                
                const spiralNonce = await spiralTokenContract.nonces(userAddress);
                const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
                const spiralAmountHuman = ethers.utils.formatUnits(order.source_amount, 8);
                const spiralAmount = order.source_amount;
                
                console.log("  Spiral Permit details:");
                console.log("    Owner:", userAddress);
                console.log("    Spender:", HTLC_CONTRACT);
                console.log("    Amount (human):", spiralAmountHuman);
                console.log("    Amount (raw):", spiralAmount);
                console.log("    Nonce:", spiralNonce.toString());
                console.log("    Deadline:", deadline);
                
                // Sign the Spiral permit
                const spiralPermitResult = await signPermitMessage(
                    signer,
                    userAddress,
                    HTLC_CONTRACT,
                    spiralAmountHuman,
                    spiralNonce,
                    deadline,
                    SPIRAL_TOKEN
                );
                
                console.log("✅ Spiral permit signed successfully!");
                console.log("  Signature:", spiralPermitResult.signature);
                
                // Test 4: Execute Spiral permit via ICP canister
                console.log("\n📋 Test 4: Executing Spiral permit via ICP canister...");
                
                const spiralPermitRequest = {
                    owner: userAddress,
                    spender: HTLC_CONTRACT,
                    value: spiralAmount,
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
                    amount: spiralAmount,
                    token_address: SPIRAL_TOKEN
                };
                
                const spiralPermitResult2 = await actor.execute_gasless_approval(spiralGaslessApprovalRequest);
                if ('Ok' in spiralPermitResult2) {
                    console.log("✅ Spiral permit executed successfully!");
                    console.log("  Transaction Hash:", spiralPermitResult2.Ok);
                    
                    // Add delay between transactions to avoid nonce conflicts
                    console.log("\n⏳ Waiting 5 seconds between transactions...");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Test 5: Create EIP-2612 permit for Stardust tokens (destination)
                    console.log("\n📋 Test 5: Creating EIP-2612 permit for Stardust tokens (destination)...");
                    
                    // Get nonce from Stardust token contract
                    const stardustTokenContract = new ethers.Contract(order.destination_token, [
                        'function nonces(address owner) view returns (uint256)'
                    ], provider);
                    
                    const stardustNonce = await stardustTokenContract.nonces(userAddress);
                    const stardustAmountHuman = ethers.utils.formatUnits(order.destination_amount, 8);
                    const stardustAmount = order.destination_amount;
                    
                    console.log("  Stardust Permit details:");
                    console.log("    Owner:", userAddress);
                    console.log("    Spender:", HTLC_CONTRACT);
                    console.log("    Amount (human):", stardustAmountHuman);
                    console.log("    Amount (raw):", stardustAmount);
                    console.log("    Nonce:", stardustNonce.toString());
                    console.log("    Deadline:", deadline);
                    
                    // Sign the Stardust permit
                    const stardustPermitResult = await signPermitMessage(
                        signer,
                        userAddress,
                        HTLC_CONTRACT,
                        stardustAmountHuman,
                        stardustNonce,
                        deadline,
                        order.destination_token
                    );
                    
                    console.log("✅ Stardust permit signed successfully!");
                    console.log("  Signature:", stardustPermitResult.signature);
                    
                    // Test 6: Execute Stardust permit via ICP canister
                    console.log("\n📋 Test 6: Executing Stardust permit via ICP canister...");
                    
                    const stardustPermitRequest = {
                        owner: userAddress,
                        spender: HTLC_CONTRACT,
                        value: stardustAmount,
                        nonce: stardustNonce.toString(),
                        deadline: deadline.toString(),
                        v: stardustPermitResult.sig.v.toString(),
                        r: stardustPermitResult.sig.r,
                        s: stardustPermitResult.sig.s,
                        signature: stardustPermitResult.signature
                    };
                    
                    const stardustGaslessApprovalRequest = {
                        permit_request: stardustPermitRequest,
                        user_address: userAddress,
                        amount: stardustAmount,
                        token_address: order.destination_token
                    };
                    
                    const stardustPermitResult2 = await actor.execute_gasless_approval(stardustGaslessApprovalRequest);
                    if ('Ok' in stardustPermitResult2) {
                        console.log("✅ Stardust permit executed successfully!");
                        console.log("  Transaction Hash:", stardustPermitResult2.Ok);
                        
                        // Test 7: Create source HTLC (now with allowance)
                        console.log("\n📋 Test 7: Creating source HTLC...");
                        const sourceHtlcResult = await actor.create_evm_htlc(orderId, true);
                        if ('Ok' in sourceHtlcResult) {
                            const sourceHtlcTx = sourceHtlcResult.Ok;
                            console.log("✅ Source HTLC created successfully!");
                            console.log("  Transaction Hash:", sourceHtlcTx);
                            
                            // Test 8: Create destination HTLC
                            console.log("\n📋 Test 8: Creating destination HTLC...");
                            const destHtlcResult = await actor.create_evm_htlc(orderId, false);
                            if ('Ok' in destHtlcResult) {
                                const destHtlcTx = destHtlcResult.Ok;
                                console.log("✅ Destination HTLC created successfully!");
                                console.log("  Transaction Hash:", destHtlcTx);
                                
                                // Test 9: Claim source HTLC
                                console.log("\n📋 Test 9: Claiming source HTLC...");
                                const sourceClaimResult = await actor.claim_evm_htlc(orderId, sourceHtlcTx);
                                if ('Ok' in sourceClaimResult) {
                                    const sourceClaimTx = sourceClaimResult.Ok;
                                    console.log("✅ Source HTLC claimed successfully!");
                                    console.log("  Transaction Hash:", sourceClaimTx);
                                    
                                    // Test 10: Claim destination HTLC
                                    console.log("\n📋 Test 10: Claiming destination HTLC...");
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
                        console.log("❌ Failed to execute Stardust permit:", stardustPermitResult2.Err);
                    }
                } else {
                    console.log("❌ Failed to execute Spiral permit:", spiralPermitResult2.Err);
                }
            } else {
                console.log("❌ Failed to get order details");
            }
        } else {
            console.log("❌ Failed to create atomic swap order:", orderResult.Err);
        }
        
        // Test 11: Get all atomic swap orders
        console.log("\n📋 Test 11: Getting all atomic swap orders...");
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