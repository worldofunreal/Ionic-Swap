import React from 'react';
import './HistoryPage.css';

const HistoryPage = ({ actor, userAddress }) => {
  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <h2>Transaction History</h2>
          <p>View your completed cross-chain swaps</p>
        </div>
        
        <div className="history-content">
          <div className="history-placeholder">
            <div className="placeholder-icon">📜</div>
            <h3>History Coming Soon</h3>
            <p>This page will display your transaction history, including completed swaps, fees paid, and timestamps.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage; 