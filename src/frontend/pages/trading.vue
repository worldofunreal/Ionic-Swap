<template>
  <div class="trading-page h-screen bg-background overflow-hidden flex flex-col" style="height: 100vh; max-height: 100vh;">
    <!-- Trading Header -->
    <div
      class="bg-card border-b border-neutral-200 dark:border-neutral-700 px-4 py-2 flex-shrink-0"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <UIcon :name="getTokenIcon(selectedTokenSymbol)" class="w-5 h-5" />
            </div>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white">
                {{ selectedTokenSymbol }}/USDT
              </div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">
                {{ selectedTokenInfo?.name || selectedTokenSymbol }}
              </div>
            </div>
          </div>

          <!-- Price Display -->
          <div class="flex items-center space-x-4">
            <div class="text-2xl font-bold text-zinc-900 dark:text-white">
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
            class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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

    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- Left Column - Chart and History -->
      <div class="flex-1 flex flex-col">

        <!-- Chart Area -->
        <div class="bg-card p-2 overflow-hidden" style="height: 50%;">
          <LightweightPriceChart
            :key="`trading-${selectedTokenSymbol}`"
            :token-symbol="selectedTokenSymbol"
            :default-chart-type="'candlesticks'"
            :no-container="true"
            class="h-full"
          />
        </div>

        <!-- Transaction History -->
        <div class="bg-card border-t border-neutral-200 dark:border-neutral-700 p-2 overflow-hidden" style="height: 50%;">
          <div class="overflow-y-auto scrollbar-hide" style="height: calc(100% - 1.5rem);">
            <TransactionHistory ref="transactionHistoryRef" />
          </div>
        </div>
      </div>

      <!-- Right Column - Trading Panel -->
      <div
        class="w-80 bg-card border-l border-neutral-200 dark:border-neutral-700 flex flex-col"
      >
        <!-- Trading Header -->
        <div class="border-b border-neutral-200 dark:border-neutral-700 px-2 py-2">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">Market Trading</h3>
            
            <!-- Chart Controls -->
            <div class="flex items-center space-x-2">
              <button
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
              >
                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
              </button>
              <button
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Trading Form -->
        <div class="flex-1 p-3">
          <!-- Market Trading -->
          <div class="space-y-3">
            <!-- Buy Section -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-zinc-900 dark:text-white"
                  >Buy {{ selectedTokenSymbol }}</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-400"
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
                    class="w-full px-3 py-2 bg-buy-surface border border-neutral-200 dark:border-neutral-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                  <div
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    USDT
                  </div>
                </div>

                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-buy-surface text-zinc-900 dark:text-white rounded hover:bg-zinc-50 dark:bg-zinc-900-elevated"
                    @click="setBuyAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <button
                @click="executeBuy"
                :disabled="buyLoading || !buyAmount || parseFormattedNumber(buyAmount) <= 0"
                class="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="buyLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ buyLoading ? 'Buying...' : `Buy ${selectedTokenSymbol}` }}
              </button>
            </div>

            <!-- Sell Section -->
            <div
              class="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-zinc-900 dark:text-white"
                  >Sell {{ selectedTokenSymbol }}</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-400"
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
                    class="w-full px-3 py-2 bg-sell-surface border border-neutral-200 dark:border-neutral-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                  <div
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {{ selectedTokenSymbol }}
                  </div>
                </div>

                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-sell-surface text-zinc-900 dark:text-white rounded hover:bg-zinc-50 dark:bg-zinc-900-elevated"
                    @click="setSellAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <button
                @click="executeSell"
                :disabled="sellLoading || !sellAmount || parseFormattedNumber(sellAmount) <= 0"
                class="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="sellLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ sellLoading ? 'Selling...' : `Sell ${selectedTokenSymbol}` }}
              </button>
            </div>
          </div>

          <!-- Limit Tab (Hidden for now) -->
          <div v-if="false" class="space-y-4">
            <!-- Buy Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-zinc-900 dark:text-white"
                  >Buy {{ selectedToken?.symbol || 'BTC' }}</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-400"
                  >Balance: 0.00 USDT</span
                >
              </div>

              <div class="space-y-2">
                <div>
                  <label
                    class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1"
                    >Price (USDT)</label
                  >
                  <input
                    v-model="limitBuyPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label
                    class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1"
                    >Amount ({{ selectedToken?.symbol || 'BTC' }})</label
                  >
                  <input
                    v-model="limitBuyAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div class="text-xs text-zinc-500 dark:text-zinc-400">
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
              class="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium text-zinc-900 dark:text-white"
                  >Sell {{ selectedToken?.symbol || 'BTC' }}</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-400"
                  >Balance: 0.00 {{ selectedToken?.symbol || 'BTC' }}</span
                >
              </div>

              <div class="space-y-2">
                <div>
                  <label
                    class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1"
                    >Price (USDT)</label
                  >
                  <input
                    v-model="limitSellPrice"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label
                    class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1"
                    >Amount ({{ selectedToken?.symbol || 'BTC' }})</label
                  >
                  <input
                    v-model="limitSellAmount"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div class="text-xs text-zinc-500 dark:text-zinc-400">
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
  // Removed activeTab as tabs are no longer needed
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

  // Template refs
  const transactionHistoryRef = ref<any>(null)


  // Trading tabs (simplified)
  // Removed history tab as it's now below the chart

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
    return 'text-zinc-500 dark:text-zinc-400'
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

  // Raw balance values for calculations (keep as raw values from backend)
  const usdtBalanceRaw = computed(() => {
    return userBalances.value['USDT'] || 0
  })

  const selectedTokenBalanceRaw = computed(() => {
    return userBalances.value[selectedTokenSymbol.value] || 0
  })

  // Display balance values (converted for UI display)
  const usdtBalanceDisplay = computed(() => {
    const balance = userBalances.value['USDT'] || 0
    return balance / Math.pow(10, TokenService.getTokenDecimals('USDT'))
  })

  const selectedTokenBalanceDisplay = computed(() => {
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

  // Get token icon for display (matching wallet.vue)
  const getTokenIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      'BTC': 'logos:bitcoin',
      'ETH': 'token-branded:ethereum',
      'XRP': 'cryptocurrency-color:xrp',
      'USDT': 'cryptocurrency-color:usdt',
      'BNB': 'token-branded:binance',
      'SOL': 'token-branded:solana',
      'DOGE': 'simple-icons:dogecoin',
      'ADA': 'logos:cardano-icon',
      'TRX': 'token-branded:tron',
      'ICP': 'token-branded:icp',
    }
    return icons[symbol] || 'cryptocurrency-color:generic'
  }

  const setBuyAmount = (percent: number) => {
    const balance = usdtBalanceDisplay.value
    const amount = (balance * percent) / 100
    console.log(`Setting buy amount: ${percent}% of ${balance} USDT = ${amount}`)
    buyAmount.value = formatNumberWithCommas(amount, TokenService.getDisplayDecimals('USDT'))
  }

  const setSellAmount = (percent: number) => {
    const balance = selectedTokenBalanceDisplay.value
    const amount = (balance * percent) / 100
    console.log(`Setting sell amount: ${percent}% of ${balance} ${selectedTokenSymbol.value} = ${amount}`)
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
    if (parsed > usdtBalanceDisplay.value) {
      buyAmount.value = formatNumberWithCommas(usdtBalanceDisplay.value, TokenService.getDisplayDecimals('USDT'))
    }
  }

  // Validate sell amount on blur
  const validateSellAmount = () => {
    const parsed = parseFormattedNumber(sellAmount.value)
    if (parsed > selectedTokenBalanceDisplay.value) {
      sellAmount.value = formatNumberWithCommas(selectedTokenBalanceDisplay.value, TokenService.getDisplayDecimals(selectedTokenSymbol.value))
    }
  }

  // Trading functions
  const executeBuy = async () => {
    const parsedAmount = parseFormattedNumber(buyAmount.value)
    console.log(`Execute buy: parsedAmount=${parsedAmount}, usdtBalanceDisplay=${usdtBalanceDisplay.value}`)
    
    if (!buyAmount.value || parsedAmount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        color: 'error',
      })
      return
    }

    if (parsedAmount > usdtBalanceDisplay.value) {
      console.log(`Insufficient balance: ${parsedAmount} > ${usdtBalanceDisplay.value}`)
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
        
        // Refresh transaction history
        if (transactionHistoryRef.value) {
          await transactionHistoryRef.value.refreshHistory()
        }
        
        // Show success toast
        const receivedAmount = TokenService.formatBalance(Number(result.Ok.to_amount), selectedTokenSymbol.value)
        const paidAmount = TokenService.formatBalance(Number(result.Ok.from_amount), 'USDT')
        toast.add({
          title: 'Trade Successful!',
          description: `Bought ${receivedAmount} ${selectedTokenSymbol.value} for ${paidAmount} USDT`,
          color: 'success',
        })
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
    console.log(`Execute sell: parsedAmount=${parsedAmount}, selectedTokenBalanceDisplay=${selectedTokenBalanceDisplay.value}`)
    
    if (!sellAmount.value || parsedAmount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        color: 'error',
      })
      return
    }

    if (parsedAmount > selectedTokenBalanceDisplay.value) {
      console.log(`Insufficient balance: ${parsedAmount} > ${selectedTokenBalanceDisplay.value}`)
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
        
        // Refresh transaction history
        if (transactionHistoryRef.value) {
          await transactionHistoryRef.value.refreshHistory()
        }
        
        // Show success toast
        const soldAmount = TokenService.formatBalance(Number(result.Ok.from_amount), selectedTokenSymbol.value)
        const receivedAmount = TokenService.formatBalance(Number(result.Ok.to_amount), 'USDT')
        toast.add({
          title: 'Trade Successful!',
          description: `Sold ${soldAmount} ${selectedTokenSymbol.value} for ${receivedAmount} USDT`,
          color: 'success',
        })
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
    
    // Prevent body scrolling on trading page
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    document.body.style.maxHeight = '100vh'
    
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

  onUnmounted(() => {
    // Restore body scrolling when leaving trading page
    document.body.style.overflow = ''
    document.body.style.height = ''
    document.body.style.maxHeight = ''
  })

  // Page title
  useHead({
    title: 'Trading - Ionic Swap',
  })
</script>

<style scoped>
  /* Hide scrollbar for transaction history */
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
</style>

<style>
  /* Prevent scrolling only on trading page */
  .trading-page {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
  
  /* Prevent body scrolling when on trading page */
  body:has(.trading-page) {
    overflow: hidden;
    height: 100vh;
    max-height: 100vh;
  }
</style>

