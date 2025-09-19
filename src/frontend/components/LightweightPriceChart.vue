<template>
  <div :class="[
    'w-full h-full flex flex-col',
    !noContainer ? 'bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700' : ''
  ]">
    <div class="flex justify-between items-center mb-2 px-4">
      <div class="flex items-center gap-3">
        <div class="text-lg font-bold text-gray-900 dark:text-white">{{ tokenSymbol }}</div>
        <div class="text-sm font-semibold flex items-center gap-1" :class="priceChangeClass">
          ${{ formatPrice(currentPrice) }}
          <span class="text-xs">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
          </span>
        </div>
      </div>
      <div class="flex gap-1">
        <!-- Chart Type Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
          <button
            :class="[
              'px-2 py-1 text-xs rounded-md transition-colors',
              chartType === 'candlesticks' 
                ? 'bg-primary-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="chartType = 'candlesticks'"
          >
            <UIcon name="i-heroicons-chart-bar-square" class="w-3 h-3" />
          </button>
          <button
            :class="[
              'px-2 py-1 text-xs rounded-md transition-colors',
              chartType === 'line' 
                ? 'bg-primary-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="chartType = 'line'"
          >
            <UIcon name="i-heroicons-chart-bar" class="w-3 h-3" />
          </button>
        </div>
        
        <!-- Time Period Buttons -->
        <button
          v-for="period in timePeriods"
          :key="period.value"
          :class="[
            'px-2 py-1 text-xs rounded-md transition-colors',
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

    <!-- Chart Container -->
    <div ref="chartContainer" class="flex-1 w-full relative">
      <!-- Loading state -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 rounded-lg">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        <span>Loading chart data...</span>
      </div>

      <!-- Error state -->
      <div v-if="error" class="absolute inset-0 flex items-center justify-center gap-2 text-red-500 bg-gray-50 dark:bg-neutral-900 rounded-lg">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
        <span>Failed to load chart data</span>
        <button class="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors" @click="refreshChart">Retry</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries,
  ColorType 
} from 'lightweight-charts'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'
import { priceService } from '@/services/PriceService'
import { useColorTheme } from '@/composables/useColorTheme'
import { useTheme } from '@/composables/useTheme'

interface Props {
  tokenSymbol: string
  height?: number
  noContainer?: boolean
  defaultChartType?: 'candlesticks' | 'line'
}

const props = withDefaults(defineProps<Props>(), {
  height: 400,
  noContainer: false,
  defaultChartType: 'candlesticks'
})

// Color theme and dark/light mode
const { currentTheme, colorTheme } = useColorTheme()
const { theme: themeMode } = useTheme()

// Refs
const chartContainer = ref<HTMLElement>()
const chart = ref<IChartApi>()
const candlestickSeries = ref<ISeriesApi<any>>()
const lineSeries = ref<ISeriesApi<any>>()
const volumeSeries = ref<ISeriesApi<any>>()
const currentPriceLine = ref<any>()
const resizeObserver = ref<ResizeObserver>()

// Reactive data
const loading = ref(false)
const error = ref(false)
const currentPrice = ref(0)
const priceChange = ref(0)
const chartType = ref<'candlesticks' | 'line'>(props.defaultChartType)
const selectedPeriod = ref('15m')
const wsConnection = ref<WebSocket>()
const isLoadingHistory = ref(false)
const earliestTimestamp = ref<number>(0)
const cachedData = ref<any[]>([])
const isDisposed = ref(false)

// Debouncing refs
const resizeTimeout = ref<NodeJS.Timeout>()
const themeUpdateTimeout = ref<NodeJS.Timeout>()
const wsReconnectTimeout = ref<NodeJS.Timeout>()

// Component instance tracking for debugging
const componentId = ref(Math.random().toString(36).substr(2, 9))

// Time periods
const timePeriods = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
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

// Chart colors based on theme (non-reactive to prevent constant updates)
const chartColors = ref({
  primary: '#10b981',
  up: '#10b981', 
  down: '#ef4444',
  background: '#ffffff',
  text: '#000000',
  grid: '#e5e7eb',
  border: '#d1d5db',
})

