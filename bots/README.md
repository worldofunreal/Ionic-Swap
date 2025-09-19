# 🤖 Ionic Swap Trading Bot System

A professional-grade automated trading system built with clean architecture principles. Manages 10 autonomous trading bots executing different strategies on the Ionic Swap platform.

## 🏗️ Architecture

```
bots/
├── index.ts           # Main entry point & CLI interface
├── types/             # TypeScript interfaces & types
├── core/              # Core trading engine
├── strategies/        # Modular trading strategies
├── utils/             # Utility functions & helpers
└── README.md          # This file
```

### Design Principles

- **Single Responsibility**: Each module has one clear purpose
- **Dependency Injection**: Clean interfaces between components
- **Strategy Pattern**: Pluggable trading algorithms
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript coverage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start trading bots (30s intervals)
npm run bots

# Run single test cycle
npm run bots test

# Check system status
npm run bots status

# Start with custom interval (60s)
npm run bots start 60
```

## 📊 Trading Strategies

### 🔥 Momentum Trader
- **Risk**: Aggressive
- **Min Profit**: 2.0%
- **Max Trade**: 20% of portfolio
- **Logic**: Follows strong price trends

### 🛡️ Conservative Arbitrage
- **Risk**: Low
- **Min Profit**: 1.0%
- **Max Trade**: 10% of portfolio  
- **Logic**: Low-volatility opportunities only

### ⚖️ Balanced Trader
- **Risk**: Moderate
- **Min Profit**: 1.5%
- **Max Trade**: 15% of portfolio
- **Logic**: Risk-adjusted profit optimization

### ⚡ Scalper
- **Risk**: Aggressive
- **Min Profit**: 0.5%
- **Max Trade**: 5% of portfolio
- **Logic**: High-frequency small profits

## 🔧 System Components

### Core Engine (`core/index.ts`)
- Bot lifecycle management
- Portfolio tracking
- Trade execution
- Market data handling
- System metrics

### Strategy System (`strategies/index.ts`)
- Modular strategy interface
- Market analysis algorithms
- Risk management rules
- Trade opportunity detection

### Type System (`types/index.ts`)
- Complete TypeScript interfaces
- Data models and contracts
- Configuration structures
- API response types

### Utilities (`utils/index.ts`)
- Identity generation
- Token formatting
- Canister communication
- Math calculations
- Logging system

## 🤖 Bot Configuration

Each bot has a unique identity and strategy:

```typescript
const BOT_CONFIGURATIONS = [
  { name: 'alice_trader', strategy: 'MOMENTUM' },
  { name: 'bob_arbitrage', strategy: 'CONSERVATIVE' },
  { name: 'charlie_momentum', strategy: 'MOMENTUM' },
  { name: 'diana_scalper', strategy: 'SCALPER' },
  { name: 'eve_balanced', strategy: 'BALANCED' },
  // ... 5 more bots
];
```

## 📈 Performance Tracking

The system tracks comprehensive metrics:

- **Portfolio Value**: Real-time USD valuation
- **Profit & Loss**: Absolute and percentage gains
- **Trade Success Rate**: Successful vs failed trades
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Largest portfolio decline

## 🛠️ Development

### Adding New Strategies

1. Implement the `IStrategy` interface
2. Add to the strategy factory
3. Register in available strategies

```typescript
export class CustomStrategy extends BaseStrategy {
  analyze(bot: Bot, marketData: MarketData): StrategyDecision {
    // Your trading logic here
  }
}
```

### Extending Bot Capabilities

The modular architecture makes it easy to:
- Add new trading algorithms
- Implement risk management rules
- Create custom portfolio metrics
- Build monitoring dashboards

## 🔒 Security & Risk Management

### Built-in Safeguards
- **Position Limits**: Maximum trade size constraints
- **Cooldown Periods**: Prevent overtrading
- **Balance Validation**: Ensure sufficient funds
- **Error Recovery**: Graceful failure handling
- **Emergency Stop**: System-wide trading halt

### Risk Controls
- Portfolio diversification limits
- Maximum drawdown thresholds
- Volatility-based position sizing
- Stop-loss mechanisms

## 📋 Prerequisites

### System Requirements
- Node.js 18+ with TypeScript support
- DFX local network running
- Ionic Swap backend canister deployed
- Price oracle system active

### Environment Setup
```bash
# Ensure DFX is running
dfx start --background

# Deploy canisters (if not already done)
dfx deploy

# Verify canister health
dfx canister call uxrrr-q7777-77774-qaaaq-cai get_current_prices
```

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module '@dfinity/principal'"**
```bash
npm install @dfinity/principal
```

**"Canister call failed"**
- Check DFX network is running
- Verify canister ID is correct
- Ensure price oracle is active

**"No trading opportunities"**
- Check market data is updating
- Verify price oracle has recent data
- Review strategy parameters

### Debug Mode
```bash
# Enable verbose logging
DEBUG=true npm run bots test
```

## 🔄 Continuous Integration

The system supports automated deployment:

```bash
# Run tests
npm test

# Check code quality
npm run lint

# Build for production
npm run build
```

## 📊 Monitoring & Alerts

Real-time system monitoring includes:
- Bot performance metrics
- Trade execution logs
- Portfolio value tracking
- System health indicators
- Error rate monitoring

## 🚀 Production Deployment

For production use:

1. **Security Audit**: Review all trading logic
2. **Risk Assessment**: Set appropriate limits
3. **Monitoring Setup**: Implement alerting
4. **Backup Strategy**: Portfolio recovery plans
5. **Performance Tuning**: Optimize intervals

## 🤝 Contributing

1. Follow the established architecture
2. Add comprehensive tests
3. Update documentation
4. Use TypeScript strictly
5. Handle errors gracefully

## 📄 License

This trading bot system is part of the Ionic Swap project.

---

**⚠️ Disclaimer**: This is a demonstration system. Do not use with real funds without proper testing and risk assessment. Cryptocurrency trading involves substantial risk of loss.
🤖 10 Professional Trading Bots
alice_trader - Momentum Trader (Aggressive)
bob_arbitrage - Conservative Arbitrage (Safe)
charlie_momentum - Momentum Trader (Aggressive)
diana_scalper - Scalper (High-frequency)
eve_balanced - Balanced Trader (Moderate)
frank_conservative - Conservative Arbitrage (Safe)
grace_aggressive - Momentum Trader (Aggressive)
henry_diversified - Balanced Trader (Moderate)
iris_focused - Scalper (High-frequency)
jack_adaptive - Conservative Arbitrage (Safe)