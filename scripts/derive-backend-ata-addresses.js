#!/usr/bin/env node

const { PublicKey } = require('@solana/web3.js');

// Configuration
const CANISTER_BASE_ADDRESS = 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ';
const SPIRAL_MINT = 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK';
const STARDUST_MINT = 'A1wZAwvc5r8LPoKbbdTXHY25V2ZkQrk7ikW5QgbzdtH';

// SPL Token program ID
const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
// Associated Token Program ID
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Function to derive ATA address (same as backend)
function getAssociatedTokenAddress(walletAddress, mintAddress) {
  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mintAddress);
  
  // Find the associated token account address
  const [ataAddress] = PublicKey.findProgramAddressSync(
    [
      walletPubkey.toBuffer(),
      SPL_TOKEN_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  return ataAddress;
}

function deriveBackendATAAddresses() {
  console.log('🔍 Deriving Backend ATA Addresses');
  console.log('=================================');
  console.log(`Canister base address: ${CANISTER_BASE_ADDRESS}`);
  console.log(`Spiral mint: ${SPIRAL_MINT}`);
  console.log(`Stardust mint: ${STARDUST_MINT}`);
  console.log('');
  
  // Derive Spiral token account
  const spiralATA = getAssociatedTokenAddress(CANISTER_BASE_ADDRESS, SPIRAL_MINT);
  console.log(`🎯 Spiral ATA address: ${spiralATA.toBase58()}`);
  
  // Derive Stardust token account
  const stardustATA = getAssociatedTokenAddress(CANISTER_BASE_ADDRESS, STARDUST_MINT);
  console.log(`🎯 Stardust ATA address: ${stardustATA.toBase58()}`);
  
  console.log('');
  console.log('📊 Comparison with what we funded:');
  console.log(`   We funded Spiral: 2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK`);
  console.log(`   Backend expects:   ${spiralATA.toBase58()}`);
  console.log(`   Match: ${spiralATA.toBase58() === '2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK'}`);
  console.log('');
  console.log(`   We tried Stardust: BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av`);
  console.log(`   Backend expects:   ${stardustATA.toBase58()}`);
  console.log(`   Match: ${stardustATA.toBase58() === 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av'}`);
  
  console.log('');
  console.log('🔧 Next steps:');
  if (spiralATA.toBase58() !== '2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK') {
    console.log(`   1. Fund the correct Spiral account: ${spiralATA.toBase58()}`);
  }
  if (stardustATA.toBase58() !== 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av') {
    console.log(`   2. Fund the correct Stardust account: ${stardustATA.toBase58()}`);
  }
}

// Run the script
deriveBackendATAAddresses();
