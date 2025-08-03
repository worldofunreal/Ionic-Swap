import React from 'react';

const Footer = () => {
  return (
    <>
      {/* Powered By 1inch Section */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <a 
              href="https://1inch.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-neutral-400 hover:text-white transition-colors"
            >
              <span className="text-xs font-medium">Powered By:</span>
              <img 
                src="/1inch.svg" 
                alt="1inch" 
                className="h-12 w-auto"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="border-t border-neutral-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-4">
            <h4 className="text-lg font-semibold text-white">Ionic Swap</h4>
            <p className="text-xs font-light text-neutral-500">United DeFi - Gasless, Cross-chain atomic swaps</p>
          </div>

          {/* Center - World of Unreal */}
          <a 
            href="https://worldofunreal.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-neutral-600 hover:text-white transition-colors"
          >
            &copy; 2025 World of Unreal.
          </a>

          {/* Right side - Networks, GitHub, and version */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <a 
                href="https://sepolia.etherscan.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Sepolia</span>
              </a>
              <a 
                href="https://dashboard.internetcomputer.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">ICP</span>
              </a>
            </div>
            <a 
              href="https://github.com/worldofunreal/Ionic-Swap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <span className="text-sm text-neutral-400">v0.0.1-alpha</span>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer; 