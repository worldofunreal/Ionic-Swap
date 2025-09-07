#!/usr/bin/env node

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');

// Current canister addresses (derived from canister ID: 5w2a3-wqaaa-aaaap-qqaea-cai)
const CANISTER_BASE_ADDRESS = 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ';
const SPIRAL_ATA = '2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK';
const STARDUST_ATA = 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av';

// Token mints
const SPIRAL_MINT = 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK';
const STARDUST_MINT = 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH';

// Deployer address (from token-info.json)
const DEPLOYER_ADDRESS = '6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES';

async function fundCanisterAccounts() {
    console.log('🚀 Funding Current Canister Token Accounts');
    console.log('============================================');
    console.log(`📋 Canister Base Address: ${CANISTER_BASE_ADDRESS}`);
    console.log(`📋 Spiral ATA: ${SPIRAL_ATA}`);
    console.log(`📋 Stardust ATA: ${STARDUST_ATA}`);
    console.log(`📋 Deployer: ${DEPLOYER_ADDRESS}`);
    
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load deployer keypair
    const deployerKeypairPath = process.env.HOME + '/.config/solana/id.json';
    const deployerKeypairData = JSON.parse(require('fs').readFileSync(deployerKeypairPath, 'utf8'));
    const deployerKeypair = Keypair.fromSecretKey(new Uint8Array(deployerKeypairData));
    
    console.log(`🔑 Using deployer keypair: ${deployerKeypair.publicKey.toBase58()}`);
    
    try {
        // Get deployer's token accounts
        const deployerSpiralAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            deployerKeypair,
            new PublicKey(SPIRAL_MINT),
            deployerKeypair.publicKey
        );
        
        const deployerStardustAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            deployerKeypair,
            new PublicKey(STARDUST_MINT),
            deployerKeypair.publicKey
        );
        
        console.log(`📊 Deployer Spiral account: ${deployerSpiralAccount.address.toBase58()}`);
        console.log(`📊 Deployer Stardust account: ${deployerStardustAccount.address.toBase58()}`);
        
        // Check deployer balances
        const spiralBalance = await connection.getTokenAccountBalance(deployerSpiralAccount.address);
        const stardustBalance = await connection.getTokenAccountBalance(deployerStardustAccount.address);
        
        console.log(`💰 Deployer Spiral balance: ${spiralBalance.value.amount} tokens`);
        console.log(`💰 Deployer Stardust balance: ${stardustBalance.value.amount} tokens`);
        
        // Fund Spiral account
        console.log('\n🔄 Funding Spiral account...');
        const spiralTransferAmount = 1000000000; // 1 billion tokens
        
        try {
            const spiralTransferSignature = await transfer(
                connection,
                deployerKeypair,
                deployerSpiralAccount.address,
                new PublicKey(SPIRAL_ATA),
                deployerKeypair,
                spiralTransferAmount
            );
            console.log(`✅ Spiral transfer signature: ${spiralTransferSignature}`);
        } catch (error) {
            console.log(`⚠️  Spiral transfer failed: ${error.message}`);
        }
        
        // Fund Stardust account
        console.log('\n🔄 Funding Stardust account...');
        const stardustTransferAmount = 1000000000; // 1 billion tokens
        
        try {
            const stardustTransferSignature = await transfer(
                connection,
                deployerKeypair,
                deployerStardustAccount.address,
                new PublicKey(STARDUST_ATA),
                deployerKeypair,
                stardustTransferAmount
            );
            console.log(`✅ Stardust transfer signature: ${stardustTransferSignature}`);
        } catch (error) {
            console.log(`⚠️  Stardust transfer failed: ${error.message}`);
        }
        
        // Check final balances
        console.log('\n📊 Final canister balances:');
        try {
            const canisterSpiralBalance = await connection.getTokenAccountBalance(new PublicKey(SPIRAL_ATA));
            console.log(`💰 Canister Spiral balance: ${canisterSpiralBalance.value.amount} tokens`);
        } catch (error) {
            console.log(`❌ Could not get canister Spiral balance: ${error.message}`);
        }
        
        try {
            const canisterStardustBalance = await connection.getTokenAccountBalance(new PublicKey(STARDUST_ATA));
            console.log(`💰 Canister Stardust balance: ${canisterStardustBalance.value.amount} tokens`);
        } catch (error) {
            console.log(`❌ Could not get canister Stardust balance: ${error.message}`);
        }
        
        console.log('\n🎉 Funding completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fundCanisterAccounts();
