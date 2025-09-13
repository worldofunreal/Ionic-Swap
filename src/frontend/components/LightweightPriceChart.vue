<template>
  <div
    :class="[
      'w-full h-full flex flex-col',
      !noContainer
        ? 'bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700'
        : '',
    ]"
  >
    <div class="flex justify-between items-center mb-4">
      <div class="flex flex-col">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ tokenSymbol }}
        </div>
        <div
          class="text-lg font-semibold flex items-center gap-2"
          :class="priceChangeClass"
        >
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
              chartType === 'candlesticks'
                ? 'bg-primary-500 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="chartType = 'candlesticks'"
          >
            <UIcon name="ic:round-candlestick-chart" class="w-4 h-4" />
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              chartType === 'line'
                ? 'bg-primary-500 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="chartType = 'line'"
          >
            <UIcon name="mdi:chart-line" class="w-4 h-4" />
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
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
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
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 rounded-lg"
      >
        <div
          class="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"
        />
        <span>Loading chart data...</span>
      </div>

      <!-- Error state -->
      <div
        v-if="error"
        class="absolute inset-0 flex items-center justify-center gap-2 text-red-500 bg-gray-50 dark:bg-neutral-900 rounded-lg"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
        <span>Failed to load chart data</span>
        <button
          class="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          @click="refreshChart"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import {
    createChart,
    CandlestickSeries,
    LineSeries,
    HistogramSeries,
    ColorType,
  } from 'lightweight-charts'
  import type { 
    IChartApi, 
    ISeriesApi, 
    CandlestickData, 
    LineData, 
    HistogramData 
  } from 'lightweight-charts'
  // import { priceService } from '@/services/PriceService'
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
    defaultChartType: 'candlesticks',
  })

  // Color theme and dark/light mode
  const { colorTheme } = useColorTheme()
  const { theme: themeMode } = useTheme()

  // Refs
  const chartContainer = ref<HTMLElement>()
  const chart = ref<IChartApi>()
  const candlestickSeries = ref<ISeriesApi<'Candlestick'>>()
  const lineSeries = ref<ISeriesApi<'Line'>>()
  const volumeSeries = ref<ISeriesApi<'Histogram'>>()
  const _currentPriceLine = ref<unknown>()
  const resizeObserver = ref<ResizeObserver>()
  const isDisposed = ref(false)

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
  const wsConnecting = ref(false)
  const wsReconnectTimeout = ref<ReturnType<typeof setTimeout>>()

  // Time periods
  const timePeriods = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
  ]

  // Computed properties
  const priceChangeClass = computed(() => {
    if (priceChange.value > 0) return 'text-green-600 dark:text-green-400'
    if (priceChange.value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  })

  // Chart colors based on theme (reactive to both color theme and dark/light mode)
  const chartColors = computed(() => {
    const isDark = themeMode.value === 'dark'

    // Color theme mapping
    const colorMap: Record<
      string,
      { primary: string; up: string; down: string }
    > = {
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

    return {
      ...colors,
      // Theme-reactive backgrounds and text
      background: isDark ? '#0a0a0a' : '#ffffff',
      text: isDark ? '#ffffff' : '#000000',
      grid: isDark ? '#2a2a2a' : '#e5e7eb',
      border: isDark ? '#374151' : '#d1d5db',
    }
  })

  // Chart configuration (v5 API)
  const getChartConfig = () => ({
    layout: {
      background: {
        type: ColorType.Solid,
        color: chartColors.value.background,
      },
      textColor: chartColors.value.text,
    },
    grid: {
      vertLines: { color: chartColors.value.grid },
      horzLines: { color: chartColors.value.grid },
    },
    crosshair: {
      mode: 1, // Normal crosshair mode
      vertLine: {
        width: 1 as const,
        color: chartColors.value.text,
        style: 0, // Solid line
      },
      horzLine: {
        width: 1 as const,
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
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT',
      XRP: 'XRPUSDT',
      BNB: 'BNBUSDT',
      SOL: 'SOLUSDT',
      USDC: 'USDCUSDT',
      DOGE: 'DOGEUSDT',
      ADA: 'ADAUSDT',
      TRX: 'TRXUSDT',
      ICP: 'ICPUSDT',
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
      '1w': '1w',
    }
    return intervalMap[period] || '1h'
  }

  // Chart initialization (v5 API) - Exchange Quality
  const initChart = async () => {
    if (!chartContainer.value || isDisposed.value) return

    try {
      // Reset disposal state
      isDisposed.value = false
      
      // Create chart with proper configuration
      chart.value = createChart(chartContainer.value, {
        width: chartContainer.value.clientWidth,
        height: props.height,
        ...getChartConfig(),
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
      })

      // Configure volume price scale
      chart.value.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.7, bottom: 0 },
        borderVisible: false,
      })

      // Apply Helvetica Neue - clean, professional font for trading charts
      chart.value.applyOptions({
        layout: {
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: 12,
        },
      })

      // Set up resize observer
      resizeObserver.value = new ResizeObserver(() => {
        if (chart.value && chartContainer.value) {
          chart.value.applyOptions({
            width: chartContainer.value.clientWidth,
            height: props.height,
          })
        }
      })

      resizeObserver.value.observe(chartContainer.value)

      // Load initial data
      await loadChartData()

      // Start WebSocket connection for real-time updates
      startWebSocket()
    } catch (err) {
      console.error('Failed to initialize chart:', err)
      error.value = true
    }
  }

  // Data fetching
  const fetchHistoricalData = async (limit: number = 500, endTime?: number) => {
    const binanceSymbol = getBinanceSymbol(props.tokenSymbol)

    try {
      const query: Record<string, string | number> = {
        symbol: binanceSymbol,
        interval: getInterval(selectedPeriod.value),
        limit: limit,
      }

      // If endTime is provided, fetch data before that time
      if (endTime) {
        query.endTime = endTime * 1000 // Convert to milliseconds for Binance API
      }

      const response = await $fetch('/api/binance/klines', { query }) as { success: boolean; data?: unknown[] }

      if (response.success && Array.isArray(response.data)) {
        return response.data.map((kline: any) => ({
          time: Math.floor(Number(kline[0]) / 1000) as any, // Convert to seconds
          open: parseFloat(String(kline[1])),
          high: parseFloat(String(kline[2])),
          low: parseFloat(String(kline[3])),
          close: parseFloat(String(kline[4])),
          volume: parseFloat(String(kline[5])),
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
        earliestTimestamp.value = olderData[0]?.time || 0
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
    loading.value = true
    error.value = false

    try {
      const data = await fetchHistoricalData()

      if (data.length > 0) {
        // Ensure initial data is sorted in ascending order (oldest first)
        const sortedData = data.sort((a: any, b: any) => a.time - b.time)

        // Cache the sorted data and set earliest timestamp
        cachedData.value = [...sortedData]
        earliestTimestamp.value = sortedData[0]?.time || 0

        // Update current price (use latest from sorted data)
        const latest = sortedData[sortedData.length - 1]
        const previous = sortedData[sortedData.length - 2]
        if (latest && previous) {
          currentPrice.value = latest.close
          priceChange.value =
            ((latest.close - previous.close) / previous.close) * 100
        }

        // Set data to appropriate series (using sorted data)
        if (!isDisposed.value) {
          if (chartType.value === 'candlesticks') {
            candlestickSeries.value?.setData(sortedData)
            lineSeries.value?.setData([])
          } else {
            const lineData = sortedData.map((d: any) => ({
              time: d.time,
              value: d.close,
            }))
            lineSeries.value?.setData(lineData)
            candlestickSeries.value?.setData([])
          }
        }

        // Set volume data with proper colors (using sorted data)
        if (!isDisposed.value) {
          const volumeData = sortedData.map((d: any) => ({
            time: d.time,
            value: d.volume,
            color:
              d.close >= d.open
                ? chartColors.value.up + '80'
                : chartColors.value.down + '80', // Add transparency
          }))
          volumeSeries.value?.setData(volumeData)

          // Set up infinite scroll for historical data
          setupInfiniteScroll()

          // Fit content to view
          chart.value?.timeScale().fitContent()
        }
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
    if (!chart.value) return

    chart.value
      .timeScale()
      .subscribeVisibleLogicalRangeChange(async logicalRange => {
        // Check if user scrolled close to the beginning (left side)
        if (logicalRange && logicalRange.from < 20 && !isLoadingHistory.value) {
          try {
            const olderData = await fetchOlderData()

            if (olderData.length > 0) {
              // Prepend older data to cached data
              cachedData.value = [...olderData, ...cachedData.value]

              // CRITICAL: Sort all data by time in ascending order (oldest first)
              const allData = cachedData.value.sort((a: any, b: any) => a.time - b.time)

              // Remove any duplicate timestamps to prevent ordering issues
              const uniqueData = allData.filter(
                (item: any, index: number, arr: any[]) =>
                  index === 0 || item.time !== arr[index - 1].time
              )

              // Update cached data with unique, sorted data
              cachedData.value = uniqueData

              if (!isDisposed.value) {
                if (chartType.value === 'candlesticks') {
                  candlestickSeries.value?.setData(uniqueData)
                } else {
                  const lineData = uniqueData.map((d: any) => ({
                    time: d.time,
                    value: d.close,
                  }))
                  lineSeries.value?.setData(lineData)
                }
              }

              // Update volume data (also sorted and deduplicated)
              if (!isDisposed.value) {
                const volumeData = uniqueData.map((d: any) => ({
                  time: d.time,
                  value: d.volume,
                  color:
                    d.close >= d.open
                      ? chartColors.value.up + '80'
                      : chartColors.value.down + '80',
                }))
                volumeSeries.value?.setData(volumeData)
              }
            }
          } catch (error) {
            console.error('Error in infinite scroll:', error)
            isLoadingHistory.value = false
          }
        }
      })
  }

  // WebSocket for real-time updates
  const startWebSocket = () => {
    // Prevent multiple simultaneous connections
    if (wsConnecting.value || wsConnection.value?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress, skipping...')
      return
    }

    // Don't start if component is disposed
    if (isDisposed.value) {
      console.log('Component disposed, not starting WebSocket')
      return
    }

    // Close existing connection properly with a delay
    if (wsConnection.value) {
      console.log('Closing existing WebSocket connection...')
      wsConnection.value.close(1000, 'Starting new connection')
      wsConnection.value = undefined
      
      // Wait a bit before starting new connection
      setTimeout(() => {
        if (!isDisposed.value) {
          startWebSocketInternal()
        }
      }, 500)
      return
    }

    startWebSocketInternal()
  }

  const startWebSocketInternal = () => {
    if (isDisposed.value) {
      console.log('Component disposed during WebSocket setup, aborting')
      return
    }

    // Clear any pending reconnection
    if (wsReconnectTimeout.value) {
      clearTimeout(wsReconnectTimeout.value)
      wsReconnectTimeout.value = undefined
    }

    wsConnecting.value = true

    const binanceSymbol = getBinanceSymbol(props.tokenSymbol).toLowerCase()
    const interval = getInterval(selectedPeriod.value)
    const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${interval}`

    console.log('Starting WebSocket connection to:', wsUrl)

    try {
      wsConnection.value = new WebSocket(wsUrl)

      wsConnection.value.onopen = () => {
        console.log('WebSocket connected successfully')
        wsConnecting.value = false
      }

      wsConnection.value.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        wsConnecting.value = false
        wsConnection.value = undefined
        
        // Only attempt reconnection if component is not disposed and it wasn't a manual close
        if (!isDisposed.value && event.code !== 1000 && event.code !== 1001) {
          console.log('Attempting to reconnect in 5 seconds...')
          wsReconnectTimeout.value = setTimeout(() => {
            if (!isDisposed.value) {
              startWebSocket()
            }
          }, 5000)
        }
      }

      wsConnection.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        wsConnecting.value = false
      }

      wsConnection.value.onmessage = event => {
        const data = JSON.parse(event.data)

        if (data.k) {
          const kline = data.k
          const candleData = {
            time: Math.floor(kline.t / 1000) as any,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
          }

          // Update current price
          currentPrice.value = candleData.close

          // Update chart only if not disposed
          if (!isDisposed.value && chart.value) {
            try {
              if (chartType.value === 'candlesticks') {
                candlestickSeries.value?.update(candleData)
              } else {
                lineSeries.value?.update({
                  time: candleData.time as any,
                  value: candleData.close,
                })
              }

              // Update volume
              volumeSeries.value?.update({
                time: candleData.time as any,
                value: candleData.volume,
                color:
                  candleData.close >= candleData.open
                    ? chartColors.value.up + '80'
                    : chartColors.value.down + '80',
              })
            } catch (error) {
              // Silently handle disposal errors
              if (error instanceof Error && error.message.includes('disposed')) {
                console.warn('Chart update attempted on disposed chart')
                return
              }
              throw error
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      wsConnecting.value = false
    }
  }

  const stopWebSocket = () => {
    // Clear any pending reconnection
    if (wsReconnectTimeout.value) {
      clearTimeout(wsReconnectTimeout.value)
      wsReconnectTimeout.value = undefined
    }

    // Close WebSocket connection
    if (wsConnection.value) {
      wsConnection.value.close(1000, 'Component unmounting') // Normal closure
      wsConnection.value = undefined
    }

    wsConnecting.value = false
  }

  // Chart actions
  const refreshChart = () => {
    loadChartData()
  }

  // Recreate series when chart type changes
  const recreateSeries = () => {
    if (!chart.value || isDisposed.value) return

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
  }

  // Watchers
  watch(chartType, async () => {
    recreateSeries()
    await loadChartData()
  })

  watch(selectedPeriod, async () => {
    console.log('Period changed to:', selectedPeriod.value)
    stopWebSocket()
    await loadChartData()
    // Add a longer delay to ensure the previous connection is fully closed
    setTimeout(() => {
      if (!isDisposed.value) {
        startWebSocket()
      }
    }, 1000)
  })

  watch(
    () => props.tokenSymbol,
    async () => {
      console.log('Token symbol changed to:', props.tokenSymbol)
      stopWebSocket()
      await loadChartData()
      // Add a longer delay to ensure the previous connection is fully closed
      setTimeout(() => {
        if (!isDisposed.value) {
          startWebSocket()
        }
      }, 1000)
    }
  )

  // Update chart colors when color theme changes
  watch(colorTheme, () => {
    updateChartTheme()
  })

  // Update chart colors when light/dark mode changes
  watch(themeMode, () => {
    updateChartTheme()
  })

  // Function to update chart theme colors
  const updateChartTheme = () => {
    if (!chart.value || isDisposed.value) return

    // Update chart configuration with theme colors and font
    chart.value.applyOptions({
      ...getChartConfig(),
      layout: {
        ...getChartConfig().layout,
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 12,
      },
    })

    // Update series colors
    if (!isDisposed.value) {
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
    }

    // Update volume price scale
    chart.value.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
      borderVisible: false,
    })
  }

  // Lifecycle
  onMounted(async () => {
    await nextTick()
    await initChart()
  })

  onUnmounted(() => {
    // Mark as disposed first to prevent any pending updates
    isDisposed.value = true
    
    // Stop WebSocket connection and clear timeouts
    stopWebSocket()
    
    // Disconnect resize observer
    resizeObserver.value?.disconnect()
    
    // Dispose chart
    if (chart.value) {
      try {
        chart.value.remove()
      } catch (error) {
        // Silently handle disposal errors
        console.warn('Chart disposal error:', error)
      }
      chart.value = undefined
    }
    
    // Clear series references
    candlestickSeries.value = undefined
    lineSeries.value = undefined
    volumeSeries.value = undefined
    
    // Clear state variables
    wsConnecting.value = false
    if (wsReconnectTimeout.value) {
      clearTimeout(wsReconnectTimeout.value)
      wsReconnectTimeout.value = undefined
    }
  })
</script>

<style scoped>
  /* Chart container styling */
</style>
