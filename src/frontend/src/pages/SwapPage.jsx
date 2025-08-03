import React, { useState } from 'react';
import SwapForm from '../components/swap/SwapForm';

const SwapPage = ({ actor, user }) => {
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
    <div className="py-24">
      <div className="max-w-2xl mx-auto">
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
          user={user}
        />
      </div>
    </div>
  );
};

export default SwapPage; 