// Function to update chart colors (called only when needed)
const updateChartColors = () => {
  const isDark = themeMode.value === 'dark'
  
  // Color theme mapping
  const colorMap: Record<string, { primary: string; up: string; down: string }> = {
    emerald: { primary: '#10b981', up: '#10b981', down: '#ef4444' },
    pink: { primary: '#ec4899', up: '#10b981', down: '#ef4444' },
    red: { primary: '#ef4444', up: '#10b981', down: '#ef4444' },
    orange: { primary: '#f97316', up: '#10b981', down: '#ef4444' },
    sky: { primary: '#0ea5e9', up: '#10b981', down: '#ef4444' },
    fuchsia: { primary: '#d946ef', up: '#10b981', down: '#ef4444' },
    purple: { primary: '#a855f7', up: '#10b981', down: '#ef4444' },
    teal: { primary: '#14b8a6', up: '#10b981', down: '#ef4444' },
  }
  
  const colors = colorMap[colorTheme.value] || colorMap.emerald
  
  if (colors) {
    chartColors.value = {
      primary: colors.primary,
      up: colors.up,
      down: colors.down,
      // Theme-reactive backgrounds and text
      background: isDark ? 'oklch(21% 0.006 285.885)' : '#ffffff',
      text: isDark ? '#ffffff' : '#000000',
      grid: isDark ? '#2a2a2a' : '#e5e7eb',
      border: isDark ? '#374151' : '#d1d5db',
    }
  }
}

// Chart configuration (v5 API)
const getChartConfig = () => ({
  layout: {
    background: { type: ColorType.Solid, color: chartColors.value.background },
    textColor: chartColors.value.text,
  },
  grid: {
    vertLines: { color: chartColors.value.grid },
    horzLines: { color: chartColors.value.grid },
  },
  crosshair: {
    mode: 1, // Normal crosshair mode
    vertLine: {
      width: 1 as any,
      color: chartColors.value.text,
      style: 0, // Solid line
    },
    horzLine: {
      width: 1 as any,
      color: chartColors.value.text,
      style: 0, // Solid line
    },
  },
  timeScale: {
    borderColor: chartColors.value.border,
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: {
    borderColor: chartColors.value.border,
    visible: true,
    entireTextOnly: false,
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
    autoScale: true,
    invertScale: false,
    alignLabels: true,
    borderVisible: true,
    ticksVisible: true,
    textColor: chartColors.value.text,
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
})

// Helper functions
const formatPrice = (price: number) => {
  if (price === 0) return '0.00'
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  if (price < 100) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const getBinanceSymbol = (symbol: string) => {
  const symbolMap: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'XRP': 'XRPUSDT',
    'BNB': 'BNBUSDT',
    'SOL': 'SOLUSDT',
    'DOGE': 'DOGEUSDT',
    'ADA': 'ADAUSDT',
    'TRX': 'TRXUSDT',
    'ICP': 'ICPUSDT'
  }
  return symbolMap[symbol] || 'BTCUSDT'
}

const getInterval = (period: string) => {
  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h', 
    '1d': '1d',
    '1w': '1w'
  }
  return intervalMap[period] || '1h'
}

// Chart initialization (v5 API) - Exchange Quality
const initChart = async () => {
  if (!chartContainer.value || isDisposed.value) return
  
  try {
    console.log(`[Chart ${componentId.value}] Initializing chart for ${props.tokenSymbol}`)
    
    // Ensure any existing chart is properly disposed first
    if (chart.value) {
      console.log(`[Chart ${componentId.value}] Disposing existing chart before reinit`)
      disposeChart()
      await nextTick() // Wait for DOM cleanup
    }
    
    // Reset disposal flag
    isDisposed.value = false
    
    // Create chart with proper configuration
    chart.value = createChart(chartContainer.value, {
      width: chartContainer.value.clientWidth,
      height: props.height,
      ...getChartConfig()
    })

    // Create main price series with proper price formatting
    if (chartType.value === 'candlesticks') {
      candlestickSeries.value = chart.value.addSeries(CandlestickSeries, {
        upColor: chartColors.value.up,
        downColor: chartColors.value.down,
        borderUpColor: chartColors.value.up,
        borderDownColor: chartColors.value.down,
        wickUpColor: chartColors.value.up,
        wickDownColor: chartColors.value.down,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })
    } else {
      lineSeries.value = chart.value.addSeries(LineSeries, {
        color: chartColors.value.primary,
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })
    }

    // Create volume series in separate scale (bottom 20% of chart)
    volumeSeries.value = chart.value.addSeries(HistogramSeries, {
      color: chartColors.value.primary,
      priceFormat: { 
        type: 'volume',
      },
      priceScaleId: 'volume',
    } as any)

    // Configure volume price scale
    chart.value.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
      borderVisible: false,
    })

    // Set up resize observer with debouncing
    resizeObserver.value = new ResizeObserver(() => {
      if (!isDisposed.value && chart.value && chartContainer.value) {
        // Clear existing timeout
        if (resizeTimeout.value) {
          clearTimeout(resizeTimeout.value)
        }
        
        // Debounce resize updates
        resizeTimeout.value = setTimeout(() => {
          if (!isDisposed.value && chart.value && chartContainer.value) {
            try {
              chart.value.applyOptions({
                width: chartContainer.value.clientWidth,
                height: props.height,
              })
            } catch (error) {
              console.warn('Error updating chart size:', error)
            }
          }
        }, 150) // 150ms debounce
      }
    })
    
    resizeObserver.value.observe(chartContainer.value)
    
    // Load initial data
    await loadChartData()
    
    // Start WebSocket connection for real-time updates
    if (!isDisposed.value) {
      startWebSocket()
    }
    
  } catch (err) {
    console.error('Failed to initialize chart:', err)
    error.value = true
  }
}

