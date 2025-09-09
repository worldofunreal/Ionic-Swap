import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createApproveCheckedInstruction,
  createTransferCheckedInstruction
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
    console.log(`   Spiral Account Owner: ${spiralBalance.owner.toString()}`);
    console.log(`   Spiral Account Mint: ${spiralBalance.mint.toString()}`);
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
  
  // CORRECTED: Create atomic transaction with proper account ordering
  // Fee payer = canister (index 0), signers = {canister, alice}
  
  // Instruction 1: ApproveChecked (delegation)
  const approveInstruction = createApproveCheckedInstruction(
    aliceTokenAccount,           // source (Alice's ATA)
    new PublicKey(SPIRAL_MINT),  // mint
    new PublicKey(canisterWallet), // delegate (canister)
    alice.solKeypair.publicKey,  // owner (Alice) - SHE SIGNS THIS
    amount,                      // amount
    decimals                     // decimals
  );
  
  // Instruction 2: Transfer (using canister as delegate authority)
  // ALTERNATIVE: Use createTransferInstruction instead of createTransferCheckedInstruction
  // This avoids the mint account signer issue
  const transferInstruction = createTransferInstruction(
    aliceTokenAccount,           // source (Alice's ATA)
    canisterTokenAccount,        // destination (canister's ATA)
    new PublicKey(canisterWallet), // authority (CANISTER - using delegated permission!)
    amount                       // amount (no decimals needed)
  );
  
  // Manually add the mint account as a read-only, non-signer
  transferInstruction.keys.push({
    pubkey: new PublicKey(SPIRAL_MINT),
    isSigner: false,
    isWritable: false
  });
  
  // DEBUG: Log the instruction details
  console.log('\n🔍 Instruction Debug:');
  console.log('   ApproveChecked instruction:');
  console.log(`     Source: ${aliceTokenAccount.toString()}`);
  console.log(`     Mint: ${SPIRAL_MINT}`);
  console.log(`     Delegate: ${canisterWallet}`);
  console.log(`     Owner: ${alice.solAddress}`);
  console.log('   Transfer instruction:');
  console.log(`     Source: ${aliceTokenAccount.toString()}`);
  console.log(`     Destination: ${canisterTokenAccount.toString()}`);
  console.log(`     Authority: ${canisterWallet} (CANISTER - using delegated permission!)`);
  console.log(`     Mint: ${SPIRAL_MINT} (manually added as read-only, non-signer)`);
  
  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  
  // Create transaction with canister as fee payer
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: new PublicKey(canisterWallet) // Canister pays gas!
  });
  
  // Check if canister's token account exists, create if not
  console.log('\n🏦 Checking Canister\'s Token Account...');
  try {
    await getAccount(connection, canisterTokenAccount);
    console.log(`   ✅ Canister token account exists: ${canisterTokenAccount.toString()}`);
  } catch (error) {
    console.log(`   ❌ Canister token account does not exist, creating...`);
    
    // Create the canister's associated token account
    const createAccountInstruction = createAssociatedTokenAccountInstruction(
      new PublicKey(canisterWallet), // payer (canister)
      canisterTokenAccount,          // associated token account
      new PublicKey(canisterWallet), // owner (canister)
      new PublicKey(SPIRAL_MINT)     // mint
    );
    
    // Add the create account instruction to the transaction
    transaction.add(createAccountInstruction);
    console.log(`   ✅ Added create account instruction`);
  }
  
  // Add both instructions for atomic transaction
  transaction.add(approveInstruction);
  transaction.add(transferInstruction);
  
  // CRITICAL FIX: Manually correct the account metadata
  // The mint should NEVER be a signer, but the Solana library incorrectly marks it as one
  // when the canister is both fee payer and authority
  transaction.instructions.forEach(instruction => {
    instruction.keys.forEach(key => {
      // Mint should NEVER be a signer and should be read-only
      if (key.pubkey.toString() === SPIRAL_MINT) {
        key.isSigner = false;
        key.isWritable = false;
      }
      // Canister should be a signer (fee payer + delegate authority)
      if (key.pubkey.toString() === canisterWallet) {
        key.isSigner = true;
      }
      // Alice should be a signer (owner)
      if (key.pubkey.toString() === alice.solAddress) {
        key.isSigner = true;
      }
    });
  });
  
  // Debug: Log the corrected transaction structure
  console.log('\n🔍 Corrected Transaction Structure:');
  console.log(`   Fee Payer: ${transaction.feePayer?.toString()}`);
  console.log(`   Instructions count: ${transaction.instructions.length}`);
  console.log(`   Required signatures: ${transaction.instructions.reduce((acc, inst) => acc + inst.keys.filter(k => k.isSigner).length, 0)}`);
  
  // Log account keys and their roles
  const allAccounts = new Set<string>();
  transaction.instructions.forEach((inst, i) => {
    console.log(`   Instruction ${i}:`);
    inst.keys.forEach((key, j) => {
      allAccounts.add(key.pubkey.toString());
      console.log(`     Account ${j}: ${key.pubkey.toString()} (signer: ${key.isSigner}, writable: ${key.isWritable})`);
    });
  });
  
  console.log(`   Total unique accounts: ${allAccounts.size}`);
  
  console.log('\n✍️  Signing Atomic Transaction with Alice\'s Key...');
  console.log('   Transaction contains:');
  console.log('   1. ApproveChecked instruction (delegation) - Alice signs as owner');
  console.log('   2. Transfer instruction (transfer) - Canister signs as delegate authority');
  console.log('   ATOMIC: Both operations in one transaction');
  // Alice signs the atomic transaction (partial sign - only her signature)
  const signedTransaction = await signTransaction(transaction, alice.solKeypair);
  console.log(`   Atomic transaction partially signed by Alice`);
  
  // Send signed transaction to canister for co-signing and submission
  console.log('\n🚀 Sending Atomic Transaction to Canister...');
  console.log('   This will:');
  console.log('   1. Canister co-signs as fee payer AND delegate authority (single signature)');
  console.log('   2. Canister submits to Solana');
  console.log('   3. Alice delegates tokens to canister (ApproveChecked)');
  console.log('   4. Canister transfers tokens using delegated authority (Transfer)');
  console.log('   5. Alice pays NO gas fees!');
  console.log('   ATOMIC: Both operations in one transaction');
  
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
