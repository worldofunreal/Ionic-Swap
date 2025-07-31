import { useState } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_SEPOLIA, SEPOLIA_CHAIN_ID } from '../utils/contractUtils.js';

export const useSwapIntent = (signer, userAddress) => {
  const [intentStatus, setIntentStatus] = useState('idle');
  const [error, setError] = useState('');

  const submitGaslessSwapIntent = async (amount, htlcActor) => {
    if (!signer || !userAddress) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIntentStatus('submitting-intent');
      setError('');

      // Create swap intent
      const intent = {
        user: userAddress,
        amountIn: amount,
        tokenIn: SPIRAL_SEPOLIA,
        tokenOut: "0xICP_ADDRESS", // ICP token address
        deadline: Math.floor(Date.now() / 1000) + 3600,
        nonce: Date.now(),
      };

      // EIP-712 types for swap intent
      const intentTypes = {
        SwapIntent: [
          { name: "user", type: "address" },
          { name: "amountIn", type: "string" },
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      // Sign the swap intent
      const intentSignature = await signer._signTypedData(
        { 
          name: "SwapIntent", 
          version: "1", 
          chainId: SEPOLIA_CHAIN_ID
        },
        intentTypes,
        intent
      );

      // Submit to ICP canister
      const result = await htlcActor.submit_swap_intent({
        intent: intent,
        signature: intentSignature,
        user_address: userAddress,
      });

      if (result.Ok) {
        setIntentStatus('intent-submitted');
        console.log('✅ Swap intent submitted successfully!');
        return true;
      } else {
        throw new Error('Swap intent submission failed');
      }
    } catch (err) {
      console.error('Swap intent submission failed:', err);
      setError(err.message);
      setIntentStatus('error');
      return false;
    }
  };

  return {
    intentStatus,
    error,
    submitGaslessSwapIntent
  };
}; 