// Data fetching
const fetchHistoricalData = async (limit: number = 500, endTime?: number) => {
  const binanceSymbol = getBinanceSymbol(props.tokenSymbol)
  
  try {
    const query: any = {
      symbol: binanceSymbol,
      interval: getInterval(selectedPeriod.value),
      limit: limit
    }
    
    // If endTime is provided, fetch data before that time
    if (endTime) {
      query.endTime = endTime * 1000 // Convert to milliseconds for Binance API
    }

    const response = await $fetch('/api/binance/klines', { query })

    if (response.success && Array.isArray((response as any).data)) {
      return (response as any).data.map((kline: any[]) => ({
        time: Math.floor(kline[0] / 1000), // Convert to seconds
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }))
    }
    
    return []
  } catch (err) {
    console.error('Failed to fetch historical data:', err)
    return endTime ? [] : generateMockData()
  }
}

// Fetch older historical data for infinite scroll
const fetchOlderData = async () => {
  if (isLoadingHistory.value || !earliestTimestamp.value) return []
  
  isLoadingHistory.value = true
  
  
  try {
    // Fetch data before the earliest timestamp we have
    const olderData = await fetchHistoricalData(500, earliestTimestamp.value)
    
    if (olderData.length > 0) {
      
      // Update earliest timestamp to the oldest data we just received
      earliestTimestamp.value = olderData[0].time
      return olderData
    }
    
    return []
  } catch (err) {
    console.error('Failed to fetch older data:', err)
    return []
  } finally {
    isLoadingHistory.value = false
  }
}

const generateMockData = () => {
  const data = []
  const now = Math.floor(Date.now() / 1000)
  let price = 50000
  
  for (let i = 500; i > 0; i--) {
    const time = now - i * 60
    const change = (Math.random() - 0.5) * 0.02 * price
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 0.01 * price
    const low = Math.min(open, close) - Math.random() * 0.01 * price
    const volume = Math.random() * 1000
    
    data.push({ time, open, high, low, close, volume })
    price = close
  }
  
  return data
}

