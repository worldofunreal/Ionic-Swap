import React from 'react';
import './SwapSummary.css';

const SwapSummary = ({
  direction,
  sourceToken,
  destinationToken,
  amount,
  destinationAddress,
  onSwap,
  isLoading
}) => {
  const isValid = amount && destinationAddress && parseFloat(amount) > 0;

  const getSwapDetails = () => {
    if (!isValid) return null;

    const sourceNetwork = direction === 'evm-to-icp' ? 'Sepolia' : 'ICP';
    const destinationNetwork = direction === 'evm-to-icp' ? 'ICP' : 'Sepolia';

    return {
      source: `${amount} ${sourceToken} on ${sourceNetwork}`,
      destination: `${amount} ${destinationToken} on ${destinationNetwork}`,
      destinationAddress: destinationAddress,
      estimatedFee: '0.001 ETH', // TODO: Get actual fee from backend
      estimatedTime: '2-5 minutes'
    };
  };

  const details = getSwapDetails();

  return (
    <div className="swap-summary">
      <h3>Swap Summary</h3>
      
      {details ? (
        <>
          <div className="summary-details">
            <div className="summary-item">
              <span className="summary-label">You Pay:</span>
              <span className="summary-value">{details.source}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">You Receive:</span>
              <span className="summary-value">{details.destination}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Destination:</span>
              <span className="summary-value address">
                {details.destinationAddress.slice(0, 10)}...{details.destinationAddress.slice(-8)}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Network Fee:</span>
              <span className="summary-value">{details.estimatedFee}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Estimated Time:</span>
              <span className="summary-value">{details.estimatedTime}</span>
            </div>
          </div>
          
          <div className="swap-warning">
            <p>⚠️ This is an atomic swap. Funds will be locked until the swap is completed or refunded after the timelock expires.</p>
          </div>
          
          <button
            onClick={onSwap}
            disabled={!isValid || isLoading}
            className={`swap-button ${isValid ? 'valid' : 'invalid'}`}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Swap Order...
              </>
            ) : (
              'Create Swap Order'
            )}
          </button>
        </>
      ) : (
        <div className="summary-placeholder">
          <p>Fill in the swap details to see the summary</p>
        </div>
      )}
    </div>
  );
};

export default SwapSummary; 