import React from 'react';

const GaslessApprovalButton = ({ 
  amount, 
  isCorrectNetwork, 
  approvalStatus, 
  onApprove 
}) => {
  if (approvalStatus === 'idle' && isCorrectNetwork) {
    return (
      <button onClick={onApprove} disabled={!amount}>
        TRUE Gasless Approve (ICP Handles Permit)
      </button>
    );
  }

  if (approvalStatus === 'approved') {
    return (
      <div className="success-message">
        <p>✅ Tokens approved successfully!</p>
        <p>ICP canister will handle permit execution.</p>
      </div>
    );
  }

  return null;
};

export default GaslessApprovalButton; 