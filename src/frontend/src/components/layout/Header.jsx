import React from 'react';
import NetworkStatus from '../wallet/NetworkStatus';
import BalanceDisplay from '../wallet/BalanceDisplay';
import UserDropdown from '../user/UserDropdown';

const Header = ({ 
  currentPage, 
  onPageChange, 
  user, 
  onLogout 
}) => {
  const navItems = [
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'orders', label: 'Orders', icon: '📊' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ionic Swap</h1>
                <p className="text-sm text-gray-500">Cross-Chain Atomic Swaps</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === item.id 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => onPageChange(item.id)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {user && (
              <>
                {/* Network Status */}
                <div className="flex items-center">
                  <NetworkStatus />
                </div>

                {/* Balance Display */}
                <div className="hidden xl:block">
                  <BalanceDisplay user={user} />
                </div>

                {/* User Dropdown */}
                <UserDropdown user={user} onLogout={onLogout} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 