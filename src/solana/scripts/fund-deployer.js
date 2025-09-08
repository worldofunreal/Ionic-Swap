const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.argv[2] || 'devnet';
const RPC_URLS = {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com'
};

const connection = new Connection(RPC_URLS[NETWORK], 'confirmed');

// Addresses
const DEPLOYER_ADDRESS = 'GLxeKkwTFodLPcaRmsjrGhpKMorREAf4j4HsT6c8gwRM';
const CANISTER_ADDRESS = '6n3cKK86zeiGtX9VBLLCqjyaUwYqNHFFoR7A4cQvjcwd';

async function fundDeployer() {
    try {
        console.log(`💰 Funding deployer from canister on ${NETWORK}...\n`);
        
        // Check current balances
        const deployerBalance = await connection.getBalance(new PublicKey(DEPLOYER_ADDRESS));
        const canisterBalance = await connection.getBalance(new PublicKey(CANISTER_ADDRESS));
        
        console.log(`📝 Deployer balance: ${deployerBalance / 1e9} SOL`);
        console.log(`🏦 Canister balance: ${canisterBalance / 1e9} SOL`);
        
        // Calculate how much to transfer (need ~2.5 SOL for deployment)
        const needed = 2.5e9; // 2.5 SOL in lamports
        const current = deployerBalance;
        const transferAmount = needed - current;
        
        if (transferAmount <= 0) {
            console.log('✅ Deployer already has sufficient SOL');
            return;
        }
        
        if (canisterBalance < transferAmount) {
            console.error(`❌ Canister doesn't have enough SOL to fund deployer`);
            console.error(`   Need: ${transferAmount / 1e9} SOL`);
            console.error(`   Have: ${canisterBalance / 1e9} SOL`);
            return;
        }
        
        console.log(`💸 Transferring ${transferAmount / 1e9} SOL from canister to deployer...`);
        
        // Note: This would require the canister's private key, which we don't have
        // The canister would need to initiate this transfer through its own methods
        console.log('⚠️  Cannot transfer directly - canister needs to initiate transfer');
        console.log('💡 Use the backend canister to send SOL to deployer:');
        console.log(`   dfx canister call backend send_sol --network ic '(opt null, "${DEPLOYER_ADDRESS}", ${transferAmount})'`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the funding check
fundDeployer().catch(console.error);
