import { Principal } from '@dfinity/principal';
import * as crypto from 'crypto';

// Generate consistent seed (same pattern as EVM/Solana)
const generateSeed = (name: string): Uint8Array => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seedBytes[i] = parseInt(seed[i % seed.length] || '0', 16);
  }
  
  return seedBytes;
};

// Generate test identity
const generateTestIdentity = (name: string) => {
  const seed = generateSeed(name);
  const principal = Principal.selfAuthenticating(seed);
  
  return {
    name,
    principal: principal.toText(),
    seed: Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
};

// Main function
const generateIcpTestWallets = () => {
  console.log('🔑 Generating Deterministic ICP Test Wallets');
  console.log('============================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Wallets:`);
  console.log(`\n👤 Alice:`);
  console.log(`   Principal: ${alice.principal}`);
  console.log(`   Seed: ${alice.seed}`);
  
  console.log(`\n👤 Bob:`);
  console.log(`   Principal: ${bob.principal}`);
  console.log(`   Seed: ${bob.seed}`);
  
  console.log(`\n👤 Charlie:`);
  console.log(`   Principal: ${charlie.principal}`);
  console.log(`   Seed: ${charlie.seed}`);
  
  console.log(`\n💰 Next Steps:`);
  console.log(`   1. Fund them with SPIRAL and STD tokens (NO ICP needed!)`);
  console.log(`   2. Use these wallets to call icrc2_approve for gasless transactions`);
  console.log(`   3. Canister pays all gas fees!`);
  
  console.log(`\n📋 Token Information:`);
  console.log(`   SPIRAL Token: uzt4z-lp777-77774-qaabq-cai`);
  console.log(`   STD Token: umunu-kh777-77774-qaaca-cai`);
  console.log(`   Backend Canister: uxrrr-q7777-77774-qaaaq-cai`);
  console.log(`   Network: Internet Computer (Local)`);
  
  return { alice, bob, charlie };
};

// Run the generation
const wallets = generateIcpTestWallets();

export { wallets };