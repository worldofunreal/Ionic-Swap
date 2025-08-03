import React from 'react';

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
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Swap Summary</h3>

      {details ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">You Pay:</span>
              <span className="text-sm font-mono text-gray-900">{details.source}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">You Receive:</span>
              <span className="text-sm font-mono text-gray-900">{details.destination}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Destination:</span>
              <span className="text-sm font-mono text-gray-900">
                {details.destinationAddress.slice(0, 10)}...{details.destinationAddress.slice(-8)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Network Fee:</span>
              <span className="text-sm text-gray-900">{details.estimatedFee}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Estimated Time:</span>
              <span className="text-sm text-gray-900">{details.estimatedTime}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <p className="text-sm text-yellow-800">
                This is an atomic swap. Funds will be locked until the swap is completed or refunded after the timelock expires.
              </p>
            </div>
          </div>

          <button
            onClick={onSwap}
            disabled={!isValid || isLoading}
            className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
              isValid && !isLoading
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Swap Order...</span>
              </div>
            ) : (
              'Create Swap Order'
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-600">Fill in the swap details to see the summary</p>
        </div>
      )}
    </div>
  );
};

export default SwapSummary; 