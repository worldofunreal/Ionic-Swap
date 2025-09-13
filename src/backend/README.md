# Ionic Swap Backend

A Rust-based Internet Computer (IC) canister that provides cross-chain token swapping functionality with integrated price oracle system.

## 🏗️ Architecture

The backend consists of several modules:

- **Oracle System**: Multi-source price aggregation with failure handling
- **EVM Operations**: Ethereum-compatible blockchain interactions
- **ICP Operations**: Internet Computer Protocol token handling
- **Solana Operations**: Solana blockchain integration
- **User Management**: User data and session handling
- **Storage**: Persistent data management

## 📊 Price Oracle System

### Overview

The price oracle system aggregates cryptocurrency prices from multiple external APIs to provide reliable, real-time pricing data for token swaps. It implements robust failure handling and automatic recalculation when API sources become unavailable.

### Supported Price Sources

| Source | Tokens | API Endpoint | Status |
|--------|--------|--------------|--------|
| **CoinGecko** | 9 tokens | `api.coingecko.com` | ✅ Active |
| **Binance** | 9 tokens | `api.binance.com` | ✅ Active |
| **CoinCap** | 9 tokens | `rest.coincap.io` | ✅ Active |
| **CryptoCompare** | 9 tokens | `min-api.cryptocompare.com` | ✅ Active |

### Supported Tokens

| Token | Symbol | CoinGecko | Binance | CoinCap | CryptoCompare |
|-------|--------|-----------|---------|---------|---------------|
| Bitcoin | BTC | ✅ | ✅ | ✅ | ✅ |
| Ethereum | ETH | ✅ | ✅ | ✅ | ✅ |
| Solana | SOL | ✅ | ✅ | ✅ | ✅ |
| Internet Computer | ICP | ✅ | ✅ | ✅ | ✅ |
| Cardano | ADA | ✅ | ✅ | ✅ | ✅ |
| XRP | XRP | ✅ | ✅ | ✅ | ✅ |
| Binance Coin | BNB | ✅ | ✅ | ✅ | ✅ |
| Dogecoin | DOGE | ✅ | ✅ | ✅ | ✅ |
| Tron | TRX | ✅ | ✅ | ✅ | ✅ |

### Price Aggregation Algorithm

#### 1. Data Collection
Each API is called independently using `get_coingecko_prices()`, `get_binance_prices()`, `get_coincap_prices()`, and `get_cryptocompare_prices()`. Successful responses are collected while failures are logged but don't stop the process.

#### 2. Grouping by Symbol
All price data is grouped by token symbol, regardless of source.

#### 3. Quality Control
- **Minimum Sources**: Requires at least 2 sources per token for reliability
- **Single Source**: Tokens with only 1 source are skipped entirely
- **No Sources**: Falls back to mock data for testing

#### 4. Weighted Average Calculation
The system calculates a weighted average using `calculate_weighted_averages()` which dynamically adjusts based on available sources. The total weight equals the number of successful sources.

#### 5. Quality Metrics
- **Standard Deviation**: Calculated for price variance assessment
- **Source Count**: Tracks how many sources contributed to each price
- **Timestamp**: Records when the price was last updated

### API Failure Handling

The system is designed to be resilient to individual API failures:

#### Failure Scenarios

**Scenario 1: Single API Failure**
```
✅ CoinGecko: 9 prices
❌ Binance: Connection timeout
✅ CoinCap: 9 prices  
✅ CryptoCompare: 9 prices

Result: BTC gets average from 3 sources (CoinGecko + CoinCap + CryptoCompare)
```

**Scenario 2: Multiple API Failures**
```
❌ CoinGecko: Rate limit exceeded
❌ Binance: Service unavailable
✅ CoinCap: 9 prices
✅ CryptoCompare: 9 prices

Result: BTC gets average from 2 sources (CoinCap + CryptoCompare)
```

**Scenario 3: Critical Failure**
```
❌ CoinGecko: Failed
❌ Binance: Failed  
❌ CoinCap: Failed
❌ CryptoCompare: Failed

Result: Falls back to mock data for testing
```

