//! Token Service
//! 
//! This service provides token configuration and number formatting functionality.
//! It mirrors the backend token configuration and provides consistent formatting across the app.

export interface TokenConfig {
  symbol: string
  name: string
  decimals: number
  displayDecimals: number  // How many decimals to show in UI
  formatType: 'currency' | 'crypto' | 'percentage'
  minDisplayValue: number  // Minimum value to show (for very small amounts)
}

// Token configurations matching the backend config.rs
export const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  USDT: { 
    symbol: 'USDT', 
    name: 'Tether USD', 
    decimals: 6, 
    displayDecimals: 2, 
    formatType: 'currency',
    minDisplayValue: 0.01
  },
  BTC: { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    decimals: 8, 
    displayDecimals: 6, 
    formatType: 'crypto',
    minDisplayValue: 0.000001
  },
  ETH: { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 18, 
    displayDecimals: 6, 
    formatType: 'crypto',
    minDisplayValue: 0.000001
  },
  SOL: { 
    symbol: 'SOL', 
    name: 'Solana', 
    decimals: 9, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01
  },
  ICP: { 
    symbol: 'ICP', 
    name: 'Internet Computer', 
    decimals: 8, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01
  },
  XRP: { 
    symbol: 'XRP', 
    name: 'XRP', 
    decimals: 6, 
    displayDecimals: 4, 
    formatType: 'crypto',
    minDisplayValue: 0.0001
  },
  BNB: { 
    symbol: 'BNB', 
    name: 'BNB', 
    decimals: 18, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01
  },
  DOGE: { 
    symbol: 'DOGE', 
    name: 'Dogecoin', 
    decimals: 8, 
    displayDecimals: 6, 
    formatType: 'crypto',
    minDisplayValue: 0.000001
  },
  ADA: { 
    symbol: 'ADA', 
    name: 'Cardano', 
    decimals: 6, 
    displayDecimals: 4, 
    formatType: 'crypto',
    minDisplayValue: 0.0001
  },
  TRX: { 
    symbol: 'TRX', 
    name: 'TRON', 
    decimals: 6, 
    displayDecimals: 4, 
    formatType: 'crypto',
    minDisplayValue: 0.0001
  },
}

export class TokenService {
  /**
   * Get token configuration by symbol
   */
  static getTokenConfig(symbol: string): TokenConfig | null {
    return TOKEN_CONFIGS[symbol] || null
  }

  /**
   * Check if a token symbol is supported
   */
  static isSupportedToken(symbol: string): boolean {
    return symbol in TOKEN_CONFIGS
  }

  /**
   * Get all supported token symbols
   */
  static getSupportedTokens(): string[] {
    return Object.keys(TOKEN_CONFIGS)
  }

  /**
   * Convert raw balance (from backend) to display value
   */
  static formatBalance(rawBalance: number, tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) {
      console.warn(`Unknown token symbol: ${tokenSymbol}`)
      return '0.00'
    }

    const balance = rawBalance / Math.pow(10, config.decimals)
    return this.formatNumber(balance, config.displayDecimals, config.formatType)
  }

  /**
   * Format a number with appropriate decimals and formatting
   */
  static formatNumber(value: number, decimals: number, formatType: 'currency' | 'crypto' | 'percentage'): string {
    if (isNaN(value) || !isFinite(value)) {
      return '0.00'
    }

    // Handle very small numbers
    if (value > 0 && value < 0.000001) {
      return value.toExponential(2)
    }

    // Format based on type
    switch (formatType) {
      case 'currency':
        return this.formatCurrency(value, decimals)
      case 'crypto':
        return this.formatCrypto(value, decimals)
      case 'percentage':
        return this.formatPercentage(value, decimals)
      default:
        return value.toFixed(decimals)
    }
  }

  /**
   * Format currency (USDT) with $ prefix and commas
   */
  static formatCurrency(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  /**
   * Format crypto amounts with commas and appropriate decimals
   */
  static formatCrypto(amount: number, decimals: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  /**
   * Format percentage values
   */
  static formatPercentage(value: number, decimals: number): string {
    return `${value.toFixed(decimals)}%`
  }

  /**
   * Format price for display (used in price displays)
   */
  static formatPrice(price: number, tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) {
      return '0.00'
    }

    // For prices, we typically want 2-4 decimals depending on the token
    let priceDecimals = 2
    if (price < 1) {
      priceDecimals = 4
    } else if (price < 0.01) {
      priceDecimals = 6
    }

    return this.formatCrypto(price, priceDecimals)
  }

  /**
   * Convert display amount back to raw amount for backend
   */
  static toRawAmount(displayAmount: number, tokenSymbol: string): number {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) {
      console.warn(`Unknown token symbol: ${tokenSymbol}`)
      return 0
    }

    return Math.floor(displayAmount * Math.pow(10, config.decimals))
  }

  /**
   * Get token decimals for calculations
   */
  static getTokenDecimals(tokenSymbol: string): number {
    const config = this.getTokenConfig(tokenSymbol)
    return config?.decimals || 6
  }

  /**
   * Get display decimals for UI
   */
  static getDisplayDecimals(tokenSymbol: string): number {
    const config = this.getTokenConfig(tokenSymbol)
    return config?.displayDecimals || 2
  }

  /**
   * Format balance for input fields (no commas, appropriate decimals)
   */
  static formatForInput(value: number, tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) {
      return '0.00'
    }

    return value.toFixed(config.displayDecimals)
  }

  /**
   * Get token name by symbol
   */
  static getTokenName(tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    return config?.name || tokenSymbol
  }

  /**
   * Get all token configs as array
   */
  static getAllTokenConfigs(): TokenConfig[] {
    return Object.values(TOKEN_CONFIGS)
  }

  /**
   * Get trading pairs (all tokens except USDT)
   */
  static getTradingPairs(): Array<{ symbol: string; name: string }> {
    return Object.values(TOKEN_CONFIGS)
      .filter(config => config.symbol !== 'USDT')
      .map(config => ({
        symbol: config.symbol,
        name: config.name
      }))
  }
}
