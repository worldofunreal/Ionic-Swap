import React from 'react';

const OrdersPage = ({ actor, user }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-from to-gradient-to py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Book</h2>
            <p className="text-gray-600">View and manage your cross-chain swap orders</p>
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Management Coming Soon</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              This page will display all your swap orders, their status, and allow you to complete or cancel them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage; 