import React from 'react';
import './TokenSelector.css';

const TokenSelector = ({ value, onChange, direction, isSource }) => {
  const tokens = [
    { symbol: 'SPIRAL', name: 'Spiral Token', icon: '🌀' },
    { symbol: 'STARDUST', name: 'Stardust Token', icon: '⭐' }
  ];

  return (
    <div className="token-selector">
      {tokens.map(token => (
        <button
          key={token.symbol}
          className={`token-option ${value === token.symbol ? 'selected' : ''}`}
          onClick={() => onChange(token.symbol)}
        >
          <span className="token-icon">{token.icon}</span>
          <div className="token-info">
            <span className="token-symbol">{token.symbol}</span>
            <span className="token-name">{token.name}</span>
          </div>
          {value === token.symbol && (
            <span className="selected-indicator">✓</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TokenSelector; 