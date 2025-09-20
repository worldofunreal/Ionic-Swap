# 🤖 Ionic Swap Trading Bot System

A sophisticated automated trading system with 10 professional trading bots that manage portfolios, execute trades, and track P&L on the Ionic Swap platform.

## 🎯 What This System Does

The bot system creates **10 autonomous trading bots** that:
- **Sign up** and claim 2M USDT automatically
- **Diversify** their portfolios across all 10 supported tokens
- **Track** real-time prices and market movements
- **Execute** trades based on different strategies
- **Show** detailed portfolio holdings, cost basis, and P&L

## 📊 Real-Time Portfolio Display

Each bot shows a clean portfolio table like this:

```
🤖 ALICE (Momentum Trader)
──────────────────────────────────────────────────────────────────────────────────────────
TOKEN     | QUANTITY      | BOUGHT @   | CURRENT @  | P&L %     | P&L $     | ACTION
──────────────────────────────────────────────────────────────────────────────────────────
USDT      |    800000.00 | $1.00      | $1.00      | +0.00%    | $0.00     | 💰 CASH
BNB       |   16028.2187 | $ 992.25 | $ 996.87 |   +0.47% | +$74050.37 | ⚪ HOLD
SOL       |  833857.6402 | $ 238.41 | $ 239.18 |   +0.32% | +$642070.38 | ⚪ HOLD
ETH       |      66.7477 | $4467.57 | $4476.82 |   +0.21% | +$617.42 | ⚪ HOLD
──────────────────────────────────────────────────────────────────────────────────────────
💎 Realized P&L: $      0.00  |  📈 Unrealized P&L: +$ 738689.33
```

**What Each Column Means:**
- **TOKEN**: Which cryptocurrency the bot holds
- **QUANTITY**: How much of each token they own
- **BOUGHT @**: The average price they paid (cost basis)
- **CURRENT @**: Current market price from oracle
- **P&L %**: Percentage profit/loss vs their cost basis
- **P&L $**: Dollar amount profit/loss
- **ACTION**: What the bot wants to do (🔴 SELL, 🟢 BUY, ⚪ HOLD, 💰 CASH)

## 🚀 Quick Start

### 1. Run the Bots (Single Command)

```bash
cd /path/to/Ionic-Swap
npm run bots test
```

That's it! This single command:
- Starts all 10 bots
- Signs them up automatically  
- Diversifies their portfolios
- Shows live portfolio updates
- Runs trading cycles continuously

### 2. Different Run Modes

```bash
# Test mode (runs a few cycles then continues)
npm run bots test

# Continuous mode (runs forever)
npm run bots start

# Single cycle (for testing)
npm run bots cycle
```

## 👥 The 10 Trading Bots

| Bot Name | Strategy | Style | Risk Level |
|----------|----------|-------|------------|
| **alice** | Momentum Trader | Aggressive | High |
| **bob** | Conservative Arbitrage | Safe | Low |
| **charlie** | Momentum Trader | Aggressive | High |
| **diana** | Scalper | High-frequency | Very High |
| **eve** | Balanced Trader | Moderate | Medium |
| **frank** | Conservative Arbitrage | Safe | Low |
| **grace** | Momentum Trader | Aggressive | High |
| **henry** | Balanced Trader | Moderate | Medium |
| **iris** | Scalper | High-frequency | Very High |
| **jack** | Conservative Arbitrage | Safe | Low |

## 📈 Trading Strategies Explained

### 🔥 Momentum Strategy (alice, charlie, grace)
- **Goal**: Ride price trends up and down
- **Sell**: When profit ≥ 1.0% vs cost basis
- **Buy**: When price drops ≥ 1.5% from recent highs
- **Risk**: High (chases momentum)

### 🛡️ Conservative Strategy (bob, frank, jack)  
- **Goal**: Safe, low-risk trades only
- **Sell**: When profit ≥ 2.25% vs cost basis (higher threshold)
- **Buy**: When price drops ≥ 2.25% from recent highs
- **Extra**: Skips high-volatility tokens
- **Risk**: Low (very selective)

### ⚖️ Balanced Strategy (eve, henry)
- **Goal**: Balance risk and reward
- **Sell**: When profit ≥ 1.25% vs cost basis
- **Buy**: When price drops ≥ 1.25% from recent highs
- **Extra**: Adjusts confidence based on volatility
- **Risk**: Medium (balanced approach)

### ⚡ Scalper Strategy (diana, iris)
- **Goal**: Quick, small profits from tiny price movements
- **Sell**: When profit ≥ 0.1% vs cost basis (very low threshold)
- **Buy**: When price drops ≥ 0.15% from recent price
- **Risk**: Very High (high frequency trading)

## 🔄 Complete Workflow

### Phase 1: Initialization (30 seconds)
1. **Generate Identities**: Creates deterministic identities for each bot
2. **Sign Up**: Each bot calls `signup()` to create account and claim 2M USDT
3. **Load State**: Restores previous cost basis and realized P&L from files

