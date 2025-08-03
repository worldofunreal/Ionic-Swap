import React, { useState } from 'react';
import SwapForm from '../components/swap/SwapForm';
import SwapSummary from '../components/swap/SwapSummary';

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
    <div className="min-h-screen bg-gradient-to-br from-gradient-from to-gradient-to py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Cross-Chain Swap</h2>
            <p className="text-gray-600">Swap tokens between EVM and ICP networks</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
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

            <div className="space-y-6">
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
    </div>
  );
};

export default SwapPage; 