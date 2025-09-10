import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';

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

// Main function
const generateTestWallets = () => {
  console.log('🔑 Generating Deterministic Test Wallets');
  console.log('==========================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Wallets:`);
  console.log(`\n👤 Alice:`);
  console.log(`   Address: ${alice.solAddress}`);
  console.log(`   Mnemonic: ${alice.mnemonic}`);
  
  console.log(`\n👤 Bob:`);
  console.log(`   Address: ${bob.solAddress}`);
  console.log(`   Mnemonic: ${bob.mnemonic}`);
  
  console.log(`\n👤 Charlie:`);
  console.log(`   Address: ${charlie.solAddress}`);
  console.log(`   Mnemonic: ${charlie.mnemonic}`);
  
  console.log(`\n💰 Next Steps:`);
  console.log(`   1. Fund them with Spiral and Stardust tokens (NO SOL needed!)`);
  console.log(`   2. Use these wallets to sign permits for gasless escrow`);
  console.log(`   3. Canister pays all gas fees!`);
  
  console.log(`\n📋 Token Funding Commands:`);
  console.log(`   # Fund with SPL tokens (deployer pays gas)`);
  console.log(`   # Replace TOKEN_MINT with actual Spiral/Stardust mint addresses`);
  console.log(`   spl-token transfer TOKEN_MINT 1000000000 ${alice.solAddress}`);
  console.log(`   spl-token transfer TOKEN_MINT 1000000000 ${bob.solAddress}`);
  console.log(`   spl-token transfer TOKEN_MINT 1000000000 ${charlie.solAddress}`);
  
  return { alice, bob, charlie };
};

// Run the generation
const wallets = generateTestWallets();

export { wallets };
