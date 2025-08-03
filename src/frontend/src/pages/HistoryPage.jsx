import React from 'react';

const HistoryPage = ({ actor, user }) => {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-800 rounded-xl p-8 border border-neutral-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Transaction History</h2>
            <p className="text-neutral-400">View your completed cross-chain swaps</p>
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-6">📜</div>
            <h3 className="text-xl font-semibold text-white mb-2">History Coming Soon</h3>
            <p className="text-neutral-400 max-w-md mx-auto">
              This page will display your transaction history, including completed swaps, fees paid, and timestamps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage; 