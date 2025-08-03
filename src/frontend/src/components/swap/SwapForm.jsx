import React from 'react';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import './SwapForm.css';

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
  userAddress
}) => {
  const handleDirectionToggle = () => {
    const newDirection = direction === 'evm-to-icp' ? 'icp-to-evm' : 'evm-to-icp';
    onDirectionChange(newDirection);
  };

  const getDirectionLabel = () => {
    return direction === 'evm-to-icp' ? 'EVM → ICP' : 'ICP → EVM';
  };

  const getDestinationPlaceholder = () => {
    return direction === 'evm-to-icp' 
      ? 'Enter ICP Principal ID' 
      : 'Enter EVM Address (0x...)';
  };

  return (
    <div className="swap-form">
      {/* Direction Toggle */}
      <div className="direction-toggle">
        <button
          className={`direction-btn ${direction === 'evm-to-icp' ? 'active' : ''}`}
          onClick={() => onDirectionChange('evm-to-icp')}
        >
          <span className="direction-icon">🔗</span>
          EVM → ICP
        </button>
        <button
          className={`direction-btn ${direction === 'icp-to-evm' ? 'active' : ''}`}
          onClick={() => onDirectionChange('icp-to-evm')}
        >
          <span className="direction-icon">🔗</span>
          ICP → EVM
        </button>
      </div>

      {/* Source Token Selection */}
      <div className="form-section">
        <label className="form-label">Source Token</label>
        <TokenSelector
          value={sourceToken}
          onChange={onSourceTokenChange}
          direction={direction}
          isSource={true}
        />
      </div>

      {/* Amount Input */}
      <div className="form-section">
        <label className="form-label">Amount</label>
        <AmountInput
          value={amount}
          onChange={onAmountChange}
          token={sourceToken}
          userAddress={userAddress}
        />
      </div>

      {/* Destination Token Selection */}
      <div className="form-section">
        <label className="form-label">Destination Token</label>
        <TokenSelector
          value={destinationToken}
          onChange={onDestinationTokenChange}
          direction={direction}
          isSource={false}
        />
      </div>

      {/* Destination Address */}
      <div className="form-section">
        <label className="form-label">Destination Address</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={(e) => onDestinationAddressChange(e.target.value)}
          placeholder={getDestinationPlaceholder()}
          className="destination-input"
        />
        <div className="input-help">
          {direction === 'evm-to-icp' 
            ? 'Enter the ICP Principal ID where you want to receive tokens'
            : 'Enter the EVM address where you want to receive tokens'
          }
        </div>
      </div>

      {/* Network Info */}
      <div className="network-info">
        <div className="network-item">
          <span className="network-label">From:</span>
          <span className="network-value">
            {direction === 'evm-to-icp' ? 'Sepolia Testnet' : 'Internet Computer'}
          </span>
        </div>
        <div className="network-item">
          <span className="network-label">To:</span>
          <span className="network-value">
            {direction === 'evm-to-icp' ? 'Internet Computer' : 'Sepolia Testnet'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwapForm; 