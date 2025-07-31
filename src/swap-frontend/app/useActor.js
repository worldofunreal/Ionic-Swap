"use client"
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
        // Check if we're in development mode and no canister ID is available
        const canisterId = process.env.CANISTER_ID_FUSION_HTLC_CANISTER;
        
        if (!canisterId || canisterId === 'local') {
          console.log('Using mock actor for development');
          setActor(createMockActor());
          setLoading(false);
          return;
        }

        // Try to import the real actor
        const { Actor, HttpAgent } = await import('@dfinity/agent');
        const { idlFactory } = await import('../../declarations/fusion_htlc_canister');
        
        const agent = new HttpAgent({ 
          host: 'https://ic0.app'
        });
        
        // For development, fetch root key
        if (process.env.NODE_ENV === 'development') {
          await agent.fetchRootKey();
        }
        
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