import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginWithMetaMask, loginWithInternetIdentity } = useAuth();

  const handleMetaMaskLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await loginWithMetaMask();
      console.log('MetaMask login successful');
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
      onLoginSuccess?.();
    } catch (error) {
      console.error('Internet Identity login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-from to-gradient-to flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Ionic Swap</h2>
          <p className="text-gray-600">Connect your wallet to start swapping between EVM and ICP</p>
        </div>

        <div className="space-y-4">
          <button
            className="w-full flex items-center justify-center space-x-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleMetaMaskLogin}
            disabled={loading}
          >
            <div className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.49 4L13.5 12.99L21.49 20.98L19.5 22.98L9.5 12.99L19.5 2.98L21.49 4Z"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold">MetaMask</h3>
              <p className="text-sm opacity-90">Connect with your Ethereum wallet</p>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleInternetIdentityLogin}
            disabled={loading}
          >
            <div className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Internet Identity</h3>
              <p className="text-sm opacity-90">Connect with your ICP identity</p>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm font-medium mb-2">
            <strong>Dual Identity:</strong> Both methods will give you access to both EVM and ICP networks.
          </p>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• MetaMask users get an ICP principal derived from their signature</li>
            <li>• Internet Identity users get an EVM address derived from their principal</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 