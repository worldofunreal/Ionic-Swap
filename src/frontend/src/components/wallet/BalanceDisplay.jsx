import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BalanceDisplay.css';

const BalanceDisplay = ({ userAddress }) => {
  const [balances, setBalances] = useState({
    evm: { ETH: '0', SPIRAL: '0', STARDUST: '0' },
    icp: { SPIRAL: '0', STARDUST: '0' }
  });
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
    if (userAddress) {
      fetchBalances();
    }
  }, [userAddress]);

  const fetchBalances = async () => {
    if (!window.ethereum || !userAddress) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Fetch ETH balance
      const ethBalance = await provider.getBalance(userAddress);
      const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);

      // Fetch ERC20 balances
      const spiralContract = new ethers.Contract(SPIRAL_TOKEN, erc20Abi, provider);
      const stardustContract = new ethers.Contract(STARDUST_TOKEN, erc20Abi, provider);

      const spiralBalance = await spiralContract.balanceOf(userAddress);
      const stardustBalance = await stardustContract.balanceOf(userAddress);

      // Format with 8 decimals (as per our tokens)
      const spiralFormatted = ethers.utils.formatUnits(spiralBalance, 8);
      const stardustFormatted = ethers.utils.formatUnits(stardustBalance, 8);

      setBalances({
        evm: {
          ETH: parseFloat(ethBalanceFormatted).toFixed(4),
          SPIRAL: parseFloat(spiralFormatted).toFixed(2),
          STARDUST: parseFloat(stardustFormatted).toFixed(2)
        },
        icp: {
          SPIRAL: '0', // TODO: Implement ICP balance fetching
          STARDUST: '0'
        }
      });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance, symbol) => {
    if (loading) return '...';
    return `${balance} ${symbol}`;
  };

  return (
    <div className="balance-display">
      <div className="balance-section">
        <h4>EVM Balances</h4>
        <div className="balance-item">
          <span className="token-symbol">ETH</span>
          <span className="balance-amount">{formatBalance(balances.evm.ETH, 'ETH')}</span>
        </div>
        <div className="balance-item">
          <span className="token-symbol">SPIRAL</span>
          <span className="balance-amount">{formatBalance(balances.evm.SPIRAL, 'SPIRAL')}</span>
        </div>
        <div className="balance-item">
          <span className="token-symbol">STARDUST</span>
          <span className="balance-amount">{formatBalance(balances.evm.STARDUST, 'STD')}</span>
        </div>
      </div>
      
      <div className="balance-section">
        <h4>ICP Balances</h4>
        <div className="balance-item">
          <span className="token-symbol">SPIRAL</span>
          <span className="balance-amount">{formatBalance(balances.icp.SPIRAL, 'SPIRAL')}</span>
        </div>
        <div className="balance-item">
          <span className="token-symbol">STARDUST</span>
          <span className="balance-amount">{formatBalance(balances.icp.STARDUST, 'STD')}</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay; 