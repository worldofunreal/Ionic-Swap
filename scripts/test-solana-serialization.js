#!/usr/bin/env node

/**
 * Test script to understand Solana transaction serialization
 * This will help us understand the correct format before implementing in the canister
 */

const { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } = require('@solana/web3.js');
const { createTransferInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');

async function testSolanaSerialization() {
    console.log('🧪 Testing Solana Transaction Serialization');
    console.log('==========================================');
    
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create test keypairs
    const fromKeypair = Keypair.generate();
    const toKeypair = Keypair.generate();
    
    console.log('📋 Test Setup:');
    console.log(`   From: ${fromKeypair.publicKey.toBase58()}`);
    console.log(`   To: ${toKeypair.publicKey.toBase58()}`);
    
    try {
        // Test 1: Create a simple SOL transfer transaction
        console.log('\n🚀 Test 1: Creating SOL transfer transaction...');
        
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toKeypair.publicKey,
                lamports: 1000000, // 0.001 SOL
            })
        );
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromKeypair.publicKey;
        
        console.log('   ✅ Transaction created');
        console.log(`   Blockhash: ${blockhash}`);
        console.log(`   Fee Payer: ${fromKeypair.publicKey.toBase58()}`);
        
        // Test 2: Serialize the transaction
        console.log('\n🔧 Test 2: Serializing transaction...');
        
        // Sign the transaction
        transaction.sign(fromKeypair);
        
        // Serialize to different formats
        const serialized = transaction.serialize();
        const base64 = serialized.toString('base64');
        const hex = serialized.toString('hex');
        
        console.log('   ✅ Transaction serialized');
        console.log(`   Serialized length: ${serialized.length} bytes`);
        console.log(`   Base64 length: ${base64.length} chars`);
        console.log(`   Hex length: ${hex.length} chars`);
        console.log(`   Base64 (first 100 chars): ${base64.substring(0, 100)}...`);
        
        // Test 3: Try to send the transaction (this will fail due to insufficient funds, but we'll see the format)
        console.log('\n📡 Test 3: Testing RPC call format...');
        
        const rpcRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'sendTransaction',
            params: [
                base64,
                {
                    encoding: 'base64',
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                }
            ]
        };
        
        console.log('   ✅ RPC request format:');
        console.log(`   Method: ${rpcRequest.method}`);
        console.log(`   Params length: ${rpcRequest.params.length}`);
        console.log(`   Transaction encoding: ${rpcRequest.params[1].encoding}`);
        console.log(`   Transaction data length: ${rpcRequest.params[0].length} chars`);
        
        // Test 4: Show the structure of a Solana transaction
        console.log('\n📊 Test 4: Transaction structure analysis...');
        console.log('   Transaction object:');
        console.log(`     - signatures: ${transaction.signatures.length} signatures`);
        console.log(`     - message: ${transaction.message?.instructions?.length || 'N/A'} instructions`);
        console.log(`     - recentBlockhash: ${transaction.recentBlockhash}`);
        console.log(`     - feePayer: ${transaction.feePayer?.toBase58()}`);
        
        // Show signature structure
        if (transaction.signatures.length > 0) {
            const sig = transaction.signatures[0];
            console.log(`     - signature[0]: ${sig.toString('base64')} (${sig.length} bytes)`);
        }
        
        console.log('\n🎉 Serialization test complete!');
        console.log('\n💡 Key insights:');
        console.log('   1. Solana transactions use Borsh serialization');
        console.log('   2. The transaction includes signatures + message');
        console.log('   3. RPC expects base64 encoding by default');
        console.log('   4. Each signature is 64 bytes');
        console.log('   5. The message contains instructions, blockhash, and fee payer');
        
    } catch (error) {
        console.error('❌ Error during serialization test:', error.message);
    }
}

// Run the test
testSolanaSerialization().catch(console.error);
