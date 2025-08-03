import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { fetchICRCBalance } from '../../utils/icrc';
import { useAuth } from '../../contexts/AuthContext';

const TokenPanel = ({ user }) => {
  const { getIdentity } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

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
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllBalances();
    }
  }, [user]);

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

  return (
    <div className="relative" ref={panelRef}>
      {/* Token Panel Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
      >
        <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">💰</span>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Token Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tokens</h3>
              <div className="text-xs text-neutral-400">
                {loading ? 'Loading...' : 'Updated'}
              </div>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="space-y-2">
              {tokens.map(token => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{token.icon}</span>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPanel; 