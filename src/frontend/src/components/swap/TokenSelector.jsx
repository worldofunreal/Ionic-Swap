import React, { useState } from 'react';
import TokenModal from './TokenModal';

const TokenSelector = ({ value, onChange, user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default token if none selected
  const defaultToken = {
    id: 'spiral-sepolia',
    symbol: 'SPIRAL',
    name: 'Spiral Token',
    icon: '🌀',
    network: 'Sepolia',
    type: 'evm'
  };

  // Parse the value to get token info
  const getSelectedToken = () => {
    if (!value) return defaultToken;
    
    // For backward compatibility, try to parse the old format
    if (typeof value === 'string') {
      // This is the old format, we'll need to determine network from context
      // For now, default to Sepolia
      return {
        id: `${value.toLowerCase()}-sepolia`,
        symbol: value,
        name: `${value} Token`,
        icon: value === 'SPIRAL' ? '🌀' : '⭐',
        network: 'Sepolia',
        type: 'evm'
      };
    }
    
    return value;
  };

  const selectedToken = getSelectedToken();

  const handleTokenSelect = (token) => {
    onChange(token);
  };

  return (
    <>
      {/* Token Selection Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-between p-3 bg-transparent border-none hover:bg-gray-100 focus:outline-none focus:ring-0 focus:border-none focus:shadow-none rounded-lg transition-all duration-200 hover:scale-[1.02]"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{selectedToken.icon}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{selectedToken.symbol}</div>
            <div className="text-xs text-gray-500">on {selectedToken.network}</div>
          </div>
        </div>
        <svg 
          className="w-5 h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Token Modal */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTokenSelect={handleTokenSelect}
        user={user}
      />
    </>
  );
};

export default TokenSelector; 