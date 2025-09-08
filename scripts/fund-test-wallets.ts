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

const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const DEPLOYER_KEYPAIR_PATH = '../src/solana/deployer-keypair.json';

// Token mint addresses from deployment
const SPIRAL_MINT = 'DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy';
const STARDUST_MINT = '2Peg6gadPcvuKASdaqqpi1Jib6B6d97tkoiSaBBy4MCY';

// Deployer token accounts (where tokens are stored)
const DEPLOYER_SPIRAL_ACCOUNT = 'AnuFCsfL7BLK44BTcF8aym4H3EY7jJv1rbAM6TZA23ri';
const DEPLOYER_STARDUST_ACCOUNT = '6XVzuZkgB2rMuUv4aB9u36L2m7dat3jvue5wWYtJ6LMe';

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

const fundTestWallets = async () => {
  console.log('💰 Funding Test Wallets with SPL Tokens (TOKENS ONLY)');
  console.log('=====================================================');
  
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  
  // Load deployer keypair
  const deployerKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require('fs').readFileSync(DEPLOYER_KEYPAIR_PATH, 'utf-8')))
  );
  console.log(`👤 Deployer: ${deployerKeypair.publicKey.toBase58()}`);
  
  // Generate test wallets
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  const wallets = [alice, bob, charlie];
  
  // Check deployer balances
  console.log('\n📊 Checking Deployer Balances:');
  const deployerSolBalance = await connection.getBalance(deployerKeypair.publicKey);
  console.log(`   SOL: ${deployerSolBalance / LAMPORTS_PER_SOL} SOL`);
  
  try {
    const deployerSpiralAccount = await getAccount(connection, new PublicKey(DEPLOYER_SPIRAL_ACCOUNT));
    console.log(`   Spiral: ${deployerSpiralAccount.amount.toString()} (${Number(deployerSpiralAccount.amount) / Math.pow(10, 8)} SPIRAL)`);
  } catch (error) {
    console.log(`   Spiral: Account not found or error`);
  }
  
  try {
    const deployerStardustAccount = await getAccount(connection, new PublicKey(DEPLOYER_STARDUST_ACCOUNT));
    console.log(`   Stardust: ${deployerStardustAccount.amount.toString()} (${Number(deployerStardustAccount.amount) / Math.pow(10, 8)} STD)`);
  } catch (error) {
    console.log(`   Stardust: Account not found or error`);
  }
  
  // Fund each wallet
  for (const wallet of wallets) {
    console.log(`\n👤 Funding ${wallet.name.toUpperCase()}:`);
    console.log(`   Address: ${wallet.solAddress}`);
    console.log(`   ⚠️  NO SOL - Testing true gasless permits!`);
    
    // 1. Fund with Spiral tokens
    try {
      console.log('   🪙 Setting up Spiral tokens...');
      const recipientSpiralAccount = await getAssociatedTokenAddress(
        new PublicKey(SPIRAL_MINT),
        wallet.solKeypair.publicKey
      );
      
      // Check if recipient account exists, create if not
      let accountExists = false;
      try {
        await getAccount(connection, recipientSpiralAccount);
        accountExists = true;
        console.log('   📝 Spiral token account already exists');
      } catch {
        console.log('   📝 Creating Spiral token account...');
        const createAccountIx = createAssociatedTokenAccountInstruction(
          deployerKeypair.publicKey, // payer
          recipientSpiralAccount, // associated token account
          wallet.solKeypair.publicKey, // owner
          new PublicKey(SPIRAL_MINT) // mint
        );
        
        const createTx = new Transaction().add(createAccountIx);
        const createSig = await connection.sendTransaction(createTx, [deployerKeypair]);
        await connection.confirmTransaction(createSig);
        console.log(`   ✅ Spiral account created: ${createSig}`);
        accountExists = true;
      }
      
      if (accountExists) {
        const transferAmount = 1000 * Math.pow(10, 8); // 1000 SPIRAL tokens
        const transferIx = createTransferInstruction(
          new PublicKey(DEPLOYER_SPIRAL_ACCOUNT), // source
          recipientSpiralAccount, // destination
          deployerKeypair.publicKey, // authority
          transferAmount
        );
        
        const tx = new Transaction().add(transferIx);
        const sig = await connection.sendTransaction(tx, [deployerKeypair]);
        await connection.confirmTransaction(sig);
        console.log(`   ✅ Spiral transferred: ${sig}`);
      }
    } catch (error) {
      console.log(`   ❌ Spiral setup failed: ${error}`);
    }
    
    // 2. Fund with Stardust tokens
    try {
      console.log('   ⭐ Setting up Stardust tokens...');
      const recipientStardustAccount = await getAssociatedTokenAddress(
        new PublicKey(STARDUST_MINT),
        wallet.solKeypair.publicKey
      );
      
      // Check if recipient account exists, create if not
      let accountExists = false;
      try {
        await getAccount(connection, recipientStardustAccount);
        accountExists = true;
        console.log('   📝 Stardust token account already exists');
      } catch {
        console.log('   📝 Creating Stardust token account...');
        const createAccountIx = createAssociatedTokenAccountInstruction(
          deployerKeypair.publicKey, // payer
          recipientStardustAccount, // associated token account
          wallet.solKeypair.publicKey, // owner
          new PublicKey(STARDUST_MINT) // mint
        );
        
        const createTx = new Transaction().add(createAccountIx);
        const createSig = await connection.sendTransaction(createTx, [deployerKeypair]);
        await connection.confirmTransaction(createSig);
        console.log(`   ✅ Stardust account created: ${createSig}`);
        accountExists = true;
      }
      
      if (accountExists) {
        const transferAmount = 1000 * Math.pow(10, 8); // 1000 STD tokens
        const transferIx = createTransferInstruction(
          new PublicKey(DEPLOYER_STARDUST_ACCOUNT), // source
          recipientStardustAccount, // destination
          deployerKeypair.publicKey, // authority
          transferAmount
        );
        
        const tx = new Transaction().add(transferIx);
        const sig = await connection.sendTransaction(tx, [deployerKeypair]);
        await connection.confirmTransaction(sig);
        console.log(`   ✅ Stardust transferred: ${sig}`);
      }
    } catch (error) {
      console.log(`   ❌ Stardust setup failed: ${error}`);
    }
  }
  
  console.log('\n🎉 Funding Complete!');
  console.log('\n📋 Summary:');
  console.log('   Each wallet should now have:');
  console.log('   - 0 SOL (testing true gasless permits!)');
  console.log('   - 1000 SPIRAL tokens');
  console.log('   - 1000 STD tokens');
  console.log('\n💡 Next Steps:');
  console.log('   1. Verify token balances with: spl-token balance <mint> <address>');
  console.log('   2. Sign permits off-chain (no gas needed)');
  console.log('   3. Call canister to create gasless escrows');
  console.log('   4. Canister pays all gas fees!');
};

fundTestWallets().catch(console.error);
