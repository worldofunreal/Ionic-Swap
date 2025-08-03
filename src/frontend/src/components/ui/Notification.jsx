import React, { useEffect } from 'react';

const Notification = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    // Only set timer if duration is not null
    if (duration !== null) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-400/30 text-green-200 backdrop-blur-sm';
      case 'error':
        return 'bg-red-500/20 border-red-400/30 text-red-200 backdrop-blur-sm';
      case 'info':
        return 'bg-blue-500/20 border-blue-400/30 text-blue-200 backdrop-blur-sm';
      default:
        return 'bg-green-500/20 border-green-400/30 text-green-200 backdrop-blur-sm';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${getStyles()}`}>
        <div className="flex-shrink-0">
          <span className="text-lg font-semibold">{getIcon()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification; 