import React from 'react';

const SwapSummary = ({
  direction,
  sourceToken,
  destinationToken,
  sourceAmount,
  destinationAmount,
  destinationAddress,
  onSwap,
  isLoading
}) => {
  const isValid = sourceAmount && parseFloat(sourceAmount) > 0;

  const getSwapDetails = () => {
    if (!isValid) return null;

    const sourceNetwork = direction === 'evm-to-icp' ? 'Sepolia' : 'ICP';
    const destinationNetwork = direction === 'evm-to-icp' ? 'ICP' : 'Sepolia';

    return {
      source: `${sourceAmount} ${sourceToken} on ${sourceNetwork}`,
      destination: `${destinationAmount} ${destinationToken} on ${destinationNetwork}`
    };
  };

  const details = getSwapDetails();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {details ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">You Send:</span>
            <span className="text-sm font-mono text-gray-900">{details.source}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">You Receive:</span>
            <span className="text-sm font-mono text-gray-900">{details.destination}</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 text-sm">⚠️</div>
              <p className="text-xs text-yellow-800">
                This is an atomic and gasless swap. Funds will be locked until the swap is completed or refunded after the timelock expires.
              </p>
            </div>
          </div>

          <button
            onClick={onSwap}
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isValid && !isLoading
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Swap Order...</span>
              </div>
            ) : (
              'Create Swap Order'
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm text-gray-600">Fill in the swap details to see the summary</p>
        </div>
      )}
    </div>
  );
};

export default SwapSummary; 