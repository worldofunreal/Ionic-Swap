import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ConnectWallet = ({ onLoginSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginWithMetaMask, loginWithInternetIdentity } = useAuth();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMetaMaskLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await loginWithMetaMask();
      console.log('MetaMask login successful');
      setIsOpen(false);
      onLoginSuccess?.();
    } catch (error) {
      console.error('MetaMask login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInternetIdentityLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await loginWithInternetIdentity();
      console.log('Internet Identity login successful');
      setIsOpen(false);
      onLoginSuccess?.();
    } catch (error) {
      console.error('Internet Identity login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Connect Wallet Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-200"
      >
        <svg
          className="w-4 h-4 text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-sm font-medium text-neutral-300">Connect Wallet</span>
        <svg
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Login Form Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-neutral-700/50 py-4 z-50">
          <div className="px-4 pb-3 border-b border-neutral-700/50">
            <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-sm text-neutral-400 mt-1">Choose your preferred connection method</p>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* MetaMask Button */}
            <button
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30 hover:bg-neutral-800/50 hover:border-neutral-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleMetaMaskLogin}
              disabled={loading}
            >
              <img 
                src="/metamask.svg" 
                alt="MetaMask" 
                className="w-6 h-6"
              />
              <div className="text-left flex-1">
                <div className="font-semibold text-white">MetaMask</div>
              </div>
              {loading && (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-900 text-neutral-500">or</span>
              </div>
            </div>

            {/* Internet Identity Button */}
            <button
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30 hover:bg-neutral-800/50 hover:border-neutral-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleInternetIdentityLogin}
              disabled={loading}
            >
              <img 
                src="/icp.svg" 
                alt="Internet Computer" 
                className="w-6 h-6"
              />
              <div className="text-left flex-1">
                <div className="font-semibold text-white">Internet Identity</div>
              </div>
              {loading && (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300 text-sm font-medium mb-2">
                <strong>Dual Identity:</strong> Both methods give you access to EVM and ICP networks.
              </p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• MetaMask users get an ICP principal derived from their signature</li>
                <li>• Internet Identity users get an EVM address derived from their principal</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet; 