const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = 'devnet';
const RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Load deployer keypair
const deployerKeypairPath = path.join(__dirname, '..', 'deployer-keypair.json');
const deployerKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(deployerKeypairPath, 'utf8')))
);

// Canister public key (from our backend)
const CANISTER_PUBLIC_KEY = '4jF6SJsN4JeCf73W1fGiKzbqzjBdLfZasPpyFprFYzBn';

async function fundCanister() {
    try {
        console.log('💰 Funding Canister with SOL');
        console.log('============================');
        
        // Check current balances
        console.log('\n📊 Current Balances:');
        const deployerBalance = await connection.getBalance(deployerKeypair.publicKey);
        const canisterBalance = await connection.getBalance(new PublicKey(CANISTER_PUBLIC_KEY));
        
        console.log(`   Deployer: ${deployerBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`   Canister: ${canisterBalance / LAMPORTS_PER_SOL} SOL`);
        
        // Transfer amount (2 SOL)
        const transferAmount = 2 * LAMPORTS_PER_SOL;
        
        if (deployerBalance < transferAmount) {
            console.log(`❌ Insufficient balance. Deployer has ${deployerBalance / LAMPORTS_PER_SOL} SOL, need ${transferAmount / LAMPORTS_PER_SOL} SOL`);
            return;
        }
        
        console.log(`\n🚀 Transferring ${transferAmount / LAMPORTS_PER_SOL} SOL to canister...`);
        
        // Create transfer transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: deployerKeypair.publicKey,
                toPubkey: new PublicKey(CANISTER_PUBLIC_KEY),
                lamports: transferAmount,
            })
        );
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = deployerKeypair.publicKey;
        
        // Sign and send transaction
        transaction.sign(deployerKeypair);
        
        console.log('   Sending transaction...');
        const signature = await connection.sendRawTransaction(transaction.serialize());
        
        console.log(`   Transaction signature: ${signature}`);
        console.log('   Waiting for confirmation...');
        
        // Wait for confirmation
        await connection.confirmTransaction(signature);
        
        // Check new balances
        console.log('\n📊 New Balances:');
        const newDeployerBalance = await connection.getBalance(deployerKeypair.publicKey);
        const newCanisterBalance = await connection.getBalance(new PublicKey(CANISTER_PUBLIC_KEY));
        
        console.log(`   Deployer: ${newDeployerBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`   Canister: ${newCanisterBalance / LAMPORTS_PER_SOL} SOL`);
        
        console.log('\n✅ Canister funded successfully!');
        
    } catch (error) {
        console.error('❌ Error funding canister:', error);
        process.exit(1);
    }
}

// Run the funding
fundCanister().catch(console.error);
