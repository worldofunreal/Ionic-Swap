<template>
  <div class="h-full bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
    <div class="flex gap-4 p-6 h-full">
      <!-- Left Column - Token List -->
      <div class="w-80 flex">
        <div
          class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col w-full h-full"
        >
          <!-- Search Bar Header -->
          <div
            class="p-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0"
          >
            <div class="relative">
              <UIcon
                name="i-heroicons-magnifying-glass"
                 class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tokens..."
                 class="pl-10 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
             <div class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div
                v-for="token in filteredTokens"
                :key="token.symbol"
                 class="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/20':
                    selectedToken === token.symbol,
                }"
                @click="selectToken(token.symbol)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <img
                      :src="TokenService.getTokenIcon(token.symbol)"
                      :alt="`${token.symbol} icon`"
                      class="w-6 h-6"
                    />
                    <div>
                      <div class="text-sm font-bold text-black dark:text-white">
                        {{ token.symbol }}
                      </div>
                      <div
                         class="text-xs text-zinc-500 dark:text-zinc-400 truncate"
                      >
                        {{ TokenService.getTokenName(token.symbol) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                       class="text-xs font-medium text-zinc-900 dark:text-white"
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
           class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col w-full h-full"
        >
          <div class="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <div class="flex items-center space-x-3">
              <img
                :src="TokenService.getTokenIcon(selectedToken)"
                :alt="`${selectedToken} icon`"
                class="w-10 h-10"
              />
              <div>
                 <h2 class="text-xl font-bold text-zinc-900 dark:text-white">
                  {{ selectedToken }}/USDT
                </h2>
                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                  {{ TokenService.getTokenName(selectedToken) }}
                </p>
              </div>
            </div>
            <button
              @click="handleTradeClick"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Trade {{ selectedToken }}
            </button>
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
  import { ref, computed, onMounted, onUnmounted, inject, type Ref } from 'vue'
  import { priceService } from '@/services/PriceService'
  import { TokenService } from '@/services/TokenService'
  import { useAuthStore } from '@/stores/auth'
  import LightweightPriceChart from '@/components/LightweightPriceChart.vue'

  // Reactive data
  const selectedToken = ref<string | null>(null)
  const searchQuery = ref('')
  const isUsingMockData = ref(false)
  const auth = useAuthStore()

  // Inject the login panel ref from the app
  const loginPanelRef = inject('loginPanelRef') as Ref<{
    open: () => void
  }> | null

  const openLoginPanel = () => {
    console.log('Markets: Opening login panel')
    if (loginPanelRef?.value) {
      loginPanelRef.value.open()
    } else {
      console.warn('LoginPanel ref not found')
    }
  }


  // Computed properties
  const tokens = computed(() => {
    const prices = priceService.getPrices()
    return Array.from(prices.values()).map(token => ({
      ...token,
      name: TokenService.getTokenName(token.symbol),
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

  // Handle trade button click - check auth status
  const handleTradeClick = () => {
    if (auth.authenticated && auth.userProfile) {
      // User is logged in, navigate to trading page with selected token
      navigateTo(`/trading?token=${selectedToken.value}`)
    } else {
      // User is not logged in, open login panel
      openLoginPanel()
    }
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

