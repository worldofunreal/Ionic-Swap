const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');
const { ethers } = require('ethers');

// Configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Contract addresses
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const STARDUST_TOKEN_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
const HTLC_CONTRACT = '0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d';
const SEPOLIA_CHAIN_ID = 11155111;

// Test amounts (small for testing)
const TEST_AMOUNTS = {
    SPIRAL_10: 1000000000n,      // 10 SPIRAL (8 decimals)
    STD_5: 500000000n,           // 5 STD (8 decimals)
};

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
    console.log("🚀 Testing EVM→ICP Cross-Chain Swap with Permit Allowance");
    console.log("=========================================================");
    
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
        // Test 1: Create EIP-2612 permit for Spiral tokens (EVM source)
        console.log("\n📋 Test 1: Creating EIP-2612 permit for Spiral tokens (EVM source)...");
        
        // Get nonce from Spiral token contract
        const spiralTokenContract = new ethers.Contract(SPIRAL_TOKEN, [
            'function nonces(address owner) view returns (uint256)'
        ], provider);
        
        const spiralNonce = await spiralTokenContract.nonces(userAddress);
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const spiralAmount = TEST_AMOUNTS.SPIRAL_10.toString(); // 10 SPIRAL
        const spiralAmountHuman = ethers.utils.formatUnits(spiralAmount, 8);
        
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
        
        // Test 2: Create EVM→ICP order with automatic permit execution
        console.log("\n📋 Test 2: Creating EVM→ICP order with automatic permit execution...");
        const sourceToken = SPIRAL_TOKEN; // EVM Spiral token
        const destinationToken = STARDUST_TOKEN_CANISTER_ID; // ICP Stardust token
        const sourceAmount = TEST_AMOUNTS.SPIRAL_10.toString(); // 10 SPIRAL
        const destinationAmount = TEST_AMOUNTS.STD_5.toString(); // 5 STD
        const timelockDuration = 3600; // 1 hour
        const icpDestinationPrincipal = "mxzaz-hqaaa-aaaar-qaada-cai"; // Example ICP principal
        
        const permitRequest = {
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
        
        const orderResult = await actor.create_evm_to_icp_order(
            userAddress,
            sourceToken,
            destinationToken,
            sourceAmount,
            destinationAmount,
            icpDestinationPrincipal,
            BigInt(timelockDuration),
            permitRequest
        );
        
        if ('Ok' in orderResult) {
            console.log("✅ EVM→ICP order created successfully!");
            console.log("  Result:", orderResult.Ok);
            
            // Extract order ID from the result
            const orderId = orderResult.Ok.split("Order ID: ")[1].split(",")[0];
            console.log("  Order ID:", orderId);
            
            // Test 3: Get order details
            console.log("\n📋 Test 3: Getting order details...");
            const orderDetails = await actor.get_atomic_swap_order(orderId);
            if (orderDetails.length > 0) {
                const order = orderDetails[0];
                console.log("✅ Order details retrieved:");
                console.log("  Maker (EVM):", order.maker);
                console.log("  Taker (ICP):", order.taker);
                console.log("  Source Token (EVM):", order.source_token);
                console.log("  Destination Token (ICP):", order.destination_token);
                console.log("  Source Amount:", order.source_amount);
                console.log("  Destination Amount:", order.destination_amount);
                console.log("  Secret:", order.secret);
                console.log("  Hashlock:", order.hashlock);
                console.log("  Status:", order.status);
                console.log("  Created At:", new Date(Number(order.created_at) * 1000).toISOString());
                console.log("  Expires At:", new Date(Number(order.expires_at) * 1000).toISOString());
                console.log("  ICP Destination Principal:", order.icp_destination_principal);
                
                // Test 4: Complete the swap using the secret
                console.log("\n📋 Test 4: Completing the swap using the secret...");
                const completeResult = await actor.complete_cross_chain_swap_public(
                    orderId,
                    order.secret
                );
                
                if ('Ok' in completeResult) {
                    console.log("✅ Swap completed successfully!");
                    console.log("  Result:", completeResult.Ok);
                    
                    // Test 5: Check final order status
                    console.log("\n📋 Test 5: Checking final order status...");
                    const finalOrderDetails = await actor.get_atomic_swap_order(orderId);
                    if (finalOrderDetails.length > 0) {
                        const finalOrder = finalOrderDetails[0];
                        console.log("✅ Final order status:", finalOrder.status);
                    }
                    
                    console.log("\n🎉 Complete EVM→ICP Cross-Chain Swap Executed Successfully!");
                    console.log('\n📋 Complete Transaction Summary:');
                    console.log(`  ✅ Permit Creation: Signed by user`);
                    console.log(`  ✅ Order Creation: ${orderId}`);
                    console.log(`  ✅ Automatic Permit Execution: Included in order creation`);
                    console.log(`  ✅ Automatic EVM HTLC Creation: Included in order creation`);
                    console.log(`  ✅ Swap Completion: ${completeResult.Ok}`);
                    
                } else {
                    console.log("❌ Failed to complete swap:", completeResult.Err);
                }
            } else {
                console.log("❌ Failed to get order details");
            }
        } else {
            console.log("❌ Failed to create EVM→ICP order:", orderResult.Err);
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