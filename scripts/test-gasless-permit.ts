import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createApproveCheckedInstruction
} from '@solana/spl-token';
import * as bip39 from 'bip39';
import { createHash, randomBytes } from 'crypto';

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

// Sign transaction with real Ed25519 (no mock signatures!)
const signTransaction = async (transaction: Transaction, keypair: Keypair): Promise<Transaction> => {
  // Sign the transaction with Alice's keypair
  transaction.sign(keypair);
  return transaction;
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
  
  // Get canister's Solana wallet address
  console.log('\n🏦 Getting Canister\'s Solana Wallet...');
  const { execSync } = require('child_process');
  const canisterWalletOutput = execSync('dfx canister call backend get_canister_public_key', { encoding: 'utf8' });
  const canisterWallet = canisterWalletOutput.trim().replace(/[()"]/g, '');
  console.log(`   Canister Wallet: ${canisterWallet}`);
  
  // Create ApproveChecked transaction for delegation
  console.log('\n📝 Creating ApproveChecked Transaction:');
  const amount = 1000 * Math.pow(10, 8); // 1000 SPIRAL tokens
  const decimals = 8; // SPIRAL token decimals
  
  // Get Alice's associated token account
  const aliceTokenAccount = await getAssociatedTokenAddress(
    new PublicKey(SPIRAL_MINT),
    alice.solKeypair.publicKey
  );
  
  // Get canister's associated token account
  const canisterTokenAccount = await getAssociatedTokenAddress(
    new PublicKey(SPIRAL_MINT),
    new PublicKey(canisterWallet)
  );
  
  console.log(`   Alice Token Account: ${aliceTokenAccount.toString()}`);
  console.log(`   Canister Token Account: ${canisterTokenAccount.toString()}`);
  console.log(`   Amount: ${amount} (${amount / Math.pow(10, 8)} SPIRAL)`);
  console.log(`   Decimals: ${decimals}`);
  
  // Create ApproveChecked instruction
  const approveInstruction = createApproveCheckedInstruction(
    aliceTokenAccount,           // source (Alice's ATA)
    new PublicKey(SPIRAL_MINT),  // mint
    new PublicKey(canisterWallet), // delegate (canister)
    alice.solKeypair.publicKey,  // owner (Alice)
    amount,                      // amount
    decimals                     // decimals
  );
  
  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  
  // Create transaction with canister as fee payer
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: new PublicKey(canisterWallet) // Canister pays gas!
  });
  
  transaction.add(approveInstruction);
  
  console.log('\n✍️  Signing Transaction with Alice\'s Key...');
  // Alice signs the transaction (but canister pays gas)
  const signedTransaction = await signTransaction(transaction, alice.solKeypair);
  console.log(`   Transaction signed by Alice`);
  
  // Send signed transaction to canister for co-signing and submission
  console.log('\n🚀 Sending Signed Transaction to Canister...');
  console.log('   This will:');
  console.log('   1. Canister co-signs as fee payer');
  console.log('   2. Canister submits to Solana');
  console.log('   3. Alice delegates tokens to canister');
  console.log('   4. Alice pays NO gas fees!');
  
  // Serialize the partially signed transaction (Alice signed, canister will co-sign)
  const serializedTransaction = signedTransaction.serialize({ requireAllSignatures: false });
  const transactionBase64 = serializedTransaction.toString('base64');
  
  console.log('\n📞 Sending Transaction to Canister...');
  try {
    const canisterCall = `dfx canister call backend submit_delegation_transaction '(blob "${transactionBase64}")'`;
    
    console.log('   Executing delegation transaction...');
    const result = execSync(canisterCall, { encoding: 'utf8', timeout: 30000 });
    console.log('   ✅ Delegation transaction successful!');
    console.log('   Result:', result);
    
    // Check Alice's balance after the call
    console.log('\n📊 Checking Alice\'s Balance After Canister Call:');
    try {
      const aliceSpiralAccount = await getAssociatedTokenAddress(
        new PublicKey(SPIRAL_MINT),
        alice.solKeypair.publicKey
      );
      const spiralBalance = await getAccount(connection, aliceSpiralAccount);
      console.log(`   Spiral: ${spiralBalance.amount.toString()} (${Number(spiralBalance.amount) / Math.pow(10, 8)} SPIRAL)`);
    } catch (error) {
      console.log(`   Spiral: Error checking balance - ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    console.log('   ❌ Canister call failed:', error instanceof Error ? error.message : String(error));
    console.log('   This is expected if the backend function is not fully implemented yet.');
  }
  
  console.log('\n🎉 Gasless Permit Flow Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Implement actual canister call');
  console.log('   2. Verify escrow creation on Solana');
  console.log('   3. Check Alice\'s token balance (should be reduced)');
  console.log('   4. Verify escrow contains Alice\'s tokens');
};

testGaslessPermit().catch(console.error);