const loadChartData = async () => {
  if (isDisposed.value) return
  
  loading.value = true
  error.value = false
  
  try {
    const data = await fetchHistoricalData()
    
    if (data.length > 0 && !isDisposed.value) {
      // Ensure initial data is sorted in ascending order (oldest first)
      const sortedData = data.sort((a: any, b: any) => a.time - b.time)
      
      // Cache the sorted data and set earliest timestamp
      cachedData.value = [...sortedData]
      earliestTimestamp.value = sortedData[0].time
      
      // Update current price (use latest from sorted data)
      const latest = sortedData[sortedData.length - 1]
      const previous = sortedData[sortedData.length - 2]
      currentPrice.value = latest.close
      priceChange.value = ((latest.close - previous.close) / previous.close) * 100
      
      // Set data to appropriate series (using sorted data) - with disposal checks
      if (chartType.value === 'candlesticks' && candlestickSeries.value) {
        candlestickSeries.value.setData(sortedData)
        if (lineSeries.value) lineSeries.value.setData([])
      } else if (lineSeries.value) {
        const lineData = sortedData.map((d: any) => ({ time: d.time, value: d.close }))
        lineSeries.value.setData(lineData)
        if (candlestickSeries.value) candlestickSeries.value.setData([])
      }
      
      // Set volume data with proper colors (using sorted data)
      if (volumeSeries.value) {
        const volumeData = sortedData.map((d: any) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? chartColors.value.up + '80' : chartColors.value.down + '80' // Add transparency
        }))
        volumeSeries.value.setData(volumeData)
      }
      
      // Set up infinite scroll for historical data
      if (!isDisposed.value) {
        setupInfiniteScroll()
      }
      
      // Fit content to view
      if (!isDisposed.value && chart.value) {
        chart.value.timeScale().fitContent()
      }
      
      // Add current price line
      addCurrentPriceLine()
    }
  } catch (err) {
    console.error('Failed to load chart data:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Set up infinite scroll for loading historical data
const setupInfiniteScroll = () => {
  if (isDisposed.value || !chart.value) return
  
  chart.value.timeScale().subscribeVisibleLogicalRangeChange(async (logicalRange) => {
    if (isDisposed.value) return
    
    // Check if user scrolled close to the beginning (left side)
    if (logicalRange && logicalRange.from < 20 && !isLoadingHistory.value) {
      
      try {
        const olderData = await fetchOlderData()
        
        if (olderData.length > 0 && !isDisposed.value) {
          // Prepend older data to cached data
          cachedData.value = [...olderData, ...cachedData.value]
          
          // CRITICAL: Sort all data by time in ascending order (oldest first)
          const allData = cachedData.value.sort((a, b) => a.time - b.time)
          
          // Remove any duplicate timestamps to prevent ordering issues
          const uniqueData = allData.filter((item, index, arr) => 
            index === 0 || item.time !== arr[index - 1].time
          )
          
          // Update cached data with unique, sorted data
          cachedData.value = uniqueData
          
          if (chartType.value === 'candlesticks' && candlestickSeries.value) {
            candlestickSeries.value.setData(uniqueData)
          } else if (lineSeries.value) {
            const lineData = uniqueData.map(d => ({ time: d.time, value: d.close }))
            lineSeries.value.setData(lineData)
          }
          
          // Update volume data (also sorted and deduplicated)
          if (volumeSeries.value) {
            const volumeData = uniqueData.map(d => ({
              time: d.time,
              value: d.volume,
              color: d.close >= d.open ? chartColors.value.up + '80' : chartColors.value.down + '80'
            }))
            volumeSeries.value.setData(volumeData)
          }
        }
      } catch (error) {
        console.error('Error in infinite scroll:', error)
        isLoadingHistory.value = false
      }
    }
  })
}

// Add current price line
const addCurrentPriceLine = () => {
  if (isDisposed.value || !chart.value || (!candlestickSeries.value && !lineSeries.value)) return
  
  try {
    // Remove existing price line if it exists
    if (currentPriceLine.value) {
      candlestickSeries.value?.removePriceLine(currentPriceLine.value)
      lineSeries.value?.removePriceLine(currentPriceLine.value)
    }
    
    // Add new price line
    const priceLine = {
      price: currentPrice.value,
      color: chartColors.value.primary,
      lineWidth: 1 as any,
      lineStyle: 0, // Solid line
      axisLabelVisible: true,
      title: `$${formatPrice(currentPrice.value)}`,
    }
    
    if (chartType.value === 'candlesticks' && candlestickSeries.value) {
      currentPriceLine.value = candlestickSeries.value.createPriceLine(priceLine)
    } else if (lineSeries.value) {
      currentPriceLine.value = lineSeries.value.createPriceLine(priceLine)
    }
  } catch (error) {
    console.warn('Error adding price line:', error)
  }
}

// WebSocket for real-time updates
const startWebSocket = () => {
  if (isDisposed.value) return
  
  const binanceSymbol = getBinanceSymbol(props.tokenSymbol).toLowerCase()
  const interval = getInterval(selectedPeriod.value)
  const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${interval}`
  
  wsConnection.value = new WebSocket(wsUrl)
  
  wsConnection.value.onmessage = (event) => {
    if (isDisposed.value || !chart.value) return
    
    try {
      const data = JSON.parse(event.data)
      
      if (data.k) {
        const kline = data.k
        const candleData = {
          time: Math.floor(kline.t / 1000),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v)
        }
        
        // Update current price
        currentPrice.value = candleData.close
        
        // Update chart - with disposal check
        if (chartType.value === 'candlesticks' && candlestickSeries.value) {
          candlestickSeries.value.update(candleData)
        } else if (lineSeries.value) {
          lineSeries.value.update({ time: candleData.time, value: candleData.close })
        }
        
        // Update current price line
        addCurrentPriceLine()
        
        // Update volume
        if (volumeSeries.value) {
          volumeSeries.value.update({
            time: candleData.time,
            value: candleData.volume,
            color: candleData.close >= candleData.open ? chartColors.value.up + '80' : chartColors.value.down + '80'
          })
        }
      }
    } catch (error) {
      console.error('WebSocket message processing error:', error)
    }
  }
  
  wsConnection.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

const stopWebSocket = () => {
  if (wsConnection.value) {
    wsConnection.value.close()
    wsConnection.value = undefined
  }
}

// Safe chart disposal
const disposeChart = () => {
  if (isDisposed.value) return
  
  console.log(`[Chart ${componentId.value}] Disposing chart for ${props.tokenSymbol}`)
  isDisposed.value = true
  
  // Clear all timeouts
  if (resizeTimeout.value) {
    clearTimeout(resizeTimeout.value)
    resizeTimeout.value = undefined
  }
  if (themeUpdateTimeout.value) {
    clearTimeout(themeUpdateTimeout.value)
    themeUpdateTimeout.value = undefined
  }
  if (wsReconnectTimeout.value) {
    clearTimeout(wsReconnectTimeout.value)
    wsReconnectTimeout.value = undefined
  }
  
  // Stop WebSocket first
  stopWebSocket()
  
  // Disconnect resize observer
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = undefined
  }
  
  // Remove chart with proper cleanup
  if (chart.value) {
    try {
      // Clear all data first to prevent memory leaks
      if (candlestickSeries.value) {
        candlestickSeries.value.setData([])
      }
      if (lineSeries.value) {
        lineSeries.value.setData([])
      }
      if (volumeSeries.value) {
        volumeSeries.value.setData([])
      }
      
      // Remove the chart
      chart.value.remove()
    } catch (error) {
      console.warn('Error disposing chart:', error)
    } finally {
      chart.value = undefined
    }
  }
  
  // Clear series references
  candlestickSeries.value = undefined
  lineSeries.value = undefined
  volumeSeries.value = undefined
  currentPriceLine.value = undefined
  
  // Clear cached data
  cachedData.value = []
  earliestTimestamp.value = 0
}

// Chart actions
const refreshChart = () => {
  loadChartData()
}

// Recreate series when chart type changes
const recreateSeries = () => {
  if (isDisposed.value || !chart.value) return
  
  try {
    // Remove existing series
    if (candlestickSeries.value) {
      chart.value.removeSeries(candlestickSeries.value)
      candlestickSeries.value = undefined
    }
    if (lineSeries.value) {
      chart.value.removeSeries(lineSeries.value)
      lineSeries.value = undefined
    }
    
    // Create new series based on chart type
    if (chartType.value === 'candlesticks') {
      candlestickSeries.value = chart.value.addSeries(CandlestickSeries, {
        upColor: chartColors.value.up,
        downColor: chartColors.value.down,
        borderUpColor: chartColors.value.up,
        borderDownColor: chartColors.value.down,
        wickUpColor: chartColors.value.up,
        wickDownColor: chartColors.value.down,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })
    } else {
      lineSeries.value = chart.value.addSeries(LineSeries, {
        color: chartColors.value.primary,
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })
    }
    
    // Add current price line to the new series
    addCurrentPriceLine()
  } catch (error) {
    console.warn('Error recreating series:', error)
  }
}

// Watchers
watch(chartType, async () => {
  if (isDisposed.value) return
  recreateSeries()
  await loadChartData()
})

watch(selectedPeriod, async () => {
  if (isDisposed.value) return
  
  // Clear existing reconnect timeout
  if (wsReconnectTimeout.value) {
    clearTimeout(wsReconnectTimeout.value)
  }
  
  stopWebSocket()
  await loadChartData()
  
  // Debounce WebSocket reconnection
  wsReconnectTimeout.value = setTimeout(() => {
    if (!isDisposed.value) {
      startWebSocket()
    }
  }, 300)
})

watch(() => props.tokenSymbol, async () => {
  if (isDisposed.value) return
  
  // Clear existing reconnect timeout
  if (wsReconnectTimeout.value) {
    clearTimeout(wsReconnectTimeout.value)
  }
  
  stopWebSocket()
  await loadChartData()
  
  // Debounce WebSocket reconnection
  wsReconnectTimeout.value = setTimeout(() => {
    if (!isDisposed.value) {
      startWebSocket()
    }
  }, 300)
})

// Debounced theme updates to prevent excessive chart recreation
watch([colorTheme, themeMode], () => {
  if (isDisposed.value) return
  
  // Clear existing theme update timeout
  if (themeUpdateTimeout.value) {
    clearTimeout(themeUpdateTimeout.value)
  }
  
  // Debounce theme updates
  themeUpdateTimeout.value = setTimeout(() => {
    if (!isDisposed.value) {
      updateChartTheme()
    }
  }, 100) // 100ms debounce for theme changes
}, { deep: false })

// Function to update chart theme colors
const updateChartTheme = () => {
  if (isDisposed.value || !chart.value) return
  
  try {
    // Update chart colors first
    updateChartColors()
    
    // Update chart configuration
    chart.value.applyOptions(getChartConfig())
    
    // Update series colors
    candlestickSeries.value?.applyOptions({
      upColor: chartColors.value.up,
      downColor: chartColors.value.down,
      borderUpColor: chartColors.value.up,
      borderDownColor: chartColors.value.down,
      wickUpColor: chartColors.value.up,
      wickDownColor: chartColors.value.down,
    })
    
    lineSeries.value?.applyOptions({
      color: chartColors.value.primary,
    })
    
    volumeSeries.value?.applyOptions({
      color: chartColors.value.primary,
    })
    
    // Update volume price scale
    chart.value.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
      borderVisible: false,
    })
    
    // Update current price line
    addCurrentPriceLine()
  } catch (error) {
    console.warn('Error updating chart theme:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  // Initialize chart colors first
  updateChartColors()
  
  await initChart()
})

onBeforeUnmount(() => {
  // Ensure cleanup happens before component is destroyed
  disposeChart()
})

onUnmounted(() => {
  // Final cleanup - should already be done in beforeUnmount
  if (!isDisposed.value) {
    disposeChart()
  }
})
</script>

<style scoped>
/* Chart container styling */
</style>