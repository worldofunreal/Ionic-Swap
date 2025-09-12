<template>
  <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col">
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

    <!-- Chart Grid Layout -->
    <div class="grid grid-cols-[80px_1fr] grid-rows-[1fr_40px] gap-0 w-full flex-1" :style="{ minHeight: (height + 40) + 'px' }">
      <!-- Y-axis labels area -->
      <div class="flex flex-col justify-between py-2 pr-2">
        <div v-for="(label, index) in priceLabels" :key="index" class="text-right text-xs text-gray-500 dark:text-gray-400" :style="{ height: (height / (priceLabels.length - 1)) + 'px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }">
          ${{ label.text }}
        </div>
      </div>
      
      <!-- Chart area -->
      <div class="relative">
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
          v-if="currentPrice > 0 && chartData.length > 0"
          :cx="lastPointPosition.x"
          :cy="lastPointPosition.y"
          r="4"
          fill="#3b82f6"
        />
        
      </svg>
      </div>
      
      <!-- X-axis labels area -->
      <div class="col-span-2 flex justify-between items-center px-2 py-1">
        <div v-for="(label, index) in timeLabels" :key="index" class="text-xs text-gray-500 dark:text-gray-400 text-center" :style="{ width: (100 / timeLabels.length) + '%' }">
          {{ label.text }}
        </div>
      </div>
    </div>

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

const lastPointPosition = computed(() => {
  if (chartData.value.length === 0) return { x: 0, y: 0 }
  
  const lastIndex = chartData.value.length - 1
  const x = (lastIndex / (chartData.value.length - 1)) * chartWidth
  const y = getYPosition(chartData.value[lastIndex]?.price || 0)
  
  return { x, y }
})

const timeLabels = computed(() => {
  if (chartData.value.length === 0) return []
  
  const labels = []
  const numLabels = 5 // Reduce to 5 labels to prevent overlap
  const usedTexts = new Set()
  
  for (let i = 0; i < numLabels; i++) {
    const index = Math.floor((i / (numLabels - 1)) * (chartData.value.length - 1))
    const dataPoint = chartData.value[index]
    if (dataPoint) {
      const x = (index / (chartData.value.length - 1)) * chartWidth
      const date = new Date(dataPoint.timestamp)
      let text = formatTimeLabel(date, selectedPeriod.value)
      
      // Ensure unique labels by adding index if duplicate
      let counter = 1
      let originalText = text
      while (usedTexts.has(text)) {
        text = `${originalText} (${counter})`
        counter++
      }
      usedTexts.add(text)
      
      labels.push({ x, text })
    }
  }
  
  return labels
})

const priceLabels = computed(() => {
  if (chartData.value.length === 0) return []
  
  const prices = chartData.value.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  
  if (priceRange === 0) return []
  
  const labels = []
  const numLabels = 4 // Reduce to 4 price labels to prevent cutoff
  
  for (let i = 0; i < numLabels; i++) {
    const price = minPrice + (i / (numLabels - 1)) * priceRange
    const y = getYPosition(price)
    const text = formatPrice(price)
    labels.push({ y, text })
  }
  
  return labels
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

const formatTimeLabel = (date: Date, period: string) => {
  // Round time to cleaner periods
  const roundedDate = new Date(date)
  
  switch (period) {
    case '1h':
      // Round to 15-minute intervals
      const minutes = roundedDate.getMinutes()
      const roundedMinutes = Math.round(minutes / 15) * 15
      roundedDate.setMinutes(roundedMinutes, 0, 0)
      
      const now = new Date()
      const isToday = roundedDate.toDateString() === now.toDateString()
      
      if (isToday) {
        return roundedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      } else {
        return roundedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    case '4h':
      // Round to 1-hour intervals
      roundedDate.setMinutes(0, 0, 0)
      
      const now4h = new Date()
      const isToday4h = roundedDate.toDateString() === now4h.toDateString()
      
      if (isToday4h) {
        return roundedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      } else {
        return roundedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    case '1d':
      // Round to day start
      roundedDate.setHours(0, 0, 0, 0)
      
      const now1d = new Date()
      const isToday1d = roundedDate.toDateString() === now1d.toDateString()
      const isYesterday1d = new Date(now1d.getTime() - 24 * 60 * 60 * 1000).toDateString() === roundedDate.toDateString()
      
      if (isToday1d) {
        return 'Today'
      } else if (isYesterday1d) {
        return 'Yesterday'
      } else {
        return roundedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }
    case '1w':
      // Round to day start
      roundedDate.setHours(0, 0, 0, 0)
      
      const now1w = new Date()
      const isToday1w = roundedDate.toDateString() === now1w.toDateString()
      const isYesterday1w = new Date(now1w.getTime() - 24 * 60 * 60 * 1000).toDateString() === roundedDate.toDateString()
      
      if (isToday1w) {
        return 'Today'
      } else if (isYesterday1w) {
        return 'Yesterday'
      } else {
        return roundedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }
    default:
      return roundedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
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

    if (response.success && Array.isArray((response as any).data)) {
      return (response as any).data.map((kline: unknown[]) => ({
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
  } catch (err) {
    console.error('Error initializing chart:', err)
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
