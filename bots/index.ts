#!/usr/bin/env node

import { TradingEngine } from './core';
import { getAvailableStrategies } from './strategies';
import { SystemConfig } from './types';
import { log } from './utils';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: SystemConfig = {
  canisterId: 'uxrrr-q7777-77774-qaaaq-cai',
  tradingInterval: 30, // 30 seconds
  maxBotsCount: 10,
  emergencyStop: false
};

const BOT_CONFIGURATIONS = [
  { name: 'alice', strategy: 'MOMENTUM' },
  { name: 'bob', strategy: 'CONSERVATIVE' },
  { name: 'charlie', strategy: 'MOMENTUM' },
  { name: 'diana', strategy: 'SCALPER' },
  { name: 'eve', strategy: 'BALANCED' },
  { name: 'frank', strategy: 'CONSERVATIVE' },
  { name: 'grace', strategy: 'MOMENTUM' },
  { name: 'henry', strategy: 'BALANCED' },
  { name: 'iris', strategy: 'SCALPER' },
  { name: 'jack', strategy: 'CONSERVATIVE' }
];

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class TradingBotApplication {
  private engine: TradingEngine;

  constructor(config: SystemConfig = DEFAULT_CONFIG) {
    this.engine = new TradingEngine(config);
  }

  async initialize(): Promise<void> {
    try {
      log.info('🚀 Initializing Ionic Swap Trading Bot System');
      log.info('===============================================');
      
      // No global initialization needed - each bot creates their own authenticated actor
      
      // Validate strategies
      const availableStrategies = getAvailableStrategies();
      log.info(`Available strategies: ${availableStrategies.join(', ')}`);
      
      // Initialize bots
      await this.engine.initializeBots(BOT_CONFIGURATIONS);
      
      log.success('✅ System initialization completed');
      
    } catch (error) {
      log.error('❌ Failed to initialize system:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      await this.initialize();
      
      // Show initial status
      this.engine.printSystemStatus();
      
      // Start trading
      await this.engine.start();
      
    } catch (error) {
      log.error('❌ Failed to start trading system:', error);
      process.exit(1);
    }
  }

  async runSingleCycle(): Promise<void> {
    try {
      await this.initialize();
      await this.engine.runTradingCycle();
      this.engine.printSystemStatus();
      
    } catch (error) {
      log.error('❌ Failed to run single cycle:', error);
      process.exit(1);
    }
  }

  async showStatus(): Promise<void> {
    try {
      await this.initialize();
      this.engine.printSystemStatus();
      
    } catch (error) {
      log.error('❌ Failed to show status:', error);
      process.exit(1);
    }
  }

  stop(): void {
    this.engine.stop();
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  const interval = parseInt(args[1] || '30');

  // Update config if interval provided
  const config: SystemConfig = {
    ...DEFAULT_CONFIG,
    tradingInterval: interval
  };

  const app = new TradingBotApplication(config);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log.info('\n🛑 Received shutdown signal...');
    app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('\n🛑 Received termination signal...');
    app.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    log.error('💥 Uncaught exception:', error);
    app.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    log.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    app.stop();
    process.exit(1);
  });

  // Execute command
  try {
    switch (command.toLowerCase()) {
      case 'start':
        log.info(`🚀 Starting trading bots with ${interval}s intervals...`);
        await app.start();
        break;

      case 'test':
      case 'cycle':
        log.info('🧪 Running single trading cycle...');
        await app.runSingleCycle();
        break;

      case 'status':
        log.info('📊 Checking system status...');
        await app.showStatus();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        log.error(`❓ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    log.error('💥 Application error:', error);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
🤖 Ionic Swap Trading Bot System

USAGE:
  npm run bots [command] [interval]

COMMANDS:
  start [interval]  Start continuous trading (default: 30s intervals)
  test              Run single trading cycle and show results
  status            Show current system status
  help              Show this help message

EXAMPLES:
  npm run bots                    # Start with default 30s intervals
  npm run bots start 60           # Start with 60s intervals
  npm run bots test               # Run single test cycle
  npm run bots status             # Show system status

FEATURES:
  ✅ 10 autonomous trading bots with unique strategies
  ✅ Real-time price monitoring and arbitrage detection
  ✅ Risk management and portfolio tracking
  ✅ Comprehensive performance metrics
  ✅ Clean architecture with modular strategies

STRATEGIES:
  🔥 Momentum Trader    - Aggressive trend following
  🛡️  Conservative      - Low-risk arbitrage only
  ⚖️  Balanced Trader   - Risk-adjusted opportunities
  ⚡ Scalper           - High-frequency small profits

REQUIREMENTS:
  📋 Local DFX network running
  📋 Backend canister deployed
  📋 Price oracle active
  📋 Sufficient canister liquidity

For more information, check the bot system documentation.
`);
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  main().catch((error) => {
    log.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
