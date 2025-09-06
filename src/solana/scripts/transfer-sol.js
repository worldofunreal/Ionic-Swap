const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

commander
  .option('--network <network>', 'Network to use (devnet, testnet)', 'devnet')
  .option('--keypair <path>', 'Path to keypair file', '~/.config/solana/id.json')
  .option('--to <address>', 'Recipient address (required)')
  .option('--amount <lamports>', 'Amount in lamports', '1000000000') // 1 SOL default
  .parse(process.argv);

const options = commander.opts();

async function main() {
  console.log('💸 Transferring SOL on Solana');
  console.log('=============================');

  if (!options.to) {
    console.error('❌ Error: --to address is required');
    console.log('Usage: node transfer-sol.js --to <address> [--amount <lamports>]');
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
    console.log('💡 Make sure the keypair file exists or create one with:');
    console.log('   solana-keygen new --outfile ~/.config/solana/id.json');
    process.exit(1);
  }

  console.log(`👤 Sender: ${keypair.publicKey.toString()}`);
  console.log(`🎯 Recipient: ${options.to}`);
  console.log(`💰 Amount: ${options.amount} lamports (${options.amount / 1e9} SOL)`);

  // Connect to Solana
  const connection = new Connection(endpoint, 'confirmed');
  
  // Check sender balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💳 Sender balance: ${balance / 1e9} SOL`);

  if (balance < parseInt(options.amount)) {
    console.error(`❌ Insufficient balance. Need ${options.amount} lamports, have ${balance} lamports`);
    console.log('💡 Try airdropping more SOL: solana airdrop 2');
    process.exit(1);
  }

  // Create transfer transaction
  console.log('\n🔄 Creating transfer transaction...');
  const recipientPubkey = new PublicKey(options.to);
  const amount = parseInt(options.amount);

  const transferTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: recipientPubkey,
      lamports: amount,
    })
  );

  try {
    console.log('📤 Sending transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transferTx,
      [keypair],
      { commitment: 'confirmed' }
    );
    
    console.log('\n✅ Transfer successful!');
    console.log(`📋 Transaction signature: ${signature}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=${network}`);
    
    // Check new balances
    console.log('\n💰 Updated balances:');
    const newSenderBalance = await connection.getBalance(keypair.publicKey);
    const newRecipientBalance = await connection.getBalance(recipientPubkey);
    
    console.log(`👤 Sender: ${newSenderBalance / 1e9} SOL`);
    console.log(`🎯 Recipient: ${newRecipientBalance / 1e9} SOL`);
    
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
