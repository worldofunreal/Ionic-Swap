import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { idlFactory as backendIdlFactory } from '../src/declarations/backend/backend.did.js';

const testVps = async () => {
  const agent = new HttpAgent({ 
    host: 'http://74.208.246.177:7777',
    identity: Ed25519KeyIdentity.generate(),
    verifyQuerySignatures: false,
    verifyUpdateSignatures: false,
  });

  // Don't fetch root key for raw domain
  // await agent.fetchRootKey();

  const backend = Actor.createActor(backendIdlFactory, {
    agent,
    canisterId: 'uxrrr-q7777-77774-qaaaq-cai',
  });

  try {
    const result = await backend.get_all_internal_tokens();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testVps();
