import React from 'react';

const SwapIntentForm = ({ 
  approvalStatus, 
  intentStatus, 
  onSubmitIntent 
}) => {
  if (intentStatus === 'intent-submitted') {
    return (
      <div className="success-message">
        <p>✅ Swap intent submitted successfully!</p>
        <p>Your swap will be processed gaslessly.</p>
      </div>
    );
  }

  return (
    <button onClick={onSubmitIntent}>
      Submit Gasless Swap Intent
    </button>
  );
};

export default SwapIntentForm; 