### Phase 2: Portfolio Bootstrap (2-3 minutes)
1. **Check Holdings**: See what tokens each bot already owns
2. **Diversify**: Buy missing tokens according to strategy allocation:
   - **Momentum**: 40% USDT, 15% BTC, 15% ETH, 30% other tokens
   - **Conservative**: 60% USDT, 20% BTC, 15% ETH, 5% other tokens  
   - **Balanced**: 50% USDT, 12% BTC, 12% ETH, 26% other tokens
   - **Scalper**: 70% USDT, 8% BTC, 8% ETH, 14% other tokens
3. **Record Cost Basis**: Track purchase price for P&L calculation

### Phase 3: Price History Seeding (30 seconds)
1. **Check History**: See if bots have enough price data (60 points)
2. **Fetch Binance Data**: Get recent 1-minute price history from Binance API
3. **Populate History**: Fill bot price history buffers for strategy decisions

### Phase 4: Active Trading (Continuous)
**Every 30 seconds:**

1. **Update Prices**: Fetch current prices from on-chain oracle
2. **Show Portfolios**: Display portfolio table for all bots
3. **Analyze Markets**: Each bot runs its strategy against current holdings
4. **Execute Trades**: Bots place trades when opportunities are found
5. **Update State**: Record new trades, update cost basis, realize P&L
6. **Wait**: 30-second pause before next cycle

## 📁 File Structure & What Each Does

```
bots/
├── index.ts              # 🎯 MAIN ENTRY POINT - Run this to start everything
├── types/index.ts        # 📋 All TypeScript interfaces and data types
├── utils/
│   ├── index.ts          # 🔧 Helper functions (identity generation, token math)
│   └── marketData.ts     # 📈 Binance API integration for price history
├── strategies/
│   └── index.ts          # 🧠 All 4 trading strategies and decision logic
├── core/
│   ├── index.ts          # ⚙️ Main trading engine that orchestrates everything
│   └── bootstrap.ts      # 🌱 Portfolio diversification logic
└── state/
    └── StateStore.ts     # 💾 Persistent storage for cost basis and P&L
```

## 📝 Detailed File Breakdown

### 🎯 `bots/index.ts` - Main Entry Point
**What it does**: The command center that starts everything

**Key Functions**:
- `TradingBotSystem.start()`: Starts continuous trading
- `TradingBotSystem.runSingleCycle()`: Runs test cycles then continues
- `TradingBotSystem.initialize()`: Sets up the trading engine

**Commands**:
```bash
npm run bots start    # → calls TradingBotSystem.start()
npm run bots test     # → calls TradingBotSystem.runSingleCycle()
```

### ⚙️ `bots/core/index.ts` - Trading Engine
**What it does**: The brain that manages all bots and executes the workflow

**Key Functions**:
- `initializeBots()`: Creates all 10 bot identities and signs them up
- `updateMarketData()`: Fetches current prices from oracle
- `runTradingCycle()`: Executes one complete trading cycle
- `executeTrade()`: Places actual trades and updates cost basis
- `logDetailedPnLAnalysis()`: Shows the portfolio tables

**Workflow Steps**:
1. Create bot identities with `generateBotIdentity()`
2. Sign up each bot with `actor.signup()`
3. Update prices with `actor.get_current_prices()`
4. Show portfolios with formatted tables
5. Run strategies and execute trades

### 🧠 `bots/strategies/index.ts` - Trading Logic
**What it does**: Contains all 4 trading strategies and decision-making

**Key Classes**:
- `MomentumStrategy`: Aggressive trend following
- `ConservativeStrategy`: Safe, low-risk trading
- `BalancedStrategy`: Medium risk/reward balance
- `ScalperStrategy`: High-frequency quick profits

**Key Functions**:
- `analyze()`: Looks at portfolio and decides what to trade
- `getRealPnL()`: Calculates actual profit/loss vs cost basis
- `getRecentPriceChange()`: Detects price trends from Binance history

**Decision Logic**:
```typescript
// Example: Scalper selling logic
const pnlPercent = ((currentPrice - costBasis.avgCostUsd) / costBasis.avgCostUsd) * 100;
if (pnlPercent >= 0.1%) {
  // SELL - Made 0.1% profit!
}
```

### 🌱 `bots/core/bootstrap.ts` - Portfolio Setup
**What it does**: Diversifies bot portfolios across all 10 tokens

**Key Functions**:
- `needsBootstrap()`: Checks if bot needs more tokens
- `bootstrapBot()`: Buys missing tokens according to strategy
- `getAllocation()`: Returns target percentages for each strategy

**Allocation Examples**:
- **Momentum**: 40% USDT, 15% BTC, 15% ETH, 30% others
- **Scalper**: 70% USDT, 8% BTC, 8% ETH, 14% others

### 💾 `bots/state/StateStore.ts` - Data Persistence
**What it does**: Saves bot trading history to files so they remember cost basis

**Key Functions**:
- `load()`: Loads bot's previous cost basis and realized P&L
- `save()`: Saves updated state to `bots_state/{botname}.json`
- `onBuy()`: Updates cost basis when bot buys tokens
- `onSell()`: Calculates realized P&L when bot sells tokens

