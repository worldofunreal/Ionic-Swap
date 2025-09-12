<template>
  <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center mb-4">
      <div class="flex flex-col">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ tokenSymbol }}</div>
        <div class="text-lg font-semibold flex items-center gap-2" :class="priceChangeClass">
          ${{ formatPrice(currentPrice) }}
          <span class="text-sm">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          v-for="period in timePeriods"
          :key="period.value"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            selectedPeriod === period.value 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Simple SVG Chart -->
    <div class="relative w-full" :style="{ height: height + 'px' }">
      <svg 
        v-if="chartData.length > 0" 
        class="w-full h-full"
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        preserveAspectRatio="none"
      >
        <!-- Grid lines -->
        <defs>
          <pattern id="grid" width="80" height="20" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Price line -->
        <polyline
          :points="priceLinePoints"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
        />
        
        <!-- Price area fill -->
        <polygon
          :points="areaPoints"
          fill="url(#gradient)"
          opacity="0.1"
        />
        
        <!-- Gradient definition -->
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
          </linearGradient>
        </defs>
        
        <!-- Current price point -->
        <circle
          v-if="currentPrice > 0"
          :cx="chartWidth - 20"
          :cy="getYPosition(currentPrice)"
          r="4"
          fill="#3b82f6"
        />
      </svg>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400" :style="{ height: height + 'px' }">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        <span>Loading chart data...</span>
      </div>

      <!-- Error state -->
      <div v-if="error" class="flex items-center justify-center gap-2 text-red-500" :style="{ height: height + 'px' }">
        <span>Failed to load chart data</span>
        <button class="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors" @click="refreshChart">Retry</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { priceService } from '@/services/PriceService'

interface Props {
  tokenSymbol: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

// Reactive data
const loading = ref(false)
const error = ref(false)
const currentPrice = ref(0)
const priceChange = ref(0)
const chartData = ref<Array<{ timestamp: number; price: number }>>([])
const selectedPeriod = ref('1h')

// Chart dimensions
const chartWidth = 800
const chartHeight = 200

// Time periods
const timePeriods = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' }
]

// Computed properties
const priceChangeClass = computed(() => {
  if (priceChange.value > 0) return 'text-green-600 dark:text-green-400'
  if (priceChange.value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
})

// Chart rendering
const priceLinePoints = computed(() => {
  if (chartData.value.length === 0) return ''
  
  const points = chartData.value.map((point, index) => {
    const x = (index / (chartData.value.length - 1)) * chartWidth
    const y = getYPosition(point.price)
    return `${x},${y}`
  })
  
  return points.join(' ')
})

const areaPoints = computed(() => {
  if (chartData.value.length === 0) return ''
  
  const linePoints = priceLinePoints.value
  const firstPoint = chartData.value[0]
  const lastPoint = chartData.value[chartData.value.length - 1]
  
  return `0,${chartHeight} ${linePoints} ${chartWidth},${chartHeight}`
})

// Helper functions
const getYPosition = (price: number) => {
  if (chartData.value.length === 0) return chartHeight / 2
  
  const prices = chartData.value.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  
  if (priceRange === 0) return chartHeight / 2
  
  const normalizedPrice = (price - minPrice) / priceRange
  return chartHeight - (normalizedPrice * chartHeight)
}

const formatPrice = (price: number) => {
  if (price === 0) return '0.00'
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  if (price < 100) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// Fetch historical data
const fetchHistoricalData = async () => {
  const binanceSymbol = getBinanceSymbol(props.tokenSymbol)
  if (!binanceSymbol) return []

  try {
    const response = await $fetch('/api/binance/klines', {
      query: {
        symbol: binanceSymbol,
        interval: getInterval(selectedPeriod.value),
        limit: 100
      }
    })

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((kline: unknown[]) => ({
        timestamp: kline[0] as number,
        price: parseFloat(kline[4] as string) // Close price
      }))
    }
    return []
  } catch (err) {
    console.error('Failed to fetch historical data:', err)
    throw err
  }
}

const getBinanceSymbol = (symbol: string) => {
  const symbolMap: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'XRP': 'XRPUSDT',
    'BNB': 'BNBUSDT',
    'SOL': 'SOLUSDT',
    'USDC': 'USDCUSDT',
    'DOGE': 'DOGEUSDT',
    'ADA': 'ADAUSDT',
    'TRX': 'TRXUSDT',
    'ICP': 'ICPUSDT'
  }
  return symbolMap[symbol] || null
}

const getInterval = (period: string) => {
  const intervalMap: Record<string, string> = {
    '1h': '1m',
    '4h': '5m',
    '1d': '1h',
    '1w': '4h'
  }
  return intervalMap[period] || '1h'
}

// Load chart data
const loadChartData = async () => {
  loading.value = true
  error.value = false
  
  try {
    const data = await fetchHistoricalData()
    chartData.value = data
    
    // Set current price from latest data
    if (data.length > 0) {
      const latest = data[data.length - 1]
      const previous = data[Math.max(0, data.length - 2)]
      currentPrice.value = latest.price
      priceChange.value = ((latest.price - previous.price) / previous.price) * 100
    }
  } catch (err) {
    console.error('Failed to load chart data:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Refresh chart
const refreshChart = () => {
  loadChartData()
}

// Price update subscription
let unsubscribe: (() => void) | null = null

const subscribeToPriceUpdates = () => {
  unsubscribe = priceService.subscribe((prices) => {
    const tokenPrice = prices.get(props.tokenSymbol)
    if (tokenPrice) {
      currentPrice.value = tokenPrice.price
      priceChange.value = tokenPrice.change24h
    }
  })
}

// Watch for period changes
watch(selectedPeriod, () => {
  loadChartData()
})

// Watch for token symbol changes
watch(() => props.tokenSymbol, () => {
  // Unsubscribe from previous token updates
  if (unsubscribe) {
    unsubscribe()
  }
  // Load new chart data and subscribe to new token updates
  loadChartData()
  subscribeToPriceUpdates()
}, { immediate: false })

// Lifecycle
onMounted(async () => {
  try {
    subscribeToPriceUpdates()
    await loadChartData()
  } catch (error) {
    console.error('Error initializing chart:', error)
    error.value = true
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
/* All styles moved to inline classes in template */
</style>
