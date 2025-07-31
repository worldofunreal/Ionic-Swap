import React from 'react';

const StatusDisplay = ({ 
  approvalStatus, 
  intentStatus, 
  isCorrectNetwork, 
  txHash, 
  error 
}) => {
  const getStatusText = () => {
    if (approvalStatus === 'approving') return 'Approving tokens...';
    if (approvalStatus === 'approved') return 'Tokens approved ✅';
    if (intentStatus === 'submitting-intent') return 'Submitting swap intent...';
    if (intentStatus === 'intent-submitted') return 'Swap intent submitted ✅';
    return 'Ready to swap';
  };

  return (
    <div className="status-display">
      <p>Status: {getStatusText()}</p>
      <p>Network: {isCorrectNetwork ? 'Sepolia ✅' : 'Wrong Network ❌'}</p>
      {txHash && (
        <p>
          Transaction: 
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {txHash}
          </a>
        </p>
      )}
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
};

export default StatusDisplay; 