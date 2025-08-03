import React from 'react';
import TokenPanel from '../wallet/TokenPanel';
import UserDropdown from '../user/UserDropdown';
import ConnectWallet from '../auth/ConnectWallet';

const Header = ({ 
  currentPage, 
  onPageChange, 
  user, 
  onLogout,
  authenticated 
}) => {
  const navItems = [
    { id: 'swap', label: 'Swap' },
    { id: 'orders', label: 'Orders' },
    { id: 'history', label: 'History' }
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 rounded-xl flex items-center justify-center">
              <img src="/logo-full.svg" alt="Ionic Swap" className="w-full h-full" />
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-1 p-1 rounded-xl">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === item.id 
                      ? 'text-white' 
                      : 'text-neutral-600 hover:text-white'
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {authenticated && user ? (
              <>
                {/* Token Panel */}
                <div className="hidden sm:block">
                  <TokenPanel user={user} />
                </div>

                {/* User Dropdown */}
                <UserDropdown user={user} onLogout={onLogout} />
              </>
            ) : (
              /* Connect Wallet Button */
              <ConnectWallet />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 