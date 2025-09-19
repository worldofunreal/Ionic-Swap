import {
  TradingStrategy,
  TradeOpportunity,
  StrategyDecision,
  Bot,
  MarketData,
  STARTING_BALANCE_USDT
} from '../types';
import { calculateProfitPercent, log } from '../utils';

// ============================================================================
// STRATEGY DEFINITIONS
// ============================================================================

export const STRATEGIES: Record<string, TradingStrategy> = {
  MOMENTUM: {
    name: 'Momentum Trader',
    minProfitPercent: 2.0,
    maxTradePercent: 20,
    riskLevel: 'aggressive',
    cooldownSeconds: 60
  },
  
  CONSERVATIVE: {
    name: 'Conservative Arbitrage',
    minProfitPercent: 1.0,
    maxTradePercent: 10,
    riskLevel: 'conservative',
    cooldownSeconds: 300
  },
  
  BALANCED: {
    name: 'Balanced Trader',
    minProfitPercent: 1.5,
    maxTradePercent: 15,
    riskLevel: 'moderate',
    cooldownSeconds: 120
  },
  
  SCALPER: {
    name: 'Scalper',
    minProfitPercent: 0.5,
    maxTradePercent: 5,
    riskLevel: 'aggressive',
    cooldownSeconds: 30
  }
};

// ============================================================================
// STRATEGY INTERFACE
// ============================================================================

export interface IStrategy {
  name: string;
  analyze(bot: Bot, marketData: MarketData): StrategyDecision;
  calculateTradeAmount(bot: Bot, opportunity: TradeOpportunity): bigint;
  shouldTrade(bot: Bot, opportunity: TradeOpportunity): boolean;
}

// ============================================================================
// BASE STRATEGY CLASS
// ============================================================================

export abstract class BaseStrategy implements IStrategy {
  constructor(public readonly config: TradingStrategy) {}
  
  get name(): string {
    return this.config.name;
  }
  
  abstract analyze(bot: Bot, marketData: MarketData): StrategyDecision;
  
  calculateTradeAmount(bot: Bot, opportunity: TradeOpportunity): bigint {
    const maxTradeValue = bot.portfolio.totalUsdValue * (this.config.maxTradePercent / 100);
    const availableBalance = bot.portfolio.balances[opportunity.fromToken] || 0n;
    
    if (availableBalance === 0n) return 0n;
    
    // For now, return a simple percentage of available balance
    // This will be properly calculated by the trading engine with current prices
    const tradePercent = Math.min(this.config.maxTradePercent / 100, 0.5); // Max 50%
    return BigInt(Math.floor(Number(availableBalance) * tradePercent));
  }
  
  shouldTrade(bot: Bot, opportunity: TradeOpportunity): boolean {
    // Check cooldown
    const timeSinceLastTrade = Date.now() - bot.lastTradeTime;
    if (timeSinceLastTrade < this.config.cooldownSeconds * 1000) {
      return false;
    }
    
    // Check minimum profit
    if (opportunity.expectedProfitPercent < this.config.minProfitPercent) {
      return false;
    }
    
    // Check if we have balance to trade
    const balance = bot.portfolio.balances[opportunity.fromToken] || 0n;
    if (balance === 0n) {
      return false;
    }
    
    return true;
  }
  
  protected getPriceChange(bot: Bot, token: string, currentPrice: number): number {
    const history = bot.priceHistory[token] || [];
    if (history.length === 0) return 0;
    
    const lastPrice = history[history.length - 1]!;
    return ((currentPrice - lastPrice) / lastPrice) * 100;
  }
  
  protected getVolatility(bot: Bot, token: string): number {
    const history = bot.priceHistory[token] || [];
    if (history.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const returnRate = (history[i]! - history[i - 1]!) / history[i - 1]!;
      returns.push(returnRate);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Return as percentage
  }
}

// ============================================================================
// MOMENTUM STRATEGY
// ============================================================================

export class MomentumStrategy extends BaseStrategy {
  analyze(bot: Bot, marketData: MarketData): StrategyDecision {
    const opportunities: TradeOpportunity[] = [];
    
    for (const [token, price] of Object.entries(marketData.prices)) {
      if (token === 'USDT') continue;
      
      const priceChange = this.getPriceChange(bot, token, price.price);
      const volatility = this.getVolatility(bot, token);
      
      // Strong upward momentum - sell
      if (priceChange >= this.config.minProfitPercent && bot.portfolio.balances[token]) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: priceChange,
          confidence: Math.min(priceChange / 5, 1), // Higher confidence with higher price change
          maxAmount: bot.portfolio.balances[token] || 0n,
          reason: `Strong upward momentum: ${priceChange.toFixed(2)}% price increase`
        });
      }
      
