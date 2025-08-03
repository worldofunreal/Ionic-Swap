import React from 'react';

const SwapSummary = ({
  direction,
  sourceToken,
  destinationToken,
  sourceAmount,
  destinationAmount,
  destinationAddress,
  onSwap,
  isLoading,
  swapStatus = 'idle'
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

  const getButtonText = () => {
    if (swapStatus === 'success') {
      return 'Swap Completed!';
    } else if (swapStatus === 'error') {
      return 'Retry Swap';
    } else if (isLoading) {
      return 'Creating Swap Order...';
    } else {
      return 'Create Swap Order';
    }
  };

  const getButtonState = () => {
    if (swapStatus === 'success') {
      return 'success';
    } else if (swapStatus === 'error') {
      return 'error';
    } else if (isLoading) {
      return 'loading';
    } else if (isValid) {
      return 'enabled';
    } else {
      return 'disabled';
    }
  };

  const buttonState = getButtonState();

  const getButtonClasses = () => {
    switch (buttonState) {
      case 'success':
        return 'bg-green-600 hover:bg-green-500 text-white cursor-default';
      case 'error':
        return 'bg-red-600 hover:bg-red-500 text-white';
      case 'loading':
        return 'bg-neutral-700 text-neutral-500 cursor-not-allowed';
      case 'enabled':
        return 'bg-neutral-600 hover:bg-neutral-500 text-white';
      case 'disabled':
        return 'bg-neutral-700 text-neutral-500 cursor-not-allowed';
      default:
        return 'bg-neutral-700 text-neutral-500 cursor-not-allowed';
    }
  };

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
          disabled={buttonState === 'loading' || buttonState === 'disabled' || buttonState === 'success'}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${getButtonClasses()}`}
        >
          {buttonState === 'loading' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Swap Order...</span>
            </div>
          ) : buttonState === 'success' ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{getButtonText()}</span>
            </div>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );
};

export default SwapSummary; 