**Data Stored**:
```json
{
  "botName": "alice",
  "realizedPnlUsd": 1234.56,
  "costBasis": {
    "BTC": {
      "avgCostUsd": 115548.00,
      "quantity": "258070000"
    }
  }
}
```

### 🔧 `bots/utils/index.ts` - Helper Functions
**What it does**: Utility functions for identity, math, and canister interaction

**Key Functions**:
- `generateBotIdentity()`: Creates deterministic ICP identities
- `createBotActor()`: Sets up authenticated canister connection
- `formatBalance()`: Handles token decimal conversion
- `calculateSlippage()`: Computes trade price impacts

### 📈 `bots/utils/marketData.ts` - Price History
**What it does**: Fetches historical price data from Binance

**Key Functions**:
- `fetchBinanceCloses()`: Gets recent price history for strategy decisions

**API Call Example**:
```
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=60
→ Returns 60 recent 1-minute candle closes
```

## 🔍 Technical Details

### Identity Generation
Each bot gets a deterministic identity:
```typescript
const seed = generateSeed(botName);  // Creates consistent seed
const identity = Ed25519KeyIdentity.generate(seed);  // ICP identity
const principal = identity.getPrincipal();  // Unique address
```

### Cost Basis Tracking
When bots buy tokens:
```typescript
// Track what they paid
costBasis[token] = {
  avgCostUsd: purchasePrice,
  quantity: amountBought
};
```

When bots sell tokens:
```typescript
// Calculate profit/loss
const profit = (sellPrice - costBasis.avgCostUsd) * quantitySold;
realizedPnlUsd += profit;
```

### Real P&L Calculation
```typescript
// Current profit vs what they paid
const pnlPercent = ((currentPrice - costBasis.avgCostUsd) / costBasis.avgCostUsd) * 100;
const pnlDollar = (currentPrice - costBasis.avgCostUsd) * quantity;
```

## 🛠️ Prerequisites

1. **Ionic Swap backend running** on local IC network (`dfx start`)
2. **Node.js** and **npm** installed
3. **Canister deployed** with initial USDT balance

## 📊 Monitoring & Debugging

### Portfolio Display Frequency
- Shows after every market data update (every 30 seconds)
- Clean tables with no debug spam
- Real-time P&L calculations

### Log Levels
- **✅ Success**: Green checkmarks for completed actions
- **ℹ️ Info**: Blue info for system status
- **🤖 Bot**: Bot-specific actions and trades
- **💰 Trade**: Successful trades with P&L updates

### State Files
Persistent data stored in `bots_state/`:
- `alice.json`, `bob.json`, etc.
- Contains cost basis and realized P&L
- Survives bot restarts

## 🎮 Example Usage Session

```bash
# Start the bots
cd /path/to/Ionic-Swap
npm run bots test

# You'll see:
# 1. Bot initialization (30 sec)
# 2. Portfolio bootstrap (2-3 min) 
# 3. Live portfolio tables every 30 sec
# 4. Trade notifications when bots act
# 5. Updated P&L in real-time

# Stop with Ctrl+C
```

## 🔧 Customization

### Adjust Strategy Thresholds
Edit `bots/strategies/index.ts`:
```typescript
SCALPER: {
  minProfitPercent: 0.1,  // Sell at 0.1% profit
  maxTradePercent: 5,     // Max 5% of holdings per trade
  cooldownSeconds: 30     // Wait 30s between trades
}
```

### Change Portfolio Allocation
Edit `bots/core/bootstrap.ts`:
```typescript
'MOMENTUM': {
  'USDT': 40,   // 40% cash
  'BTC': 15,    // 15% Bitcoin
  'ETH': 15,    // 15% Ethereum
  // ... rest distributed among other tokens
}
```

### Modify Update Frequency
Edit `bots/core/index.ts`:
```typescript
// Change from 30 seconds to 60 seconds
await new Promise(resolve => setTimeout(resolve, 60000));
```

## 🚨 Troubleshooting

### "Unauthorized" Errors
- **Problem**: Bot identities not signing correctly
- **Solution**: Check that `Ed25519KeyIdentity` is being used properly

### "No opportunities available"
- **Problem**: Strategy thresholds too high for current market
- **Solution**: Temporarily lower `minProfitPercent` in strategies

### Missing Portfolio Data
- **Problem**: Bots not diversified yet
- **Solution**: Wait for bootstrap phase to complete (2-3 minutes)

### Stale Price Data
- **Problem**: Oracle not updating frequently enough
- **Solution**: Binance price history provides additional data points

---

## 🎯 Summary

This bot system provides a **complete automated trading solution** with:

✅ **10 professional bots** with different strategies  
✅ **Real-time portfolio tracking** with cost basis and P&L  
✅ **Automatic diversification** across all tokens  
✅ **Persistent state management** that survives restarts  
✅ **Clean, readable output** showing exactly what you want  
✅ **One-command startup** - just run `npm run bots test`  

The system handles everything automatically - from bot creation to portfolio management to trade execution - while providing complete transparency into each bot's performance and holdings.