import * as fs from 'fs';
import * as path from 'path';
import { SupportedToken, TOKEN_DECIMALS } from '../types';
import { log } from '../utils';

export interface CostBasisEntry {
  avgCostUsd: number; // average cost in USDT per 1 token
  quantity: bigint;   // raw on-chain quantity (with token decimals)
}

export interface BotState {
  botName: string;
  realizedPnlUsd: number;
  costBasis: Record<string, CostBasisEntry>; // token -> entry
  lastUpdated: number;
}

const STATE_DIR = path.resolve(process.cwd(), 'bots_state');

function ensureDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

export class StateStore {
  static load(botName: string): BotState {
    ensureDir();
    const file = path.join(STATE_DIR, `${botName}.json`);
    if (!fs.existsSync(file)) {
      return {
        botName,
        realizedPnlUsd: 0,
        costBasis: {},
        lastUpdated: Date.now(),
      };
    }
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw, (key, value) => {
        // Convert quantity strings back to BigInt
        if (key === 'quantity' && typeof value === 'string') {
          return BigInt(value);
        }
        return value;
      }) as BotState;
      return parsed;
    } catch (error) {
      log.error(`Failed to load state for ${botName}:`, error);
      return {
        botName,
        realizedPnlUsd: 0,
        costBasis: {},
        lastUpdated: Date.now(),
      };
    }
  }

  static save(state: BotState): void {
    try {
      ensureDir();
      const file = path.join(STATE_DIR, `${state.botName}.json`);
      // Handle BigInt serialization
      const serialized = JSON.stringify(state, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2);
      fs.writeFileSync(file, serialized, 'utf8');
    } catch (error) {
      log.error(`Failed to save state for ${state.botName}:`, error);
    }
  }

  static initMissingFromHoldings(
    state: BotState,
    balances: Record<string, bigint>,
    prices: Record<string, { price: number }>
  ): BotState {
    const updated: BotState = { ...state };
    for (const [symbol, qty] of Object.entries(balances)) {
      if (symbol === 'USDT') continue;
      if (!updated.costBasis[symbol]) {
        const price = prices[symbol]?.price;
        if (price && qty > 0n) {
          updated.costBasis[symbol] = {
            avgCostUsd: price, // assume current price as initial cost if unknown
            quantity: qty,
          };
          updated.lastUpdated = Date.now();
        }
      }
    }
    return updated;
  }

  static onBuy(
    state: BotState,
    token: SupportedToken,
    buyQty: bigint,
    execPriceUsd: number
  ): BotState {
    const current = state.costBasis[token];
    const updated: BotState = { ...state, costBasis: { ...state.costBasis } };
    if (!current) {
      updated.costBasis[token] = {
        avgCostUsd: execPriceUsd,
        quantity: buyQty,
      };
    } else {
      const oldQty = current.quantity;
      const newQty = oldQty + buyQty;
      const decimals = TOKEN_DECIMALS[token] || 6;
      const oldQtyNorm = Number(oldQty) / Math.pow(10, decimals);
      const buyQtyNorm = Number(buyQty) / Math.pow(10, decimals);
      const totalCost = current.avgCostUsd * oldQtyNorm + execPriceUsd * buyQtyNorm;
      const newAvg = newQty > 0n ? totalCost / (oldQtyNorm + buyQtyNorm) : current.avgCostUsd;
      updated.costBasis[token] = {
        avgCostUsd: newAvg,
        quantity: newQty,
      };
    }
    updated.lastUpdated = Date.now();
    return updated;
  }

  static onSell(
    state: BotState,
    token: SupportedToken,
    sellQty: bigint,
    execPriceUsd: number
  ): BotState {
    const current = state.costBasis[token];
    const updated: BotState = { ...state, costBasis: { ...state.costBasis } };
    if (!current) {
      // No cost basis tracked; skip P&L calculation
      return updated;
    }
    const decimals = TOKEN_DECIMALS[token] || 6;
    const sellQtyNorm = Number(sellQty) / Math.pow(10, decimals);
    const pnl = (execPriceUsd - current.avgCostUsd) * sellQtyNorm;
    updated.realizedPnlUsd += pnl;

    const remaining = current.quantity - sellQty;
    updated.costBasis[token] = {
      avgCostUsd: current.avgCostUsd,
      quantity: remaining > 0n ? remaining : 0n,
    };
    if (remaining <= 0n) {
      // Remove entry if fully sold
      delete updated.costBasis[token];
    }
    updated.lastUpdated = Date.now();
    return updated;
  }
}


