// Lightweight Binance market data utilities for seeding bot price history
// NOTE: Public endpoints; no API key required. Keep limits conservative.

import { SupportedToken } from '../types';

export const BINANCE_SYMBOLS: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'XRP': 'XRPUSDT',
  'BNB': 'BNBUSDT',
  'SOL': 'SOLUSDT',
  'DOGE': 'DOGEUSDT',
  'ADA': 'ADAUSDT',
  'TRX': 'TRXUSDT',
  'ICP': 'ICPUSDT',
  'USDT': 'USDTUSDT', // placeholder; not fetched
};

type Kline = [
  number, // open time
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // close time
  string, // quote asset volume
  number, // number of trades
  string, // taker buy base asset volume
  string, // taker buy quote asset volume
  string  // ignore
];

// Fetch recent close prices from Binance for a token symbol
export async function fetchBinanceCloses(
  token: SupportedToken,
  interval: string = '1m',
  limit: number = 150
): Promise<number[]> {
  if (token === 'USDT') return [];
  const symbol = BINANCE_SYMBOLS[token] || 'BTCUSDT';
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as Kline[];
  if (!Array.isArray(data)) return [];
  return data.map(k => parseFloat(k[4]!)) // close
    .filter(n => Number.isFinite(n) && n > 0);
}


