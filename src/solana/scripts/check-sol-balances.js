const { Connection, PublicKey } = require('@solana/web3.js');

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
const SPIRAL_MINT = 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK';
const STARDUST_MINT = 'A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH';

async function checkSOLBalances() {
    try {
        console.log(`🔍 Checking SOL balances on ${NETWORK}...\n`);
        
        // Check deployer SOL balance
        const deployerBalance = await connection.getBalance(new PublicKey(DEPLOYER_ADDRESS));
        console.log(`📝 Deployer (${DEPLOYER_ADDRESS}):`);
        console.log(`   SOL: ${deployerBalance / 1e9} SOL`);
        
        // Check canister SOL balance
        const canisterBalance = await connection.getBalance(new PublicKey(CANISTER_ADDRESS));
        console.log(`\n🏦 Canister (${CANISTER_ADDRESS}):`);
        console.log(`   SOL: ${canisterBalance / 1e9} SOL`);
        
        // Summary
        console.log(`\n📊 Summary:`);
        console.log(`   Deployer has: ${deployerBalance / 1e9} SOL`);
        console.log(`   Canister has: ${canisterBalance / 1e9} SOL`);
        console.log(`   Total available: ${(deployerBalance + canisterBalance) / 1e9} SOL`);
        
        // Recommendations
        console.log(`\n💡 Recommendations:`);
        if (deployerBalance < 1e9) {
            console.log(`   ⚠️  Deployer needs more SOL for deployment (minimum 1 SOL)`);
        } else {
            console.log(`   ✅ Deployer has sufficient SOL for deployment`);
        }
        
        if (canisterBalance < 1e9) {
            console.log(`   ⚠️  Canister needs more SOL for operations (minimum 1 SOL)`);
        } else {
            console.log(`   ✅ Canister has sufficient SOL for operations`);
        }
        
        // Next steps
        console.log(`\n🚀 Next Steps:`);
        console.log(`   1. Deploy escrow program (needs ~0.1 SOL)`);
        console.log(`   2. Initialize TSS authority in escrow program`);
        console.log(`   3. Transfer tokens to canister for liquidity`);
        console.log(`   4. Test the complete workflow`);
        
    } catch (error) {
        console.error('❌ Error checking balances:', error);
        process.exit(1);
    }
}

// Run the check
checkSOLBalances().catch(console.error);
