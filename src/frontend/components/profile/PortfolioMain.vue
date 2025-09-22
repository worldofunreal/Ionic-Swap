<template>
  <div class="flex flex-col gap-6 p-4 w-full">
    <!-- Mobile Filter Button - Only visible on mobile -->
    <div class="md:hidden flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Portfolio
      </h2>
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        @click="isDrawerOpen = true"
      >
        <UIcon name="heroicons:funnel" class="w-4 h-4" />
        <span class="text-sm font-medium">Filters</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Portfolio Content -->
    <div v-else class="space-y-6">
      <!-- Portfolio Overview Card -->
      <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold mb-1 text-zinc-900 dark:text-white">
              {{ isOwnProfile ? 'My Portfolio' : `${userProfile?.username || 'User'}'s Portfolio` }}
            </h3>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm">Total portfolio value across all assets</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
              {{ valueDisplay === 'usd' 
                ? `$${portfolioTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : `${(portfolioTotalValue / btcPrice).toFixed(8)} BTC` 
              }}
            </div>
            <div class="text-zinc-500 dark:text-zinc-400 text-sm">
              {{ portfolioStats.totalAssets }} total assets
            </div>
          </div>
        </div>
        
        <!-- Portfolio Breakdown -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div class="text-center">
            <div class="text-lg font-semibold text-zinc-900 dark:text-white">{{ portfolioStats.tokenCount }}</div>
            <div class="text-zinc-500 dark:text-zinc-400 text-xs">Token Balances</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-zinc-900 dark:text-white">{{ portfolioStats.positionCount }}</div>
            <div class="text-zinc-500 dark:text-zinc-400 text-xs">Staked Positions</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ valueDisplay === 'usd' 
                ? `$${tokensWithBalances.reduce((sum, token) => sum + token.value, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}` 
                : `${(tokensWithBalances.reduce((sum, token) => sum + token.value, 0) / btcPrice).toFixed(4)} BTC`
              }}
            </div>
            <div class="text-zinc-500 dark:text-zinc-400 text-xs">Liquid Assets</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ valueDisplay === 'usd' 
                ? `$${liquidityPositions.reduce((total, position) => {
                    const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
                    const price = tokenPrices[position.token_symbol]
                    return total + (price ? stakeAmount * price.usd : 0)
                  }, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}` 
                : `${(liquidityPositions.reduce((total, position) => {
                    const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
                    const price = tokenPrices[position.token_symbol]
                    return total + (price ? stakeAmount * price.usd : 0)
                  }, 0) / btcPrice).toFixed(4)} BTC`
              }}
            </div>
            <div class="text-zinc-500 dark:text-zinc-400 text-xs">Staked Assets</div>
          </div>
        </div>
      </div>

      <!-- Token Balances Section -->
      <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Token Balances</h3>
            <div class="flex items-center gap-3">
              <!-- Value Toggle -->
              <div class="flex bg-muted rounded-md p-1">
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    valueDisplay === 'usd'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/80',
                  ]"
                  @click="valueDisplay = 'usd'"
                >
                  USD
                </button>
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    valueDisplay === 'btc'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/80',
                  ]"
                  @click="valueDisplay = 'btc'"
                >
                  BTC
                </button>
              </div>
              <span class="text-xs text-muted-foreground">
                {{ tokensWithBalances.length }} assets
              </span>
            </div>
          </div>
        </div>

        <!-- Token Balances Table using Tokens component -->
        <div class="p-4">
          <Tokens
            :tokens="tokensWithBalances"
            :balances-visible="true"
            :value-display="valueDisplay"
            :btc-price="btcPrice"
            :show-actions="false"
            :empty-title="isOwnProfile ? 'No token balances' : 'This user has no token balances'"
            :empty-description="isOwnProfile ? 'Complete signup to receive your welcome bonus!' : 'This user has no token balances'"
          />
        </div>
      </div>

      <!-- Liquidity Positions Section -->
      <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Liquidity Positions</h3>
            <span class="text-xs text-muted-foreground">
              {{ liquidityPositions.length }} positions
            </span>
          </div>
        </div>

        <!-- Liquidity Positions Content using Stakes component -->
        <div class="p-4">
          <Stakes
            :positions="liquidityPositions"
            :loading="positionsLoading"
            :show-actions="isOwnProfile"
            :empty-title="'No liquidity positions'"
            :empty-description="isOwnProfile ? 'You don\'t have any liquidity positions yet.' : 'This user has no liquidity positions.'"
            @start-dissolving="startDissolving"
            @stop-dissolving="stopDissolving"
            @withdraw="withdrawPosition"
            @claim-fees="claimFees"
          >
            <template #cta>
              <UButton 
                v-if="isOwnProfile"
                color="primary" 
                variant="soft" 
                @click="navigateTo('/liquidity')"
                class="text-sm font-semibold px-4 py-2"
              >
                <UIcon name="i-heroicons-plus-20-solid" class="w-4 h-4 mr-2" />
                Start Staking
              </UButton>
            </template>
          </Stakes>
        </div>
      </div>
    </div>

    <!-- Mobile Filter Drawer -->
    <div
      class="fixed inset-0 z-50 md:hidden transition-opacity duration-300"
      :class="isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="isDrawerOpen = false"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" />

      <!-- Drawer Content -->
      <div
        class="absolute left-0 right-0 bg-zinc-50 dark:bg-neutral-950 rounded-t-2xl border-t border-zinc-200 dark:border-zinc-800 max-h-[80vh] flex flex-col transition-transform duration-300 ease-out"
        :class="
          isDrawerOpen ? 'bottom-0 translate-y-0' : 'bottom-0 translate-y-full'
        "
        @click.stop
      >
        <!-- Drawer Handle -->
        <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div class="w-12 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>

        <!-- Drawer Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0"
        >
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
            Filters
          </h3>
          <button
            class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            @click="isDrawerOpen = false"
          >
            <UIcon
              name="heroicons:x-mark"
              class="w-5 h-5 text-zinc-500 dark:text-zinc-400"
            />
          </button>
        </div>

        <!-- Filter Content - Scrollable Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Value Display Toggle -->
          <div>
            <h4 class="font-semibold text-zinc-900 dark:text-white mb-3">
              Value Display
            </h4>
            <div class="flex bg-muted rounded-md p-1">
              <button
                :class="[
                  'flex-1 px-3 py-2 text-sm rounded-md transition-colors',
                  valueDisplay === 'usd'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/80',
                ]"
                @click="valueDisplay = 'usd'"
              >
                USD
              </button>
              <button
                :class="[
                  'flex-1 px-3 py-2 text-sm rounded-md transition-colors',
                  valueDisplay === 'btc'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/80',
                ]"
                @click="valueDisplay = 'btc'"
              >
                BTC
              </button>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div
          class="p-6 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0"
        >
            <button
            class="w-full px-4 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            @click="isDrawerOpen = false"
          >
            Done
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { priceService } from '@/services/PriceService'
  import { TokenService } from '@/services/TokenService'
  import { useToast } from '#imports'
  import Tokens from '@/components/Tokens.vue'
  import Stakes from '@/components/Stakes.vue'

  // Props
  interface Props {
    targetUser?: any
    isOwnProfile?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    targetUser: undefined,
    isOwnProfile: false,
  })

  const auth = useAuthStore()
  const toast = useToast()

  // Reactive data
  const loading = ref(true)
  const positionsLoading = ref(false)
  const isDrawerOpen = ref(false)
  const valueDisplay = ref<'usd' | 'btc'>('usd')

  // Token data
  const userBalances = ref<Record<string, number>>({})
  const internalTokens = ref<any[]>([])
  const tokenPrices = ref<Record<string, { usd: number; btc: number; change24h: number }>>({})
  const btcPrice = ref(45000)

  // Liquidity positions
  const liquidityPositions = ref<any[]>([])
  const allPools = ref<any[]>([])

  // Computed properties
  const userProfile = computed(() => props.targetUser || auth.userProfile)
  const userId = computed(() => userProfile.value?.id)

  // Portfolio total value calculation
  const portfolioTotalValue = computed(() => {
    // Calculate token balances value
    const tokenValue = tokensWithBalances.value.reduce((total, token) => total + token.value, 0)
    
    // Calculate liquidity positions value
    const positionsValue = liquidityPositions.value.reduce((total, position) => {
      const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
      const price = tokenPrices.value[position.token_symbol]
      return total + (price ? stakeAmount * price.usd : 0)
    }, 0)
    
    return tokenValue + positionsValue
  })

  // Portfolio stats
  const portfolioStats = computed(() => {
    const tokenCount = tokensWithBalances.value.length
    const positionCount = liquidityPositions.value.length
    const totalAssets = tokenCount + positionCount
    
    return {
      totalValue: portfolioTotalValue.value,
      tokenCount,
      positionCount,
      totalAssets
    }
  })

  // Get tokens with balances, sorted by value
  const tokensWithBalances = computed(() => {
    return internalTokens.value
      .map(token => {
        const balance = userBalances.value[token.symbol] || 0
        const decimals = token.decimals || 6
        const normalizedBalance = balance / Math.pow(10, decimals)
        const price = tokenPrices.value[token.symbol]
        const value = price ? normalizedBalance * price.usd : 0
        
        return {
          ...token,
          balance,
          normalizedBalance,
          value,
          price: price?.usd || 0,
          change24h: price?.change24h || 0
        }
      })
      .filter(token => token.balance > 0) // Only show tokens with balances
      .sort((a, b) => b.value - a.value) // Sort by value descending
  })

  // Helper functions

  const formatTokenAmount = (symbol: string, balance: number) => {
    return TokenService.formatBalance(balance, symbol)
  }

  const formatTokenValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTokenPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTokenValueBTC = (value: number) => {
    const btcValue = value / btcPrice.value
    return `${btcValue.toFixed(8)} BTC`
  }

  const formatTokenPriceBTC = (price: number) => {
    const btcPrice_val = btcPrice.value
    const btcValue = price / btcPrice_val
    return `${btcValue.toFixed(8)} BTC`
  }

  // Liquidity position helpers
  // Liquidity position actions (only for own profile)
  const startDissolving = async (position: any) => {
    toast.add({
      title: 'Dissolving Coming Soon',
      description: 'Position management features will be available soon',
      color: 'info',
    })
  }

  const stopDissolving = async (position: any) => {
    toast.add({
      title: 'Dissolving Management Coming Soon',
      description: 'Position management features will be available soon',
      color: 'info',
    })
  }

  const withdrawPosition = async (position: any) => {
    toast.add({
      title: 'Withdrawal Coming Soon',
      description: 'Position withdrawal will be available soon',
      color: 'info',
    })
  }

  const claimFees = async (position: any) => {
    try {
      const result = await canisterService.claimFees(position.id)
      
      toast.add({
        title: 'Fees Claimed Successfully!',
        description: result,
        color: 'success',
      })

      // Refresh positions
      await loadLiquidityPositions()
    } catch (error) {
      console.error('Error claiming fees:', error)
      toast.add({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    }
  }

  // Data loading functions
  const loadTokenData = async () => {
    if (!userId.value || !canisterService.isInitialized()) return

    try {
      // Load user balances
      const balances = await canisterService.getUserBalances(userId.value.toText())
      userBalances.value = balances

      // Load internal tokens
      const tokens = await canisterService.getAllInternalTokens()
      internalTokens.value = tokens
    } catch (error) {
      console.error('Error loading token data:', error)
    }
  }

  const loadLiquidityPositions = async () => {
    if (!userId.value || !canisterService.isInitialized()) return

    positionsLoading.value = true
    try {
      const positions = await canisterService.getLiquidityPositions(userId.value)
      liquidityPositions.value = positions
    } catch (error) {
      console.error('Error loading liquidity positions:', error)
    } finally {
      positionsLoading.value = false
    }
  }

  const loadAllPools = async () => {
    if (!canisterService.isInitialized()) return
    
    try {
      const pools = await canisterService.getAllLiquidityPools()
      allPools.value = pools
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  const updatePrices = () => {
    const prices = priceService.getPrices()
    const newTokenPrices: Record<string, { usd: number; btc: number; change24h: number }> = {}
    
    prices.forEach((token, symbol) => {
      newTokenPrices[symbol] = {
        usd: token.price,
        btc: symbol === 'BTC' ? 1 : token.price / btcPrice.value,
        change24h: token.change24h
      }
      
      if (symbol === 'BTC') {
        btcPrice.value = token.price
      }
    })
    
    tokenPrices.value = newTokenPrices
  }

  // Load all data
  const loadData = async () => {
    loading.value = true
    try {
      await Promise.all([
        loadTokenData(),
        loadLiquidityPositions(),
        loadAllPools()
      ])
    } catch (error) {
      console.error('Error loading portfolio data:', error)
    } finally {
      loading.value = false
    }
  }

  // Watch for user changes
  watch(userId, async (newUserId) => {
    if (newUserId && canisterService.isInitialized()) {
      await loadData()
    }
  })

  // Subscribe to price updates
  let priceUnsubscribe: (() => void) | null = null

  onMounted(async () => {
    // Subscribe to price updates
    priceUnsubscribe = priceService.subscribe(() => {
      updatePrices()
    })

    // Initial price update
    updatePrices()

    // Load data if canister service is ready
    if (canisterService.isInitialized()) {
      await loadData()
    }
  })

  onUnmounted(() => {
    if (priceUnsubscribe) {
      priceUnsubscribe()
    }
  })
</script>

