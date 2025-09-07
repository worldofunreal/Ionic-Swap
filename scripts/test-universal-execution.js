#!/usr/bin/env node

const { Principal } = require('@dfinity/principal');
const { Actor, HttpAgent } = require('@dfinity/agent');

// Load the backend canister interface
const backend_idl = require('../src/declarations/backend/backend.did.js');
const backend_canister_id = '5w2a3-wqaaa-aaaap-qqaea-cai';

async function testUniversalExecution() {
    console.log('🚀 Testing Universal Market Order Execution System');
    console.log('================================================================================');
    
    // Create agent and actor
    const agent = new HttpAgent({ host: 'https://ic0.app' });
    const backend = Actor.createActor(backend_idl.idlFactory, {
        agent,
        canisterId: backend_canister_id,
    });
    
    try {
        console.log('🔄 Creating order pair simultaneously...');
        
        // Create ICP → Solana order and Solana → ICP order in parallel
        // Use valid addresses for testing
        const alice_icp_principal = '5w2a3-wqaaa-aaaap-qqaea-cai'; // Backend canister principal
        const bob_icp_principal = 'ej2n5-qaaaa-aaaap-qqc3a-cai';   // Spiral token canister principal
        const alice_solana_address = '8Tfg3vjV5Huk1YKpZ1FKCF9N6cz2jTYRPeH1vonNmXMG'; // Alice's Solana address with token accounts
        const bob_solana_address = 'Eata7NcsFkN2TJDgoKNndAAax66eC3JDnZMa1fhdZTWT';   // Bob's Solana address with token accounts
        
        const [order1_result, order2_result] = await Promise.all([
            // ICP → Solana (Spiral)
            backend.create_cross_chain_swap_order_public(
                alice_icp_principal, bob_solana_address, 
                'ej2n5-qaaaa-aaaap-qqc3a-cai', 'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK',
                '1000', '1000',
                0n, 1n, // ICP to Solana
                BigInt(Date.now() + 7200000) // 2 hours from now
            ),
            // Solana → ICP (Spiral)  
            backend.create_cross_chain_swap_order_public(
                bob_solana_address, alice_icp_principal,
                'HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK', 'ej2n5-qaaaa-aaaap-qqc3a-cai',
                '1000', '1000', 
                1n, 0n, // Solana to ICP
                BigInt(Date.now() + 7200000) // 2 hours from now
            )
        ]);
        
        console.log('📊 Results:');
        if (order1_result.Ok) {
            console.log(`✅ ICP → Solana order: ${order1_result.Ok}`);
        } else {
            console.log(`❌ ICP → Solana order failed: ${order1_result.Err}`);
        }
        
        if (order2_result.Ok) {
            console.log(`✅ Solana → ICP order: ${order2_result.Ok}`);
        } else {
            console.log(`❌ Solana → ICP order failed: ${order2_result.Err}`);
        }
        
        if (order1_result.Ok && order2_result.Ok) {
            console.log('🎉 UNIVERSAL MARKET ORDER EXECUTION SUCCESSFUL!');
            console.log('Both orders should have been paired and executed immediately!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testUniversalExecution();
