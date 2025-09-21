<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Token Prices
      </h3>
      <UButton
        color="primary"
        size="md"
        class="text-base font-semibold px-5 py-1.5 text-white"
        @click="handleTradeClick"
      >
        <UIcon name="i-heroicons-chart-bar-20-solid" class="w-5 h-5 mr-2" />
        Trade
      </UButton>
    </div>

    <div class="space-y-2">
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        @click="selectToken(token)"
      >
        <div class="flex items-center gap-2">
          <img
            :src="TokenService.getTokenIcon(token.symbol)"
            :alt="`${token.symbol} icon`"
            class="w-7 h-7"
          />
          <div>
            <div class="font-bold text-black dark:text-white">
              {{ token.symbol }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ TokenService.getTokenName(token.symbol) }}
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="font-semibold text-zinc-900 dark:text-white tabular-nums">
            ${{ formatPrice(token.price) }}
          </div>
          <div
            class="text-xs flex items-center justify-end gap-1 font-medium tabular-nums"
            :class="
              token.change >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            <UIcon
              :name="
                token.change >= 0
                  ? 'i-heroicons-arrow-trending-up'
                  : 'i-heroicons-arrow-trending-down'
              "
              class="w-3 h-3"
            />
            {{ Math.abs(token.change).toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, inject, type Ref } from 'vue'
  import { priceService } from '@/services/PriceService'
  import { TokenService } from '@/services/TokenService'
  import { useAuthStore } from '@/stores/auth'

  interface Token {
    symbol: string
    name: string
    price: number
    change: number
    chains: string[]
  }

  const loading = ref(false)
  const auth = useAuthStore()

  // Inject the login panel ref from the app
  const loginPanelRef = inject('loginPanelRef') as Ref<{
    open: () => void
  }> | null

  const openLoginPanel = () => {
    console.log('TokenPriceList: Opening login panel')
    if (loginPanelRef?.value) {
      loginPanelRef.value.open()
    } else {
      console.warn('LoginPanel ref not found')
    }
  }


  // Token list from todo - these will be the tokens we support
  const tokenList = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    { symbol: 'XRP', name: 'XRP', price: 0, change: 0, chains: ['EVM', 'ICP'] },
    { symbol: 'BNB', name: 'BNB', price: 0, change: 0, chains: ['EVM', 'ICP'] },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 0,
      change: 0,
      chains: ['Solana', 'ICP'],
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    {
      symbol: 'TRX',
      name: 'TRON',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    {
      symbol: 'ICP',
      name: 'Internet Computer',
      price: 0,
      change: 0,
      chains: ['ICP'],
    },
  ]

  // Helper functions

  const formatPrice = (price: number) => {
    if (price === 0) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    if (price < 100) return price.toFixed(2)
    // For prices >= 100, use thousands separators with proper formatting
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    })
  }

  // Get tokens with real-time prices from PriceService
  const tokens = computed(() => {
    const prices = priceService.getPrices()
    return tokenList.map(token => {
      const priceData = prices.get(token.symbol)
      return {
        ...token,
        name: TokenService.getTokenName(token.symbol),
        price: priceData?.price || 0,
        change: priceData?.change24h || 0,
      }
    })
  })

  // Price service subscription
  let unsubscribe: (() => void) | null = null

  // Handle trade button click - check auth status
  const handleTradeClick = () => {
    if (auth.authenticated && auth.userProfile) {
      // User is logged in, navigate to trading page
      navigateTo('/trading')
    } else {
      // User is not logged in, open login panel
      openLoginPanel()
    }
  }

  const selectToken = (token: Token) => {
    // Navigate to markets page with the selected token
    navigateTo(`/markets?token=${token.symbol}`)
  }

  onMounted(() => {
    // Subscribe to price updates
    unsubscribe = priceService.subscribe(_prices => {
      // Price updates are handled automatically
    })
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
</script>

<style scoped>
  /* Custom gradient backgrounds for token icons */
  .bg-gradient-to-br {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
</style>
