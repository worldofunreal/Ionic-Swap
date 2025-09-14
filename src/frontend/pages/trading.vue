<template>
  <div class="h-full bg-gray-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Trading Header -->
    <div
      class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              {{ selectedToken?.symbol?.charAt(0) || 'B' }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">
                {{ selectedTokenSymbol }}/USDT
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedTokenInfo?.name || selectedTokenSymbol }}
              </div>
            </div>
          </div>

          <!-- Price Display -->
          <div class="flex items-center space-x-4">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              ${{ formatPrice(selectedToken?.price || 0) }}
            </div>
            <div class="flex items-center space-x-1" :class="priceChangeClass">
              <UIcon
                :name="
                  priceChange >= 0
                    ? 'i-heroicons-arrow-trending-up'
                    : 'i-heroicons-arrow-trending-down'
                "
                class="w-4 h-4"
              />
              <span class="font-semibold">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Token Selector -->
        <div class="flex items-center space-x-2">
          <select
            v-model="selectedTokenSymbol"
            class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Select Token</option>
            <option
              v-for="option in tokenOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex h-full">
      <!-- Left Column - Chart -->
      <div class="flex-1 flex flex-col">
        <!-- Chart Controls -->
        <div
          class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex-shrink-0"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
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

            <div class="flex items-center space-x-2">
              <button
                class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
              </button>
              <button
                class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Chart Area -->
        <div class="flex-1 bg-white dark:bg-neutral-900 p-4 overflow-hidden">
          <LightweightPriceChart
            :key="`trading-${selectedTokenSymbol}-${selectedPeriod}`"
            :token-symbol="selectedTokenSymbol"
            :default-chart-type="'candlesticks'"
            :no-container="true"
            class="h-full"
          />
        </div>
      </div>

      <!-- Right Column - Trading Panel -->
      <div
        class="w-80 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-gray-800 flex flex-col"
      >
        <!-- Trading Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-800">
          <button
            v-for="tab in tradingTabs"
            :key="tab.value"
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Trading Form -->
        <div class="flex-1 p-4">
          <!-- Debug Info -->
          <div class="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <div>Tokens loaded: {{ internalTokens.length }}</div>
            <div>Token options: {{ tokenOptions.length }}</div>
            <div>USDT Balance: {{ usdtBalance }}</div>
            <div>Selected: {{ selectedTokenSymbol }}</div>
            <div>Auth user: {{ auth.userProfile?.id || 'Not logged in' }}</div>
          </div>
          
          <!-- Market Tab -->
          <div v-if="activeTab === 'market'" class="space-y-4">
            <!-- Buy Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Buy {{ selectedTokenSymbol }}</span
                >
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >Balance: {{ usdtBalance }}</span
                >
              </div>

              <div class="space-y-2">
                <div class="relative">
                  <input
                    v-model="buyAmount"
                    type="text"
                    placeholder="0.00"
                    @input="formatBuyAmount"
                    @blur="validateBuyAmount"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <div
                    class="absolute left-3 top-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    USDT
                  </div>
                </div>

                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
                    @click="setBuyAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <button
                @click="executeBuy"
                :disabled="buyLoading || !buyAmount || parseFormattedNumber(buyAmount) <= 0"
                class="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="buyLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ buyLoading ? 'Buying...' : `Buy ${selectedTokenSymbol}` }}
              </button>
            </div>

            <!-- Sell Section -->
            <div
              class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Sell {{ selectedTokenSymbol }}</span
                >
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >Balance: {{ selectedTokenBalance }} {{ selectedTokenSymbol }}</span
                >
              </div>

              <div class="space-y-2">
                <div class="relative">
                  <input
                    v-model="sellAmount"
                    type="text"
                    placeholder="0.00"
                    @input="formatSellAmount"
                    @blur="validateSellAmount"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <div
                    class="absolute left-3 top-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ selectedTokenSymbol }}
                  </div>
                </div>

                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
                    @click="setSellAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <button
                @click="executeSell"
                :disabled="sellLoading || !sellAmount || parseFormattedNumber(sellAmount) <= 0"
                class="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="sellLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ sellLoading ? 'Selling...' : `Sell ${selectedTokenSymbol}` }}
              </button>
            </div>
          </div>

          <!-- Limit Tab -->
          <div v-if="activeTab === 'limit'" class="space-y-4">
            <!-- Buy Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Buy {{ selectedToken?.symbol || 'BTC' }}</span
                >
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >Balance: 0.00 USDT</span
                >
              </div>

              <div class="space-y-2">
                <div>
                  <label
                    class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Price (USDT)</label
                  >
                  <input
                    v-model="limitBuyPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>

                <div>
                  <label
                    class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Amount ({{ selectedToken?.symbol || 'BTC' }})</label
                  >
                  <input
                    v-model="limitBuyAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Total:
                  {{
                    (
                      parseFloat(limitBuyPrice || '0') *
                      parseFloat(limitBuyAmount || '0')
                    ).toFixed(2)
                  }}
                  USDT
                </div>
              </div>

              <button
                class="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors"
              >
                Buy {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>

            <!-- Sell Section -->
            <div
              class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Sell {{ selectedToken?.symbol || 'BTC' }}</span
                >
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >Balance: 0.00 {{ selectedToken?.symbol || 'BTC' }}</span
                >
              </div>

              <div class="space-y-2">
                <div>
                  <label
                    class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Price (USDT)</label
                  >
                  <input
                    v-model="limitSellPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>

                <div>
                  <label
                    class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Amount ({{ selectedToken?.symbol || 'BTC' }})</label
                  >
                  <input
                    v-model="limitSellAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Total:
                  {{
                    (
                      parseFloat(limitSellPrice || '0') *
                      parseFloat(limitSellAmount || '0')
                    ).toFixed(2)
                  }}
                  USDT
                </div>
              </div>

              <button
                class="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors"
              >
                Sell {{ selectedToken?.symbol || 'BTC' }}
              </button>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="space-y-4">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { priceService } from '@/services/PriceService'
  import { canisterService } from '@/services/CanisterService'
  import { useAuthStore } from '@/stores/auth'
  import { TokenService } from '@/services/TokenService'
  import LightweightPriceChart from '@/components/LightweightPriceChart.vue'
  import TransactionHistory from '@/components/TransactionHistory.vue'

  // Stores
  const auth = useAuthStore()
  const toast = useToast()

  // Reactive data
  const selectedTokenSymbol = ref('BTC')
  const selectedPeriod = ref('1h')
  const activeTab = ref('market')
  const loading = ref(false)
  const buyLoading = ref(false)
  const sellLoading = ref(false)

  // Trading form data
  const buyAmount = ref('')
  const sellAmount = ref('')
  const limitBuyPrice = ref('')
  const limitBuyAmount = ref('')
  const limitSellPrice = ref('')
  const limitSellAmount = ref('')

  // User balances
  const userBalances = ref<Record<string, number>>({})
  const internalTokens = ref<any[]>([])
  const canisterServiceReady = ref(false)

  // Time periods
  const timePeriods = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ]

  // Trading tabs
  const tradingTabs = [
    { label: 'Market', value: 'market' },
    { label: 'History', value: 'history' },
  ]

  // Token options - all internal tokens
  const tokenOptions = computed(() => {
    return internalTokens.value
      .filter(token => token.symbol !== 'USDT') // Exclude USDT as it's the base currency
      .map(token => ({
        label: `${token.symbol}/USDT`,
        value: token.symbol
      }))
  })

  // Computed properties
  const selectedToken = computed(() => {
    const prices = priceService.getPrices()
    return prices.get(selectedTokenSymbol.value)
  })

  // Remove the computed property since we're using a ref now

  const priceChange = computed(() => {
    return selectedToken.value?.change24h || 0
  })

  const priceChangeClass = computed(() => {
    if (priceChange.value > 0) return 'text-green-600 dark:text-green-400'
    if (priceChange.value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  })

  // Balance calculations using TokenService
  const usdtBalance = computed(() => {
    const balance = userBalances.value['USDT'] || 0
    return TokenService.formatBalance(balance, 'USDT')
  })

  const selectedTokenBalance = computed(() => {
    const balance = userBalances.value[selectedTokenSymbol.value] || 0
    return TokenService.formatBalance(balance, selectedTokenSymbol.value)
  })

  // Raw balance values for calculations
  const usdtBalanceRaw = computed(() => {
    const balance = userBalances.value['USDT'] || 0
    return balance / Math.pow(10, TokenService.getTokenDecimals('USDT'))
  })

  const selectedTokenBalanceRaw = computed(() => {
    const balance = userBalances.value[selectedTokenSymbol.value] || 0
    return balance / Math.pow(10, TokenService.getTokenDecimals(selectedTokenSymbol.value))
  })

  const selectedTokenInfo = computed(() => {
    return internalTokens.value.find(t => t.symbol === selectedTokenSymbol.value)
  })

  // Helper functions using TokenService
  const formatPrice = (price: number) => {
    return TokenService.formatPrice(price, selectedTokenSymbol.value)
  }

  const setBuyAmount = (percent: number) => {
    const balance = usdtBalanceRaw.value
    const amount = (balance * percent) / 100
    buyAmount.value = formatNumberWithCommas(amount, TokenService.getDisplayDecimals('USDT'))
  }

  const setSellAmount = (percent: number) => {
    const balance = selectedTokenBalanceRaw.value
    const amount = (balance * percent) / 100
    sellAmount.value = formatNumberWithCommas(amount, TokenService.getDisplayDecimals(selectedTokenSymbol.value))
  }

  // Format number with commas
  const formatNumberWithCommas = (value: number, decimals: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  // Parse number from formatted string (remove commas)
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '')
    return parseFloat(cleaned) || 0
  }

  // Format buy amount input
  const formatBuyAmount = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value
    const parsed = parseFormattedNumber(value)
    
    if (!isNaN(parsed) && isFinite(parsed)) {
      const formatted = formatNumberWithCommas(parsed, TokenService.getDisplayDecimals('USDT'))
      buyAmount.value = formatted
    }
  }

  // Format sell amount input
  const formatSellAmount = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value
    const parsed = parseFormattedNumber(value)
    
    if (!isNaN(parsed) && isFinite(parsed)) {
      const formatted = formatNumberWithCommas(parsed, TokenService.getDisplayDecimals(selectedTokenSymbol.value))
      sellAmount.value = formatted
    }
  }

  // Validate buy amount on blur
  const validateBuyAmount = () => {
    const parsed = parseFormattedNumber(buyAmount.value)
    if (parsed > usdtBalanceRaw.value) {
      buyAmount.value = formatNumberWithCommas(usdtBalanceRaw.value, TokenService.getDisplayDecimals('USDT'))
    }
  }

  // Validate sell amount on blur
  const validateSellAmount = () => {
    const parsed = parseFormattedNumber(sellAmount.value)
    if (parsed > selectedTokenBalanceRaw.value) {
      sellAmount.value = formatNumberWithCommas(selectedTokenBalanceRaw.value, TokenService.getDisplayDecimals(selectedTokenSymbol.value))
    }
  }

  // Trading functions
  const executeBuy = async () => {
    const parsedAmount = parseFormattedNumber(buyAmount.value)
    if (!buyAmount.value || parsedAmount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        color: 'error',
      })
      return
    }

    if (parsedAmount > usdtBalanceRaw.value) {
      toast.add({
        title: 'Insufficient Balance',
        description: 'You don\'t have enough USDT for this trade',
        color: 'error',
      })
      return
    }

    buyLoading.value = true
    try {
      const amount = TokenService.toRawAmount(parsedAmount, 'USDT')
      
      const result = await canisterService.marketSwap({
        from_token: 'USDT',
        to_token: selectedTokenSymbol.value,
        amount: BigInt(amount)
      })

      if (result.Ok) {
        // Update balances
        await loadUserBalances()
        // Clear form
        buyAmount.value = ''
        
        // Show success toast
        const receivedAmount = TokenService.formatBalance(Number(result.Ok.to_amount), selectedTokenSymbol.value)
        const paidAmount = TokenService.formatBalance(Number(result.Ok.from_amount), 'USDT')
        toast.add({
          title: 'Trade Successful!',
          description: `Bought ${receivedAmount} ${selectedTokenSymbol.value} for ${paidAmount} USDT`,
          color: 'success',
        })
        
        // Refresh transaction history if on history tab
        if (activeTab.value === 'history') {
          // Trigger refresh by emitting event to TransactionHistory component
          // The component will automatically refresh when it detects the tab change
        }
      } else {
        toast.add({
          title: 'Trade Failed',
          description: result.Err,
          color: 'error',
        })
      }
    } catch (error) {
      console.error('Buy error:', error)
      toast.add({
        title: 'Trade Failed',
        description: 'Please try again',
        color: 'error',
      })
    } finally {
      buyLoading.value = false
    }
  }

  const executeSell = async () => {
    const parsedAmount = parseFormattedNumber(sellAmount.value)
    if (!sellAmount.value || parsedAmount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        color: 'error',
      })
      return
    }

    if (parsedAmount > selectedTokenBalanceRaw.value) {
      toast.add({
        title: 'Insufficient Balance',
        description: `You don't have enough ${selectedTokenSymbol.value} for this trade`,
        color: 'error',
      })
      return
    }

    sellLoading.value = true
    try {
      const amount = TokenService.toRawAmount(parsedAmount, selectedTokenSymbol.value)
      
      const result = await canisterService.marketSwap({
        from_token: selectedTokenSymbol.value,
        to_token: 'USDT',
        amount: BigInt(amount)
      })

      if (result.Ok) {
        // Update balances
        await loadUserBalances()
        // Clear form
        sellAmount.value = ''
        
        // Show success toast
        const soldAmount = TokenService.formatBalance(Number(result.Ok.from_amount), selectedTokenSymbol.value)
        const receivedAmount = TokenService.formatBalance(Number(result.Ok.to_amount), 'USDT')
        toast.add({
          title: 'Trade Successful!',
          description: `Sold ${soldAmount} ${selectedTokenSymbol.value} for ${receivedAmount} USDT`,
          color: 'success',
        })
        
        // Refresh transaction history if on history tab
        if (activeTab.value === 'history') {
          // Trigger refresh by emitting event to TransactionHistory component
          // The component will automatically refresh when it detects the tab change
        }
      } else {
        toast.add({
          title: 'Trade Failed',
          description: result.Err,
          color: 'error',
        })
      }
    } catch (error) {
      console.error('Sell error:', error)
      toast.add({
        title: 'Trade Failed',
        description: 'Please try again',
        color: 'error',
      })
    } finally {
      sellLoading.value = false
    }
  }

  // Data loading functions
  const loadUserBalances = async () => {
    if (!auth.userProfile?.id) {
      console.log('No user ID found, auth userProfile:', auth.userProfile)
      return
    }

    // Check if CanisterService is ready
    if (!canisterServiceReady.value) {
      console.log('CanisterService not ready, waiting...')
      return
    }
    
    try {
      console.log('Loading balances for user:', auth.userProfile.id)
      console.log('User ID type:', typeof auth.userProfile.id)
      const balances = await canisterService.getUserBalances(auth.userProfile.id.toString())
      console.log('Loaded balances:', balances)
      userBalances.value = balances
    } catch (error) {
      console.error('Error loading balances:', error)
    }
  }

  const loadInternalTokens = async () => {
    // Check if CanisterService is ready
    if (!canisterServiceReady.value) {
      console.log('CanisterService not ready, waiting...')
      return
    }

    try {
      console.log('Loading internal tokens...')
      const tokens = await canisterService.getAllInternalTokens()
      console.log('Loaded tokens:', tokens)
      internalTokens.value = tokens
    } catch (error) {
      console.error('Error loading tokens:', error)
    }
  }

  // Watchers
  watch(selectedTokenSymbol, () => {
    // Clear forms when switching tokens
    buyAmount.value = ''
    sellAmount.value = ''
  })

  // Watch for user authentication changes
  watch(() => auth.userProfile, async (newProfile) => {
    if (newProfile?.id && canisterServiceReady.value) {
      console.log('User authenticated and service ready, loading data...')
      await loadUserBalances()
    }
  }, { immediate: true })

  // Watch for CanisterService initialization
  watch(canisterServiceReady, async (isReady) => {
    if (isReady) {
      console.log('CanisterService ready, loading data...')
      await loadInternalTokens()
      
      // Set first available token as default
      if (internalTokens.value.length > 0) {
        const firstToken = internalTokens.value.find(t => t.symbol !== 'USDT')
        if (firstToken) {
          selectedTokenSymbol.value = firstToken.symbol
          console.log('Set default token to:', firstToken.symbol)
        }
      }

      // Load user balances if authenticated
      if (auth.userProfile?.id) {
        await loadUserBalances()
      }
    }
  }, { immediate: true })

  // Lifecycle
  onMounted(async () => {
    console.log('Trading page mounted, checking service status...')
    
    // Check if CanisterService is already ready
    if (canisterService.isInitialized()) {
      console.log('CanisterService already ready')
      canisterServiceReady.value = true
    } else {
      console.log('CanisterService not ready, waiting for initialization...')
      // Poll for service readiness
      const checkService = setInterval(() => {
        if (canisterService.isInitialized()) {
          console.log('CanisterService became ready')
          canisterServiceReady.value = true
          clearInterval(checkService)
        }
      }, 100)
      
      // Stop polling after 10 seconds
      setTimeout(() => {
        clearInterval(checkService)
        if (!canisterServiceReady.value) {
          console.warn('CanisterService did not initialize within 10 seconds')
        }
      }, 10000)
    }
  })

  // Page title
  useHead({
    title: 'Trading - Ionic Swap',
  })
</script>

<style scoped>
  /* All styles are inline classes */
</style>
