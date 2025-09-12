<template>
  <div class="flex h-full bg-gray-50 dark:bg-neutral-950">
    <!-- Main Content Area -->
    <div class="flex-1 w-0 flex flex-col overflow-hidden">
      <!-- Markets Header -->
      <div class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Markets</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Real-time cryptocurrency prices and trading data</p>
          <div v-if="isUsingMockData" class="mt-2">
            <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1" />
              Demo data (API restricted in your region)
            </div>
          </div>
        </div>
        
        <!-- Search Bar -->
        <div class="flex items-center space-x-4">
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tokens..."
              class="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
        </div>
      </div>
    </div>

      <!-- Horizontal Token List -->
      <div class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div class="px-4 py-3">
        <div class="w-full overflow-x-auto scrollbar-hide pb-2" style="scrollbar-width: none; -ms-overflow-style: none;">
          <div class="flex space-x-3 w-max">
            <div
              v-for="token in filteredTokens"
              :key="token.symbol"
              class="flex-shrink-0 cursor-pointer group"
              @click="selectToken(token.symbol)"
            >
              <div class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors w-36"
                   :class="selectedToken === token.symbol 
                     ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                     : 'hover:bg-gray-50 dark:hover:bg-neutral-800'">
              <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <UIcon :name="getTokenIcon(token.symbol)" class="w-5 h-5" />
              </div>
                <div class="text-left min-w-0">
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">{{ token.symbol }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ getTokenName(token.symbol) }}</div>
                </div>
                <div class="text-right min-w-0">
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">${{ formatPrice(token.price) }}</div>
                  <div class="text-xs" :class="token.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
      </div>
        </div>
      </div>
        </div>
        
      <!-- Main Content Area -->
      <div class="flex-1 p-6 overflow-auto">
            <!-- Selected Token Chart -->
            <div v-if="selectedToken" class="mb-6 flex-1 flex flex-col">
        <div class="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <UIcon :name="getTokenIcon(selectedToken)" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedToken }}/USDT</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ getTokenName(selectedToken) }}</p>
              </div>
            </div>
            <NuxtLink
              :to="`/tokens/${selectedToken}`"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Trade {{ selectedToken }}
            </NuxtLink>
          </div>
              <SimplePriceChart :key="selectedToken" :token-symbol="selectedToken" :height="400" class="flex-1" />
            </div>
      </div>

      <!-- Token Data Table -->
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">All Tokens</h3>
        </div>
        <div class="overflow-x-auto max-w-full">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h Change</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h Volume</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="token in filteredTokens"
                :key="token.symbol"
                class="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <td class="px-4 py-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                      <UIcon :name="getTokenIcon(token.symbol)" class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">{{ token.symbol }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ getTokenName(token.symbol) }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="font-semibold text-gray-900 dark:text-white">${{ formatPrice(token.price) }}</div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="font-semibold" :class="token.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="text-gray-900 dark:text-white">${{ formatVolume(token.volume24h) }}</div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      class="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      @click="selectToken(token.symbol)"
                    >
                      Chart
                    </button>
                    <NuxtLink
                      :to="`/tokens/${token.symbol}`"
                      class="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                    >
                      Trade
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { priceService } from '@/services/PriceService'
  import SimplePriceChart from '@/components/SimplePriceChart.vue'

// Reactive data
  const selectedToken = ref<string | null>(null)
const searchQuery = ref('')
const isUsingMockData = ref(false)

// Token configuration
const tokenConfig = {
  'BTC': { name: 'Bitcoin', icon: 'logos:bitcoin' },
  'ETH': { name: 'Ethereum', icon: 'token-branded:ethereum' },
  'XRP': { name: 'XRP', icon: 'cryptocurrency-color:xrp' },
  'USDT': { name: 'Tether', icon: 'cryptocurrency-color:usdt' },
  'BNB': { name: 'BNB', icon: 'token-branded:binance' },
  'SOL': { name: 'Solana', icon: 'token-branded:solana' },
  'USDC': { name: 'USD Coin', icon: 'cryptocurrency-color:usdc' },
  'DOGE': { name: 'Dogecoin', icon: 'simple-icons:dogecoin' },
  'ADA': { name: 'Cardano', icon: 'logos:cardano-icon' },
  'TRX': { name: 'TRON', icon: 'token-branded:tron' },
  'ICP': { name: 'Internet Computer', icon: 'token-branded:icp' },
}

// Computed properties
const tokens = computed(() => {
  const prices = priceService.getPrices()
  return Array.from(prices.values()).map(token => ({
    ...token,
    name: getTokenName(token.symbol),
    icon: getTokenIcon(token.symbol)
  }))
})

const filteredTokens = computed(() => {
  if (!searchQuery.value) return tokens.value
  
  const query = searchQuery.value.toLowerCase()
  return tokens.value.filter(token => 
    token.symbol.toLowerCase().includes(query) ||
    token.name.toLowerCase().includes(query)
  )
})

// Helper functions
const getTokenName = (symbol: string) => {
  return tokenConfig[symbol as keyof typeof tokenConfig]?.name || symbol
}

const getTokenIcon = (symbol: string) => {
  return tokenConfig[symbol as keyof typeof tokenConfig]?.icon || 'cryptocurrency-color:generic'
}

const formatPrice = (price: number) => {
  if (price === 0) return '0.00'
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  if (price < 100) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const formatVolume = (volume: number) => {
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B'
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M'
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K'
  return volume.toFixed(2)
}

const selectToken = (symbol: string) => {
    selectedToken.value = symbol
}

// Lifecycle
onMounted(() => {
  // Select first token by default
  if (tokens.value.length > 0 && !selectedToken.value) {
    selectedToken.value = tokens.value[0]?.symbol || null
  }
  
  // Check if we're using mock data (prices are exactly the mock values)
  const btcPrice = tokens.value.find(t => t.symbol === 'BTC')?.price
  if (btcPrice === 45000) {
    isUsingMockData.value = true
  }
})

// Page title
useHead({
  title: 'Markets - Ionic Swap'
})
</script>

<style scoped>
/* Hide scrollbar for horizontal token list */
.scrollbar-hide {
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar { 
  display: none;  /* Safari and Chrome */
}

/* Ensure smooth scrolling */
.overflow-x-auto {
  scroll-behavior: smooth;
}
</style>
