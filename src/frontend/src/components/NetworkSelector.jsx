import React from 'react';

const NetworkSelector = ({ 
  isCorrectNetwork, 
  error, 
  onConnectWallet, 
  onSwitchNetwork 
}) => {
  if (!isCorrectNetwork) {
    return (
      <div className="network-warning">
        <p>⚠️ Please switch to Sepolia network in MetaMask</p>
        <button onClick={onSwitchNetwork} className="switch-network-btn">
          Switch to Sepolia
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return null;
};

export default NetworkSelector; 