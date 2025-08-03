import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const AmountInput = ({ value, onChange, token, user }) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);

  // Token addresses (from our test script)
  const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
  const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';

  // ERC20 ABI for balanceOf
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  useEffect(() => {
    if (user && token) {
      fetchBalance();
    }
  }, [user, token]);

  const fetchBalance = async () => {
    if (!window.ethereum || !user?.evmAddress) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      let tokenAddress;
      if (token === 'SPIRAL') {
        tokenAddress = SPIRAL_TOKEN;
      } else if (token === 'STARDUST') {
        tokenAddress = STARDUST_TOKEN;
      } else {
        // ETH balance
        const ethBalance = await provider.getBalance(user.evmAddress);
        const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);
        setBalance(parseFloat(ethBalanceFormatted).toFixed(4));
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const tokenBalance = await contract.balanceOf(user.evmAddress);

      // Format with 8 decimals (as per our tokens)
      const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
      setBalance(parseFloat(formattedBalance).toFixed(2));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  const setPercentage = (percentage) => {
    const newAmount = (parseFloat(balance) * percentage).toFixed(2);
    onChange(newAmount);
  };

  const setMaxAmount = () => {
    onChange(balance);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="input-field pr-16"
          min="0"
          step="0.01"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-gray-500 font-medium">{token}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Balance: {loading ? '...' : `${balance} ${token}`}
        </div>

        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => setPercentage(0.25)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPercentage(0.5)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setPercentage(0.75)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            75%
          </button>
          <button
            type="button"
            onClick={setMaxAmount}
            className="px-2 py-1 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 rounded transition-colors font-medium"
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmountInput; 