      // Strong downward momentum - buy (if we have USDT)
      if (priceChange <= -this.config.minProfitPercent && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(priceChange),
          confidence: Math.min(Math.abs(priceChange) / 5, 1),
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Strong downward momentum: ${priceChange.toFixed(2)}% price decrease, buying opportunity`
        });
      }
    }
    
    // Sort by expected profit
    opportunities.sort((a, b) => b.expectedProfitPercent - a.expectedProfitPercent);
    
    return {
      shouldTrade: opportunities.length > 0,
      opportunities,
      reason: opportunities.length > 0 
        ? `Found ${opportunities.length} momentum opportunities`
        : 'No significant momentum detected'
    };
  }
}

// ============================================================================
// CONSERVATIVE STRATEGY
// ============================================================================

export class ConservativeStrategy extends BaseStrategy {
  analyze(bot: Bot, marketData: MarketData): StrategyDecision {
    const opportunities: TradeOpportunity[] = [];
    
    for (const [token, price] of Object.entries(marketData.prices)) {
      if (token === 'USDT') continue;
      
      const priceChange = this.getPriceChange(bot, token, price.price);
      const volatility = this.getVolatility(bot, token);
      
      // Only trade if volatility is low (less risky)
      if (volatility > 10) continue; // Skip high volatility tokens
      
      // Conservative profit taking - only on significant gains
      if (priceChange >= this.config.minProfitPercent * 2 && bot.portfolio.balances[token]) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: priceChange,
          confidence: 0.8, // Conservative confidence
          maxAmount: bot.portfolio.balances[token] || 0n,
          reason: `Conservative profit taking: ${priceChange.toFixed(2)}% gain with low volatility`
        });
      }
      
      // Conservative buying - only on significant dips with low volatility
      if (priceChange <= -this.config.minProfitPercent * 2 && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(priceChange),
          confidence: 0.8,
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Conservative buying: ${priceChange.toFixed(2)}% dip with low volatility`
        });
      }
    }
    
    // Sort by confidence and profit
    opportunities.sort((a, b) => (b.confidence * b.expectedProfitPercent) - (a.confidence * a.expectedProfitPercent));
    
    return {
      shouldTrade: opportunities.length > 0,
      opportunities,
      reason: opportunities.length > 0 
        ? `Found ${opportunities.length} low-risk opportunities`
        : 'No low-risk opportunities available'
    };
  }
}

// ============================================================================
// BALANCED STRATEGY
// ============================================================================

export class BalancedStrategy extends BaseStrategy {
  analyze(bot: Bot, marketData: MarketData): StrategyDecision {
    const opportunities: TradeOpportunity[] = [];
    
    for (const [token, price] of Object.entries(marketData.prices)) {
      if (token === 'USDT') continue;
      
      const priceChange = this.getPriceChange(bot, token, price.price);
      const volatility = this.getVolatility(bot, token);
      
      // Balanced approach - consider both momentum and risk
      const riskAdjustedProfit = priceChange * (1 - volatility / 100);
      
      // Sell on good profits
      if (priceChange >= this.config.minProfitPercent && bot.portfolio.balances[token]) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: riskAdjustedProfit,
          confidence: Math.max(0.1, 1 - volatility / 50), // Lower confidence with higher volatility
          maxAmount: bot.portfolio.balances[token] || 0n,
          reason: `Balanced sell: ${priceChange.toFixed(2)}% gain, ${volatility.toFixed(1)}% volatility`
        });
      }
      
      // Buy on dips
      if (priceChange <= -this.config.minProfitPercent && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(riskAdjustedProfit),
          confidence: Math.max(0.1, 1 - volatility / 50),
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Balanced buy: ${priceChange.toFixed(2)}% dip, ${volatility.toFixed(1)}% volatility`
        });
      }
    }
    
    // Sort by risk-adjusted profit
    opportunities.sort((a, b) => (b.confidence * b.expectedProfitPercent) - (a.confidence * a.expectedProfitPercent));
    
    return {
      shouldTrade: opportunities.length > 0,
      opportunities,
      reason: opportunities.length > 0 
        ? `Found ${opportunities.length} balanced opportunities`
        : 'No balanced opportunities available'
    };
  }
}

// ============================================================================
// SCALPER STRATEGY
// ============================================================================

export class ScalperStrategy extends BaseStrategy {
  analyze(bot: Bot, marketData: MarketData): StrategyDecision {
    const opportunities: TradeOpportunity[] = [];
    
    for (const [token, price] of Object.entries(marketData.prices)) {
      if (token === 'USDT') continue;
      
      const priceChange = this.getPriceChange(bot, token, price.price);
      
      // Scalping - take small profits quickly
      if (Math.abs(priceChange) >= this.config.minProfitPercent) {
        if (priceChange > 0 && bot.portfolio.balances[token]) {
          // Quick profit taking
          opportunities.push({
            fromToken: token,
            toToken: 'USDT',
            expectedProfitPercent: priceChange,
            confidence: 0.6, // Medium confidence for quick trades
            maxAmount: bot.portfolio.balances[token] || 0n,
            reason: `Scalp sell: ${priceChange.toFixed(2)}% quick profit`
          });
        } else if (priceChange < 0 && bot.portfolio.balances['USDT']) {
          // Quick buy on dip
          opportunities.push({
            fromToken: 'USDT',
            toToken: token,
            expectedProfitPercent: Math.abs(priceChange),
            confidence: 0.6,
            maxAmount: bot.portfolio.balances['USDT'] || 0n,
            reason: `Scalp buy: ${priceChange.toFixed(2)}% quick dip`
          });
        }
      }
    }
    
    // Sort by expected profit
    opportunities.sort((a, b) => b.expectedProfitPercent - a.expectedProfitPercent);
    
    return {
      shouldTrade: opportunities.length > 0,
      opportunities,
      reason: opportunities.length > 0 
        ? `Found ${opportunities.length} scalping opportunities`
        : 'No scalping opportunities available'
    };
  }
}

// ============================================================================
// STRATEGY FACTORY
// ============================================================================

export const createStrategy = (strategyName: string): IStrategy => {
  switch (strategyName.toUpperCase()) {
    case 'MOMENTUM':
      return new MomentumStrategy(STRATEGIES.MOMENTUM);
    case 'CONSERVATIVE':
      return new ConservativeStrategy(STRATEGIES.CONSERVATIVE);
    case 'BALANCED':
      return new BalancedStrategy(STRATEGIES.BALANCED);
    case 'SCALPER':
      return new ScalperStrategy(STRATEGIES.SCALPER);
    default:
      throw new Error(`Unknown strategy: ${strategyName}`);
  }
};

export const getAvailableStrategies = (): string[] => {
  return Object.keys(STRATEGIES);
};
