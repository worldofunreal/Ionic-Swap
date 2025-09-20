// Test strategy logic with simulated price changes
const { STRATEGIES } = require('./strategies/index');

// Mock bot with simulated price history
const mockBot = {
  identity: { name: 'test-bot' },
  portfolio: {
    balances: {
      'BTC': 100000000n, // 1 BTC
      'USDT': 1000000000n, // 1000 USDT
    }
  },
  priceHistory: {
    'BTC': [115000, 115000, 115000, 115500], // +0.43% change
    'ETH': [4400, 4400, 4400, 4350], // -1.14% change
  }
};

// Mock market data
const mockMarketData = {
  prices: {
    'BTC': { price: 115500 },
    'ETH': { price: 4350 },
    'USDT': { price: 1.0 }
  }
};

console.log('🧪 TESTING STRATEGY LOGIC');
console.log('='.repeat(50));

// Test ScalperStrategy
const { ScalperStrategy } = require('./strategies/index');
const scalper = new ScalperStrategy();

console.log('\n📊 SCALPER STRATEGY TEST:');
console.log('BTC: 115000 → 115500 (+0.43%)');
console.log('ETH: 4400 → 4350 (-1.14%)');
console.log('Thresholds: sell >= 0.1%, buy <= -0.15%');

const decision = scalper.analyze(mockBot, mockMarketData);
console.log(`\nShould trade: ${decision.shouldTrade}`);
console.log(`Opportunities: ${decision.opportunities.length}`);
console.log(`Reason: ${decision.reason}`);

if (decision.opportunities.length > 0) {
  console.log('\n💡 OPPORTUNITIES FOUND:');
  decision.opportunities.forEach((opp, i) => {
    console.log(`${i+1}. ${opp.fromToken} → ${opp.toToken}`);
    console.log(`   Profit: ${opp.expectedProfitPercent.toFixed(2)}%`);
    console.log(`   Confidence: ${opp.confidence}`);
    console.log(`   Reason: ${opp.reason}`);
  });
} else {
  console.log('\n❌ NO OPPORTUNITIES - Why?');
  
  // Manual check
  const btcChange = ((115500 - 115000) / 115000) * 100;
  const ethChange = ((4350 - 4400) / 4400) * 100;
  
  console.log(`BTC change: ${btcChange.toFixed(3)}% (threshold: ${STRATEGIES.SCALPER.minProfitPercent}%)`);
  console.log(`ETH change: ${ethChange.toFixed(3)}% (buy threshold: -0.15%)`);
  
  console.log(`BTC should sell: ${btcChange >= STRATEGIES.SCALPER.minProfitPercent ? 'YES' : 'NO'}`);
  console.log(`ETH should buy: ${ethChange <= -0.15 ? 'YES' : 'NO'}`);
}
