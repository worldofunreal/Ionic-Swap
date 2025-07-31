import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_NETWORK_CONFIG } from '../utils/contractUtils.js';

export const useWalletConnection = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState('');

  // Check and switch to Sepolia network
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return false;
    }

    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== SEPOLIA_NETWORK_CONFIG.chainId) {
        // Switch to Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_NETWORK_CONFIG.chainId }],
        });
      }
      
      setIsCorrectNetwork(true);
      setError('');
      return true;
    } catch (switchError) {
      // If Sepolia is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK_CONFIG]
          });
          setIsCorrectNetwork(true);
          setError('');
          return true;
        } catch (addError) {
          setError('Failed to add Sepolia network to MetaMask');
          return false;
        }
      } else {
        setError('Failed to switch to Sepolia network');
        return false;
      }
    }
  };

  // Initialize wallet connection
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return false;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Check and switch network
      const networkOk = await checkAndSwitchNetwork();
      if (!networkOk) return false;

      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      setUserAddress(address);
      setError('');
      
      return true;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect to wallet');
      return false;
    }
  };

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        if (chainId !== SEPOLIA_NETWORK_CONFIG.chainId) {
          setIsCorrectNetwork(false);
          setError('Please switch to Sepolia network');
        } else {
          setIsCorrectNetwork(true);
          setError('');
        }
      };

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setUserAddress('');
          setSigner(null);
          setProvider(null);
        } else {
          setUserAddress(accounts[0]);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return {
    provider,
    signer,
    userAddress,
    isCorrectNetwork,
    error,
    connectWallet,
    checkAndSwitchNetwork
  };
}; 