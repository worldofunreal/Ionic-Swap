<template>
  <div
    class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Live Prices
      </h2>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {{ lastUpdated }}
      </div>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 transition-all hover:bg-gray-100 dark:hover:bg-neutral-600 hover:shadow-md border border-gray-200 dark:border-gray-600"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex flex-col">
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ token.symbol }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ getTokenName(token.symbol) }}
            </div>
          </div>
          <div class="text-gray-400 dark:text-gray-500">
            <UIcon :name="getTokenIcon(token.symbol)" class="w-8 h-8" />
          </div>
        </div>

        <div class="mb-3">
          <div
            class="text-xl font-semibold"
            :class="getPriceChangeClass(token.change24h)"
          >
            ${{ formatPrice(token.price) }}
          </div>
          <div
            class="text-sm font-medium"
            :class="getPriceChangeClass(token.change24h)"
          >
            {{ token.change24h >= 0 ? '+' : ''
            }}{{ token.change24h.toFixed(2) }}%
          </div>
        </div>

        <div class="flex justify-between items-center text-sm mb-3">
          <div class="text-gray-500 dark:text-gray-400">24h Volume</div>
          <div class="font-medium text-gray-700 dark:text-gray-300">
            ${{ formatVolume(token.volume24h) }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            @click="selectToken(token.symbol)"
          >
            Chart
          </button>
          <NuxtLink
            :to="`/tokens/${token.symbol}`"
            class="flex-1 px-3 py-2 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors text-center"
          >
            Trade
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-8"
    >
      <div
        class="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
      />
      <span>Loading prices...</span>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="flex items-center justify-center gap-2 text-red-500 py-8"
    >
      <span>Failed to load prices</span>
      <button
        class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        @click="refreshPrices"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { priceService, type TokenPrice } from '@/services/PriceService'

  interface Props {
    onTokenSelect?: (symbol: string) => void
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    tokenSelect: [symbol: string]
  }>()

  const loading = ref(true)
  const error = ref(false)
  const prices = ref<Map<string, TokenPrice>>(new Map())
  const lastUpdated = ref('')

  // Token configuration
  const tokenConfig = {
    BTC: { name: 'Bitcoin', icon: 'logos:bitcoin' },
    ETH: { name: 'Ethereum', icon: 'token-branded:ethereum' },
    XRP: { name: 'XRP', icon: 'cryptocurrency-color:xrp' },
    USDT: { name: 'Tether', icon: 'cryptocurrency-color:usdt' },
    BNB: { name: 'BNB', icon: 'token-branded:binance' },
    SOL: { name: 'Solana', icon: 'token-branded:solana' },
    USDC: { name: 'USD Coin', icon: 'cryptocurrency-color:usdc' },
    DOGE: { name: 'Dogecoin', icon: 'simple-icons:dogecoin' },
    ADA: { name: 'Cardano', icon: 'logos:cardano-icon' },
    TRX: { name: 'TRON', icon: 'token-branded:tron' },
    ICP: { name: 'Internet Computer', icon: 'token-branded:icp' },
  }

  // Computed properties
  const tokens = computed(() => {
    const tokenList: TokenPrice[] = []
    prices.value.forEach((price, symbol) => {
      if (tokenConfig[symbol as keyof typeof tokenConfig]) {
        tokenList.push(price)
      }
    })
    return tokenList.sort((a, b) => a.symbol.localeCompare(b.symbol))
  })

  // Price update subscription
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    subscribeToPriceUpdates()
    // Initial fetch
    priceService.fetchInitialPrices()
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  // Subscribe to price updates
  const subscribeToPriceUpdates = () => {
    unsubscribe = priceService.subscribe(newPrices => {
      prices.value = newPrices
      lastUpdated.value = new Date().toLocaleTimeString()
      loading.value = false
      error.value = false
    })
  }

  // Select token
  const selectToken = (symbol: string) => {
    emit('tokenSelect', symbol)
    if (props.onTokenSelect) {
      props.onTokenSelect(symbol)
    }
  }

  // Get token name
  const getTokenName = (symbol: string): string => {
    return tokenConfig[symbol as keyof typeof tokenConfig]?.name || symbol
  }

  // Get token icon
  const getTokenIcon = (symbol: string): string => {
    return (
      tokenConfig[symbol as keyof typeof tokenConfig]?.icon ||
      'heroicons:currency-dollar'
    )
  }

  // Get price change class
  const getPriceChangeClass = (change: number): string => {
    return change >= 0 ? 'positive' : 'negative'
  }

  // Format price
  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return price.toFixed(6)
    } else if (price < 1) {
      return price.toFixed(4)
    } else if (price < 100) {
      return price.toFixed(2)
    } else {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
    }
  }

  // Format volume
  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(1) + 'B'
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(1) + 'M'
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(1) + 'K'
    } else {
      return volume.toFixed(0)
    }
  }

  // Refresh prices
  const refreshPrices = () => {
    loading.value = true
    error.value = false
    priceService.fetchInitialPrices()
  }
</script>

<style scoped>
  /* All styles moved to inline classes in template */
</style>
