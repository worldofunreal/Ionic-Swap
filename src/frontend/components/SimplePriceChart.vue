<template>
  <div :class="[
    'w-full h-full flex flex-col',
    !noContainer ? 'bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700' : ''
  ]">
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
        <!-- Chart Type Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              chartType === 'line' 
                ? 'bg-primary-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="chartType = 'line'"
          >
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              chartType === 'candlestick' 
                ? 'bg-primary-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="chartType = 'candlestick'"
          >
            <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4" />
          </button>
        </div>
        
        <!-- Time Period Buttons -->
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
    </div>

    <!-- Chart Grid Layout -->
    <div class="grid grid-cols-[80px_1fr] grid-rows-[1fr_40px] gap-0 w-full flex-1" :style="{ minHeight: (height + 40) + 'px' }">
      <!-- Y-axis labels area -->
      <div class="flex flex-col justify-between py-2 pr-2">
        <div v-for="(label, index) in priceLabels" :key="index" class="text-right text-xs text-gray-500 dark:text-gray-400" :style="{ height: (height / (priceLabels.length - 1)) + 'px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }">
          ${{ priceLabels[priceLabels.length - 1 - index].text }}
        </div>
      </div>
      
      <!-- Chart area -->
      <div class="relative">
        <svg 
          v-if="chartData.length > 0" 
          :key="`chart-${colorTheme}-${themeUpdateTrigger}`"
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
        
        <!-- Line Chart -->
        <template v-if="chartType === 'line'">
          <!-- Price line -->
          <polyline
            :points="priceLinePoints"
            fill="none"
            :stroke="chartColors.primary"
            stroke-width="2"
          />
          
          <!-- Price area fill -->
          <polygon
            :points="areaPoints"
            fill="url(#gradient)"
            opacity="0.1"
          />
        </template>
        
        <!-- Candlestick Chart -->
        <template v-else-if="chartType === 'candlestick'">
          <g v-for="(candle, index) in candlestickData" :key="index">
            <!-- Candlestick body -->
            <rect
              :x="candle.x - candleWidth/2"
              :y="candle.bodyTop"
              :width="candleWidth"
              :height="candle.bodyHeight"
              :fill="candle.isGreen ? chartColors.primary : '#ef4444'"
              :stroke="candle.isGreen ? chartColors.primary : '#ef4444'"
              stroke-width="1"
            />
            <!-- Upper wick -->
            <line
              :x1="candle.x"
              :y1="candle.wickTop"
              :x2="candle.x"
              :y2="candle.bodyTop"
              :stroke="candle.isGreen ? chartColors.primary : '#ef4444'"
              stroke-width="1"
            />
            <!-- Lower wick -->
            <line
              :x1="candle.x"
              :y1="candle.bodyBottom"
              :x2="candle.x"
              :y2="candle.wickBottom"
              :stroke="candle.isGreen ? chartColors.primary : '#ef4444'"
              stroke-width="1"
            />
          </g>
        </template>
        
        <!-- Gradient definition -->
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :style="`stop-color:${chartColors.primary};stop-opacity:0.3`" />
              <stop offset="100%" :style="`stop-color:${chartColors.primary};stop-opacity:0`" />
            </linearGradient>
          </defs>
        
        <!-- Current price point -->
        <circle
          v-if="currentPrice > 0 && chartData.length > 0"
          :cx="lastPointPosition.x"
          :cy="lastPointPosition.y"
          r="4"
          :fill="chartColors.primary"
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
      <div class="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
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
import { useColorTheme } from '@/composables/useColorTheme'

interface Props {
  tokenSymbol: string
  height?: number
  noContainer?: boolean
  defaultChartType?: 'line' | 'candlestick'
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  noContainer: false,
  defaultChartType: 'line'
})

// Color theme
const { currentTheme, colorTheme } = useColorTheme()
const themeUpdateTrigger = ref(0)

// Color mapping for chart elements
const chartColors = computed(() => {
  // Include themeUpdateTrigger to make it reactive to theme changes
  themeUpdateTrigger.value // This makes the computed property depend on the trigger
  
  const colorMap: Record<string, { primary: string; light: string; dark: string }> = {
    emerald: { primary: '#10b981', light: '#10b981', dark: '#059669' },
    pink: { primary: '#ec4899', light: '#ec4899', dark: '#db2777' },
    red: { primary: '#ef4444', light: '#ef4444', dark: '#dc2626' },
    orange: { primary: '#f97316', light: '#f97316', dark: '#ea580c' },
    sky: { primary: '#0ea5e9', light: '#0ea5e9', dark: '#0284c7' },
    fuchsia: { primary: '#d946ef', light: '#d946ef', dark: '#c026d3' },
    purple: { primary: '#a855f7', light: '#a855f7', dark: '#9333ea' },
    teal: { primary: '#14b8a6', light: '#14b8a6', dark: '#0d9488' },
  }
  return colorMap[currentTheme.value] || colorMap.emerald
})

