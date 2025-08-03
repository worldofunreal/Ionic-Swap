import React from 'react';
import './OrdersPage.css';

const OrdersPage = ({ actor, userAddress }) => {
  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h2>Order Book</h2>
          <p>View and manage your cross-chain swap orders</p>
        </div>
        
        <div className="orders-content">
          <div className="orders-placeholder">
            <div className="placeholder-icon">📊</div>
            <h3>Order Management Coming Soon</h3>
            <p>This page will display all your swap orders, their status, and allow you to complete or cancel them.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage; 