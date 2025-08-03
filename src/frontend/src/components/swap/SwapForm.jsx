import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { fetchICRCBalance } from '../../utils/icrc';
import { useAuth } from '../../contexts/AuthContext';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';

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

  // ERC20 ABI for balanceOf
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

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

  const getDestinationPlaceholder = () => {
    return destinationToken?.type === 'icrc'
      ? 'Enter ICP Principal ID'
      : 'Enter EVM Address (0x...)';
  };

  return (
    <div className="space-y-6">


      {/* Main Swap Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* You Send Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-end space-x-2">
            <div className="text-sm text-gray-600">
              Balance: <span className="font-medium">{loading ? 'Loading...' : `${sourceBalance} ${sourceToken?.symbol || 'SPIRAL'}`}</span>
            </div>
            <button
              type="button"
              onClick={() => setSourceAmount(sourceBalance)}
              disabled={loading}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-100 hover:bg-primary-200 text-primary-700'
              }`}
            >
              Max
            </button>
          </div>
          
          <div className="flex items-center bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Token Selection */}
            <div className="flex-1">
              <TokenSelector
                value={sourceToken}
                onChange={onSourceTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input */}
            <div className="flex-1">
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
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

                {/* You Get Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-end space-x-2">
            <div className="text-sm text-gray-600">
              Balance: <span className="font-medium">{loading ? 'Loading...' : `${destinationBalance} ${destinationToken?.symbol || 'STARDUST'}`}</span>
            </div>
            <button
              type="button"
              onClick={() => setDestinationAmount(destinationBalance)}
              disabled={loading}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-100 hover:bg-primary-200 text-primary-700'
              }`}
            >
              Max
            </button>
          </div>
          
          <div className="flex items-center bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Token Selection */}
            <div className="flex-1">
              <TokenSelector
                value={destinationToken}
                onChange={onDestinationTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input */}
            <div className="flex-1">
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

      {/* Destination Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Destination Address</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={(e) => onDestinationAddressChange(e.target.value)}
          placeholder={getDestinationPlaceholder()}
          className="input-field"
        />
        <div className="text-xs text-gray-500">
          {destinationToken?.type === 'icrc'
            ? 'Enter the ICP Principal ID where you want to receive tokens'
            : 'Enter the EVM address where you want to receive tokens'
          }
        </div>
      </div>

      {/* Network Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">From:</span>
          <span className="text-sm text-gray-600">
            {sourceToken?.network || 'Sepolia Testnet'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">To:</span>
          <span className="text-sm text-gray-600">
            {destinationToken?.network || 'Internet Computer'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwapForm; 