// Reactive data
const loading = ref(false)
const error = ref(false)
const currentPrice = ref(0)
const priceChange = ref(0)
const chartType = ref<'line' | 'candlestick'>(props.defaultChartType)
const chartData = ref<Array<{ timestamp: number; price: number; open?: number; high?: number; low?: number; close?: number }>>([])
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

// Candlestick data
const candleWidth = computed(() => {
  if (chartData.value.length === 0) return 8
  return Math.max(4, Math.min(12, chartWidth / chartData.value.length * 0.8))
})

const candlestickData = computed(() => {
  if (chartData.value.length === 0) return []
  
  const candles = []
  const minPrice = Math.min(...chartData.value.map(d => d.low || d.price))
  const maxPrice = Math.max(...chartData.value.map(d => d.high || d.price))
  const priceRange = maxPrice - minPrice
  
  chartData.value.forEach((data, index) => {
    const x = (index / (chartData.value.length - 1)) * chartWidth
    
    // Use OHLC data if available, otherwise simulate from price
    const open = data.open || data.price
    const high = data.high || data.price * 1.02
    const low = data.low || data.price * 0.98
    const close = data.close || data.price
    
    const isGreen = close >= open
    
    // Calculate Y positions (inverted because SVG Y increases downward)
    const highY = chartHeight - ((high - minPrice) / priceRange) * chartHeight
    const lowY = chartHeight - ((low - minPrice) / priceRange) * chartHeight
    const openY = chartHeight - ((open - minPrice) / priceRange) * chartHeight
    const closeY = chartHeight - ((close - minPrice) / priceRange) * chartHeight
    
    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)
    const bodyHeight = Math.abs(closeY - openY)
    
    candles.push({
      x,
      bodyTop,
      bodyBottom,
      bodyHeight: Math.max(1, bodyHeight), // Minimum height of 1px
      wickTop: highY,
      wickBottom: lowY,
      isGreen
    })
  })
  
  return candles
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
        price: parseFloat(kline[4] as string), // Close price
        open: parseFloat(kline[1] as string),   // Open price
        high: parseFloat(kline[2] as string),   // High price
        low: parseFloat(kline[3] as string),    // Low price
        close: parseFloat(kline[4] as string)   // Close price
      }))
    }
    return []
  } catch (err) {
    console.error('Failed to fetch historical data:', err)
    // Fallback to mock data with OHLC
    return generateMockOHLCData()
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

const generateMockOHLCData = () => {
  const data = []
  const now = Date.now()
  const basePrice = 50000 // Base price for mock data
  let currentPrice = basePrice
  
  // Generate 100 data points
  for (let i = 0; i < 100; i++) {
    const timestamp = now - (99 - i) * 60000 // 1 minute intervals
    const volatility = 0.02 // 2% volatility
    
    // Generate OHLC data
    const open = currentPrice
    const change = (Math.random() - 0.5) * volatility * currentPrice
    const close = open + change
    
    // High and low with some randomness
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5
    
    data.push({
      timestamp,
      price: close, // Use close as the main price
      open,
      high,
      low,
      close
    })
    
    currentPrice = close
  }
  
  return data
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

// Watch for color theme changes to force chart re-render
watch(colorTheme, () => {
  // Force re-render by incrementing the trigger
  themeUpdateTrigger.value++
}, { immediate: false })

// Also watch currentTheme as a backup
watch(currentTheme, () => {
  themeUpdateTrigger.value++
}, { immediate: false })

// Lifecycle
onMounted(async () => {
  try {
    // Set up theme change listeners
    const handleThemeChange = () => {
      themeUpdateTrigger.value++
    }
    
    // Listen for custom theme change events
    window.addEventListener('color-theme-changed', handleThemeChange)
    
    // Also listen for storage changes (when theme is saved to localStorage)
    window.addEventListener('storage', (e) => {
      if (e.key === 'ionic-swap-color-theme') {
        themeUpdateTrigger.value++
      }
    })
    
    // Store cleanup function
    const cleanup = () => {
      window.removeEventListener('color-theme-changed', handleThemeChange)
      window.removeEventListener('storage', handleThemeChange)
    }
    
    // Cleanup on unmount
    onUnmounted(cleanup)
    
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
