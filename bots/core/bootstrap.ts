import { Bot, SupportedToken, SUPPORTED_TOKENS } from '../types';
import { log, formatTokenAmount } from '../utils';

// ============================================================================
// PORTFOLIO BOOTSTRAP - INITIAL DIVERSIFICATION
// ============================================================================

// Portfolio allocation strategies for each bot type - ALL 10 TOKENS
const PORTFOLIO_ALLOCATIONS = {
  'MOMENTUM': {
    'USDT': 40,
    'BTC': 15,
    'ETH': 15,
    'SOL': 10,
    'BNB': 8,
    'XRP': 4,
    'DOGE': 3,
    'ADA': 2,
    'TRX': 2,
    'ICP': 1
  },
  'CONSERVATIVE': {
    'USDT': 60,
    'BTC': 20,
    'ETH': 15,
    'SOL': 2,
    'BNB': 1,
    'XRP': 1,
    'DOGE': 0.5,
    'ADA': 0.25,
    'TRX': 0.25,
    'ICP': 0
  },
  'BALANCED': {
    'USDT': 50,
    'BTC': 12,
    'ETH': 12,
    'SOL': 8,
    'BNB': 6,
    'XRP': 4,
    'DOGE': 3,
    'ADA': 2,
    'TRX': 2,
    'ICP': 1
  },
  'SCALPER': {
    'USDT': 70,
    'BTC': 8,
    'ETH': 8,
    'SOL': 5,
    'BNB': 3,
    'XRP': 2,
    'DOGE': 2,
    'ADA': 1,
    'TRX': 1,
    'ICP': 0
  }
};

export class PortfolioBootstrap {
  
  // Get allocation strategy for a bot
  static getAllocation(strategyName: string): Record<string, number> {
    const strategy = strategyName.split(' ')[0]!.toUpperCase();
    return PORTFOLIO_ALLOCATIONS[strategy as keyof typeof PORTFOLIO_ALLOCATIONS] || PORTFOLIO_ALLOCATIONS.BALANCED;
  }

  // Execute initial portfolio diversification for a bot
  static async bootstrapBot(bot: Bot): Promise<void> {
    try {
      log.bot(bot.identity.name, `🚀 Starting portfolio bootstrap...`);
      
      const actor = (bot as any).actor;
      if (!actor) {
        throw new Error('Bot actor not available');
      }

      const allocation = this.getAllocation(bot.strategy.name);
      const startingUSDT = bot.portfolio.balances['USDT'] || 0n;
      
      if (startingUSDT === 0n) {
        log.bot(bot.identity.name, `❌ No USDT balance to bootstrap with`);
        return;
      }

      log.bot(bot.identity.name, `💰 Starting with ${formatTokenAmount(startingUSDT, 'USDT')} USDT`);
      log.bot(bot.identity.name, `📊 Target allocation: ${JSON.stringify(allocation)}`);

      // Execute trades for ALL target tokens (skip USDT)
      for (const [token, percentage] of Object.entries(allocation)) {
        if (token === 'USDT') continue; // Skip USDT, keep remaining amount
        
        const targetAmount = Number(startingUSDT) * (percentage / 100);
        const tradeAmount = BigInt(Math.floor(targetAmount));
        
        // Only trade if amount is meaningful (> $100)
        if (tradeAmount >= 100_000_000n) { // 100 USDT with 6 decimals
          const execPrice = await this.executeBuyTrade(bot, actor, token as SupportedToken, tradeAmount);
          
          // Update cost basis for bootstrap purchase
          if (execPrice > 0) {
            const { StateStore } = require('../state/StateStore');
            const state = StateStore.load(bot.identity.name);
            const updatedState = StateStore.onBuy(state, token as SupportedToken, tradeAmount, execPrice);
            bot.realizedPnlUsd = updatedState.realizedPnlUsd;
            bot.costBasis = updatedState.costBasis;
            StateStore.save(updatedState);
            
            log.bot(bot.identity.name, `📊 Cost basis: ${token} @ $${execPrice.toFixed(4)}`);
          }
           
          // Small delay between trades to avoid overwhelming canister
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (percentage > 0) {
          log.bot(bot.identity.name, `⏭️ Skipping ${token} (${percentage}% = $${(targetAmount / 1_000_000).toFixed(2)}, too small)`);
        }
      }

      log.bot(bot.identity.name, `✅ Portfolio bootstrap completed`);
      
    } catch (error) {
      log.error(`Portfolio bootstrap failed for ${bot.identity.name}:`, error);
    }
  }

  // Execute a buy trade during bootstrap
  private static async executeBuyTrade(
    bot: Bot, 
    actor: any, 
    toToken: SupportedToken, 
    usdtAmount: bigint
  ): Promise<number> {
    try {
      log.bot(bot.identity.name, `🔄 Buying ${toToken} with ${formatTokenAmount(usdtAmount, 'USDT')} USDT`);
      
      const result = await actor.market_swap({
        from_token: 'USDT',
        to_token: toToken,
        amount: usdtAmount
      });

      if ('Ok' in (result as any)) {
        const swapResult = (result as any).Ok;
        const receivedAmount = BigInt(swapResult.to_amount);
        const execPrice = swapResult.to_price;
        
        log.bot(bot.identity.name, 
          `✅ Bought ${formatTokenAmount(receivedAmount, toToken)} ${toToken} ` +
          `for ${formatTokenAmount(usdtAmount, 'USDT')} USDT @ $${execPrice.toFixed(4)}`
        );
        
        return execPrice;
      } else {
        const error = (result as any).Err;
        log.error(`❌ ${bot.identity.name} failed to buy ${toToken}: ${JSON.stringify(error)}`);
        return 0;
      }
      
    } catch (error) {
      log.error(`❌ ${bot.identity.name} trade execution failed:`, error);
      return 0;
    }
  }

  // Check if bot needs bootstrapping - should have ALL 10 tokens according to strategy
  static needsBootstrap(bot: Bot): boolean {
    const allocation = this.getAllocation(bot.strategy.name);
    const currentTokens = Object.keys(bot.portfolio.balances).filter(t => 
      bot.portfolio.balances[t] > 0n
    );
    
    // Check if bot is missing any tokens that should have >0% allocation
    for (const [token, percentage] of Object.entries(allocation)) {
      if (percentage > 0 && !currentTokens.includes(token)) {
        log.bot(bot.identity.name, `🔄 Missing ${token} (${percentage}% allocation)`);
        return true;
      }
    }
    
    return false;
  }
}
