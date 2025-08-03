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
      {/* Simple User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
      >
        <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user?.evmAddress?.slice(2, 4).toUpperCase() || 'U'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-neutral-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.evmAddress?.slice(2, 4).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {user?.loginMethod === 'metamask' ? 'MetaMask User' : 'Internet Identity User'}
                </div>
                <div className="text-xs text-neutral-400">
                  Connected via {user?.loginMethod === 'metamask' ? 'MetaMask' : 'Internet Identity'}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Address - Clickable */}
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="text-xs font-medium text-neutral-400 mb-2">
              {user?.loginMethod === 'metamask' ? 'EVM Address' : 'ICP Principal'}
            </div>
            <button
              onClick={() => copyToClipboard(
                addresses.primary.full, 
                user?.loginMethod === 'metamask' ? 'EVM Address' : 'ICP Principal'
              )}
              className="w-full text-left p-3 rounded-lg hover:bg-neutral-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-mono text-white group-hover:text-neutral-300 transition-colors">
                    {addresses.primary.short}
                  </div>
                </div>
                <div className="ml-2 p-2 text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-neutral-400 mt-1 group-hover:text-neutral-300 transition-colors">
                Click to copy
              </div>
            </button>
          </div>

          {/* Secondary Address - Clickable */}
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="text-xs font-medium text-neutral-400 mb-2">
              {user?.loginMethod === 'metamask' ? 'ICP Principal' : 'EVM Address'}
            </div>
            <button
              onClick={() => copyToClipboard(
                addresses.secondary.full, 
                user?.loginMethod === 'metamask' ? 'ICP Principal' : 'EVM Address'
              )}
              className="w-full text-left p-3 rounded-lg hover:bg-neutral-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-mono text-white group-hover:text-neutral-300 transition-colors">
                    {addresses.secondary.short}
                  </div>
                </div>
                <div className="ml-2 p-2 text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-neutral-400 mt-1 group-hover:text-neutral-300 transition-colors">
                Click to copy
              </div>
            </button>
          </div>

          {/* Logout Button */}
          <div className="px-4 py-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-700 rounded-lg transition-colors"
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