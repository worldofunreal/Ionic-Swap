import React, { useState, useEffect } from 'react';

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
    <div className="flex items-center space-x-2">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
        isCorrectNetwork
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span>{currentNetwork}</span>
      </div>

      {!isCorrectNetwork && (
        <button
          onClick={switchToSepolia}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
        >
          Switch to Sepolia
        </button>
      )}
    </div>
  );
};

export default NetworkStatus; 