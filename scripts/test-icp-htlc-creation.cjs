const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');
const { ethers } = require('ethers');

// Configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Contract addresses
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const HTLC_CONTRACT = '0x294b513c6b14d9BAA8F03703ADEf50f8dBf93913';
const SEPOLIA_CHAIN_ID = 11155111;

// EIP-2612 permit helpers
const createPermitDomain = (tokenAddress) => ({
  name: 'Spiral',
  version: '1',
  chainId: SEPOLIA_CHAIN_ID,
  verifyingContract: tokenAddress
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
  value: ethers.utils.parseUnits(value, 8),
  nonce,
  deadline
});

const signPermitMessage = async (signer, owner, spender, value, nonce, deadline, tokenAddress) => {
  const domain = createPermitDomain(tokenAddress);
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
    console.log("🚀 Testing ICP HTLC Creation with Proper ABI Encoding");
    console.log("=====================================================");
    
    // Create agent and actor
    const agent = new HttpAgent({ 
        host: LOCAL_HOST,
        fetchRootKey: true,
    });
    
    await agent.fetchRootKey();
    
    const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
    });

    // Setup ethers provider and signer
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303');
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(privateKey, provider);
    const userAddress = await signer.getAddress();
    
    try {
        // Test 1: Create atomic swap order
        console.log("\n📋 Test 1: Creating atomic swap order...");
        const maker = userAddress;
        const taker = userAddress;
        const sourceToken = SPIRAL_TOKEN;
        const destinationToken = SPIRAL_TOKEN; // Use same token for simplicity
        const sourceAmount = "100000000000"; // 1000 tokens
        const destinationAmount = "100000000000"; // 1000 tokens
        const timelockDuration = 3600;
        
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
                console.log("  Source Token:", order.source_token);
                console.log("  Source Amount:", order.source_amount);
                console.log("  Hashlock:", order.hashlock);
                
                // Test 3: Create EIP-2612 permit
                console.log("\n📋 Test 3: Creating EIP-2612 permit...");
                
                const tokenContract = new ethers.Contract(SPIRAL_TOKEN, [
                    'function nonces(address owner) view returns (uint256)'
                ], provider);
                
                const nonce = await tokenContract.nonces(userAddress);
                const deadline = Math.floor(Date.now() / 1000) + 3600;
                const amountHuman = ethers.utils.formatUnits(order.source_amount, 8);
                
                console.log("  Permit details:");
                console.log("    Owner:", userAddress);
                console.log("    Spender:", HTLC_CONTRACT);
                console.log("    Amount (human):", amountHuman);
                console.log("    Nonce:", nonce.toString());
                console.log("    Deadline:", deadline);
                
                const permitResult = await signPermitMessage(
                    signer,
                    userAddress,
                    HTLC_CONTRACT,
                    amountHuman,
                    nonce,
                    deadline,
                    SPIRAL_TOKEN
                );
                
                console.log("✅ Permit signed successfully!");
                console.log("  Signature:", permitResult.signature);
                
                // Test 4: Execute permit
                console.log("\n📋 Test 4: Executing permit...");
                
                const permitRequest = {
                    owner: userAddress,
                    spender: HTLC_CONTRACT,
                    value: order.source_amount,
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
                    amount: order.source_amount
                };
                
                const permitResult2 = await actor.execute_gasless_approval(gaslessApprovalRequest);
                if ('Ok' in permitResult2) {
                    console.log("✅ Permit executed successfully!");
                    console.log("  Transaction Hash:", permitResult2.Ok);
                    
                    // Test 5: Create HTLC (this should now work with proper ABI encoding)
                    console.log("\n📋 Test 5: Creating HTLC with proper ABI encoding...");
                    
                    const htlcResult = await actor.create_evm_htlc(orderId, true);
                    if ('Ok' in htlcResult) {
                        console.log("✅ HTLC created successfully!");
                        console.log("  Transaction Hash:", htlcResult.Ok);
                        
                        // Test 6: Get updated order details
                        console.log("\n📋 Test 6: Getting updated order details...");
                        const updatedOrderDetails = await actor.get_atomic_swap_order(orderId);
                        if (updatedOrderDetails.length > 0) {
                            const updatedOrder = updatedOrderDetails[0];
                            console.log("✅ Updated order details:");
                            console.log("  Status:", updatedOrder.status);
                            console.log("  Source HTLC ID:", updatedOrder.source_htlc_id);
                            console.log("  Secret:", updatedOrder.secret);
                        }
                        
                        // Test 7: Claim HTLC
                        console.log("\n📋 Test 7: Claiming HTLC...");
                        if (updatedOrderDetails.length > 0) {
                            const updatedOrder = updatedOrderDetails[0];
                            if (updatedOrder.source_htlc_id && updatedOrder.source_htlc_id.length > 0) {
                                const htlcId = updatedOrder.source_htlc_id[0]; // Extract string from array
                                const claimResult = await actor.claim_evm_htlc(orderId, htlcId);
                                if ('Ok' in claimResult) {
                                    console.log("✅ HTLC claimed successfully!");
                                    console.log("  Transaction Hash:", claimResult.Ok);
                                } else {
                                    console.log("❌ Failed to claim HTLC:", claimResult.Err);
                                }
                            }
                        }
                        
                    } else {
                        console.log("❌ Failed to create HTLC:", htlcResult.Err);
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