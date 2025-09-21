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
  iconPath: string  // Path to token icon in /public/icons/tokens/
}

// Token configurations matching the backend config.rs
export const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  USDT: { 
    symbol: 'USDT', 
    name: 'Tether USD', 
    decimals: 6, 
    displayDecimals: 2, 
    formatType: 'currency',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/usdt.svg'
  },
  BTC: { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    decimals: 8, 
    displayDecimals: 6, 
    formatType: 'crypto',
    minDisplayValue: 0.000001,
    iconPath: '/icons/tokens/bitcoin.svg'
  },
  ETH: { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 8, 
    displayDecimals: 6, 
    formatType: 'crypto',
    minDisplayValue: 0.000001,
    iconPath: '/icons/tokens/ethereum.svg'
  },
  SOL: { 
    symbol: 'SOL', 
    name: 'Solana', 
    decimals: 9, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/solana.svg'
  },
  ICP: { 
    symbol: 'ICP', 
    name: 'Internet Computer', 
    decimals: 8, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/icp.svg'
  },
  XRP: { 
    symbol: 'XRP', 
    name: 'XRP', 
    decimals: 6, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/xrp.svg'
  },
  BNB: { 
    symbol: 'BNB', 
    name: 'BNB', 
    decimals: 8, 
    displayDecimals: 4, 
    formatType: 'crypto',
    minDisplayValue: 0.0001,
    iconPath: '/icons/tokens/bnb.svg'
  },
  DOGE: { 
    symbol: 'DOGE', 
    name: 'Dogecoin', 
    decimals: 8, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/dogecoin.svg'
  },
  ADA: { 
    symbol: 'ADA', 
    name: 'Cardano', 
    decimals: 6, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/cardano.svg'
  },
  TRX: { 
    symbol: 'TRX', 
    name: 'TRON', 
    decimals: 6, 
    displayDecimals: 2, 
    formatType: 'crypto',
    minDisplayValue: 0.01,
    iconPath: '/icons/tokens/tron.svg'
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

  /**
   * Get token icon path by symbol
   */
  static getTokenIcon(tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    return config?.iconPath || '/icons/tokens/default.svg'
  }

  /**
   * Get token icon component props for img tag
   */
  static getTokenIconProps(tokenSymbol: string): { src: string; alt: string } {
    const config = this.getTokenConfig(tokenSymbol)
    return {
      src: config?.iconPath || '/icons/tokens/default.svg',
      alt: `${config?.name || tokenSymbol} icon`
    }
  }

  /**
   * Check if token has a custom icon
   */
  static hasTokenIcon(tokenSymbol: string): boolean {
    const config = this.getTokenConfig(tokenSymbol)
    return !!config?.iconPath
  }

  /**
   * Format large token amounts with B/M/K abbreviations (includes token symbol)
   */
  static formatLargeAmount(rawAmount: number | bigint, tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) return '0'
    
    const amount = Number(rawAmount) / Math.pow(10, config.decimals)
    
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B ${tokenSymbol}`
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M ${tokenSymbol}`
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K ${tokenSymbol}`
    } else {
      return `${amount.toFixed(config.displayDecimals)} ${tokenSymbol}`
    }
  }

  /**
   * Format large token amounts with B/M/K abbreviations (number only, no symbol)
   */
  static formatCompactBalance(rawAmount: number | bigint, tokenSymbol: string): string {
    const config = this.getTokenConfig(tokenSymbol)
    if (!config) return '0'
    
    const amount = Number(rawAmount) / Math.pow(10, config.decimals)
    
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K`
    } else {
      return amount.toFixed(config.displayDecimals)
    }
  }

  /**
   * Format large USD amounts with B/M/K abbreviations
   */
  static formatLargeUSD(amount: number): string {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1)}B`
    } else if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`
    } else if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`
    } else {
      return `$${amount.toFixed(2)}`
    }
  }
}
