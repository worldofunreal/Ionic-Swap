import React, { useState } from 'react';
import SwapForm from '../components/swap/SwapForm';
import SwapSummary from '../components/swap/SwapSummary';
import './SwapPage.css';

const SwapPage = ({ actor, userAddress }) => {
  const [swapDirection, setSwapDirection] = useState('evm-to-icp');
  const [sourceToken, setSourceToken] = useState('SPIRAL');
  const [destinationToken, setDestinationToken] = useState('SPIRAL');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDirectionChange = (direction) => {
    setSwapDirection(direction);
    // Reset form when direction changes
    setAmount('');
    setDestinationAddress('');
  };

  const handleSwap = async () => {
    if (!amount || !destinationAddress) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual swap logic
      console.log('Swap initiated:', {
        direction: swapDirection,
        sourceToken,
        destinationToken,
        amount,
        destinationAddress
      });
      
      // Simulate swap process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Swap order created successfully!');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="swap-page">
      <div className="swap-container">
        <div className="swap-header">
          <h2>Cross-Chain Swap</h2>
          <p>Swap tokens between EVM and ICP networks</p>
        </div>

        <div className="swap-content">
          <div className="swap-form-section">
            <SwapForm
              direction={swapDirection}
              onDirectionChange={handleDirectionChange}
              sourceToken={sourceToken}
              destinationToken={destinationToken}
              onSourceTokenChange={setSourceToken}
              onDestinationTokenChange={setDestinationToken}
              amount={amount}
              onAmountChange={setAmount}
              destinationAddress={destinationAddress}
              onDestinationAddressChange={setDestinationAddress}
              userAddress={userAddress}
            />
          </div>

          <div className="swap-summary-section">
            <SwapSummary
              direction={swapDirection}
              sourceToken={sourceToken}
              destinationToken={destinationToken}
              amount={amount}
              destinationAddress={destinationAddress}
              onSwap={handleSwap}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage; 