<template>
  <div class="h-full bg-gray-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Trading Header -->
    <div class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {{ selectedToken?.symbol?.charAt(0) || 'B' }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">
                {{ selectedToken?.symbol || 'BTC' }}/USDT
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedToken?.name || 'Bitcoin' }}
              </div>
            </div>
          </div>
          
          <!-- Price Display -->
          <div class="flex items-center space-x-4">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              ${{ formatPrice(selectedToken?.price || 0) }}
            </div>
            <div class="flex items-center space-x-1" :class="priceChangeClass">
              <UIcon :name="priceChange >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="w-4 h-4" />
              <span class="font-semibold">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Token Selector -->
        <div class="flex items-center space-x-2">
          <USelect
            v-model="selectedTokenSymbol"
            :options="tokenOptions"
            option-attribute="label"
            value-attribute="value"
            class="w-32"
          />
        </div>
      </div>
    </div>

    <div class="flex h-full">
      <!-- Left Column - Chart -->
      <div class="flex-1 flex flex-col">
        <!-- Chart Controls -->
        <div class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex-shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button
                v-for="period in timePeriods"
                :key="period.value"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  selectedPeriod === period.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
                @click="selectedPeriod = period.value"
              >
                {{ period.label }}
              </button>
            </div>
            
            <div class="flex items-center space-x-2">
              <button class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
              </button>
              <button class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Chart Area -->
        <div class="flex-1 bg-white dark:bg-neutral-900 p-4 overflow-hidden">
          <SimplePriceChart 
            v-if="selectedTokenSymbol"
            :token-symbol="selectedTokenSymbol" 
            :default-chart-type="'candlestick'"
            :no-container="true"
            class="h-full"
          />
        </div>
      </div>

      <!-- Right Column - Trading Panel -->
      <div class="w-80 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <!-- Trading Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-800">
          <button
            v-for="tab in tradingTabs"
            :key="tab.value"
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Trading Form -->
        <div class="flex-1 p-4">
          <!-- Market Tab -->
          <div v-if="activeTab === 'market'" class="space-y-4">
            <!-- Buy Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Buy {{ selectedToken?.symbol || 'BTC' }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Balance: 0.00 USDT</span>
              </div>
              
              <div class="space-y-2">
                <div class="relative">
                  <input
                    v-model="buyAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <div class="absolute left-3 top-2 text-sm text-gray-500 dark:text-gray-400">USDT</div>
                </div>
                
                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
                    @click="setBuyAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>
              
              <button class="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors">
                Buy {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>

            <!-- Sell Section -->
            <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sell {{ selectedToken?.symbol || 'BTC' }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Balance: 0.00 {{ selectedToken?.symbol || 'BTC' }}</span>
              </div>
              
              <div class="space-y-2">
                <div class="relative">
                  <input
                    v-model="sellAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <div class="absolute left-3 top-2 text-sm text-gray-500 dark:text-gray-400">{{ selectedToken?.symbol || 'BTC' }}</div>
                </div>
                
                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
                    @click="setSellAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>
              
              <button class="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors">
                Sell {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>
          </div>

          <!-- Limit Tab -->
          <div v-if="activeTab === 'limit'" class="space-y-4">
            <!-- Buy Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Buy {{ selectedToken?.symbol || 'BTC' }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Balance: 0.00 USDT</span>
              </div>
              
              <div class="space-y-2">
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Price (USDT)</label>
                  <input
                    v-model="limitBuyPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount ({{ selectedToken?.symbol || 'BTC' }})</label>
                  <input
                    v-model="limitBuyAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Total: {{ (parseFloat(limitBuyPrice || '0') * parseFloat(limitBuyAmount || '0')).toFixed(2) }} USDT
                </div>
              </div>
              
              <button class="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors">
                Buy {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>

            <!-- Sell Section -->
            <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sell {{ selectedToken?.symbol || 'BTC' }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Balance: 0.00 {{ selectedToken?.symbol || 'BTC' }}</span>
              </div>
              
              <div class="space-y-2">
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Price (USDT)</label>
                  <input
                    v-model="limitSellPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount ({{ selectedToken?.symbol || 'BTC' }})</label>
                  <input
                    v-model="limitSellAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Total: {{ (parseFloat(limitSellPrice || '0') * parseFloat(limitSellAmount || '0')).toFixed(2) }} USDT
                </div>
              </div>
              
              <button class="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors">
                Sell {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>
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
const selectedTokenSymbol = ref('BTC')
const selectedPeriod = ref('1h')
const activeTab = ref('market')

// Trading form data
const buyAmount = ref('')
const sellAmount = ref('')
const limitBuyPrice = ref('')
const limitBuyAmount = ref('')
const limitSellPrice = ref('')
const limitSellAmount = ref('')

// Time periods
const timePeriods = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' }
]

// Trading tabs
const tradingTabs = [
  { label: 'Market', value: 'market' },
  { label: 'Limit', value: 'limit' }
]

// Token options
const tokenOptions = [
  { label: 'BTC/USDT', value: 'BTC' },
  { label: 'ETH/USDT', value: 'ETH' },
  { label: 'SOL/USDT', value: 'SOL' },
  { label: 'XRP/USDT', value: 'XRP' },
  { label: 'BNB/USDT', value: 'BNB' },
  { label: 'ADA/USDT', value: 'ADA' },
  { label: 'DOGE/USDT', value: 'DOGE' },
  { label: 'TRX/USDT', value: 'TRX' },
  { label: 'ICP/USDT', value: 'ICP' }
]

// Computed properties
const selectedToken = computed(() => {
  const prices = priceService.getPrices()
  return prices.get(selectedTokenSymbol.value)
})

const priceChange = computed(() => {
  return selectedToken.value?.change24h || 0
})

const priceChangeClass = computed(() => {
  if (priceChange.value > 0) return 'text-green-600 dark:text-green-400'
  if (priceChange.value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
})

// Helper functions
const formatPrice = (price: number) => {
  if (price === 0) return '0.00'
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  if (price < 100) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const setBuyAmount = (percent: number) => {
  // This would calculate based on available balance
  const balance = 1000 // Mock balance
  buyAmount.value = ((balance * percent) / 100).toFixed(2)
}

const setSellAmount = (percent: number) => {
  // This would calculate based on available token balance
  const balance = 0.1 // Mock balance
  sellAmount.value = ((balance * percent) / 100).toFixed(6)
}

// Lifecycle
onMounted(() => {
  // PriceService initializes automatically
})

// Page title
useHead({
  title: 'Trading - Ionic Swap'
})
</script>

<style scoped>
/* All styles are inline classes */
</style>
