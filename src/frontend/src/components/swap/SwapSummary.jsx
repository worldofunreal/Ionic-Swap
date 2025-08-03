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

  // Don't render anything if there's no valid data
  if (!details) {
    return null;
  }

  return (
    <div className="bg-neutral-800/10 rounded-lg border border-neutral-700 p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-400">You Send:</span>
          <span className="text-sm font-mono text-white">{details.source}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-400">You Receive:</span>
          <span className="text-sm font-mono text-white">{details.destination}</span>
        </div>

        <div className="bg-neutral-700/10 border border-neutral-600 rounded-lg p-3 mt-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-400 text-sm">⚠️</div>
            <p className="text-xs text-neutral-300">
              This is an atomic and gasless swap. Funds will be locked until the swap is completed or refunded after the timelock expires.
            </p>
          </div>
        </div>

        <button
          onClick={onSwap}
          disabled={!isValid || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isValid && !isLoading
              ? 'bg-neutral-600 hover:bg-neutral-500 text-white'
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
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
    </div>
  );
};

export default SwapSummary; 