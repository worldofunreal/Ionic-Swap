#!/usr/bin/env node

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

async function createStardustAccount() {
    console.log('🚀 Creating Stardust Token Account');
    console.log('==================================');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load deployer keypair
    const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
    const deployerKeypairData = JSON.parse(require('fs').readFileSync(deployerKeypairPath, 'utf8'));
    const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
    
    const canisterBaseAddress = new PublicKey('BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ');
    const stardustMint = new PublicKey('A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH');
    const expectedStardustATA = new PublicKey('BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av');
    
    console.log(`📋 Canister base: ${canisterBaseAddress.toBase58()}`);
    console.log(`📋 Stardust mint: ${stardustMint.toBase58()}`);
    console.log(`📋 Expected ATA: ${expectedStardustATA.toBase58()}`);
    
    try {
        // Try to derive the ATA using standard method
        const derivedATA = await getAssociatedTokenAddress(
            stardustMint,
            canisterBaseAddress,
            true // allowOwnerOffCurve
        );
        
        console.log(`🔍 Derived ATA: ${derivedATA.toBase58()}`);
        console.log(`🔍 Match expected: ${derivedATA.equals(expectedStardustATA)}`);
        
        if (!derivedATA.equals(expectedStardustATA)) {
            console.log('❌ ATA derivation mismatch! The backend might be using a different token program.');
            return;
        }
        
        // Create the associated token account
        const createATAInstruction = createAssociatedTokenAccountInstruction(
            deployerKeypair.publicKey, // payer
            expectedStardustATA, // associated token account
            canisterBaseAddress, // owner
            stardustMint // mint
        );
        
        const transaction = new Transaction().add(createATAInstruction);
        
        console.log('🔄 Creating associated token account...');
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [deployerKeypair],
            { commitment: 'confirmed' }
        );
        
        console.log(`✅ Account created! Signature: ${signature}`);
        
        // Check if account exists now
        const accountInfo = await connection.getAccountInfo(expectedStardustATA);
        if (accountInfo) {
            console.log('✅ Account exists and is ready for funding!');
        } else {
            console.log('❌ Account still does not exist');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createStardustAccount();