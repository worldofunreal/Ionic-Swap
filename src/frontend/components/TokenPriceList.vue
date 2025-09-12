<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Token Prices
      </h3>
      <UButton
        size="xs"
        variant="ghost"
        icon="i-heroicons-arrow-path"
        :loading="loading"
        @click="refreshPrices"
      />
    </div>

    <div class="space-y-3">
      <div
        v-for="token in tokens"
        :key="token.symbol"
        class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        @click="selectToken(token)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
            <UIcon :name="getTokenIcon(token.symbol)" class="w-5 h-5" />
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ token.symbol }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ token.name }}
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="font-semibold text-gray-900 dark:text-white">
            ${{ token.price.toFixed(4) }}
          </div>
          <div
            class="text-xs flex items-center gap-1"
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

    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Last updated: {{ lastUpdated }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { priceService } from '@/services/PriceService'

  interface Token {
    symbol: string
    name: string
    price: number
    change: number
    chains: string[]
  }

  const loading = ref(false)
  const lastUpdated = ref('')

  // Token configuration (same as markets page)
  const tokenConfig = {
    'BTC': { name: 'Bitcoin', icon: 'logos:bitcoin' },
    'ETH': { name: 'Ethereum', icon: 'token-branded:ethereum' },
    'XRP': { name: 'XRP', icon: 'cryptocurrency-color:xrp' },
    'USDT': { name: 'Tether', icon: 'cryptocurrency-color:usdt' },
    'BNB': { name: 'BNB', icon: 'token-branded:binance' },
    'SOL': { name: 'Solana', icon: 'token-branded:solana' },
    'USDC': { name: 'USD Coin', icon: 'cryptocurrency-color:usdc' },
    'DOGE': { name: 'Dogecoin', icon: 'simple-icons:dogecoin' },
    'ADA': { name: 'Cardano', icon: 'logos:cardano-icon' },
    'TRX': { name: 'TRON', icon: 'token-branded:tron' },
    'ICP': { name: 'Internet Computer', icon: 'token-branded:icp' },
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
    {
      symbol: 'USDT',
      name: 'Tether',
      price: 0,
      change: 0,
      chains: ['EVM', 'ICP'],
    },
    { symbol: 'BNB', name: 'BNB', price: 0, change: 0, chains: ['EVM', 'ICP'] },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 0,
      change: 0,
      chains: ['Solana', 'ICP'],
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      price: 0,
      change: 0,
      chains: ['EVM', 'Solana', 'ICP'],
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
  const getTokenName = (symbol: string) => {
    return tokenConfig[symbol as keyof typeof tokenConfig]?.name || symbol
  }

  const getTokenIcon = (symbol: string) => {
    return tokenConfig[symbol as keyof typeof tokenConfig]?.icon || 'cryptocurrency-color:generic'
  }

  // Get tokens with real-time prices from PriceService
  const tokens = computed(() => {
    const prices = priceService.getPrices()
    return tokenList.map(token => {
      const priceData = prices.get(token.symbol)
      return {
        ...token,
        name: getTokenName(token.symbol),
        price: priceData?.price || 0,
        change: priceData?.change24h || 0,
      }
    })
  })

  // Price service subscription
  let unsubscribe: (() => void) | null = null

  const refreshPrices = async () => {
    loading.value = true

    try {
      // Force refresh from PriceService
      // The PriceService will automatically fetch new data
      lastUpdated.value = new Date().toLocaleTimeString()
    } catch (error) {
      console.error('Failed to refresh prices:', error)
    } finally {
      loading.value = false
    }
  }

  const selectToken = (token: Token) => {
    // Emit event or navigate to token details
    console.log('Selected token:', token)
    // TODO: Implement token selection logic
  }

  onMounted(() => {
    // Subscribe to price updates
    unsubscribe = priceService.subscribe((prices) => {
      lastUpdated.value = new Date().toLocaleTimeString()
    })
    
    // Initial refresh
    refreshPrices()
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
