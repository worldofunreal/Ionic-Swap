const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to use (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .option('--program-id <id>', 'HTLC Program ID (required)')
  .option('--mint <address>', 'Token mint address (required)')
  .option('--amount <amount>', 'Amount to lock in HTLC', '1000000')
  .option('--timelock <seconds>', 'Timelock in seconds from now', '3600')
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('🧪 Testing HTLC Program Interaction');
  console.log('===================================');

  if (!options.programId || !options.mint) {
    console.error('❌ Error: --program-id and --mint are required');
    console.log('Usage: node test-htlc-interaction.js --program-id <id> --mint <address>');
    process.exit(1);
  }

  // Network configuration
  const network = options.network;
  const endpoint = network === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.testnet.solana.com';
  
  console.log(`📡 Network: ${network} (${endpoint})`);

  // Load keypair
  const keypairPath = options.keypair.replace('~', process.env.HOME);
  let keypair;
  
  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    console.error('❌ Failed to load keypair:', error.message);
    process.exit(1);
  }

  console.log(`👤 User: ${keypair.publicKey.toString()}`);
  console.log(`🏦 Program ID: ${options.programId}`);
  console.log(`🪙 Token Mint: ${options.mint}`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 SOL Balance: ${balance / 1e9} SOL`);

  const programId = new PublicKey(options.programId);
  const mintAddress = new PublicKey(options.mint);
  const amount = parseInt(options.amount);
  const timelock = Math.floor(Date.now() / 1000) + parseInt(options.timelock);

  // Generate a random hashlock (in real usage, this would be the hash of a secret)
  const secret = Buffer.from('my-secret-key-12345678901234567890');
  const hashlock = require('crypto').createHash('sha256').update(secret).digest();
  
  console.log(`🔐 Hashlock: ${hashlock.toString('hex')}`);
  console.log(`⏰ Timelock: ${new Date(timelock * 1000).toISOString()}`);

  // Get associated token accounts
  const userTokenAccount = await getAssociatedTokenAddress(mintAddress, keypair.publicKey);
  const canisterAddress = new PublicKey('4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY'); // Canister's Solana address
  const canisterTokenAccount = await getAssociatedTokenAddress(mintAddress, canisterAddress);

  console.log(`🏦 User Token Account: ${userTokenAccount.toString()}`);
  console.log(`🏦 Canister Token Account: ${canisterTokenAccount.toString()}`);

  // Check token balances
  try {
    const userTokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
    console.log(`💰 User Token Balance: ${userTokenBalance.value.uiAmount} tokens`);
    
    if (userTokenBalance.value.amount < amount) {
      console.error(`❌ Insufficient token balance. Need ${amount}, have ${userTokenBalance.value.amount}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to get token balance:', error.message);
    console.log('💡 Make sure you have tokens in your account');
    process.exit(1);
  }

  // Create HTLC PDA
  const orderId = `test-order-${Date.now()}`;
  const [htlcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('htlc'), Buffer.from(orderId)],
    programId
  );

  console.log(`📋 HTLC PDA: ${htlcPda.toString()}`);

  // Create HTLC token account PDA
  const [htlcTokenAccount] = PublicKey.findProgramAddressSync(
    [htlcPda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log(`🏦 HTLC Token Account: ${htlcTokenAccount.toString()}`);

  // Create HTLC instruction data
  const instructionData = Buffer.concat([
    Buffer.from([0x01, 0x00, 0x00, 0x00]), // create_htlc instruction discriminator
    Buffer.from(amount.toString(16).padStart(16, '0'), 'hex'), // amount (8 bytes)
    hashlock, // hashlock (32 bytes)
    Buffer.from(timelock.toString(16).padStart(16, '0'), 'hex'), // timelock (8 bytes)
    Buffer.from(orderId), // order_id
  ]);

  // Create HTLC transaction
  console.log('\n🔄 Creating HTLC transaction...');
  const createHtlcTx = new Transaction().add({
    keys: [
      { pubkey: htlcPda, isSigner: false, isWritable: true },
      { pubkey: keypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: canisterAddress, isSigner: false, isWritable: false },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: htlcTokenAccount, isSigner: false, isWritable: true },
      { pubkey: mintAddress, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: programId,
    data: instructionData,
  });

  try {
    console.log('📤 Sending HTLC creation transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      createHtlcTx,
      [keypair],
      { commitment: 'confirmed' }
    );
    
    console.log('\n✅ HTLC created successfully!');
    console.log(`📋 Transaction signature: ${signature}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=${network}`);
    
    // Check HTLC account
    console.log('\n🔍 Checking HTLC account...');
    const htlcAccountInfo = await connection.getAccountInfo(htlcPda);
    if (htlcAccountInfo) {
      console.log('✅ HTLC account created and funded');
      console.log(`📊 HTLC account size: ${htlcAccountInfo.data.length} bytes`);
    } else {
      console.log('❌ HTLC account not found');
    }

    // Check token balances
    console.log('\n💰 Updated token balances:');
    const newUserTokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
    const newHtlcTokenBalance = await connection.getTokenAccountBalance(htlcTokenAccount);
    
    console.log(`👤 User: ${newUserTokenBalance.value.uiAmount} tokens`);
    console.log(`🏦 HTLC: ${newHtlcTokenBalance.value.uiAmount} tokens`);
    
    console.log('\n🎉 HTLC interaction test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test claiming the HTLC with the secret');
    console.log('   2. Test refunding after timelock expires');
    console.log('   3. Integrate with canister for cross-chain swaps');
    
  } catch (error) {
    console.error('❌ HTLC creation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
