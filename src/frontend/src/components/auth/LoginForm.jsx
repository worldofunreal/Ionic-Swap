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
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            onClick={handleMetaMaskLogin}
            disabled={loading}
          >
            <img 
              src="/metamask.svg" 
              alt="MetaMask" 
              className="w-6 h-6"
            />
            <div className="text-left">
              <h3 className="font-semibold">MetaMask</h3>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            onClick={handleInternetIdentityLogin}
            disabled={loading}
          >
            <img 
              src="/icp.svg" 
              alt="Internet Computer" 
              className="w-6 h-6"
            />
            <div className="text-left">
              <h3 className="font-semibold">Internet Identity</h3>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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