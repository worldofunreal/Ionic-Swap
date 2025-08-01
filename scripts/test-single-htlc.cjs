const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { idlFactory } = require('../src/declarations/backend/backend.did.js');

console.log('🚀 Testing Single HTLC Creation');
console.log('================================\n');

async function testSingleHTLC() {
  try {
    // Create agent
    const agent = new HttpAgent({
      host: 'http://127.0.0.1:4943',
      fetchRootKey: true
    });
    await agent.fetchRootKey();

    // Create actor
    const canisterId = 'uxrrr-q7777-77774-qaaaq-cai';
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId
    });

    console.log('📋 Test 1: Creating atomic swap order...');
    const orderResult = await actor.create_atomic_swap_order(
      '0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7', // maker
      '0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7', // taker
      '0xdE7409EDeA573D090c3C6123458D6242E26b425E', // source token
      '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90', // destination token
      '100000000', // source amount
      '50000000',  // destination amount
      7200 // timelock duration (2 hours)
    );

    if (orderResult.Ok) {
      console.log('✅ Atomic swap order created successfully!');
      console.log(`  Order ID: ${orderResult.Ok}\n`);

      console.log('📋 Test 2: Creating source HTLC...');
      const htlcResult = await actor.create_evm_htlc(orderResult.Ok, true);
      
      if (htlcResult.Ok) {
        console.log('✅ Source HTLC created successfully!');
        console.log(`  Transaction Hash: ${htlcResult.Ok}\n`);
        
        console.log('📋 Test 3: Getting order details...');
        const orderDetails = await actor.get_atomic_swap_order(orderResult.Ok);
        if (orderDetails) {
          console.log('✅ Order details retrieved:');
          console.log(`  Status: ${JSON.stringify(orderDetails.status)}`);
          console.log(`  Source HTLC ID: ${orderDetails.source_htlc_id || 'None'}`);
          console.log(`  Destination HTLC ID: ${orderDetails.destination_htlc_id || 'None'}`);
        }
      } else {
        console.log('❌ Failed to create source HTLC:', htlcResult.Err);
      }
    } else {
      console.log('❌ Failed to create atomic swap order:', orderResult.Err);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSingleHTLC(); 