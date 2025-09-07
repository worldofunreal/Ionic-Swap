#!/usr/bin/env node

const { Principal } = require('@dfinity/principal');
const { Actor, HttpAgent } = require('@dfinity/agent');

// Load the backend canister interface
const backend_idl = require('../src/declarations/backend/backend.did.js');
const backend_canister_id = '5w2a3-wqaaa-aaaap-qqaea-cai';

async function testSimpleTransfer() {
    console.log('🧪 Testing Simple SPL Token Transfer');
    console.log('===================================');
    
    // Create agent and actor
    const agent = new HttpAgent({ host: 'https://ic0.app' });
    const backend = Actor.createActor(backend_idl.idlFactory, {
        agent,
        canisterId: backend_canister_id,
    });
    
    try {
        // Use reasonable quantities for testing
        const canister_solana_address = 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ';
        const user_solana_address = 'Eata7NcsFkN2TJDgoKNndAAax66eC3JDnZMa1fhdZTWT';
        const spiral_mint = 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK';
        const amount = 1000; // 1000 tokens (much more reasonable)
        
        console.log(`📋 Testing transfer of ${amount} Spiral tokens`);
        console.log(`📋 From: ${canister_solana_address}`);
        console.log(`📋 To: ${user_solana_address}`);
        
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
        
        // Check canister balance first
        console.log('🔍 Checking canister balance...');
        const balance_result = await backend.get_spl_token_balance_public(canister_spiral_account);
        const balance_data = JSON.parse(balance_result);
        console.log(`💰 Canister balance: ${balance_data.value} tokens`);
        
        if (balance_data.value < amount) {
            console.log(`❌ Insufficient balance: ${balance_data.value} < ${amount}`);
            return;
        }
        
        // Try to transfer directly
        console.log('🔄 Attempting direct transfer...');
        
        const transfer_result = await backend.send_spl_token_transaction_public(
            canister_spiral_account,
            user_spiral_account,
            canister_solana_address,
            amount
        );
        
        console.log(`✅ Transfer successful: ${transfer_result}`);
        
        // Check final balances
        console.log('🔍 Checking final balances...');
        const final_canister_balance = await backend.get_spl_token_balance_public(canister_spiral_account);
        const final_user_balance = await backend.get_spl_token_balance_public(user_spiral_account);
        
        console.log(`💰 Final canister balance: ${JSON.parse(final_canister_balance).value} tokens`);
        console.log(`💰 Final user balance: ${JSON.parse(final_user_balance).value} tokens`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('❌ Full error:', error);
    }
}

testSimpleTransfer();
