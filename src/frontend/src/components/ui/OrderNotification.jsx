import React, { useEffect } from 'react';

const OrderNotification = ({ 
  orderId, 
  sourceToken, 
  destinationToken, 
  sourceAmount, 
  destinationAmount, 
  direction, 
  status = 'waiting', 
  onClose, 
  duration = null 
}) => {
  useEffect(() => {
    // Only set timer if duration is not null
    if (duration !== null) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStatusInfo = () => {
    switch (status) {
      case 'waiting':
        return {
          icon: (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          ),
          text: 'Waiting for compatible counter-order...',
          style: 'bg-blue-500/20 border-blue-400/30 text-blue-200 backdrop-blur-sm'
        };
      case 'completed':
        return {
          icon: '✓',
          text: 'Swap completed successfully!',
          style: 'bg-green-500/20 border-green-400/30 text-green-200 backdrop-blur-sm'
        };
      case 'error':
        return {
          icon: '✕',
          text: 'Swap failed',
          style: 'bg-red-500/20 border-red-400/30 text-red-200 backdrop-blur-sm'
        };
      default:
        return {
          icon: 'ℹ',
          text: 'Order created',
          style: 'bg-blue-500/20 border-blue-400/30 text-blue-200 backdrop-blur-sm'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const directionText = direction === 'evm-to-icp' ? 'EVM→ICP' : 'ICP→EVM';

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300`}>
      <div className={`flex items-start space-x-3 px-4 py-3 rounded-lg border shadow-lg w-96 ${statusInfo.style}`}>
        <div className="flex-shrink-0 mt-0.5">
          {typeof statusInfo.icon === 'string' ? (
            <span className="text-lg font-semibold">{statusInfo.icon}</span>
          ) : (
            statusInfo.icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-2">{statusInfo.text}</div>
          <div className="text-xs text-neutral-200 flex items-center space-x-4">
            <span className="">{orderId}</span>
            <span>•</span>
            <span>{directionText}</span>
            <span>•</span>
            <span>{sourceAmount} {sourceToken} → {destinationAmount} {destinationToken}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-300 hover:text-white transition-colors mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OrderNotification; 