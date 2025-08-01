import { useEffect, useState } from 'react';

// Mock actor for development
const createMockActor = () => ({
  greet: async (name) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Hello, ${name}! (Mock Response)`;
  }
});

export const useActor = () => {
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initActor = async () => {
      try {
        // Use local backend canister ID
        const canisterId = 'uxrrr-q7777-77774-qaaaq-cai';
        
        if (!canisterId) {
          console.log('Using mock actor for development');
          setActor(createMockActor());
          setLoading(false);
          return;
        }

        // Try to import the real actor
        const { Actor, HttpAgent } = await import('@dfinity/agent');
        const { idlFactory } = await import('../../declarations/backend');
        
        const agent = new HttpAgent({ 
          host: 'http://127.0.0.1:4943'
        });
        
        // For local development, fetch root key
        await agent.fetchRootKey();
        
        if (!canisterId) {
          console.warn('Canister ID not found. Using mock actor.');
          setActor(createMockActor());
          setLoading(false);
          return;
        }
        
        const realActor = Actor.createActor(idlFactory, {
          agent,
          canisterId
        });
        
        setActor(realActor);
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        console.log('Falling back to mock actor');
        setActor(createMockActor());
      } finally {
        setLoading(false);
      }
    };
    
    initActor();
  }, []);

  return { actor, loading };
};