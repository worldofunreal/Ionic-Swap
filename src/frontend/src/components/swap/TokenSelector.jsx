import React from 'react';

const TokenSelector = ({ value, onChange, direction, isSource }) => {
  const tokens = [
    { symbol: 'SPIRAL', name: 'Spiral Token', icon: '🌀' },
    { symbol: 'STARDUST', name: 'Stardust Token', icon: '⭐' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tokens.map(token => (
        <button
          key={token.symbol}
          className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
            value === token.symbol
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange(token.symbol)}
        >
          <span className="text-2xl">{token.icon}</span>
          <div className="text-left">
            <div className="font-semibold">{token.symbol}</div>
            <div className="text-xs opacity-75">{token.name}</div>
          </div>
          {value === token.symbol && (
            <div className="ml-auto">
              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default TokenSelector; 