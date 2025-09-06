const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function createKeypair() {
  console.log('🔑 Creating Solana keypair...');
  
  // Generate a new keypair
  const keypair = Keypair.generate();
  
  // Create the directory if it doesn't exist
  const keypairDir = path.join(process.env.HOME, '.config/solana');
  if (!fs.existsSync(keypairDir)) {
    fs.mkdirSync(keypairDir, { recursive: true });
  }
  
  // Save the keypair
  const keypairPath = path.join(keypairDir, 'id.json');
  fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
  
  console.log(`✅ Keypair created: ${keypairPath}`);
  console.log(`📋 Public key: ${keypair.publicKey.toString()}`);
  
  return keypair;
}

createKeypair().catch(console.error);
