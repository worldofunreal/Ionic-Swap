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
    minProfitPercent: 0.1, // TEMP: Lower for testing
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
  
  // Get P&L vs cost basis (REAL profit/loss)
  protected getRealPnL(bot: Bot, token: string, currentPrice: number): number {
    const costBasis = bot.costBasis[token];
    if (!costBasis) return 0; // No position = no P&L
    
    const pnlPercent = ((currentPrice - costBasis.avgCostUsd) / costBasis.avgCostUsd) * 100;
    
    // DEBUG: Log REAL P&L vs cost basis (disabled to reduce spam)
    // if (Math.random() < 0.01) {
    //   console.log(`[DEBUG] ${bot.identity.name} ${token}: ${pnlPercent.toFixed(3)}% P&L (cost: $${costBasis.avgCostUsd.toFixed(2)} → current: $${currentPrice.toFixed(2)})`);
    // }
    
    return pnlPercent;
  }
  
  // DEPRECATED - This was always broken (comparing same prices)
  protected getPriceChange(bot: Bot, token: string, currentPrice: number): number {
    // Silently return 0 to avoid spam
    return 0;
  }
  
  // Get recent price change from Binance history (for buy signals)
  protected getRecentPriceChange(bot: Bot, token: string, currentPrice: number): number {
    const history = bot.priceHistory[token] || [];
    if (history.length < 10) return 0; // Need some history
    
    // Compare current price to 10 periods ago to detect trends
    const pastPrice = history[history.length - 10]!;
    const change = ((currentPrice - pastPrice) / pastPrice) * 100;
    
    // Disabled debug to reduce spam
    // if (Math.random() < 0.01) {
    //   console.log(`[DEBUG] ${bot.identity.name} ${token}: ${change.toFixed(3)}% trend (${pastPrice.toFixed(2)} → ${currentPrice.toFixed(2)})`);
    // }
    
    return change;
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
      
      const currentPrice = price.price;
      const balance = bot.portfolio.balances[token] || 0n;
      const pnlPercent = this.getRealPnL(bot, token, currentPrice);
      const recentTrend = this.getRecentPriceChange(bot, token, currentPrice);
      
      // SELL: If we have the token and it's profitable
      if (balance > 0n && pnlPercent >= this.config.minProfitPercent) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: pnlPercent,
          confidence: Math.min(pnlPercent / 5, 1),
          maxAmount: balance,
          reason: `Momentum sell: ${pnlPercent.toFixed(2)}% profit vs cost basis`
        });
      }
      
      // BUY: If token is trending down (opportunity)
      if (recentTrend <= -(this.config.minProfitPercent + 0.5) && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(recentTrend),
          confidence: Math.min(Math.abs(recentTrend) / 5, 1),
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Momentum buy: ${recentTrend.toFixed(2)}% downtrend, buying opportunity`
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
      
      const currentPrice = price.price;
      const balance = bot.portfolio.balances[token] || 0n;
      const pnlPercent = this.getRealPnL(bot, token, currentPrice);
      const volatility = this.getVolatility(bot, token);
      const recentTrend = this.getRecentPriceChange(bot, token, currentPrice);
      
      // Only trade if volatility is low (less risky)
      if (volatility > 10) continue; // Skip high volatility tokens
      
      // SELL: Conservative profit taking - only on significant gains
      if (balance > 0n && pnlPercent >= (this.config.minProfitPercent * 2 + 0.25)) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: pnlPercent,
          confidence: 0.8,
          maxAmount: balance,
          reason: `Conservative sell: ${pnlPercent.toFixed(2)}% profit vs cost basis (low volatility)`
        });
      }
      
      // BUY: Conservative buying - only on significant dips with low volatility
      if (recentTrend <= -(this.config.minProfitPercent * 2 + 0.25) && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(recentTrend),
          confidence: 0.7,
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Conservative buy: ${recentTrend.toFixed(2)}% downtrend (low volatility)`
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
      
      const currentPrice = price.price;
      const balance = bot.portfolio.balances[token] || 0n;
      const pnlPercent = this.getRealPnL(bot, token, currentPrice);
      const volatility = this.getVolatility(bot, token);
      const recentTrend = this.getRecentPriceChange(bot, token, currentPrice);
      
      // Balanced approach - consider both profit and risk
      const riskAdjustedProfit = pnlPercent * (1 - volatility / 100);
      
      // SELL: Balanced profit taking
      if (balance > 0n && pnlPercent >= (this.config.minProfitPercent + 0.25)) {
        opportunities.push({
          fromToken: token,
          toToken: 'USDT',
          expectedProfitPercent: riskAdjustedProfit,
          confidence: Math.max(0.1, 1 - volatility / 50),
          maxAmount: balance,
          reason: `Balanced sell: ${pnlPercent.toFixed(2)}% profit vs cost basis, ${volatility.toFixed(1)}% volatility`
        });
      }
      
      // BUY: Balanced buying on trends
      if (recentTrend <= -(this.config.minProfitPercent + 0.25) && bot.portfolio.balances['USDT']) {
        opportunities.push({
          fromToken: 'USDT',
          toToken: token,
          expectedProfitPercent: Math.abs(recentTrend),
          confidence: Math.max(0.1, 1 - volatility / 50),
          maxAmount: bot.portfolio.balances['USDT'] || 0n,
          reason: `Balanced buy: ${recentTrend.toFixed(2)}% downtrend, ${volatility.toFixed(1)}% volatility`
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
      
      // Use ACTUAL cost basis vs current price for real P&L
      const currentPrice = price.price;
      const costBasis = bot.costBasis[token];
      const balance = bot.portfolio.balances[token] || 0n;
      
      if (costBasis && balance > 0n) {
        // SELL: Check if current price > cost basis + profit threshold
        const pnlPercent = ((currentPrice - costBasis.avgCostUsd) / costBasis.avgCostUsd) * 100;
        
        if (pnlPercent >= this.config.minProfitPercent) {
          opportunities.push({
            fromToken: token,
            toToken: 'USDT',
            expectedProfitPercent: pnlPercent,
            confidence: 0.7,
            maxAmount: balance,
            reason: `Scalp sell: ${pnlPercent.toFixed(2)}% profit vs cost basis $${costBasis.avgCostUsd.toFixed(2)}`
          });
        }
      }
      
      // BUY: Always consider buying if we have USDT and token dropped from recent high
      if (bot.portfolio.balances['USDT'] && bot.portfolio.balances['USDT'] > 0n) {
        const recentTrend = this.getRecentPriceChange(bot, token, currentPrice);
        if (recentTrend <= -0.15) { // 0.15% dip from recent high
          opportunities.push({
            fromToken: 'USDT',
            toToken: token,
            expectedProfitPercent: Math.abs(recentTrend),
            confidence: 0.6,
            maxAmount: bot.portfolio.balances['USDT'] || 0n,
            reason: `Scalp buy: ${recentTrend.toFixed(2)}% dip opportunity`
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
