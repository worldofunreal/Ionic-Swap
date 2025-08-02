const { ethers } = require('ethers');

// Configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';
const HTLC_CONTRACT = '0x294b513c6b14d9BAA8F03703ADEf50f8dBf93913';

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

async function main() {
    console.log("🔍 Testing Permit Signature Verification");
    console.log("=====================================");
    
    // Setup ethers provider and signer
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303');
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(privateKey, provider);
    const userAddress = await signer.getAddress();
    
    console.log("User Address:", userAddress);
    
    // Test Stardust token permit
    console.log("\n📋 Testing Stardust Token Permit...");
    
    // Get nonce from Stardust token contract
    const stardustTokenContract = new ethers.Contract(STARDUST_TOKEN, [
        'function nonces(address owner) view returns (uint256)',
        'function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)'
    ], provider);
    
    const stardustNonce = await stardustTokenContract.nonces(userAddress);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const amount = "50000000000"; // 500 tokens (8 decimals)
    const amountHuman = ethers.utils.formatUnits(amount, 8);
    
    console.log("  Nonce:", stardustNonce.toString());
    console.log("  Amount (human):", amountHuman);
    console.log("  Amount (raw):", amount);
    console.log("  Deadline:", deadline);
    
    // Create permit domain and message
    const domain = createPermitDomain(STARDUST_TOKEN);
    const types = createPermitTypes();
    const message = createPermitMessage(userAddress, HTLC_CONTRACT, amountHuman, stardustNonce, deadline);
    
    console.log("  Domain:", JSON.stringify(domain, null, 2));
    console.log("  Message:", JSON.stringify(message, null, 2));
    
    // Sign the permit
    const signature = await signer._signTypedData(domain, types, message);
    const sig = ethers.utils.splitSignature(signature);
    
    console.log("  Signature:", signature);
    console.log("  v:", sig.v);
    console.log("  r:", sig.r);
    console.log("  s:", sig.s);
    
    // Test the permit directly on the contract
    console.log("\n📋 Testing permit execution directly...");
    try {
        const tx = await stardustTokenContract.permit(
            userAddress,
            HTLC_CONTRACT,
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s
        );
        
        console.log("✅ Permit executed successfully!");
        console.log("  Transaction Hash:", tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("  Block Number:", receipt.blockNumber);
        console.log("  Gas Used:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.log("❌ Permit execution failed:");
        console.log("  Error:", error.message);
        
        // Try to decode the error
        if (error.data) {
            console.log("  Error Data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 