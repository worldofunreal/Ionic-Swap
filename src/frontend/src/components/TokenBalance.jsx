import React from 'react';

const TokenBalance = ({ 
  tokenName, 
  tokenBalance, 
  amount, 
  onAmountChange, 
  isDisabled 
}) => {
  const setPercentage = (percentage) => {
    const newAmount = (parseFloat(tokenBalance) * percentage).toFixed(2);
    onAmountChange(newAmount);
  };

  return (
    <div className="input-group">
      <label>Amount ({tokenName}):</label>
      <div className="balance-info">
        <span>Balance: {tokenBalance} {tokenName}</span>
        <div className="balance-buttons">
          <button 
            type="button" 
            onClick={() => setPercentage(0.25)}
            disabled={isDisabled}
          >
            25%
          </button>
          <button 
            type="button" 
            onClick={() => setPercentage(0.5)}
            disabled={isDisabled}
          >
            50%
          </button>
          <button 
            type="button" 
            onClick={() => setPercentage(0.75)}
            disabled={isDisabled}
          >
            75%
          </button>
          <button 
            type="button" 
            onClick={() => onAmountChange(tokenBalance)}
            disabled={isDisabled}
          >
            Max
          </button>
        </div>
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="Enter amount"
        disabled={isDisabled}
        max={tokenBalance}
        min="0"
      />
    </div>
  );
};

export default TokenBalance; 