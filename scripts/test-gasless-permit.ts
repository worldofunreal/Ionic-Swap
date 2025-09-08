import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import * as bip39 from 'bip39';
import { createHash } from 'crypto';

const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const CANISTER_ADDRESS = '6n3cKK86zeiGtX9VBLLCqjyaUwYqNHFFoR7A4cQvjcwd'; // Backend canister address

// Token mint addresses
const SPIRAL_MINT = 'DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy';
const STARDUST_MINT = '2Peg6gadPcvuKASdaqqpi1Jib6B6d97tkoiSaBBy4MCY';

// Escrow program address (from deployment)
const ESCROW_PROGRAM_ID = '6n3cKK86zeiGtX9VBLLCqjyaUwYqNHFFoR7A4cQvjcwd'; // Replace with actual program ID

// Generate consistent mnemonic (same as test implementation)
const generateMnemonic = (name: string): string => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  return bip39.entropyToMnemonic(seed.padEnd(32, '0'));
};

// Generate test identity
const generateTestIdentity = (name: string) => {
  const mnemonic = generateMnemonic(name);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Generate Solana keypair
  const solKeypair = Keypair.fromSeed(seed.slice(0, 32));
  const solAddress = solKeypair.publicKey.toBase58();
  
  return {
    name,
    mnemonic,
    solAddress,
    solKeypair,
  };
};

// Permit message structure (matches Solana program)
interface PermitMessage {
  user: string;           // User's Solana address
  token_mint: string;     // Token mint address
  amount: number;         // Amount to escrow
  order_id: string;       // Unique order ID
  nonce: number;          // Nonce to prevent replay attacks
  expiry: number;         // Expiry timestamp
}

// Create permit message
const createPermitMessage = (user: string, tokenMint: string, amount: number, orderId: string, nonce: number, expiry: number): PermitMessage => {
  return {
    user,
    token_mint: tokenMint,
    amount,
    order_id: orderId,
    nonce,
    expiry
  };
};

// Sign permit message (mock implementation for testing)
const signPermitMessage = async (message: PermitMessage, keypair: Keypair): Promise<string> => {
  // Create message hash
  const messageString = JSON.stringify(message);
  const messageHash = createHash('sha256').update(messageString).digest();
  
  // Mock signature for testing (in real implementation, use proper Ed25519 signing)
  const mockSignature = createHash('sha256')
    .update(messageHash)
    .update(keypair.secretKey)
    .digest();
  
  // Return signature as base64
  return Buffer.from(mockSignature).toString('base64');
};

// Test gasless permit flow
const testGaslessPermit = async () => {
  console.log('🧪 Testing Gasless Permit Flow');
  console.log('===============================');
  
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  
  // Generate Alice's wallet
  const alice = generateTestIdentity('alice');
  console.log(`👤 Alice: ${alice.solAddress}`);
  
  // Check Alice's balances
  console.log('\n📊 Checking Alice\'s Balances:');
  const aliceSolBalance = await connection.getBalance(alice.solKeypair.publicKey);
  console.log(`   SOL: ${aliceSolBalance / LAMPORTS_PER_SOL} SOL`);
  
  try {
    const aliceSpiralAccount = await getAssociatedTokenAddress(
      new PublicKey(SPIRAL_MINT),
      alice.solKeypair.publicKey
    );
    const spiralBalance = await getAccount(connection, aliceSpiralAccount);
    console.log(`   Spiral: ${spiralBalance.amount.toString()} (${Number(spiralBalance.amount) / Math.pow(10, 8)} SPIRAL)`);
  } catch (error) {
    console.log(`   Spiral: Account not found or error`);
  }
  
  try {
    const aliceStardustAccount = await getAssociatedTokenAddress(
      new PublicKey(STARDUST_MINT),
      alice.solKeypair.publicKey
    );
    const stardustBalance = await getAccount(connection, aliceStardustAccount);
    console.log(`   Stardust: ${stardustBalance.amount.toString()} (${Number(stardustBalance.amount) / Math.pow(10, 8)} STD)`);
  } catch (error) {
    console.log(`   Stardust: Account not found or error`);
  }
  
  // Create permit message
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const nonce = Math.floor(Math.random() * 1000000);
  const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  
  const permitMessage = createPermitMessage(
    alice.solAddress,
    SPIRAL_MINT,
    1000 * Math.pow(10, 8), // 1000 SPIRAL tokens
    orderId,
    nonce,
    expiry
  );
  
  console.log('\n📝 Creating Permit Message:');
  console.log(`   User: ${permitMessage.user}`);
  console.log(`   Token: ${permitMessage.token_mint}`);
  console.log(`   Amount: ${permitMessage.amount} (${permitMessage.amount / Math.pow(10, 8)} SPIRAL)`);
  console.log(`   Order ID: ${permitMessage.order_id}`);
  console.log(`   Nonce: ${permitMessage.nonce}`);
  console.log(`   Expiry: ${new Date(permitMessage.expiry).toISOString()}`);
  
  // Sign permit message
  console.log('\n✍️  Signing Permit Message...');
  const permitSignature = await signPermitMessage(permitMessage, alice.solKeypair);
  console.log(`   Signature: ${permitSignature}`);
  
  // Call canister to create escrow with permit
  console.log('\n🚀 Calling Canister to Create Gasless Escrow...');
  console.log('   This will:');
  console.log('   1. Verify Alice\'s signature');
  console.log('   2. Create escrow on Solana (canister pays gas)');
  console.log('   3. Transfer Alice\'s tokens to escrow');
  console.log('   4. Alice pays NO gas fees!');
  
  // TODO: Implement actual canister call
  console.log('\n📞 Canister Call (Placeholder):');
  console.log(`   dfx canister call backend create_escrow_with_permit '(`);
  console.log(`     user: "${alice.solAddress}",`);
  console.log(`     token_mint: "${SPIRAL_MINT}",`);
  console.log(`     amount: ${permitMessage.amount},`);
  console.log(`     order_id: "${orderId}",`);
  console.log(`     nonce: ${nonce},`);
  console.log(`     expiry: ${expiry},`);
  console.log(`     signature: "${permitSignature}"`);
  console.log(`   )' --network ic`);
  
  console.log('\n🎉 Gasless Permit Flow Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Implement actual canister call');
  console.log('   2. Verify escrow creation on Solana');
  console.log('   3. Check Alice\'s token balance (should be reduced)');
  console.log('   4. Verify escrow contains Alice\'s tokens');
};

testGaslessPermit().catch(console.error);
