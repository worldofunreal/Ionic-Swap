interface TokenPrice {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: number
}

interface BinanceTickerResponse {
  symbol: string
  price: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  askPrice: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

// Token mapping from your tokens to Binance symbols
const TOKEN_SYMBOLS: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT', 
  'XRP': 'XRPUSDT',
  'BNB': 'BNBUSDT',
  'SOL': 'SOLUSDT',
  'USDC': 'USDCUSDT',
  'DOGE': 'DOGEUSDT', // Dogecoin
  'ADA': 'ADAUSDT', // Cardano
  'TRX': 'TRXUSDT', // TRON
  'ICP': 'ICPUSDT',
}

class PriceService {
  private prices: Map<string, TokenPrice> = new Map()
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private updateCallbacks: Set<(prices: Map<string, TokenPrice>) => void> = new Set()
  private isInitialized = false

  constructor() {
    if (!this.isInitialized) {
      this.initializeWebSocket()
      this.isInitialized = true
    }
  }

  // Get current prices
  getPrices(): Map<string, TokenPrice> {
    return new Map(this.prices)
  }

  // Get price for specific token
  getTokenPrice(symbol: string): TokenPrice | undefined {
    return this.prices.get(symbol.toUpperCase())
  }

  // Subscribe to price updates
  subscribe(callback: (prices: Map<string, TokenPrice>) => void): () => void {
    this.updateCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback)
    }
  }

  // Fetch initial prices from REST API
  async fetchInitialPrices(): Promise<void> {
    try {
      const symbols = Object.values(TOKEN_SYMBOLS)
      const symbolsArray = JSON.stringify(symbols)
      
      // console.log('PriceService: Fetching prices for symbols:', symbols)
      // console.log('PriceService: JSON array:', symbolsArray)
      
      const response = await $fetch('/api/binance/ticker', {
        query: { symbols: symbolsArray }
      })
      
      if (!response.success) {
        throw new Error('Failed to fetch ticker data')
      }

      const data: BinanceTickerResponse[] = response.data
      // console.log('PriceService: Received ticker data:', data.length, 'items')
      
      data.forEach((ticker) => {
        const tokenSymbol = this.getTokenSymbolFromBinance(ticker.symbol)
        if (tokenSymbol) {
          this.prices.set(tokenSymbol, {
            symbol: tokenSymbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume),
            timestamp: Date.now()
          })
        }
      })

      // console.log('PriceService: Updated prices for', this.prices.size, 'tokens')
      this.notifySubscribers()
    } catch (error) {
      console.error('PriceService: Failed to fetch initial prices:', error)
      console.log('PriceService: Using fallback mock data due to API restrictions')
      this.loadMockData()
    }
  }

  private loadMockData(): void {
    // Mock data for when Binance API is unavailable (e.g., geographic restrictions)
    const mockPrices = [
      { symbol: 'BTC', price: 45000, change24h: 2.5, volume24h: 25000000000 },
      { symbol: 'ETH', price: 3200, change24h: 1.8, volume24h: 15000000000 },
      { symbol: 'SOL', price: 180, change24h: 5.2, volume24h: 3000000000 },
      { symbol: 'XRP', price: 0.65, change24h: -1.2, volume24h: 2000000000 },
      { symbol: 'BNB', price: 320, change24h: 3.1, volume24h: 1800000000 },
      { symbol: 'ADA', price: 0.45, change24h: 2.8, volume24h: 1200000000 },
      { symbol: 'DOGE', price: 0.08, change24h: 8.5, volume24h: 800000000 },
      { symbol: 'TRX', price: 0.12, change24h: 1.5, volume24h: 600000000 },
      { symbol: 'ICP', price: 12.5, change24h: -0.8, volume24h: 400000000 },
      { symbol: 'USDC', price: 1.00, change24h: 0.01, volume24h: 5000000000 },
    ]

    mockPrices.forEach((mock) => {
      this.prices.set(mock.symbol, {
        symbol: mock.symbol,
        price: mock.price,
        change24h: mock.change24h,
        volume24h: mock.volume24h,
        timestamp: Date.now()
      })
    })

    console.log('PriceService: Loaded mock data for', this.prices.size, 'tokens')
    this.notifySubscribers()
  }

  // Initialize WebSocket connection for real-time updates
  private initializeWebSocket(): void {
    // For now, skip WebSocket and use periodic REST API calls
    // WebSocket can be enabled later if needed
    console.log('Using periodic REST API calls instead of WebSocket')
    this.startPeriodicFetch()
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: unknown): void {
    if (data && typeof data === 'object' && 'stream' in data && 'data' in data) {
      const ticker = (data as { data: Record<string, unknown> }).data
      const tokenSymbol = this.getTokenSymbolFromBinance(ticker.s as string)
      
      if (tokenSymbol) {
        this.prices.set(tokenSymbol, {
          symbol: tokenSymbol,
          price: parseFloat(ticker.c as string), // Last price
          change24h: parseFloat(ticker.P as string), // Price change percent
          volume24h: parseFloat(ticker.v as string), // Volume
          timestamp: Date.now()
        })
        
        this.notifySubscribers()
      }
    }
  }

  // Get token symbol from Binance symbol
  private getTokenSymbolFromBinance(binanceSymbol: string): string | null {
    for (const [token, binance] of Object.entries(TOKEN_SYMBOLS)) {
      if (binance === binanceSymbol) {
        return token
      }
    }
    return null
  }

  // Notify all subscribers of price updates
  private notifySubscribers(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(new Map(this.prices))
      } catch (error) {
        console.error('Error in price update callback:', error)
      }
    })
  }

  // Attempt to reconnect WebSocket
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.initializeWebSocket()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached. Falling back to periodic REST API calls.')
      this.startPeriodicFetch()
    }
  }

  // Periodic REST API calls for real-time updates
  private startPeriodicFetch(): void {
    // Fetch initial prices immediately
    this.fetchInitialPrices()
    
    // Then fetch every 30 seconds (less aggressive)
    setInterval(() => {
      this.fetchInitialPrices()
    }, 30000)
  }

  // Cleanup
  destroy(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.updateCallbacks.clear()
    this.prices.clear()
  }

  // Reset the singleton instance
  static reset(): void {
    if (priceServiceInstance) {
      priceServiceInstance.destroy()
      priceServiceInstance = null
    }
  }
}

// Export singleton instance
let priceServiceInstance: PriceService | null = null

export const priceService = (() => {
  if (!priceServiceInstance) {
    priceServiceInstance = new PriceService()
  }
  return priceServiceInstance
})()

// Global reset function for debugging
if (typeof window !== 'undefined') {
  (window as any).resetPriceService = () => {
    console.log('Resetting PriceService...')
    PriceService.reset()
    location.reload()
  }
}

// Export types
export type { TokenPrice }
