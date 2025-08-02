const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');
const { ethers } = require('ethers');

// Configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const LOCAL_HOST = 'http://127.0.0.1:4943';

// Contract addresses
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';
const HTLC_CONTRACT = '0x294b513c6b14d9BAA8F03703ADEf50f8dBf93913';
const SEPOLIA_CHAIN_ID = 11155111;

// EIP-2612 permit helpers
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
    console.log("🚀 Testing Nonce Racing Fix for ICP Atomic Swap");
    console.log("===============================================");
    
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

    // Setup ethers provider and signer
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303');
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(privateKey, provider);
    const userAddress = await signer.getAddress();
    
    try {
        // Step 1: Initialize nonce from blockchain
        console.log("\n📋 Step 1: Initializing nonce from blockchain...");
        const initResult = await actor.initialize_nonce();
        if ('Ok' in initResult) {
            console.log("✅ Nonce initialized:", initResult.Ok);
        } else {
            console.log("❌ Failed to initialize nonce:", initResult.Err);
            return;
        }
        
        // Step 2: Create atomic swap order
        console.log("\n📋 Step 2: Creating atomic swap order...");
        const maker = userAddress;
        const taker = userAddress;
        const sourceToken = SPIRAL_TOKEN;
        const destinationToken = STARDUST_TOKEN;
        const sourceAmount = "100000000000"; // 1000 tokens
        const destinationAmount = "50000000000"; // 500 tokens
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
            console.log("✅ Atomic swap order created:", orderId);
            
            // Step 3: Create and execute Spiral permit
            console.log("\n📋 Step 3: Creating and executing Spiral permit...");
            
            const spiralTokenContract = new ethers.Contract(SPIRAL_TOKEN, [
                'function nonces(address owner) view returns (uint256)'
            ], provider);
            
            const spiralNonce = await spiralTokenContract.nonces(userAddress);
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            
            const spiralPermitResult = await signPermitMessage(
                signer,
                userAddress,
                HTLC_CONTRACT,
                "1000", // 1000 tokens
                spiralNonce,
                deadline,
                SPIRAL_TOKEN
            );
            
            const spiralPermitRequest = {
                owner: userAddress,
                spender: HTLC_CONTRACT,
                value: sourceAmount,
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
                amount: sourceAmount
            };
            
            const spiralPermitResult2 = await actor.execute_gasless_approval(spiralGaslessApprovalRequest);
            if ('Ok' in spiralPermitResult2) {
                console.log("✅ Spiral permit executed successfully!");
                console.log("  Transaction Hash:", spiralPermitResult2.Ok);
                
                // Step 4: Create and execute Stardust permit (this should work now with nonce fix)
                console.log("\n📋 Step 4: Creating and executing Stardust permit...");
                
                const stardustTokenContract = new ethers.Contract(STARDUST_TOKEN, [
                    'function nonces(address owner) view returns (uint256)'
                ], provider);
                
                const stardustNonce = await stardustTokenContract.nonces(userAddress);
                
                const stardustPermitResult = await signPermitMessage(
                    signer,
                    userAddress,
                    HTLC_CONTRACT,
                    "500", // 500 tokens
                    stardustNonce,
                    deadline,
                    STARDUST_TOKEN
                );
                
                const stardustPermitRequest = {
                    owner: userAddress,
                    spender: HTLC_CONTRACT,
                    value: destinationAmount,
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
                    amount: destinationAmount
                };
                
                const stardustPermitResult2 = await actor.execute_gasless_approval(stardustGaslessApprovalRequest);
                if ('Ok' in stardustPermitResult2) {
                    console.log("✅ Stardust permit executed successfully!");
                    console.log("  Transaction Hash:", stardustPermitResult2.Ok);
                    console.log("\n🎉 Nonce racing fix is working! Both permits executed successfully!");
                } else {
                    console.log("❌ Failed to execute Stardust permit:", stardustPermitResult2.Err);
                }
            } else {
                console.log("❌ Failed to execute Spiral permit:", spiralPermitResult2.Err);
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