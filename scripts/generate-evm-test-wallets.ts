import { ethers } from 'ethers';
import * as crypto from 'crypto';

// Generate consistent mnemonic (same as Solana implementation)
const generateMnemonic = (name: string): string => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Create a proper 32-byte entropy for ethers
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  const entropy = seed.padEnd(64, '0'); // 32 bytes = 64 hex chars
  return ethers.Mnemonic.entropyToPhrase('0x' + entropy);
};

// Generate test identity
const generateTestIdentity = (name: string) => {
  const mnemonic = generateMnemonic(name);
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    name,
    mnemonic,
    address: wallet.address,
    privateKey: wallet.privateKey,
    wallet,
  };
};

// Main function
const generateEvmTestWallets = () => {
  console.log('🔑 Generating Deterministic EVM Test Wallets');
  console.log('=============================================');
  
  // Generate test identities
  const alice = generateTestIdentity('alice');
  const bob = generateTestIdentity('bob');
  const charlie = generateTestIdentity('charlie');
  
  console.log(`\n👥 Test Wallets:`);
  console.log(`\n👤 Alice:`);
  console.log(`   Address: ${alice.address}`);
  console.log(`   Private Key: ${alice.privateKey}`);
  console.log(`   Mnemonic: ${alice.mnemonic}`);
  
  console.log(`\n👤 Bob:`);
  console.log(`   Address: ${bob.address}`);
  console.log(`   Private Key: ${bob.privateKey}`);
  console.log(`   Mnemonic: ${bob.mnemonic}`);
  
  console.log(`\n👤 Charlie:`);
  console.log(`   Address: ${charlie.address}`);
  console.log(`   Private Key: ${charlie.privateKey}`);
  console.log(`   Mnemonic: ${charlie.mnemonic}`);
  
  console.log(`\n💰 Next Steps:`);
  console.log(`   1. Fund them with SPIRAL and STD tokens (NO ETH needed!)`);
  console.log(`   2. Use these wallets to sign EIP-2612 permits for gasless transactions`);
  console.log(`   3. Canister pays all gas fees!`);
  
  console.log(`\n📋 Token Information:`);
  console.log(`   SPIRAL Token: 0x4c7c4cE3709602585A426dDdaa4a68e57022E716`);
  console.log(`   STD Token: 0x905403c2fEe3749e7Ec55C5F202a923e421aD226`);
  console.log(`   Network: Sepolia (Chain ID: 11155111)`);
  console.log(`   Deployer: 0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7`);
  
  return { alice, bob, charlie };
};

// Run the generation
const wallets = generateEvmTestWallets();

export { wallets };
