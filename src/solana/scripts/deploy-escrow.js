const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
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

async function deployEscrowProgram() {
    try {
        console.log(`🚀 Deploying Ionic Escrow Program to ${NETWORK}...`);
        
        // Load deployer keypair
        const deployer = await loadKeypair();
        console.log(`📝 Deployer: ${deployer.publicKey.toString()}`);
        
        // Check balance
        const balance = await connection.getBalance(deployer.publicKey);
        console.log(`💰 Balance: ${balance / 1e9} SOL`);
        
        if (balance < 2e9) { // 2 SOL minimum
            console.error('❌ Insufficient balance for deployment');
            process.exit(1);
        }
        
        // Build the program
        console.log('🔨 Building program...');
        const { execSync } = require('child_process');
        
        try {
            execSync('cargo build-sbf --release', { 
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
        
        // Load the compiled program
        const programPath = path.join(__dirname, '..', 'target', 'deploy', 'ionic_solana_escrow.so');
        
        if (!fs.existsSync(programPath)) {
            console.error('❌ Compiled program not found');
            process.exit(1);
        }
        
        const programData = fs.readFileSync(programPath);
        
        // Create program account
        console.log('📦 Creating program account...');
        const programKeypair = Keypair.generate();
        const programId = programKeypair.publicKey;
        
        // Calculate space needed (program data + account overhead)
        const space = programData.length;
        const rentExemption = await connection.getMinimumBalanceForRentExemption(space);
        
        const createAccountTx = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: deployer.publicKey,
                newAccountPubkey: programId,
                lamports: rentExemption,
                space: space,
                programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
            })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        createAccountTx.recentBlockhash = blockhash;
        createAccountTx.feePayer = deployer.publicKey;
        createAccountTx.sign(deployer, programKeypair);
        
        const createTxSig = await connection.sendTransaction(createAccountTx, [deployer, programKeypair]);
        await connection.confirmTransaction(createTxSig);
        console.log(`✅ Program account created: ${createTxSig}`);
        
        // Deploy the program
        console.log('🚀 Deploying program...');
        const deployTxSig = await connection.sendTransaction(
            new Transaction().add({
                keys: [
                    { pubkey: programId, isSigner: false, isWritable: true },
                    { pubkey: deployer.publicKey, isSigner: true, isWritable: false }
                ],
                programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
                data: Buffer.concat([
                    Buffer.from([0, 0, 0, 0]), // Initialize instruction
                    programData
                ])
            }),
            [deployer]
        );
        
        await connection.confirmTransaction(deployTxSig);
        console.log(`✅ Program deployed: ${deployTxSig}`);
        
        // Save deployment info
        const deploymentInfo = {
            programId: programId.toString(),
            network: NETWORK,
            deployer: deployer.publicKey.toString(),
            deployTx: deployTxSig,
            timestamp: new Date().toISOString(),
            rpcUrl: RPC_URLS[NETWORK]
        };
        
        const deploymentPath = path.join(__dirname, '..', 'escrow-deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log('\n🎉 Deployment successful!');
        console.log(`📝 Program ID: ${programId.toString()}`);
        console.log(`🌐 Network: ${NETWORK}`);
        console.log(`📄 Deployment info saved to: ${deploymentPath}`);
        
        console.log('\n📋 Next steps:');
        console.log('1. Update the program ID in lib.rs');
        console.log('2. Initialize TSS authority');
        console.log('3. Test the escrow functionality');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment
deployEscrowProgram().catch(console.error);
