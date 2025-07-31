"use client";
import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import toast, { Toaster } from 'react-hot-toast';
import { ethers } from 'ethers';
import MetaTransactionService, { HTLCData } from './services/metaTransactionService';
import { relayMetaTransaction } from './services/relayerService';
import ICPService, { ICPHTLCData } from './services/icpService';

// Type definitions
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Token {
  address: string | Principal;
  symbol: string;
  decimals: number;
  logo: string;
  name: string;
  chain: string;
}

// Contract addresses
const HTLC_CONTRACT_ADDRESS = '0xBe953413e9FAB2642625D4043e4dcc0D16d14e77';
const TEST_TOKEN_ADDRESS = '0xb3684bC4c3AcEDf35bC83E02A954B546103313e1';

// Token configuration
const ETHEREUM_TOKENS: Token[] = [
  { 
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
    symbol: 'ETH', 
    decimals: 18,
    logo: '🔵',
    name: 'Ethereum',
    chain: 'Ethereum'
  },
  { 
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
    symbol: 'DAI', 
    decimals: 18,
    logo: '🟡',
    name: 'Dai Stablecoin',
    chain: 'Ethereum'
  },
  { 
    address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C', 
    symbol: 'USDC', 
    decimals: 6,
    logo: '🔵',
    name: 'USD Coin',
    chain: 'Ethereum'
  }
];

const ICP_TOKENS: Token[] = [
  { 
    address: Principal.anonymous(), 
    symbol: 'ICP', 
    decimals: 8,
    logo: '🟣',
    name: 'Internet Computer',
    chain: 'Solana'
  },
  { 
    address: Principal.anonymous(), 
    symbol: 'XTC', 
    decimals: 12,
    logo: '🟠',
    name: 'Cycles Token',
    chain: 'Solana'
  }
];

