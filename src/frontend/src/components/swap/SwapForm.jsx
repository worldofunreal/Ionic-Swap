import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { fetchICRCBalance } from '../../utils/icrc';
import { useAuth } from '../../contexts/AuthContext';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import SwapSummary from './SwapSummary';

const SwapForm = ({
  sourceToken,
  destinationToken,
  onSourceTokenChange,
  onDestinationTokenChange,
  amount,
  onAmountChange,
  destinationAddress,
  onDestinationAddressChange,
  user
}) => {
  const { getIdentity } = useAuth();
  const [sourceBalance, setSourceBalance] = useState('0');
  const [destinationBalance, setDestinationBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [sourceAmount, setSourceAmount] = useState('');
  const [destinationAmount, setDestinationAmount] = useState('');

  // Token addresses (from our test script)
  const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
  const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';

  // ICRC Canister IDs - Local development
  const SPIRAL_ICRC_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
  const STARDUST_ICRC_CANISTER_ID = 'ulvla-h7777-77774-qaacq-cai';

  // Default tokens
  const defaultSourceToken = {
    id: 'spiral-sepolia',
    symbol: 'SPIRAL',
    name: 'Spiral Token',
    icon: '🌀',
    network: 'Sepolia',
    type: 'evm',
    address: SPIRAL_TOKEN
  };

  const defaultDestinationToken = {
    id: 'stardust-icp',
    symbol: 'STARDUST',
    name: 'Stardust Token',
    icon: '⭐',
    network: 'ICP',
    type: 'icrc',
    canisterId: STARDUST_ICRC_CANISTER_ID
  };

  // ERC20 ABI for balanceOf
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  // Set default tokens if none provided
  useEffect(() => {
    if (!sourceToken) {
      onSourceTokenChange(defaultSourceToken);
    }
    if (!destinationToken) {
      onDestinationTokenChange(defaultDestinationToken);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user, sourceToken, destinationToken]);

  // Fetch balances immediately when component mounts
  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user]);

  const fetchBalances = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch source balance
      if (sourceToken?.type === 'evm') {
        // Source is Sepolia (EVM)
        if (user.evmAddress && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(sourceToken.address, erc20Abi, provider);
          const tokenBalance = await contract.balanceOf(user.evmAddress);
          const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
          setSourceBalance(parseFloat(formattedBalance).toFixed(2));
        }
      } else if (sourceToken?.type === 'icrc') {
        // Source is ICP
        if (user.icpPrincipal) {
          const identity = getIdentity();
          if (identity) {
            const balance = await fetchICRCBalance(sourceToken.canisterId, user.icpPrincipal, identity);
            setSourceBalance(balance);
          }
        }
      }

      // Fetch destination balance
      if (destinationToken?.type === 'evm') {
        // Destination is Sepolia (EVM)
        if (user.evmAddress && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(destinationToken.address, erc20Abi, provider);
          const tokenBalance = await contract.balanceOf(user.evmAddress);
          const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
          setDestinationBalance(parseFloat(formattedBalance).toFixed(2));
        }
      } else if (destinationToken?.type === 'icrc') {
        // Destination is ICP
        if (user.icpPrincipal) {
          const identity = getIdentity();
          if (identity) {
            const balance = await fetchICRCBalance(destinationToken.canisterId, user.icpPrincipal, identity);
            setDestinationBalance(balance);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSwapDirection = () => {
    if (sourceToken?.type === 'evm' && destinationToken?.type === 'icrc') {
      return 'evm-to-icp';
    } else if (sourceToken?.type === 'icrc' && destinationToken?.type === 'evm') {
      return 'icp-to-evm';
    }
    return null;
  };

  const handleSwap = () => {
    // TODO: Implement swap logic
    console.log('Swap initiated:', {
      sourceToken,
      destinationToken,
      sourceAmount,
      destinationAmount,
      direction: getSwapDirection()
    });
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Main Swap Card */}
      <div className="bg-neutral-800/10 rounded-xl border border-neutral-700 p-4 space-y-0">
        {/* You Send Section */}
        <div className="space-y-1 mb-0">
          <div className="flex items-center bg-neutral-700/10 rounded-lg p-3 pt-4 border border-neutral-600 relative">
            {/* Balance on top right */}
            <div className="absolute top-1 right-2 flex items-center space-x-2">
              <div className="text-xs text-neutral-400">
                <span className="font-medium text-white">{loading ? 'Loading...' : `${sourceBalance} ${sourceToken?.symbol || 'SPIRAL'}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setSourceAmount(sourceBalance)}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  loading 
                    ? 'bg-neutral-600 text-neutral-500 cursor-not-allowed' 
                    : 'bg-neutral-600 hover:bg-neutral-500 text-white'
                }`}
              >
                Max
              </button>
            </div>
            
            {/* Token Selection - 50% width */}
            <div className="w-1/2 pr-2">
              <TokenSelector
                value={sourceToken}
                onChange={onSourceTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input - 50% width, positioned at bottom */}
            <div className="w-1/2 pl-2 absolute bottom-2 right-2">
              <AmountInput
                value={sourceAmount}
                onChange={setSourceAmount}
                token={sourceToken?.symbol || 'SPIRAL'}
                user={user}
              />
            </div>
          </div>
        </div>

        {/* Swap Direction Indicator */}
        <div className="justify-center flex space-y-1">
          <div className="mt-1 mb-1 w-6 h-6 z-20 bg-neutral-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        {/* You Get Section */}
        <div className="">
          <div className="flex items-center bg-neutral-700/10 rounded-lg p-3 pt-4 border border-neutral-600 relative">
            {/* Balance on top right */}
            <div className="absolute top-1 right-2 flex items-center space-x-2">
              <div className="text-xs text-neutral-400">
                <span className="font-medium text-white">{loading ? 'Loading...' : `${destinationBalance} ${destinationToken?.symbol || 'STARDUST'}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setDestinationAmount(destinationBalance)}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  loading 
                    ? 'bg-neutral-600 text-neutral-500 cursor-not-allowed' 
                    : 'bg-neutral-600 hover:bg-neutral-500 text-white'
                }`}
              >
                Max
              </button>
            </div>
            
            {/* Token Selection - 50% width */}
            <div className="w-1/2 pr-2">
              <TokenSelector
                value={destinationToken}
                onChange={onDestinationTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input - 50% width, positioned at bottom */}
            <div className="w-1/2 pl-2 absolute bottom-2 right-2">
              <AmountInput
                value={destinationAmount}
                onChange={setDestinationAmount}
                token={destinationToken?.symbol || 'STARDUST'}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Swap Summary */}
      <SwapSummary
        direction={getSwapDirection()}
        sourceToken={sourceToken?.symbol || 'SPIRAL'}
        destinationToken={destinationToken?.symbol || 'STARDUST'}
        sourceAmount={sourceAmount}
        destinationAmount={destinationAmount}
        destinationAddress={user?.evmAddress || user?.icpPrincipal || ''}
        onSwap={handleSwap}
        isLoading={loading}
      />
    </div>
  );
};

export default SwapForm; 