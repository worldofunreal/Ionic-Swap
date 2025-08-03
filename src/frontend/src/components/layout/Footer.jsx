import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Ionic Swap</h4>
          <p>Cross-chain atomic swaps between EVM and ICP</p>
        </div>
        
        <div className="footer-section">
          <h4>Links</h4>
          <ul>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Support</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Networks</h4>
          <ul>
            <li>Sepolia Testnet</li>
            <li>Internet Computer</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Version</h4>
          <p>v1.0.0-beta</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Ionic Swap. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 