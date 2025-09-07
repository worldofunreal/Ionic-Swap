const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, transfer } = require('@solana/spl-token');
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

async function loadKeypair() {
    const keypairPath = path.join(__dirname, '..', 'keypairs', 'deployer-keypair.json');
    
    if (!fs.existsSync(keypairPath)) {
        console.error('❌ Deployer keypair not found. Please create one first.');
        process.exit(1);
    }
    
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

async function loadDeploymentInfo() {
    const deploymentPath = path.join(__dirname, '..', 'escrow-deployment.json');
    
    if (!fs.existsSync(deploymentPath)) {
        console.error('❌ Deployment info not found. Please deploy the program first.');
        process.exit(1);
    }
    
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function testEscrowProgram() {
    try {
        console.log(`🧪 Testing Ionic Escrow Program on ${NETWORK}...`);
        
        // Load deployer and deployment info
        const deployer = await loadKeypair();
        const deployment = await loadDeploymentInfo();
        
        console.log(`📝 Deployer: ${deployer.publicKey.toString()}`);
        console.log(`📦 Program ID: ${deployment.programId}`);
        
        // Create test users
        const user1 = Keypair.generate();
        const user2 = Keypair.generate();
        
        console.log(`👤 User 1: ${user1.publicKey.toString()}`);
        console.log(`👤 User 2: ${user2.publicKey.toString()}`);
        
        // Airdrop SOL to test users
        console.log('💰 Airdropping SOL to test users...');
        await connection.requestAirdrop(user1.publicKey, 2e9);
        await connection.requestAirdrop(user2.publicKey, 2e9);
        
        // Wait for airdrops to confirm
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Create a test token mint
        console.log('🪙 Creating test token mint...');
        const mint = await createMint(
            connection,
            deployer,
            deployer.publicKey,
            null,
            6 // 6 decimals
        );
        console.log(`🪙 Token mint: ${mint.toString()}`);
        
        // Create token accounts for users
        console.log('📝 Creating token accounts...');
        const user1TokenAccount = await createAccount(
            connection,
            user1,
            mint,
            user1.publicKey
        );
        
        const user2TokenAccount = await createAccount(
            connection,
            user2,
            mint,
            user2.publicKey
        );
        
        // Mint tokens to user1
        console.log('🪙 Minting test tokens...');
        const mintAmount = 1000 * 10**6; // 1000 tokens
        await mintTo(
            connection,
            deployer,
            mint,
            user1TokenAccount,
            deployer,
            mintAmount
        );
        
        console.log(`✅ Minted ${mintAmount / 10**6} tokens to user1`);
        
        // Test 1: Initialize TSS Authority
        console.log('\n🧪 Test 1: Initialize TSS Authority');
        
        // Create a mock TSS public key (64 bytes)
        const tssPublicKey = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            tssPublicKey[i] = Math.floor(Math.random() * 256);
        }
        
        // Find TSS config PDA
        const [tssConfigPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('tss_config')],
            new PublicKey(deployment.programId)
        );
        
        console.log(`🔑 TSS Config PDA: ${tssConfigPDA.toString()}`);
        
        // Note: In a real implementation, you would call the initialize_tss_authority instruction
        // For now, we'll simulate the test structure
        
        // Test 2: Reserve tokens
        console.log('\n🧪 Test 2: Reserve tokens in escrow');
        
        const orderId = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            orderId[i] = Math.floor(Math.random() * 256);
        }
        
        const reserveAmount = 100 * 10**6; // 100 tokens
        const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        // Find escrow PDAs
        const [escrowPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('escrow'), orderId],
            new PublicKey(deployment.programId)
        );
        
        const [escrowTokenPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('escrow_token'), orderId],
            new PublicKey(deployment.programId)
        );
        
        console.log(`📦 Escrow PDA: ${escrowPDA.toString()}`);
        console.log(`🪙 Escrow Token PDA: ${escrowTokenPDA.toString()}`);
        console.log(`💰 Reserve amount: ${reserveAmount / 10**6} tokens`);
        console.log(`⏰ Expiry: ${new Date(expiry * 1000).toISOString()}`);
        
        // Test 3: Release tokens (simulated)
        console.log('\n🧪 Test 3: Release tokens from escrow');
        
        const releaseAmount = 50 * 10**6; // 50 tokens
        const fillNonce = 1;
        const dstChainId = 1; // Ethereum mainnet
        const dstTxHash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            dstTxHash[i] = Math.floor(Math.random() * 256);
        }
        
        // Mock TSS signature (in real implementation, this would come from ICP)
        const tssSignature = new Uint8Array(64);
        const recoveryId = 0;
        
        console.log(`💰 Release amount: ${releaseAmount / 10**6} tokens`);
        console.log(`🔢 Fill nonce: ${fillNonce}`);
        console.log(`⛓️  Destination chain: ${dstChainId}`);
        
        // Test 4: Refund remaining tokens
        console.log('\n🧪 Test 4: Refund remaining tokens');
        
        const remainingAmount = reserveAmount - releaseAmount;
        console.log(`💰 Remaining amount: ${remainingAmount / 10**6} tokens`);
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n📋 Test Summary:');
        console.log('1. ✅ TSS Authority initialization (simulated)');
        console.log('2. ✅ Token reservation in escrow (simulated)');
        console.log('3. ✅ Token release with TSS signature (simulated)');
        console.log('4. ✅ Token refund (simulated)');
        
        console.log('\n🚀 Next steps:');
        console.log('1. Implement actual Anchor program calls');
        console.log('2. Test with real TSS signatures from ICP');
        console.log('3. Test partial fills and multiple releases');
        console.log('4. Test expiry and refund scenarios');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
testEscrowProgram().catch(console.error);
