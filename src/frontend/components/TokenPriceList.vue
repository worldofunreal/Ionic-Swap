<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Token Prices</h3>
      <UButton
        size="xs"
        variant="ghost"
        icon="i-heroicons-arrow-path"
        @click="refreshPrices"
        :loading="loading"
      />
    </div>
    
    <div class="space-y-3">
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        @click="selectToken(token)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm">
            {{ token.symbol.charAt(0) }}
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">{{ token.symbol }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ token.name }}</div>
          </div>
        </div>
        
        <div class="text-right">
          <div class="font-semibold text-gray-900 dark:text-white">
            ${{ token.price.toFixed(4) }}
          </div>
          <div 
            class="text-xs flex items-center gap-1"
            :class="token.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon 
              :name="token.change >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-3 h-3"
            />
            {{ Math.abs(token.change).toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Last updated: {{ lastUpdated }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Token {
  symbol: string
  name: string
  price: number
  change: number
  chains: string[]
}

const loading = ref(false)
const lastUpdated = ref('')

// Token list from todo - these will be the tokens we support
const tokens = ref<Token[]>([
  { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'XRP', name: 'XRP', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'USDT', name: 'Tether', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'BNB', name: 'BNB', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'SOL', name: 'Solana', price: 0, change: 0, chains: ['Solana', 'ICP'] },
  { symbol: 'USDC', name: 'USD Coin', price: 0, change: 0, chains: ['EVM', 'Solana', 'ICP'] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'ADA', name: 'Cardano', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'TRX', name: 'TRON', price: 0, change: 0, chains: ['EVM', 'ICP'] },
  { symbol: 'ICP', name: 'Internet Computer', price: 0, change: 0, chains: ['ICP'] },
])

// Mock price data for now - will be replaced with real API calls
const mockPrices = {
  'BTC': { price: 43250.50, change: 2.45 },
  'ETH': { price: 2650.75, change: -1.23 },
  'XRP': { price: 0.6234, change: 3.67 },
  'USDT': { price: 1.0001, change: 0.01 },
  'BNB': { price: 315.80, change: 1.89 },
  'SOL': { price: 98.45, change: -2.34 },
  'USDC': { price: 1.0000, change: 0.00 },
  'DOGE': { price: 0.08234, change: 5.67 },
  'ADA': { price: 0.4567, change: -0.89 },
  'TRX': { price: 0.1234, change: 1.23 },
  'ICP': { price: 12.45, change: 2.34 },
}

const refreshPrices = async () => {
  loading.value = true
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update prices with mock data
    tokens.value = tokens.value.map(token => {
      const mockData = mockPrices[token.symbol as keyof typeof mockPrices]
      if (mockData) {
        return {
          ...token,
          price: mockData.price,
          change: mockData.change
        }
      }
      return token
    })
    
    lastUpdated.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Failed to fetch prices:', error)
  } finally {
    loading.value = false
  }
}

const selectToken = (token: Token) => {
  // Emit event or navigate to token details
  console.log('Selected token:', token)
  // TODO: Implement token selection logic
}

// Initialize with mock data
onMounted(() => {
  refreshPrices()
})
</script>

<style scoped>
/* Custom gradient backgrounds for token icons */
.bg-gradient-to-br {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
