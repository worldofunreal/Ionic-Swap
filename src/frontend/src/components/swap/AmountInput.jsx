import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './AmountInput.css';

const AmountInput = ({ value, onChange, token, userAddress }) => {
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
    if (userAddress && token) {
      fetchBalance();
    }
  }, [userAddress, token]);

  const fetchBalance = async () => {
    if (!window.ethereum || !userAddress) return;

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
        const ethBalance = await provider.getBalance(userAddress);
        const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);
        setBalance(parseFloat(ethBalanceFormatted).toFixed(4));
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const tokenBalance = await contract.balanceOf(userAddress);
      
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
    <div className="amount-input">
      <div className="input-container">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="amount-field"
          min="0"
          step="0.01"
        />
        <div className="token-display">
          <span className="token-symbol">{token}</span>
        </div>
      </div>
      
      <div className="balance-section">
        <div className="balance-info">
          <span className="balance-label">Balance:</span>
          <span className="balance-amount">
            {loading ? '...' : `${balance} ${token}`}
          </span>
        </div>
        
        <div className="percentage-buttons">
          <button
            type="button"
            onClick={() => setPercentage(0.25)}
            className="percentage-btn"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPercentage(0.5)}
            className="percentage-btn"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setPercentage(0.75)}
            className="percentage-btn"
          >
            75%
          </button>
          <button
            type="button"
            onClick={setMaxAmount}
            className="percentage-btn max-btn"
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmountInput; 