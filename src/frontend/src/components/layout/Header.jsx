import React from 'react';
import NetworkStatus from '../wallet/NetworkStatus';
import BalanceDisplay from '../wallet/BalanceDisplay';
import './Header.css';

const Header = ({ 
  currentPage, 
  onPageChange, 
  isConnected, 
  userAddress, 
  onConnectWallet 
}) => {
  const navItems = [
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'orders', label: 'Orders', icon: '📊' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo and Brand */}
        <div className="brand">
          <h1 className="logo">⚡ Ionic Swap</h1>
          <span className="tagline">Cross-Chain Atomic Swaps</span>
        </div>

        {/* Navigation */}
        <nav className="navigation">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Wallet Section */}
        <div className="wallet-section">
          {isConnected ? (
            <>
              <NetworkStatus />
              <BalanceDisplay userAddress={userAddress} />
              <div className="wallet-info">
                <span className="wallet-address">{formatAddress(userAddress)}</span>
                <div className="wallet-status connected">Connected</div>
              </div>
            </>
          ) : (
            <button onClick={onConnectWallet} className="connect-wallet-btn">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 