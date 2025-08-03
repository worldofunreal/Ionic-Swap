import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const UserDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${label} copied to clipboard`, 'success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  const getDisplayAddresses = () => {
    if (!user) return { primary: '', secondary: '' };
    
    if (user.loginMethod === 'metamask') {
      return {
        primary: { short: `${user.evmAddress.slice(0, 6)}...${user.evmAddress.slice(-4)}`, full: user.evmAddress },
        secondary: { short: `${user.icpPrincipal.slice(0, 6)}...${user.icpPrincipal.slice(-4)}`, full: user.icpPrincipal }
      };
    } else {
      return {
        primary: { short: `${user.icpPrincipal.slice(0, 6)}...${user.icpPrincipal.slice(-4)}`, full: user.icpPrincipal },
        secondary: { short: `${user.evmAddress.slice(0, 6)}...${user.evmAddress.slice(-4)}`, full: user.evmAddress }
      };
    }
  };

  const addresses = getDisplayAddresses();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user?.evmAddress?.slice(2, 4).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {addresses.primary.short}
          </div>
          <div className="text-xs text-gray-500">
            {user?.loginMethod === 'metamask' ? 'MetaMask' : 'Internet Identity'}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.evmAddress?.slice(2, 4).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {user?.loginMethod === 'metamask' ? 'MetaMask User' : 'Internet Identity User'}
                </div>
                <div className="text-xs text-gray-500">
                  Connected via {user?.loginMethod === 'metamask' ? 'MetaMask' : 'Internet Identity'}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Address */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">
              {user?.loginMethod === 'metamask' ? 'EVM Address' : 'ICP Principal'}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-mono text-gray-900">
                  {addresses.primary.short}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {addresses.primary.full}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(
                  addresses.primary.full, 
                  user?.loginMethod === 'metamask' ? 'EVM Address' : 'ICP Principal'
                )}
                className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Secondary Address */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">
              {user?.loginMethod === 'metamask' ? 'ICP Principal' : 'EVM Address'}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-mono text-gray-900">
                  {addresses.secondary.short}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {addresses.secondary.full}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(
                  addresses.secondary.full, 
                  user?.loginMethod === 'metamask' ? 'ICP Principal' : 'EVM Address'
                )}
                className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="px-4 py-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown; 