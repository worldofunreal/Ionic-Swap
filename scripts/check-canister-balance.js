#!/usr/bin/env node

const { Principal } = require('@dfinity/principal');
const { Actor, HttpAgent } = require('@dfinity/agent');

// Load the backend canister interface
const backend_idl = require('../src/declarations/backend/backend.did.js');
const backend_canister_id = '5w2a3-wqaaa-aaaap-qqaea-cai';

async function checkCanisterBalance() {
    console.log('🔍 Checking Canister Token Balances');
    console.log('===================================');
    
    // Create agent and actor
    const agent = new HttpAgent({ host: 'https://ic0.app' });
    const backend = Actor.createActor(backend_idl.idlFactory, {
        agent,
        canisterId: backend_canister_id,
    });
    
    try {
        // Current canister addresses
        const canister_base_address = 'BqDLM81hyCKUcovhK6bJUDfJVk2BuMDpqPRsgmuS3XFQ';
        const spiral_ata = '2rZtLCFrpxUXCbbKHLDJufDLE6vvy7nNkvNfo1a39JUK';
        const stardust_ata = 'BR1DT3EBAkPiWF6eZNVFPxS1gaSSYagQ7oRyzo88H1av';
        
        console.log(`📋 Canister base address: ${canister_base_address}`);
        console.log(`📋 Spiral ATA: ${spiral_ata}`);
        console.log(`📋 Stardust ATA: ${stardust_ata}`);
        
        // Check Spiral balance
        console.log('\n🔍 Checking Spiral balance...');
        try {
            const spiral_balance_result = await backend.get_spl_token_balance_public(spiral_ata);
            console.log('🔍 Raw result:', spiral_balance_result);
            
            if (spiral_balance_result.Ok) {
                const spiral_balance = JSON.parse(spiral_balance_result.Ok);
                console.log(`💰 Spiral balance: ${spiral_balance} tokens`);
            } else {
                console.log(`❌ Spiral balance error: ${spiral_balance_result.Err}`);
            }
        } catch (error) {
            console.log(`❌ Failed to get Spiral balance: ${error.message}`);
        }
        
        // Check Stardust balance
        console.log('\n🔍 Checking Stardust balance...');
        try {
            const stardust_balance_result = await backend.get_spl_token_balance_public(stardust_ata);
            console.log('🔍 Raw result:', stardust_balance_result);
            
            if (stardust_balance_result.Ok) {
                const stardust_balance = JSON.parse(stardust_balance_result.Ok);
                console.log(`💰 Stardust balance: ${stardust_balance} tokens`);
            } else {
                console.log(`❌ Stardust balance error: ${stardust_balance_result.Err}`);
            }
        } catch (error) {
            console.log(`❌ Failed to get Stardust balance: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkCanisterBalance();