#### Benefits of This Approach

1. **🔄 Automatic Recalculation**: Averages adjust based on available sources
2. **🚫 No Stale Data**: Failed APIs don't contribute to calculations
3. **🛡️ Quality Control**: Minimum 2 sources required for reliability
4. **📊 Transparency**: Source count shows data quality
5. **⚡ Graceful Degradation**: System continues working with partial data

### API Endpoints

#### Price Management
- `update_prices()` - Updates all prices from all sources
- `get_current_prices()` - Gets current prices from cache
- `get_pair_price(symbol)` - Gets specific token price

#### Scheduler Control
- `start_price_scheduler()` - Starts automatic price updates (every second)
- `stop_price_scheduler()` - Stops automatic price updates

#### Debug & Testing
- `debug_test_external_apis()` - Tests all external API connections

### Usage Examples

#### Testing API Connectivity
```bash
dfx canister call backend debug_test_external_apis
# Returns: "✅ CoinGecko: 9 prices\n✅ Binance: 9 prices\n✅ CoinCap: 9 prices\n✅ CryptoCompare: 9 prices"
```

#### Manual Price Update
```bash
dfx canister call backend update_prices
# Returns: PriceUpdateResult with updated pairs and source statistics
```

#### Get Current Prices
```bash
dfx canister call backend get_current_prices
# Returns: JSON string with all cached prices
```

#### Get Specific Token Price
```bash
dfx canister call backend get_pair_price '("BTC")'
# Returns: TradingPair with price, timestamp, and source count
```

### Data Structures

#### PriceData
- `symbol` - Token symbol (e.g., "BTC")
- `price` - Price in USDT
- `timestamp` - Unix timestamp
- `source` - API source name

#### TradingPair
- `base` - Token symbol
- `quote` - Quote currency (USDT)
- `price` - Aggregated price
- `last_updated` - Last update timestamp
- `sources_count` - Number of sources used

#### PriceUpdateResult
- `pairs_updated` - Updated price pairs
- `total_sources` - Total configured sources
- `successful_sources` - Sources that succeeded
- `timestamp` - Update timestamp

## 🔧 Development

### Prerequisites
- Rust 1.70+
- dfx (Internet Computer SDK)
- Node.js (for testing scripts)

### Building
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Testing
```bash
# Run comprehensive oracle tests
npm run test:oracle

# Or run individual test script
node scripts/test-price-oracle.ts
```

### Deployment
```bash
# Deploy to local IC
dfx deploy backend

# Deploy to mainnet
dfx deploy backend --network ic
```

## 📝 Logging

The system provides comprehensive logging for debugging:

```
🔄 Starting price update from all sources...
   ✅ CoinGecko: 9 prices fetched
   ✅ Binance: 9 prices fetched  
   ✅ CoinCap: 4 prices fetched
   ✅ CryptoCompare: 4 prices fetched
   📊 Total prices collected: 26 from 4 sources
   📊 BTC: $45000.00 (avg from 3 sources, σ=$12.50)
   📊 ETH: $3000.00 (avg from 3 sources, σ=$8.75)
   🎉 Price update completed: 9 pairs updated
```

## 🚨 Error Handling

- **API Timeouts**: Individual API failures don't affect other sources
- **Rate Limiting**: Automatic retry with exponential backoff
- **Invalid Data**: Malformed responses are logged and skipped
- **Network Issues**: Graceful degradation with available sources
- **Cache Failures**: Fallback to mock data for testing

## 🔒 Security

- **API Keys**: Stored securely in environment variables
- **Rate Limiting**: Respects API provider limits
- **Data Validation**: All incoming data is validated before processing
- **Error Sanitization**: Sensitive information is not logged

## 📈 Performance

- **Parallel API Calls**: All sources are queried simultaneously
- **Caching**: Prices are cached to reduce API calls
- **Efficient Aggregation**: O(n) complexity for price calculations
- **Memory Management**: Automatic cleanup of old price data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
