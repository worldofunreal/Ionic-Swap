import { Principal } from '@dfinity/principal';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import { TOKEN_DECIMALS, SupportedToken } from '../types';

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
  const principal = Principal.selfAuthenticating(seed);
  
  return {
    name,
    principal: principal.toText(),
    seed: Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''),
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
// CANISTER UTILITIES
// ============================================================================

export const callCanister = (canisterId: string, method: string, args: string = ''): string => {
  try {
    const fullArgs = args ? ` '${args}'` : '';
    const cmd = `dfx canister call ${canisterId} ${method}${fullArgs}`;
    const result = execSync(cmd, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000, // 30 second timeout
      shell: '/bin/bash' // Use bash to handle the command properly
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Canister call failed: ${method} - ${error}`);
  }
};

export const parseCanisterResult = <T>(result: string): T => {
  try {
    // Handle variant { Ok = "..." } wrapper - capture everything between quotes
    const variantMatch = result.match(/variant\s*\{\s*Ok\s*=\s*"((?:[^"\\]|\\.)*)"/s);
    if (variantMatch) {
      const jsonStr = variantMatch[1]!.replace(/\\\"/g, '"');
      return JSON.parse(jsonStr);
    }
    
    // Handle Ok() wrapper
    const okMatch = result.match(/Ok\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)/s);
    if (okMatch) {
      const jsonStr = okMatch[1]!.replace(/\\\"/g, '"');
      return JSON.parse(jsonStr);
    }
    
    // Handle direct JSON
    const jsonMatch = result.match(/"((?:[^"\\]|\\.)*)"/s);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1]!.replace(/\\\"/g, '"');
      return JSON.parse(jsonStr);
    }
    
    throw new Error('Could not parse canister result');
  } catch (error) {
    throw new Error(`Failed to parse canister result: ${error}`);
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
