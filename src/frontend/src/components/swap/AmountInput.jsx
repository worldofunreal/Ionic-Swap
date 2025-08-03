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

  const setMaxAmount = () => {
    onChange(balance);
  };

  return (
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full bg-transparent border-none text-right text-2xl font-semibold text-white placeholder-neutral-500 focus:outline-none focus:ring-0 focus:border-none focus:shadow-none rounded-lg p-2 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min="0"
        step="0.01"
      />
    </div>
  );
};

export default AmountInput; 