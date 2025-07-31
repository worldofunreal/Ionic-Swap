import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_SEPOLIA, ERC20_ABI } from '../utils/contractUtils.js';

export const useTokenContract = (provider, signer, userAddress) => {
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenName, setTokenName] = useState('SPIRAL');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [error, setError] = useState('');

  // Initialize token contract
  useEffect(() => {
    if (provider && signer && userAddress) {
      try {
        const token = new ethers.Contract(SPIRAL_SEPOLIA, ERC20_ABI, signer);
        setTokenContract(token);
        setError('');
      } catch (err) {
        console.error('Failed to initialize token contract:', err);
        setError('Failed to initialize token contract');
      }
    }
  }, [provider, signer, userAddress]);

  // Get token info and balance
  useEffect(() => {
    const getTokenInfo = async () => {
      if (!tokenContract || !userAddress) return;

      try {
        // Get token name
        const name = await tokenContract.name();
        setTokenName(name);

        // Get token balance
        const balance = await tokenContract.balanceOf(userAddress);
        setTokenBalance(ethers.utils.formatUnits(balance, 8)); // Spiral has 8 decimals

        console.log('Token info loaded:', { name, balance: ethers.utils.formatUnits(balance, 8) });
      } catch (err) {
        console.error('Failed to get token info:', err);
        setError('Failed to load token information');
      }
    };

    getTokenInfo();
  }, [tokenContract, userAddress]);

  // Get current nonce for permit
  const getNonce = async () => {
    if (!tokenContract || !userAddress) {
      throw new Error('Token contract or user address not available');
    }
    return await tokenContract.nonces(userAddress);
  };

  // Check allowance
  const getAllowance = async (spender) => {
    if (!tokenContract || !userAddress) {
      throw new Error('Token contract or user address not available');
    }
    return await tokenContract.allowance(userAddress, spender);
  };

  return {
    tokenContract,
    tokenName,
    tokenBalance,
    error,
    getNonce,
    getAllowance
  };
}; 