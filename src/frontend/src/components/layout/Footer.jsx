import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white/95 backdrop-blur-lg border-t border-white/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Ionic Swap</h4>
            <p className="text-sm text-gray-600">Cross-chain atomic swaps between EVM and ICP</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">GitHub</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Support</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Networks</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">Sepolia Testnet</li>
              <li className="text-sm text-gray-600">Internet Computer</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Version</h4>
            <p className="text-sm text-gray-600">v1.0.0-beta</p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">&copy; 2024 Ionic Swap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 