export default function SwapInterface() {
  // State management
  const [ethAddress, setEthAddress] = useState<string>('');
  const [icpAddress, setIcpAddress] = useState<string>('');
  const [fromChain, setFromChain] = useState<'ethereum' | 'icp'>('ethereum');
  const [toChain, setToChain] = useState<'ethereum' | 'icp'>('icp');
  const [fromToken, setFromToken] = useState<Token>(ETHEREUM_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(ICP_TOKENS[0]);
  const [amount, setAmount] = useState('1');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isIcpConnected, setIsIcpConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [ethBalance, setEthBalance] = useState('40');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenAllowance, setTokenAllowance] = useState('0');
  const [htlcId, setHtlcId] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [hashlock, setHashlock] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Swap');
  
  // Services
  const { actor } = useActor();
  const [metaTxService, setMetaTxService] = useState<MetaTransactionService | null>(null);
  const [icpService, setIcpService] = useState<ICPService | null>(null);

  // Initialize services when wallet connects
  useEffect(() => {
    if (isEthConnected && ethAddress) {
      try {
        const service = new MetaTransactionService();
        setMetaTxService(service);
        loadBalances();
      } catch (error) {
        console.error('Failed to initialize MetaTransaction service:', error);
      }
    }
  }, [isEthConnected, ethAddress]);

  useEffect(() => {
    if (isIcpConnected && actor) {
      try {
        const service = new ICPService();
        setIcpService(service);
      } catch (error) {
        console.error('Failed to initialize ICP service:', error);
      }
    }
  }, [isIcpConnected, actor]);

  // Load balances and allowances
  const loadBalances = async () => {
    if (!metaTxService || !ethAddress) return;
    
    try {
      const [ethBal, tokenBal, tokenAllow] = await Promise.all([
        metaTxService.getEthBalance(ethAddress),
        metaTxService.getTokenBalance(ethAddress),
        metaTxService.getTokenAllowance(ethAddress)
      ]);
      
      setEthBalance(ethBal);
      setTokenBalance(tokenBal);
      setTokenAllowance(tokenAllow);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  // Connect Ethereum wallet (MetaMask)
  const connectEthWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setEthAddress(accounts[0]);
        setIsEthConnected(true);
        setShowWalletModal(false);
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
          setShowWalletModal(false);
          toast.success('ICP wallet connected!');
        }
      });
    } catch (error) {
      toast.error('Failed to connect ICP wallet');
    }
  };

  // Generate secret and hashlock
  const generateSecretAndHashlock = () => {
    if (!metaTxService) return;
    
    const { secret: newSecret, hashlock: newHashlock } = metaTxService.generateSecretAndHashlock();
    setSecret(newSecret);
    setHashlock(newHashlock);
    toast.success('Secret and hashlock generated!');
  };

  // Approve tokens for HTLC contract
  const approveTokens = async () => {
    if (!metaTxService || !amount) {
      toast.error('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    try {
      const txHash = await metaTxService.approveTokens(amount);
      toast.success(`Tokens approved! TX: ${txHash}`);
      await loadBalances(); // Reload allowances
    } catch (error) {
      console.error('Token approval error:', error);
      toast.error('Failed to approve tokens');
    } finally {
      setLoading(false);
    }
  };

  // Create HTLC on Ethereum (gasless)
  const createHTLCGasless = async () => {
    if (!metaTxService || !ethAddress || !amount || !hashlock) {
      toast.error('Please connect wallet, enter amount, and generate hashlock');
      return;
    }

    setLoading(true);
    try {
      // Generate timelock (1 hour from now)
      const timelock = Math.floor(Date.now() / 1000) + 3600;
      
      const htlcData: HTLCData = {
        recipient: ethAddress, // For demo, recipient is same as sender
        amount: amount,
        hashlock: hashlock,
        timelock: timelock,
        token: '0x0000000000000000000000000000000000000000', // ETH
        sourceChain: 1, // Ethereum
        targetChain: 0, // ICP
        orderHash: ''
      };

      // Sign meta-transaction
      const metaTxData = await metaTxService.signCreateHTLCMetaTransaction(ethAddress, htlcData);
      
      // Send to relayer
      const result = await relayMetaTransaction(HTLC_CONTRACT_ADDRESS, metaTxData);
      
      if (result.success) {
        toast.success(`HTLC created! TX: ${result.transactionHash}`);
        setHtlcId(result.transactionHash || '');
      } else {
        toast.error(`Failed to create HTLC: ${result.error}`);
      }
    } catch (error) {
      console.error('HTLC creation error:', error);
      toast.error('Failed to create HTLC');
    } finally {
      setLoading(false);
    }
  };

  // Create HTLC on ICP
  const createHTLCOnICP = async () => {
    if (!icpService || !icpAddress || !amount || !hashlock) {
      toast.error('Please connect ICP wallet, enter amount, and generate hashlock');
      return;
    }

    setLoading(true);
    try {
      const recipient = Principal.fromText(icpAddress);
      const tokenCanister = Principal.anonymous(); // Use anonymous principal for demo
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
      
      const htlcData: ICPHTLCData = {
        recipient: recipient,
        amount: BigInt(parseFloat(amount) * 1e8), // Convert to ICP units (8 decimals)
        tokenCanister: tokenCanister,
        expirationTime: expirationTime,
        chainType: 'ICP',
        ethereumAddress: ethAddress || undefined
      };

      const htlcId = await icpService.createHTLC(htlcData);
      setHtlcId(htlcId);
      toast.success(`ICP HTLC created! ID: ${htlcId}`);
    } catch (error) {
      console.error('ICP HTLC creation error:', error);
      toast.error('Failed to create ICP HTLC');
    } finally {
      setLoading(false);
    }
  };

  // Claim HTLC on Ethereum (gasless)
  const claimHTLCGasless = async () => {
    if (!metaTxService || !ethAddress || !htlcId || !secret) {
      toast.error('Please connect wallet, enter HTLC ID, and secret');
      return;
    }

    setLoading(true);
    try {
      // Sign meta-transaction
      const metaTxData = await metaTxService.signClaimHTLCMetaTransaction(ethAddress, htlcId, secret);
      
      // Send to relayer
      const result = await relayMetaTransaction(HTLC_CONTRACT_ADDRESS, metaTxData);
      
      if (result.success) {
        toast.success(`HTLC claimed! TX: ${result.transactionHash}`);
      } else {
        toast.error(`Failed to claim HTLC: ${result.error}`);
      }
    } catch (error) {
      console.error('HTLC claim error:', error);
      toast.error('Failed to claim HTLC');
    } finally {
      setLoading(false);
    }
  };

  // Claim HTLC on ICP
  const claimHTLCOnICP = async () => {
    if (!icpService || !htlcId || !secret) {
      toast.error('Please connect ICP wallet, enter HTLC ID, and secret');
      return;
    }

    setLoading(true);
    try {
      await icpService.claimHTLC(htlcId, secret);
      toast.success('ICP HTLC claimed successfully!');
    } catch (error) {
      console.error('ICP HTLC claim error:', error);
      toast.error('Failed to claim ICP HTLC');
    } finally {
      setLoading(false);
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
      // Here you would implement the actual swap logic
      // For now, we'll simulate it
      toast.success('Swap executed successfully!');
    } catch (error) {
      console.error("Swap error:", error);
      toast.error('Swap failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-100">
    {/* <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white"> */}
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
                </svg>
              </div>
              <div className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">IONIC</span>
                <span className="text-gray-300"> SWAP</span>
              </div>
            </div>

            {/* Navigation */}
            {/* <nav className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-2 cursor-pointer">
                <span className="text-gray-300">Trade</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer">
                <span className="text-gray-300">Pool</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </nav> */}
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors">
                <span>Trade</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors">
                <span>Pool</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Connect Wallet
              </button>
              <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6 pt-12">
        {/* Swap Widget */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('Swap')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'Swap' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Swap
              </button>
              <button 
                onClick={() => setActiveTab('Limit')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'Limit' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Limit
              </button>
            </div>
            <div className="flex space-x-2">
              <button className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* You Send Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">You Send</label>
              <span className="text-sm text-gray-400">Balance: {ethBalance} ETH</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Ξ</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">ETH</div>
                    <div className="text-xs text-gray-400">on Ethereum</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-right text-gray-800">
                  <div className="text-xl font-bold">{amount}</div>
                  <div className="text-sm">~$3,944.12</div>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center mb-6">
            <button 
              onClick={switchChains}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
                </svg>
              </div>
            </button>
          </div>

          {/* You Get Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">You Get</label>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">$</span>
                  </div>
                  <div>
                    <div className="font-medium">USDC</div>
                    <div className="text-xs text-gray-400">on Solana</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-600">3,932.54</div>
                  <div className="text-sm text-gray-800">~$3,938.21 (-0.39%)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Powered By */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
            Powered by: 
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <span className="font-medium text-gray-700">1inch</span>
            </div>
          </div>

          {/* HTLC Management Section */}
          {isEthConnected && (
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4">HTLC Management</h3>
              
              {/* Generate Secret & Hashlock */}
              <div className="mb-4">
                <button
                  onClick={generateSecretAndHashlock}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Generate Secret & Hashlock
                </button>
              </div>

              {/* Secret and Hashlock Display */}
              {secret && hashlock && (
                <div className="mb-4 space-y-2">
                  <div>
                    <label className="text-sm text-gray-300">Secret:</label>
                    <div className="text-xs bg-gray-800 p-2 rounded break-all">{secret}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Hashlock:</label>
                    <div className="text-xs bg-gray-800 p-2 rounded break-all">{hashlock}</div>
                  </div>
                </div>
              )}

              {/* Token Approval */}
              <div className="mb-4">
                <button
                  onClick={approveTokens}
                  disabled={loading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  {loading ? 'Approving...' : 'Approve Tokens'}
                </button>
                <div className="text-xs text-gray-400 mt-1">
                  Allowance: {tokenAllowance} | Balance: {tokenBalance}
                </div>
              </div>

              {/* Create HTLC */}
              <div className="mb-4 space-y-2">
                <button
                  onClick={createHTLCGasless}
                  disabled={loading || !hashlock}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  {loading ? 'Creating...' : 'Create HTLC (Gasless)'}
                </button>
                
                {isIcpConnected && (
                  <button
                    onClick={createHTLCOnICP}
                    disabled={loading || !hashlock}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    {loading ? 'Creating...' : 'Create HTLC on ICP'}
                  </button>
                )}
              </div>

              {/* HTLC ID Input */}
              <div className="mb-4">
                <label className="text-sm text-gray-300">HTLC ID:</label>
                <input
                  type="text"
                  value={htlcId}
                  onChange={(e) => setHtlcId(e.target.value)}
                  placeholder="Enter HTLC ID to claim/refund"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                />
              </div>

              {/* Secret Input */}
              <div className="mb-4">
                <label className="text-sm text-gray-300">Secret:</label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret to claim HTLC"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                />
              </div>

              {/* Claim HTLC */}
              <div className="mb-4 space-y-2">
                <button
                  onClick={claimHTLCGasless}
                  disabled={loading || !htlcId || !secret}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  {loading ? 'Claiming...' : 'Claim HTLC (Gasless)'}
                </button>
                
                {isIcpConnected && (
                  <button
                    onClick={claimHTLCOnICP}
                    disabled={loading || !htlcId || !secret}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    {loading ? 'Claiming...' : 'Claim HTLC on ICP'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Connect Wallet Button */}
          {!isEthConnected && (
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl font-medium text-lg transition-all duration-200"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Connect wallet</h2>
              <button 
                onClick={() => setShowWalletModal(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-400 mb-6">Connect wallet to make transactions on the dApp.</p>
            
            <div className="space-y-3">
              {/* 1inch Wallet */}
              <button className="w-full flex items-center justify-between p-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">1inch Wallet</div>
                    <div className="text-sm text-blue-200">Scan QR code to connect</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* MetaMask */}
              <button 
                onClick={connectEthWallet}
                className="w-full flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">MetaMask</div>
                    <div className="text-sm text-gray-400">Detected</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Phantom */}
              <button className="w-full flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Phantom</div>
                    <div className="text-sm text-gray-400">Detected</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* WalletConnect */}
              <button className="w-full flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">WalletConnect</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Internet Identity */}
              <button 
                onClick={connectICWallet}
                className="w-full flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Internet Identity</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Browser Wallet */}
              <button className="w-full flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Browser Wallet</div>
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                More wallets
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-400 text-center">
              By connecting your wallet, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Use</a>
              {' '}and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
              <br />
              Last update of Terms of Use: 15/05/2025
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 