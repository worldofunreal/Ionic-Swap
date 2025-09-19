<template>
  <div class="flex flex-col gap-6 p-4 w-full">
    <!-- Mobile Filter Button - Only visible on mobile -->
    <div class="md:hidden flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Portfolio
      </h2>
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
      <!-- Token Balances Section -->
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
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

        <!-- Token Balances Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Coin
            </th>
                <th class="px-6 py-3 text-right text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Amount
            </th>
                <th class="px-6 py-3 text-right text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Price
            </th>
                <th class="px-6 py-3 text-right text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Today's PnL
            </th>
                <th class="px-6 py-3 text-right text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Value
            </th>
          </tr>
        </thead>
            <tbody class="bg-card divide-y divide-gray-200 dark:divide-gray-800">
              <tr v-if="tokensWithBalances.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-muted-foreground">
                  <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-heroicons-currency-dollar-20-solid" class="w-8 h-8" />
                  </div>
                  <p class="text-base font-medium">No token balances</p>
                  <p class="text-sm">{{ isOwnProfile ? 'Complete signup to receive your welcome bonus!' : 'This user has no token balances' }}</p>
                </td>
              </tr>
              <tr
                v-for="token in tokensWithBalances"
                :key="token.symbol"
                class="hover:bg-muted/50 transition-colors"
              >
                <!-- Coin Column -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mr-3">
                      <UIcon :name="getTokenIcon(token.symbol)" class="w-6 h-6" />
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-foreground">
                        {{ token.symbol }}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        {{ token.name }}
                      </div>
                </div>
              </div>
            </td>

                <!-- Amount Column -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-bold text-foreground">
                    {{ formatTokenAmount(token.symbol, token.balance) }}
                  </div>
            </td>

                <!-- Price Column -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold text-foreground">
                    {{ formatTokenPrice(token.price) }}
                  </div>
            </td>

                <!-- Today's PnL Column -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold" :class="token.change24h >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
                  </div>
            </td>

                <!-- Value Column -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold text-foreground">
                    {{ formatTokenValue(token.value) }}
                  </div>
            </td>
          </tr>
        </tbody>
      </table>
        </div>
      </div>

      <!-- Liquidity Positions Section -->
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Liquidity Positions</h3>
            <span class="text-xs text-muted-foreground">
              {{ liquidityPositions.length }} positions
            </span>
          </div>
        </div>

        <!-- Liquidity Positions Content -->
        <div class="p-4">
          <!-- Loading State -->
          <div v-if="positionsLoading" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>

          <!-- Empty State -->
          <div v-else-if="liquidityPositions.length === 0" class="text-center py-8">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-banknotes-20-solid" class="w-8 h-8" />
            </div>
            <p class="text-base font-medium text-foreground mb-2">No liquidity positions</p>
            <p class="text-sm text-muted-foreground mb-4">
              {{ isOwnProfile ? "You don't have any liquidity positions yet." : "This user has no liquidity positions." }}
            </p>
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
          </div>

          <!-- Positions List -->
          <div v-else class="space-y-4">
            <div
              v-for="position in liquidityPositions"
              :key="position.id"
              class="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                    <UIcon :name="getTokenIcon(position.token_symbol)" class="w-6 h-6" />
                  </div>
                  <div>
                    <div class="font-semibold text-foreground">{{ position.token_symbol }} Pool</div>
                    <div class="text-xs text-muted-foreground">ID: {{ position.id.slice(-8) }}</div>
                  </div>
                </div>
                <div 
                  :class="[
                    'px-3 py-1 text-xs rounded-full font-medium',
                    getNeuronStateClass(position.state)
                  ]"
                >
                  {{ formatNeuronState(position.state) }}
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div class="text-muted-foreground mb-1">Staked Amount</div>
                  <div class="font-semibold text-foreground">
                    {{ TokenService.formatBalance(typeof position.staked_amount === 'bigint' ? Number(position.staked_amount) : position.staked_amount, position.token_symbol) }} {{ position.token_symbol }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground mb-1">Voting Power</div>
                  <div class="font-semibold text-foreground">{{ calculateVotingPower(position).toFixed(2) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground mb-1">Dissolve Delay</div>
                  <div class="font-semibold text-foreground">{{ formatDuration(position.dissolve_delay_seconds) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground mb-1">Age</div>
                  <div class="font-semibold text-foreground">{{ formatAge(position.created_at) }}</div>
                </div>
              </div>

              <!-- Claimable Fees -->
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Claimable Fees</span>
                  <div class="text-right">
                    <div class="font-semibold text-foreground">
                      {{ calculateClaimableFees(position).toFixed(6) }} {{ position.token_symbol }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Position Actions (only for own profile) -->
              <div v-if="isOwnProfile" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex gap-2">
                  <button
                    v-if="position.state.Locked"
                    @click="startDissolving(position)"
                    class="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Start Dissolving
                  </button>
                  <button
                    v-if="position.state.Dissolving"
                    @click="stopDissolving(position)"
                    class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Stop Dissolving
                  </button>
                  <button
                    v-if="position.state.Dissolved"
                    @click="withdrawPosition(position)"
                    class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Withdraw
                  </button>
                  <button
                    @click="claimFees(position)"
                    class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Claim Fees
                  </button>
                </div>
              </div>
            </div>
          </div>
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
        class="absolute left-0 right-0 bg-white dark:bg-neutral-950 rounded-t-2xl border-t border-gray-200 dark:border-gray-800 max-h-[80vh] flex flex-col transition-transform duration-300 ease-out"
        :class="
          isDrawerOpen ? 'bottom-0 translate-y-0' : 'bottom-0 translate-y-full'
        "
        @click.stop
      >
        <!-- Drawer Handle -->
        <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <!-- Drawer Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="isDrawerOpen = false"
          >
            <UIcon
              name="heroicons:x-mark"
              class="w-5 h-5 text-gray-500 dark:text-gray-400"
            />
          </button>
        </div>

        <!-- Filter Content - Scrollable Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Value Display Toggle -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
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
          class="p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0"
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

  const formatTokenAmount = (symbol: string, balance: number) => {
    return TokenService.formatBalance(balance, symbol)
  }

  const formatTokenValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTokenPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Liquidity position helpers
  const formatNeuronState = (state: any) => {
    if (state && typeof state === 'object') {
      if ('Locked' in state) return 'Locked'
      if ('Dissolving' in state) return 'Dissolving'
      if ('Dissolved' in state) return 'Dissolved'
    }
    return 'Unknown'
  }

  const getNeuronStateClass = (state: any) => {
    if (state.Locked) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (state.Dissolving) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (state.Dissolved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const formatDuration = (seconds: number | bigint) => {
    const secondsNum = typeof seconds === 'bigint' ? Number(seconds) : seconds
    const days = Math.floor(secondsNum / (24 * 3600))
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''}`
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`
    if (days >= 7) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
    const hours = Math.floor(secondsNum / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const formatAge = (timestamp: number | bigint) => {
    const now = Date.now() / 1000
    const age = now - Number(timestamp)
    return formatDuration(age)
  }

  const calculateVotingPower = (position: any) => {
    const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    return stakeAmount * delayMultiplier * ageMultiplier
  }

  const calculateClaimableFees = (position: any) => {
    // Find the corresponding pool for this position
    const pool = allPools.value.find(p => p.token_symbol === position.token_symbol)
    if (!pool) return 0
    
    const stakeAmount = Number(position.staked_amount)
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    const rawVotingPower = stakeAmount * delayMultiplier * ageMultiplier
    
    const feeIndexDifference = pool.global_fee_index - (position.last_fee_index || 0)
    const claimableFeesRaw = feeIndexDifference * rawVotingPower
    
    return claimableFeesRaw / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
  }

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

