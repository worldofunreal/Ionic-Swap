"use client";
import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { SDK, NetworkEnum } from "@1inch/cross-chain-sdk";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import toast, { Toaster } from 'react-hot-toast';

// Token configuration
const ETHEREUM_TOKENS = [
  { 
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
    symbol: 'ETH', 
    decimals: 18,
    logo: '🔵',
    name: 'Ethereum'
  },
  { 
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
    symbol: 'DAI', 
    decimals: 18,
    logo: '🟡',
    name: 'Dai Stablecoin'
  },
  { 
    address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C', 
    symbol: 'USDC', 
    decimals: 6,
    logo: '🔵',
    name: 'USD Coin'
  }
];

const ICP_TOKENS = [
  { 
    address: Principal.anonymous(), 
    symbol: 'ICP', 
    decimals: 8,
    logo: '🟣',
    name: 'Internet Computer'
  },
  { 
    address: Principal.anonymous(), 
    symbol: 'XTC', 
    decimals: 12,
    logo: '🟠',
    name: 'Cycles Token'
  }
];

interface SwapOrder {
  orderHash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  timestamp: number;
}

export default function SwapInterface() {
  // State management
  const [ethAddress, setEthAddress] = useState<string>('');
  const [icpAddress, setIcpAddress] = useState<string>('');
  const [fromChain, setFromChain] = useState<'ethereum' | 'icp'>('ethereum');
  const [toChain, setToChain] = useState<'ethereum' | 'icp'>('icp');
  const [fromToken, setFromToken] = useState(ETHEREUM_TOKENS[0]);
  const [toToken, setToToken] = useState(ICP_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapOrders, setSwapOrders] = useState<SwapOrder[]>([]);
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isIcpConnected, setIsIcpConnected] = useState(false);
  
  // ICP actor
  const { actor } = useActor();

  // Connect Ethereum wallet (MetaMask)
  const connectEthWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setEthAddress(accounts[0]);
        setIsEthConnected(true);
        toast.success('Ethereum wallet connected!');
      } catch (error) {
        toast.error('Failed to connect Ethereum wallet');
      }
    } else {
      toast.error('MetaMask not found. Please install MetaMask.');
    }
  };

  // Connect ICP wallet (Internet Identity)
  const connectICWallet = async () => {
    try {
      const authClient = await AuthClient.create();
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === "ic" 
          ? "https://identity.ic0.app" 
          : `http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal().toString();
          setIcpAddress(principal);
          setIsIcpConnected(true);
          toast.success('ICP wallet connected!');
        }
      });
    } catch (error) {
      toast.error('Failed to connect ICP wallet');
    }
  };

  // Switch chains and tokens
  const switchChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
  };

  // Get swap quote from 1inch API
  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, we'll simulate a quote
      // In production, you'd use the actual 1inch API
      const mockQuote = {
        srcAmount: amount,
        dstAmount: (parseFloat(amount) * 0.95).toFixed(6), // 5% fee simulation
        fee: (parseFloat(amount) * 0.05).toFixed(6),
        estimatedTime: '2-5 minutes',
        rate: '0.95'
      };
      
      setQuote(mockQuote);
      toast.success('Quote received!');
    } catch (error) {
      console.error("Quote error:", error);
      toast.error('Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!quote) {
      toast.error('Please get a quote first');
      return;
    }

    setLoading(true);
    
    try {
      // Create a new swap order
      const newOrder: SwapOrder = {
        orderHash: `0x${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        fromChain,
        toChain,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount,
        timestamp: Date.now()
      };

      setSwapOrders(prev => [newOrder, ...prev]);
      toast.success('Swap order created!');

      // Simulate order processing
      setTimeout(() => {
        setSwapOrders(prev => 
          prev.map(order => 
            order.orderHash === newOrder.orderHash 
              ? { ...order, status: 'processing' }
              : order
          )
        );
        toast.success('Order is being processed...');
      }, 2000);

      // Simulate completion
      setTimeout(() => {
        setSwapOrders(prev => 
          prev.map(order => 
            order.orderHash === newOrder.orderHash 
              ? { ...order, status: 'completed' }
              : order
          )
        );
        toast.success('Swap completed successfully!');
      }, 8000);

    } catch (error) {
      console.error("Swap error:", error);
      toast.error('Swap failed');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Cross-Chain Swap
          </h1>
          <p className="text-xl text-gray-300">
            Swap tokens between Ethereum and Internet Computer using 1inch Fusion+
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold mb-6 text-center">Connect Wallets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🔵</div>
              <h3 className="text-lg font-medium mb-2">Ethereum</h3>
              <button 
                onClick={connectEthWallet}
                className={`w-full py-3 px-6 rounded-xl transition-all duration-200 ${
                  isEthConnected 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {isEthConnected 
                  ? `Connected: ${ethAddress.slice(0,6)}...${ethAddress.slice(-4)}`
                  : "Connect MetaMask"
                }
              </button>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🟣</div>
              <h3 className="text-lg font-medium mb-2">Internet Computer</h3>
              <button 
                onClick={connectICWallet}
                className={`w-full py-3 px-6 rounded-xl transition-all duration-200 ${
                  isIcpConnected 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
                }`}
              >
                {isIcpConnected 
                  ? `Connected: ${icpAddress.slice(0,6)}...${icpAddress.slice(-4)}`
                  : "Connect Internet Identity"
                }
              </button>
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold mb-6 text-center">Swap Tokens</h2>
          
          {/* Chain Switch Button */}
          <div className="flex justify-center mb-8">
            <button 
              onClick={switchChains}
              className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* From Section */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="block text-sm font-medium mb-4 text-gray-300">From</label>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <select 
                    value={fromChain}
                    onChange={(e) => setFromChain(e.target.value as any)}
                    className="bg-white/10 text-white rounded-lg p-3 flex-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ethereum">🔵 Ethereum</option>
                    <option value="icp">🟣 Internet Computer</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <select 
                    value={fromToken.symbol}
                    onChange={(e) => {
                      const tokens = fromChain === 'ethereum' ? ETHEREUM_TOKENS : ICP_TOKENS;
                      const token = tokens.find(t => t.symbol === e.target.value);
                      if (token) setFromToken(token);
                    }}
                    className="bg-white/10 text-white rounded-lg p-3 flex-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(fromChain === 'ethereum' ? ETHEREUM_TOKENS : ICP_TOKENS).map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.logo} {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-white/10 text-white rounded-lg p-3 w-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg"
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">
                    {fromToken.symbol}
                  </div>
                </div>
              </div>
            </div>
            
            {/* To Section */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="block text-sm font-medium mb-4 text-gray-300">To</label>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-white/10 text-white rounded-lg p-3 flex-1 border border-white/20 opacity-50">
                    {toChain === 'ethereum' ? '🔵 Ethereum' : '🟣 Internet Computer'}
                  </div>
                </div>
                <div className="flex gap-3">
                  <select 
                    value={toToken.symbol}
                    onChange={(e) => {
                      const tokens = toChain === 'ethereum' ? ETHEREUM_TOKENS : ICP_TOKENS;
                      const token = tokens.find(t => t.symbol === e.target.value);
                      if (token) setToToken(token);
                    }}
                    className="bg-white/10 text-white rounded-lg p-3 flex-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(toChain === 'ethereum' ? ETHEREUM_TOKENS : ICP_TOKENS).map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.logo} {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <div className="bg-white/10 text-white rounded-lg p-3 w-full border border-white/20 text-right text-lg">
                    {quote ? quote.dstAmount : '0.0'}
                  </div>
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">
                    {toToken.symbol}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Display */}
          {quote && (
            <div className="mt-6 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-medium mb-4">Swap Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Rate</p>
                  <p className="font-medium">1 {fromToken.symbol} = {quote.rate} {toToken.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400">Fee</p>
                  <p className="font-medium">{quote.fee} {fromToken.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400">Est. Time</p>
                  <p className="font-medium">{quote.estimatedTime}</p>
                </div>
                <div>
                  <p className="text-gray-400">You'll Receive</p>
                  <p className="font-medium text-green-400">{quote.dstAmount} {toToken.symbol}</p>
                </div>

              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={fetchQuote}
              disabled={!isEthConnected || !isIcpConnected || !amount || loading}
              className={`py-4 px-8 rounded-xl transition-all duration-200 text-lg font-medium ${
                !isEthConnected || !isIcpConnected || !amount || loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {loading ? '⏳ Getting Quote...' : '📊 Get Quote'}
            </button>
            <button
              onClick={executeSwap}
              disabled={!quote || loading}
              className={`py-4 px-8 rounded-xl transition-all duration-200 text-lg font-medium ${
                !quote || loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105'
              }`}
            >
              {loading ? '⏳ Processing...' : '🚀 Execute Swap'}
            </button>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold mb-6 text-center">Recent Swaps</h2>
          <div className="space-y-4">
            {swapOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <p>No swaps yet. Create your first cross-chain swap above!</p>
              </div>
            ) : (
              swapOrders.map((order) => (
                <div key={order.orderHash} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {order.fromChain === 'ethereum' ? '🔵' : '🟣'} → {order.toChain === 'ethereum' ? '🔵' : '🟣'}
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.amount} {order.fromToken} → {order.toToken}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.orderHash.slice(0, 8)}...{order.orderHash.slice(-6)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}