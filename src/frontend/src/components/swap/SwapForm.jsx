import React from 'react';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';

const SwapForm = ({
  direction,
  onDirectionChange,
  sourceToken,
  destinationToken,
  onSourceTokenChange,
  onDestinationTokenChange,
  amount,
  onAmountChange,
  destinationAddress,
  onDestinationAddressChange,
  user
}) => {
  const getDirectionLabel = () => {
    return direction === 'evm-to-icp' ? 'EVM → ICP' : 'ICP → EVM';
  };

  const getDestinationPlaceholder = () => {
    return direction === 'evm-to-icp'
      ? 'Enter ICP Principal ID'
      : 'Enter EVM Address (0x...)';
  };

  return (
    <div className="space-y-6">
      {/* Direction Toggle */}
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            direction === 'evm-to-icp'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onDirectionChange('evm-to-icp')}
        >
          <span className="text-lg">🔗</span>
          <span>EVM → ICP</span>
        </button>
        <button
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            direction === 'icp-to-evm'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onDirectionChange('icp-to-evm')}
        >
          <span className="text-lg">🔗</span>
          <span>ICP → EVM</span>
        </button>
      </div>

      {/* Source Token Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Source Token</label>
        <TokenSelector
          value={sourceToken}
          onChange={onSourceTokenChange}
          direction={direction}
          isSource={true}
        />
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <AmountInput
          value={amount}
          onChange={onAmountChange}
          token={sourceToken}
          user={user}
        />
      </div>

      {/* Destination Token Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Destination Token</label>
        <TokenSelector
          value={destinationToken}
          onChange={onDestinationTokenChange}
          direction={direction}
          isSource={false}
        />
      </div>

      {/* Destination Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Destination Address</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={(e) => onDestinationAddressChange(e.target.value)}
          placeholder={getDestinationPlaceholder()}
          className="input-field"
        />
        <div className="text-xs text-gray-500">
          {direction === 'evm-to-icp'
            ? 'Enter the ICP Principal ID where you want to receive tokens'
            : 'Enter the EVM address where you want to receive tokens'
          }
        </div>
      </div>

      {/* Network Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">From:</span>
          <span className="text-sm text-gray-600">
            {direction === 'evm-to-icp' ? 'Sepolia Testnet' : 'Internet Computer'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">To:</span>
          <span className="text-sm text-gray-600">
            {direction === 'evm-to-icp' ? 'Internet Computer' : 'Sepolia Testnet'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwapForm; 