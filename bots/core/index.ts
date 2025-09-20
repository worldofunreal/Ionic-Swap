import { Principal } from '@dfinity/principal';
import {
  Bot,
  BotIdentity,
  Portfolio,
  Trade,
  MarketData,
  TradingPair,
  SwapRequest,
  SwapResult,
  UserBalance,
  SystemConfig,
  SystemMetrics,
  STARTING_BALANCE_USDT,
  SUPPORTED_TOKENS,
  SupportedToken
} from '../types';
import {
  generateBotIdentity,
  createBotActor,
  formatTokenAmount,
  calculateUsdValue,
  calculateProfitPercent,
  generateTradeId,
  log,
  sleep,
  BotError,
  CanisterError
} from '../utils';
import { IStrategy, createStrategy, getAvailableStrategies, BaseStrategy, STRATEGIES } from '../strategies';

// ============================================================================
// TRADING ENGINE
// ============================================================================

export class TradingEngine {
  private bots: Map<string, Bot> = new Map();
  private marketData: MarketData = {
    prices: {},
    lastUpdated: 0,
    isStale: true
  };
  private isRunning = false;
  private config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
  }

  // No global initialization needed - each bot creates their own authenticated actor

  // ============================================================================
  // BOT MANAGEMENT
  // ============================================================================

  async initializeBots(botConfigs: Array<{ name: string; strategy: string }>): Promise<void> {
    log.info('Initializing trading bots...');

    for (const config of botConfigs) {
      try {
        const identity = generateBotIdentity(config.name);
        const strategyInstance = createStrategy(config.strategy);
        const strategyConfig = strategyInstance instanceof BaseStrategy ? strategyInstance.config : STRATEGIES[config.strategy.toUpperCase()];

        const bot: Bot = {
          identity,
          strategy: strategyConfig,
          portfolio: {
            balances: {},
            totalUsdValue: 0,
            profitLoss: 0,
            profitLossPercent: 0
          },
          trades: [],
          lastTradeTime: 0,
          isActive: true,
          priceHistory: {}
        };

        // Sign up the bot
        await this.signupBot(bot);
        
        this.bots.set(bot.identity.name, bot);
        log.success(`Initialized bot: ${bot.identity.name} with ${strategyConfig.name} strategy`);

      } catch (error) {
        log.error(`Failed to initialize bot ${config.name}:`, error);
      }
    }

    log.success(`Initialized ${this.bots.size} bots successfully`);
  }

  private async signupBot(bot: Bot): Promise<void> {
    try {
      log.bot(bot.identity.name, `Attempting signup with principal: ${bot.identity.principal}`);
      
      // Create authenticated actor for this bot (same as frontend does)
      const actor = await createBotActor(bot.identity.identity, this.config.canisterId);
      
      // Make signed call to signup (same as frontend)
      const result = await actor.signup(
        bot.identity.name,
        [], // empty evm_address
        [], // empty bitcoin_address  
        []  // empty solana_address
      );

      if ('Ok' in (result as any)) {
        // New user signed up successfully and automatically got 2M USDT faucet
        log.bot(bot.identity.name, `✅ Successfully signed up and received ${STARTING_BALANCE_USDT.toLocaleString()} USDT`);
      } else if ('Err' in (result as any)) {
        const error = (result as any).Err;
        const errorStr = JSON.stringify(error);
        if (errorStr.includes('User already exists')) {
          // User already exists, they should already have their faucet tokens
          log.bot(bot.identity.name, `ℹ️ User already exists, loading existing data`);
        } else {
          throw new Error(`Signup failed: ${errorStr}`);
        }
      }

      // Store the bot's actor for future calls
      (bot as any).actor = actor;

    } catch (error) {
      throw new BotError(`Failed to signup bot: ${error}`, bot.identity.name, 'signup');
    }
  }

  getBot(name: string): Bot | undefined {
    return this.bots.get(name);
  }

  getAllBots(): Bot[] {
    return Array.from(this.bots.values());
  }

  // ============================================================================
  // MARKET DATA MANAGEMENT
  // ============================================================================

  async updateMarketData(): Promise<void> {
    try {
      // Use any bot's actor to get prices (query call, doesn't need specific identity)
      const firstBot = Array.from(this.bots.values())[0];
      if (!firstBot || !(firstBot as any).actor) {
        throw new Error('No bot actors available for market data');
      }

      const actor = (firstBot as any).actor;
      const result = await actor.get_current_prices();

      if ('Ok' in (result as any)) {
        const pricesJson = (result as any).Ok;
        const prices = JSON.parse(pricesJson) as Record<string, TradingPair>;

        this.marketData = {
          prices,
          lastUpdated: Date.now(),
          isStale: false
        };

        log.info(`Updated market data: ${Object.keys(prices).length} prices`);
      } else {
        throw new Error(`Failed to get prices: ${JSON.stringify((result as any).Err)}`);
      }
    } catch (error) {
      log.error('Failed to update market data:', error);
      this.marketData.isStale = true;
    }
  }

  getMarketData(): MarketData {
    return this.marketData;
  }

  // ============================================================================
  // PORTFOLIO MANAGEMENT
  // ============================================================================

  async updateBotPortfolio(bot: Bot): Promise<void> {
    try {
      // Use bot's own authenticated actor (same as frontend)
      const actor = (bot as any).actor;
      if (!actor) {
        throw new Error('Bot actor not available');
      }

      const principal = Principal.fromText(bot.identity.principal);
      const result = await actor.get_user_balances(principal);

      // Result is array of [string, bigint] tuples - same format as frontend gets
      bot.portfolio.balances = {};
      let totalUsdValue = 0;

      if (Array.isArray(result)) {
        for (const [symbol, amount] of result) {
          const bigintAmount = BigInt(amount);
          bot.portfolio.balances[symbol as SupportedToken] = bigintAmount;

          // Calculate USD value
          const price = this.marketData.prices[symbol]?.price || (symbol === 'USDT' ? 1.0 : 0);
          const usdValue = calculateUsdValue(bigintAmount, symbol as SupportedToken, price);
          totalUsdValue += usdValue;
        }
      }

      bot.portfolio.totalUsdValue = totalUsdValue;
      bot.portfolio.profitLoss = totalUsdValue - STARTING_BALANCE_USDT;
      bot.portfolio.profitLossPercent = calculateProfitPercent(totalUsdValue, STARTING_BALANCE_USDT);

    } catch (error) {
      throw new BotError(`Failed to update portfolio: ${error}`, bot.identity.name, 'updatePortfolio');
    }
  }

  // ============================================================================
  // TRADING EXECUTION
  // ============================================================================

  async executeTrade(bot: Bot, fromToken: SupportedToken, toToken: SupportedToken, amount: bigint): Promise<Trade> {
    const tradeId = generateTradeId();
    const timestamp = Date.now();

    log.bot(bot.identity.name, `Executing trade: ${formatTokenAmount(amount, fromToken)} ${fromToken} → ${toToken}`);

    try {
      // Use bot's own authenticated actor for trade (same as frontend)
      const actor = (bot as any).actor;
      if (!actor) {
        throw new Error('Bot actor not available');
      }

      const swapRequest = {
        from_token: fromToken,
        to_token: toToken,
        amount
      };

      const result = await actor.market_swap(swapRequest);

      if ('Ok' in (result as any)) {
        // Parse successful trade result
        const swapResult = (result as any).Ok;
        const trade: Trade = {
          id: tradeId,
          timestamp,
          botName: bot.identity.name,
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: BigInt(swapResult.to_amount),
          fromPrice: swapResult.from_price,
          toPrice: swapResult.to_price,
          profitLoss: 0, // Will be calculated
          successful: true
        };

        bot.trades.push(trade);
        bot.lastTradeTime = timestamp;

        log.trade(`${bot.identity.name} successfully traded ${fromToken} → ${toToken}`);
        return trade;

      } else {
        throw new Error(`Trade failed: ${JSON.stringify((result as any).Err)}`);
      }

    } catch (error) {
      const failedTrade: Trade = {
        id: tradeId,
        timestamp,
        botName: bot.identity.name,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: 0n,
        fromPrice: this.marketData.prices[fromToken]?.price || 0,
        toPrice: this.marketData.prices[toToken]?.price || 0,
        profitLoss: 0,
        successful: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      bot.trades.push(failedTrade);
      log.error(`Trade failed for ${bot.identity.name}:`, error);
      return failedTrade;
    }
  }

  // ============================================================================
  // STRATEGY EXECUTION
  // ============================================================================

  async executeStrategy(bot: Bot): Promise<void> {
    if (!bot.isActive) return;

    try {
      const strategy = createStrategy(bot.strategy.name.split(' ')[0]!.toUpperCase());
      const decision = strategy.analyze(bot, this.marketData);

      if (!decision.shouldTrade || decision.opportunities.length === 0) {
        log.bot(bot.identity.name, decision.reason);
        return;
      }

      // Take the best opportunity
      const opportunity = decision.opportunities[0]!;
      
      if (!strategy.shouldTrade(bot, opportunity)) {
        log.bot(bot.identity.name, 'Strategy declined to trade due to constraints');
        return;
      }

      const tradeAmount = strategy.calculateTradeAmount(bot, opportunity);
      if (tradeAmount === 0n) {
        log.bot(bot.identity.name, 'No sufficient balance for trade');
        return;
      }

      // Execute the trade
      await this.executeTrade(
        bot,
        opportunity.fromToken as SupportedToken,
        opportunity.toToken as SupportedToken,
        tradeAmount
      );

    } catch (error) {
      log.error(`Strategy execution failed for ${bot.identity.name}:`, error);
    }
  }

  // ============================================================================
  // PRICE HISTORY MANAGEMENT
  // ============================================================================

  updatePriceHistory(): void {
    for (const bot of this.bots.values()) {
      for (const [symbol, pair] of Object.entries(this.marketData.prices)) {
        if (!bot.priceHistory[symbol]) {
          bot.priceHistory[symbol] = [];
        }
        
        bot.priceHistory[symbol]!.push(pair.price);
        
        // Keep only last 100 price points
        if (bot.priceHistory[symbol]!.length > 100) {
          bot.priceHistory[symbol] = bot.priceHistory[symbol]!.slice(-100);
        }
      }
    }
  }

  // ============================================================================
  // TRADING CYCLE
  // ============================================================================

  async runTradingCycle(): Promise<void> {
    if (this.config.emergencyStop) {
      log.warning('Emergency stop is active, skipping trading cycle');
      return;
    }

    log.info('Starting trading cycle...');

    try {
      // Update market data
      await this.updateMarketData();
      
      if (this.marketData.isStale) {
        log.warning('Market data is stale, skipping trading cycle');
        return;
      }

      // Update price history
      this.updatePriceHistory();

      // Process each bot
      for (const bot of this.bots.values()) {
        try {
          // Update bot portfolio
          await this.updateBotPortfolio(bot);
          
          // Execute strategy
          await this.executeStrategy(bot);
          
          // Small delay between bots
          await sleep(500);
          
        } catch (error) {
          log.error(`Error processing bot ${bot.identity.name}:`, error);
        }
      }

      log.success('Trading cycle completed');

    } catch (error) {
      log.error('Trading cycle failed:', error);
    }
  }

  // ============================================================================
  // SYSTEM CONTROL
  // ============================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      log.warning('Trading engine is already running');
      return;
    }

    log.info(`Starting trading engine with ${this.config.tradingInterval}s intervals...`);
    this.isRunning = true;

    // Initialize price oracle using any bot's actor
    try {
      const firstBot = Array.from(this.bots.values())[0];
      if (firstBot && (firstBot as any).actor) {
        const actor = (firstBot as any).actor;
        await actor.start_price_scheduler();
        await actor.update_prices();
        await sleep(2000); // Wait for initial price update
      }
    } catch (error) {
      log.error('Failed to initialize price oracle:', error);
    }

    // Main trading loop
    while (this.isRunning) {
      try {
        await this.runTradingCycle();
        
        log.info(`Waiting ${this.config.tradingInterval} seconds until next cycle...`);
        await sleep(this.config.tradingInterval * 1000);
        
      } catch (error) {
        log.error('Error in main trading loop:', error);
        await sleep(5000); // Wait 5s on error
      }
    }
  }

  stop(): void {
    log.info('Stopping trading engine...');
    this.isRunning = false;
  }

  // ============================================================================
  // METRICS & REPORTING
  // ============================================================================

  getSystemMetrics(): SystemMetrics {
    const activeBots = Array.from(this.bots.values()).filter(bot => bot.isActive).length;
    const totalTrades = Array.from(this.bots.values()).reduce((sum, bot) => sum + bot.trades.length, 0);
    const totalProfit = Array.from(this.bots.values()).reduce((sum, bot) => sum + bot.portfolio.profitLoss, 0);

    return {
      totalBots: this.bots.size,
      activeBots,
      totalTrades,
      totalProfit,
      systemUptime: Date.now(), // Simplified
      lastPriceUpdate: this.marketData.lastUpdated
    };
  }

  printSystemStatus(): void {
    const metrics = this.getSystemMetrics();
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 IONIC SWAP TRADING BOT SYSTEM STATUS');
    console.log('='.repeat(80));
    
    console.log(`📊 System Metrics:`);
    console.log(`   Total Bots: ${metrics.totalBots}`);
    console.log(`   Active Bots: ${metrics.activeBots}`);
    console.log(`   Total Trades: ${metrics.totalTrades}`);
    console.log(`   Total Profit: $${metrics.totalProfit.toFixed(2)}`);
    console.log(`   Running: ${this.isRunning ? 'Yes' : 'No'}`);
    
    console.log(`\n💰 Bot Performance:`);
    
    for (const bot of this.bots.values()) {
      const profitColor = bot.portfolio.profitLoss >= 0 ? '🟢' : '🔴';
      console.log(`${profitColor} ${bot.identity.name} (${bot.strategy.name})`);
      console.log(`   Portfolio: $${bot.portfolio.totalUsdValue.toFixed(2)}`);
      console.log(`   P&L: $${bot.portfolio.profitLoss.toFixed(2)} (${bot.portfolio.profitLossPercent.toFixed(2)}%)`);
      console.log(`   Trades: ${bot.trades.length} (${bot.trades.filter(t => t.successful).length} successful)`);
      
      // Show top holdings
      const holdings = Object.entries(bot.portfolio.balances)
        .map(([symbol, amount]) => ({
          symbol,
          amount,
          value: calculateUsdValue(amount, symbol as SupportedToken, this.marketData.prices[symbol]?.price || 1)
        }))
        .filter(h => h.value > 1)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      
      for (const holding of holdings) {
        console.log(`   ${holding.symbol}: ${formatTokenAmount(holding.amount, holding.symbol as SupportedToken)} ($${holding.value.toFixed(2)})`);
      }
      console.log('');
    }
    
    console.log('='.repeat(80));
  }
}
