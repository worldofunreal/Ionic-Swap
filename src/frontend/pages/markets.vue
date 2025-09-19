<template>
  <div class="h-full bg-gray-50 dark:bg-neutral-950 overflow-hidden">
    <div class="flex gap-4 p-6 h-full">
      <!-- Left Column - Token List -->
      <div class="w-80 flex">
        <div
          class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col w-full h-full"
        >
          <!-- Search Bar Header -->
          <div
            class="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
          >
            <div class="relative">
              <UIcon
                name="i-heroicons-magnifying-glass"
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tokens..."
                class="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <!-- Demo data warning -->
            <div v-if="isUsingMockData" class="mt-2">
              <div
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
              >
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-3 h-3 mr-1"
                />
                Demo data
              </div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="token in filteredTokens"
                :key="token.symbol"
                class="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/20':
                    selectedToken === token.symbol,
                }"
                @click="selectToken(token.symbol)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"
                    >
                      <UIcon
                        :name="getTokenIcon(token.symbol)"
                        class="w-4 h-4"
                      />
                    </div>
                    <div>
                      <div class="text-sm font-bold text-black dark:text-white">
                        {{ token.symbol }}
                      </div>
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 truncate"
                      >
                        {{ getTokenName(token.symbol) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="text-xs font-medium text-gray-900 dark:text-white"
                    >
                      ${{ formatPrice(token.price) }}
                    </div>
                    <div
                      class="text-xs"
                      :class="
                        token.change24h >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      "
                    >
                      {{ token.change24h >= 0 ? '+' : ''
                      }}{{ token.change24h.toFixed(2) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Chart -->
      <div class="flex-1 flex">
        <div
          v-if="selectedToken"
          class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col w-full h-full"
        >
          <div class="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <UIcon :name="getTokenIcon(selectedToken)" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ selectedToken }}/USDT
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getTokenName(selectedToken) }}
                </p>
              </div>
            </div>
            <NuxtLink
              :to="`/trading?token=${selectedToken}`"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Trade {{ selectedToken }}
            </NuxtLink>
          </div>
          <div class="flex-1 px-6 pb-6 overflow-hidden">
            <LightweightPriceChart
              :key="`markets-${selectedToken}`"
              :token-symbol="selectedToken"
              :no-container="true"
              class="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { priceService } from '@/services/PriceService'
  import LightweightPriceChart from '@/components/LightweightPriceChart.vue'

  // Reactive data
  const selectedToken = ref<string | null>(null)
  const searchQuery = ref('')
  const isUsingMockData = ref(false)

  // Token configuration
  const tokenConfig = {
    BTC: { name: 'Bitcoin', icon: 'logos:bitcoin' },
    ETH: { name: 'Ethereum', icon: 'token-branded:ethereum' },
    XRP: { name: 'XRP', icon: 'cryptocurrency-color:xrp' },
    USDT: { name: 'Tether', icon: 'cryptocurrency-color:usdt' },
    BNB: { name: 'BNB', icon: 'token-branded:binance' },
    SOL: { name: 'Solana', icon: 'token-branded:solana' },
    DOGE: { name: 'Dogecoin', icon: 'simple-icons:dogecoin' },
    ADA: { name: 'Cardano', icon: 'logos:cardano-icon' },
    TRX: { name: 'TRON', icon: 'token-branded:tron' },
    ICP: { name: 'Internet Computer', icon: 'token-branded:icp' },
  }

  // Computed properties
  const tokens = computed(() => {
    const prices = priceService.getPrices()
    return Array.from(prices.values()).map(token => ({
      ...token,
      name: getTokenName(token.symbol),
      icon: getTokenIcon(token.symbol),
    }))
  })

  const filteredTokens = computed(() => {
    if (!searchQuery.value) return tokens.value

    const query = searchQuery.value.toLowerCase()
    return tokens.value.filter(
      token =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    )
  })

  // Helper functions
  const getTokenName = (symbol: string) => {
    return tokenConfig[symbol as keyof typeof tokenConfig]?.name || symbol
  }

  const getTokenIcon = (symbol: string) => {
    return (
      tokenConfig[symbol as keyof typeof tokenConfig]?.icon ||
      'cryptocurrency-color:generic'
    )
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    if (price < 100) return price.toFixed(2)
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  const _formatVolume = (volume: number) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B'
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M'
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K'
    return volume.toFixed(2)
  }

  const selectToken = (symbol: string) => {
    selectedToken.value = symbol
  }

  // Price service subscription
  let unsubscribe: (() => void) | null = null

  // Lifecycle
  onMounted(() => {
    // Subscribe to price updates
    unsubscribe = priceService.subscribe(_prices => {
      // Force reactivity update
      const currentPrices = priceService.getPrices()
      if (currentPrices.size > 0) {
        isUsingMockData.value = false
      }
    })

    // Check for token query parameter
    const route = useRoute()
    const tokenFromQuery = route.query.token as string

    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      // Select token from query parameter
      selectedToken.value = tokenFromQuery.toUpperCase()
    } else if (tokens.value.length > 0 && !selectedToken.value) {
      // Select first token by default if no query parameter
      selectedToken.value = tokens.value[0]?.symbol || null
    }

    // Check if we're using mock data (prices are exactly the mock values)
    const btcPrice = tokens.value.find(t => t.symbol === 'BTC')?.price
    if (btcPrice === 45000) {
      isUsingMockData.value = true
    }
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  // Page title
  useHead({
    title: 'Markets - Ionic Swap',
  })
</script>

<style scoped>
  /* Hide scrollbar for horizontal token list */
  .scrollbar-hide {
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }

  /* Ensure smooth scrolling */
  .overflow-x-auto {
    scroll-behavior: smooth;
  }
</style>
