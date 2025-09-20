import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import * as crypto from 'crypto';
import { TOKEN_DECIMALS, SupportedToken } from '../types';

// IMPORTANT: DO NOT USE DFX CLI CALLS!
// We use the same frontend imports/libraries (@dfinity/agent, @dfinity/principal)
// to call canister functions directly in TypeScript, just like the frontend does.
// This ensures we get the same response format and behavior as the frontend.

// ============================================================================
// IDENTITY UTILITIES
// ============================================================================

export const generateSeed = (name: string): Uint8Array => {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name.toLowerCase());
  
  let hash = 0;
  for (let i = 0; i < nameBytes.length; i++) {
    const char = nameBytes[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seed = Math.abs(hash).toString(16).padStart(8, '0');
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seedBytes[i] = parseInt(seed[i % seed.length] || '0', 16) * (i + 1) % 256;
  }
  
  return seedBytes;
};

export const generateBotIdentity = (name: string) => {
  const seed = generateSeed(name);
  const identity = Ed25519KeyIdentity.generate(seed);
  const principal = identity.getPrincipal();
  
  return {
    name,
    principal: principal.toText(),
    seed: Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''),
    identity, // Include the actual identity for signed calls
  };
};

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

export const formatTokenAmount = (amount: bigint, symbol: SupportedToken): string => {
  const decimals = TOKEN_DECIMALS[symbol] || 6;
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  return `${wholePart}.${fractionalPart.toString().padStart(decimals, '0')}`;
};

export const parseTokenAmount = (amount: string, symbol: SupportedToken): bigint => {
  const decimals = TOKEN_DECIMALS[symbol] || 6;
  const [whole = '0', fraction = '0'] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
};

export const calculateUsdValue = (amount: bigint, symbol: SupportedToken, price: number): number => {
  const displayAmount = parseFloat(formatTokenAmount(amount, symbol));
  return displayAmount * price;
};

// ============================================================================
// CANISTER UTILITIES - USING IC SDK (NOT DFX!)
// ============================================================================

// DO NOT USE DFX CLI CALLS! Use the same @dfinity/agent SDK as the frontend.
// Each bot needs their own authenticated actor with their own identity for signed calls.

// Create authenticated actor for a specific bot identity (same as frontend)
export const createBotActor = async (identity: Identity, canisterId: string) => {
  try {
    // Create agent with bot's identity for signed calls (same as frontend)
    const agent = new HttpAgent({
      host: 'http://127.0.0.1:4943', // Local IC network
      identity, // Use bot's identity for authentication
    });

    // Fetch root key for local development (same as frontend)
    await agent.fetchRootKey();

    // Import the IDL factory from declarations (same as frontend)
    const { idlFactory } = await import('../../src/declarations/backend');

    // Create the backend actor with bot's identity (same as frontend)
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    return actor;
  } catch (error) {
    throw new Error(`Failed to create bot actor: ${error}`);
  }
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

export const calculateProfitPercent = (currentValue: number, initialValue: number): number => {
  if (initialValue === 0) return 0;
  return ((currentValue - initialValue) / initialValue) * 100;
};

export const calculateSharpeRatio = (returns: number[], riskFreeRate: number = 0): number => {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  return (avgReturn - riskFreeRate) / stdDev;
};

export const calculateMaxDrawdown = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = values[0]!;
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    } else {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

export const log = {
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️  ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  success: (message: string, ...args: any[]) => {
    console.log(`✅ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  warning: (message: string, ...args: any[]) => {
    console.log(`⚠️  ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  trade: (message: string, ...args: any[]) => {
    console.log(`💰 ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  bot: (botName: string, message: string, ...args: any[]) => {
    console.log(`🤖 ${new Date().toISOString()} - [${botName}] ${message}`, ...args);
  }
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateTokenSymbol = (symbol: string): symbol is SupportedToken => {
  return Object.keys(TOKEN_DECIMALS).includes(symbol);
};

export const validateAmount = (amount: bigint): boolean => {
  return amount > 0n;
};

export const validateProfitPercent = (percent: number): boolean => {
  return percent >= 0 && percent <= 1000; // Max 1000% profit
};

// ============================================================================
// TIME UTILITIES
// ============================================================================

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateTradeId = (): string => {
  return crypto.randomUUID();
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export class BotError extends Error {
  constructor(
    message: string,
    public readonly botName?: string,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class CanisterError extends Error {
  constructor(
    message: string,
    public readonly method?: string,
    public readonly canisterId?: string
  ) {
    super(message);
    this.name = 'CanisterError';
  }
}

export const handleError = (error: unknown, context: string): never => {
  if (error instanceof Error) {
    throw new BotError(`${context}: ${error.message}`);
  } else {
    throw new BotError(`${context}: Unknown error occurred`);
  }
};
