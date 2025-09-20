import { Principal } from '@dfinity/principal';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface BotIdentity {
  name: string;
  principal: string;
  seed: string;
  identity: any; // Ed25519KeyIdentity for signed calls
}

export interface TokenBalance {
  symbol: string;
  amount: bigint;
  usdValue: number;
}

export interface Portfolio {
  balances: Record<string, bigint>;
  totalUsdValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface TradingPair {
  base: string;
  quote: string;
  price: number;
  lastUpdated: number;
  sourcesCount: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  botName: string;
  fromToken: string;
  toToken: string;
  fromAmount: bigint;
  toAmount: bigint;
  fromPrice: number;
  toPrice: number;
  profitLoss: number;
  successful: boolean;
  errorMessage?: string;
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export interface TradingStrategy {
  name: string;
  minProfitPercent: number;
  maxTradePercent: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  cooldownSeconds: number;
}

export interface TradeOpportunity {
  fromToken: string;
  toToken: string;
  expectedProfitPercent: number;
  confidence: number;
  maxAmount: bigint;
  reason: string;
}

export interface StrategyDecision {
  shouldTrade: boolean;
  opportunities: TradeOpportunity[];
  reason: string;
}

// ============================================================================
// BOT TYPES
// ============================================================================

export interface Bot {
  identity: BotIdentity;
  strategy: TradingStrategy;
  portfolio: Portfolio;
  trades: Trade[];
  lastTradeTime: number;
  isActive: boolean;
  priceHistory: Record<string, number[]>;
  realizedPnlUsd: number;
  costBasis: Record<string, { avgCostUsd: number; quantity: bigint }>;
}

export interface BotMetrics {
  totalTrades: number;
  successfulTrades: number;
  successRate: number;
  totalProfit: number;
  profitPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemConfig {
  canisterId: string;
  tradingInterval: number;
  maxBotsCount: number;
  emergencyStop: boolean;
}

export interface SystemMetrics {
  totalBots: number;
  activeBots: number;
  totalTrades: number;
  totalProfit: number;
  systemUptime: number;
  lastPriceUpdate: number;
}

export interface MarketData {
  prices: Record<string, TradingPair>;
  lastUpdated: number;
  isStale: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface SwapRequest {
  from_token: string;
  to_token: string;
  amount: bigint;
}

export interface SwapResult {
  from_token: string;
  to_token: string;
  from_amount: bigint;
  to_amount: bigint;
  from_price: number;
  to_price: number;
  timestamp: number;
}

export interface UserBalance {
  symbol: string;
  amount: bigint;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUPPORTED_TOKENS = [
  'BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'DOGE', 'ADA', 'TRX', 'ICP'
] as const;

export const TOKEN_DECIMALS: Record<string, number> = {
  'BTC': 8,
  'ETH': 8,
  'XRP': 6,
  'USDT': 6,
  'BNB': 8,
  'SOL': 9,
  'DOGE': 8,
  'ADA': 6,
  'TRX': 6,
  'ICP': 8
} as const;

export const STARTING_BALANCE_USDT = 2_000_000;

export type SupportedToken = typeof SUPPORTED_TOKENS[number];
