import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '../../contexts/AuthContext';
import { fetchICRCBalance } from '../../utils/icrc';

const BalanceDisplay = ({ user }) => {
  const [balances, setBalances] = useState({
    evm: { ETH: '0', SPIRAL: '0', STARDUST: '0' },
    icp: { SPIRAL: '0', STARDUST: '0' }
  });
  const [loading, setLoading] = useState(true);
  const { getIdentity } = useAuth();

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
  }, [user]);

  const fetchBalances = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch EVM balances if user has EVM address
      if (user.evmAddress && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Fetch ETH balance
        const ethBalance = await provider.getBalance(user.evmAddress);
        const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);

        // Fetch ERC20 balances
        const spiralContract = new ethers.Contract(SPIRAL_TOKEN, erc20Abi, provider);
        const stardustContract = new ethers.Contract(STARDUST_TOKEN, erc20Abi, provider);

        const spiralBalance = await spiralContract.balanceOf(user.evmAddress);
        const stardustBalance = await stardustContract.balanceOf(user.evmAddress);

        // Format with 8 decimals (as per our tokens)
        const spiralFormatted = ethers.utils.formatUnits(spiralBalance, 8);
        const stardustFormatted = ethers.utils.formatUnits(stardustBalance, 8);

        setBalances(prev => ({
          ...prev,
          evm: {
            ETH: parseFloat(ethBalanceFormatted).toFixed(4),
            SPIRAL: parseFloat(spiralFormatted).toFixed(2),
            STARDUST: parseFloat(stardustFormatted).toFixed(2)
          }
        }));
      }

      // Fetch ICRC balances if user has ICP principal
      if (user.icpPrincipal) {
        const identity = getIdentity();
        if (identity) {
          const spiralICRCBalance = await fetchICRCBalance(SPIRAL_ICRC_CANISTER_ID, user.icpPrincipal, identity);
          const stardustICRCBalance = await fetchICRCBalance(STARDUST_ICRC_CANISTER_ID, user.icpPrincipal, identity);

          setBalances(prev => ({
            ...prev,
            icp: {
              SPIRAL: spiralICRCBalance,
              STARDUST: stardustICRCBalance
            }
          }));
        }
      }
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
    <div className="p-4">
      <div className="flex items-center space-x-6">
        {/* EVM Balances */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-xs text-neutral-400 font-medium mb-1">ETH</div>
            <div className="text-sm font-mono font-semibold text-white">
              {formatBalance(balances.evm.ETH, '')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400 font-medium mb-1">SPIRAL</div>
            <div className="text-sm font-mono font-semibold text-white">
              {formatBalance(balances.evm.SPIRAL, '')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400 font-medium mb-1">STD</div>
            <div className="text-sm font-mono font-semibold text-white">
              {formatBalance(balances.evm.STARDUST, '')}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-neutral-600"></div>

        {/* ICP Balances */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-xs text-neutral-400 font-medium mb-1">ICP SPIRAL</div>
            <div className="text-sm font-mono font-semibold text-white">
              {formatBalance(balances.icp.SPIRAL, '')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400 font-medium mb-1">ICP STD</div>
            <div className="text-sm font-mono font-semibold text-white">
              {formatBalance(balances.icp.STARDUST, '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay; 