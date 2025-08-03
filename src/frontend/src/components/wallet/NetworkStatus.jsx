import React, { useState, useEffect } from 'react';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const [currentNetwork, setCurrentNetwork] = useState('Unknown');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
  const SEPOLIA_NETWORK_CONFIG = {
    chainId: SEPOLIA_CHAIN_ID,
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  };

  useEffect(() => {
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleChainChanged = (chainId) => {
    checkNetwork();
  };

  const checkNetwork = async () => {
    if (!window.ethereum) return;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId === SEPOLIA_CHAIN_ID) {
        setCurrentNetwork('Sepolia');
        setIsCorrectNetwork(true);
      } else {
        setCurrentNetwork('Wrong Network');
        setIsCorrectNetwork(false);
      }
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      setCurrentNetwork('Error');
      setIsCorrectNetwork(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
        }
      }
    }
  };

  return (
    <div className="network-status">
      <div className={`network-indicator ${isCorrectNetwork ? 'connected' : 'disconnected'}`}>
        <div className="network-dot"></div>
        <span className="network-name">{currentNetwork}</span>
      </div>
      
      {!isCorrectNetwork && (
        <button onClick={switchToSepolia} className="switch-network-btn">
          Switch to Sepolia
        </button>
      )}
    </div>
  );
};

export default NetworkStatus; 