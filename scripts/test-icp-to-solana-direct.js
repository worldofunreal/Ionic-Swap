#!/usr/bin/env node

const { Principal } = require('@dfinity/principal');
const { Actor, HttpAgent } = require('@dfinity/agent');

// Load the backend canister interface
const backend_idl = require('../src/declarations/backend/backend.did.js');
const backend_canister_id = '5w2a3-wqaaa-aaaap-qqaea-cai';

async function testDirectICPToSolana() {
    console.log('🧪 Testing Direct ICP → Solana Transfer');
    console.log('=====================================');
    
    // Create agent and actor
    const agent = new HttpAgent({ host: 'https://ic0.app' });
    const backend = Actor.createActor(backend_idl.idlFactory, {
        agent,
        canisterId: backend_canister_id,
    });
    
    try {
        // Test direct transfer from canister to user
        console.log('🔍 Testing direct SPL token transfer...');
        
        const canister_solana_address = 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ';
        const user_solana_address = 'Eata7NcsFkN2TJDgoKNndAAax66eC3JDnZMa1fhdZTWT';
        const spiral_mint = 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK';
        const amount = 1000000; // 1M tokens
        
        // Get canister's Spiral token account
        const canister_spiral_result = await backend.get_associated_token_address_public(
            canister_solana_address,
            spiral_mint
        );
        
        const canister_spiral_account = canister_spiral_result.Ok;
        console.log(`📋 Canister Spiral account: ${canister_spiral_account}`);
        
        // Get user's Spiral token account
        const user_spiral_result = await backend.get_associated_token_address_public(
            user_solana_address,
            spiral_mint
        );
        
        const user_spiral_account = user_spiral_result.Ok;
        console.log(`📋 User Spiral account: ${user_spiral_account}`);
        
        // Try to transfer directly
        console.log('🔄 Attempting direct transfer...');
        
        const transfer_result = await backend.send_spl_token_transaction_public(
            canister_spiral_account,
            user_spiral_account,
            canister_solana_address,
            amount
        );
        
        console.log(`✅ Transfer successful: ${transfer_result}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDirectICPToSolana();
