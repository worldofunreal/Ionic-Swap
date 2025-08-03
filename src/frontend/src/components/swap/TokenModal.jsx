import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { fetchICRCBalance } from '../../utils/icrc';
import { useAuth } from '../../contexts/AuthContext';

const TokenModal = ({ isOpen, onClose, onTokenSelect, user }) => {
  const { getIdentity } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  // Token addresses (from our test script)
  const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
  const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';

  // ICRC Canister IDs - Local development
  const SPIRAL_ICRC_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
  const STARDUST_ICRC_CANISTER_ID = 'ulvla-h7777-77774-qaacq-cai';

  // ERC20 ABI for balanceOf
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  const tokens = [
    {
      id: 'spiral-sepolia',
      symbol: 'SPIRAL',
      name: 'Spiral Token',
      icon: '🌀',
      network: 'Sepolia',
      type: 'evm',
      address: SPIRAL_TOKEN
    },
    {
      id: 'stardust-sepolia',
      symbol: 'STARDUST',
      name: 'Stardust Token',
      icon: '⭐',
      network: 'Sepolia',
      type: 'evm',
      address: STARDUST_TOKEN
    },
    {
      id: 'spiral-icp',
      symbol: 'SPIRAL',
      name: 'Spiral Token',
      icon: '🌀',
      network: 'ICP',
      type: 'icrc',
      canisterId: SPIRAL_ICRC_CANISTER_ID
    },
    {
      id: 'stardust-icp',
      symbol: 'STARDUST',
      name: 'Stardust Token',
      icon: '⭐',
      network: 'ICP',
      type: 'icrc',
      canisterId: STARDUST_ICRC_CANISTER_ID
    }
  ];

  useEffect(() => {
    if (isOpen && user) {
      fetchAllBalances();
    }
  }, [isOpen, user]);

  const fetchAllBalances = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const newBalances = {};

      // Fetch EVM balances
      if (user.evmAddress && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        for (const token of tokens.filter(t => t.type === 'evm')) {
          try {
            const contract = new ethers.Contract(token.address, erc20Abi, provider);
            const tokenBalance = await contract.balanceOf(user.evmAddress);
            const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
            newBalances[token.id] = parseFloat(formattedBalance).toFixed(2);
          } catch (error) {
            console.error(`Failed to fetch ${token.symbol} balance on ${token.network}:`, error);
            newBalances[token.id] = '0';
          }
        }
      }

      // Fetch ICRC balances
      if (user.icpPrincipal) {
        const identity = getIdentity();
        if (identity) {
          for (const token of tokens.filter(t => t.type === 'icrc')) {
            try {
              const balance = await fetchICRCBalance(token.canisterId, user.icpPrincipal, identity);
              newBalances[token.id] = balance;
            } catch (error) {
              console.error(`Failed to fetch ${token.symbol} balance on ${token.network}:`, error);
              newBalances[token.id] = '0';
            }
          }
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token) => {
    onTokenSelect(token);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-neutral-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto border border-neutral-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Select Token</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {tokens.map(token => (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-neutral-700/50 hover:border-neutral-500/50 hover:bg-neutral-800/50 transition-all duration-200 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{token.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-white">{token.symbol}</div>
                  <div className="text-xs text-neutral-400">on {token.network}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {loading ? '...' : `${balances[token.id] || '0'} ${token.symbol}`}
                </div>
                <div className="text-xs text-neutral-400">
                  {token.network}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenModal; 