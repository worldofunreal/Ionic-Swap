<template>
  <div class="min-h-screen bg-background">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>

    <!-- Wallet Portfolio Overview -->
    <div v-else>
        <!-- Top Header -->
        <div class="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">Wallet</h1>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="relative">
                <UIcon name="i-heroicons-magnifying-glass-20-solid" class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search tokens, positions, or transactions..."
                  class="pl-10 pr-10 py-2 w-80 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4" />
                </button>
              </div>
              
              <UButton color="primary" class="text-sm font-semibold px-4 py-2 text-white">
                <UIcon name="i-heroicons-arrow-down-tray-20-solid" class="w-4 h-4 mr-2" />
                Deposit
              </UButton>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Content -->
        <div class="p-6">
          <div class="max-w-7xl mx-auto">
            <!-- Portfolio Overview & User Profile Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <!-- User Profile Card -->
              <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-sm">{{ userInitial }}</span>
                  </div>
                  <div>
                    <h2 class="text-base font-semibold text-zinc-900 dark:text-white">
                      {{ userProfile?.username || 'User' }}
                    </h2>
                    <div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <button 
                        class="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        @click="openFollowersModal('following')"
                      >
                        <span class="font-semibold text-zinc-900 dark:text-white">{{ userProfile?.following_count || 0 }}</span>
                        <span>Following</span>
                      </button>
                      <button 
                        class="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        @click="openFollowersModal('followers')"
                      >
                        <span class="font-semibold text-zinc-900 dark:text-white">{{ userProfile?.followers_count || 0 }}</span>
                        <span>Followers</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Compact Wallet Addresses -->
                <div class="space-y-3">
                  <!-- ICP Principal -->
                  <div v-if="userProfile?.id" class="flex items-center gap-2 text-base">
                    <img :src="TokenService.getTokenIcon('ICP')" alt="ICP icon" class="w-5 h-5" />
                    <span class="font-mono text-zinc-600 dark:text-zinc-300">{{ formatCompactAddress(userProfile.id.toText()) }}</span>
                    <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="copyToClipboard(userProfile.id.toText(), 'ICP')" />
                    <UIcon name="i-heroicons-qr-code-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="showQRCode(userProfile.id.toText(), 'ICP')" />
                  </div>

                  <!-- EVM Address -->
                  <div v-if="userProfile?.evm_address?.[0]" class="flex items-center gap-2 text-base">
                    <img :src="TokenService.getTokenIcon('ETH')" alt="Ethereum icon" class="w-5 h-5" />
                    <span class="font-mono text-zinc-600 dark:text-zinc-300">{{ formatCompactAddress(userProfile.evm_address[0]) }}</span>
                    <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="copyToClipboard(userProfile.evm_address[0], 'EVM')" />
                    <UIcon name="i-heroicons-qr-code-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="showQRCode(userProfile.evm_address[0], 'EVM')" />
                  </div>

                  <!-- Solana Address -->
                  <div v-if="userProfile?.solana_address?.[0]" class="flex items-center gap-2 text-base">
                    <img :src="TokenService.getTokenIcon('SOL')" alt="Solana icon" class="w-5 h-5" />
                    <span class="font-mono text-zinc-600 dark:text-zinc-300">{{ formatCompactAddress(userProfile.solana_address[0]) }}</span>
                    <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="copyToClipboard(userProfile.solana_address[0], 'Solana')" />
                    <UIcon name="i-heroicons-qr-code-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="showQRCode(userProfile.solana_address[0], 'Solana')" />
                  </div>

                  <!-- Bitcoin Address -->
                  <div v-if="userProfile?.bitcoin_address?.[0]" class="flex items-center gap-2 text-base">
                    <img :src="TokenService.getTokenIcon('BTC')" alt="Bitcoin icon" class="w-5 h-5" />
                    <span class="font-mono text-zinc-600 dark:text-zinc-300">{{ formatCompactAddress(userProfile.bitcoin_address[0]) }}</span>
                    <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="copyToClipboard(userProfile.bitcoin_address[0], 'Bitcoin')" />
                    <UIcon name="i-heroicons-qr-code-20-solid" class="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" @click="showQRCode(userProfile.bitcoin_address[0], 'Bitcoin')" />
                  </div>
                </div>
              </div>

              <!-- Portfolio Overview Card -->
              <div class="lg:col-span-2">
                <PortfolioTracker 
                  :user-principal="userPrincipal?.toText?.() || ''"
                  :local-portfolio-value="totalValue"
                  :btc-price="btcPrice"
                  :balances-visible="balancesVisible"
                  @toggle-balance-visibility="toggleBalanceVisibility"
                  @update-value-display="valueDisplay = $event"
                />
              </div>
            </div>


            <!-- Assets Section with Tabs -->
            <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
              <!-- Tab Header -->
              <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <!-- Value Toggle (only show for Tokens tab) -->
                    <div v-if="activeTab === 'tokens'" class="flex bg-zinc-100 dark:bg-zinc-900 rounded-md p-1">
                      <button
                        :class="[
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          valueDisplay === 'usd'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
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
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                        ]"
                        @click="valueDisplay = 'btc'"
                      >
                        BTC
                      </button>
                    </div>
                    <span class="text-xs text-zinc-500 dark:text-zinc-400">
                      {{ getTabCount() }} {{ getTabLabel() }}
                      <span v-if="searchQuery" class="text-primary-600 dark:text-primary-400">
                        (filtered by "{{ searchQuery }}")
                      </span>
                    </span>
                  </div>
                </div>
                
                <!-- Tab Navigation -->
                <div class="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                  <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    :class="[
                      'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      activeTab === tab.id
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    ]"
                    @click="activeTab = tab.id"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <UIcon :name="tab.icon" class="w-4 h-4" />
                      {{ tab.label }}
                    </div>
                  </button>
                </div>
              </div>

              <!-- Tab Content -->
              <div class="p-4">
                <!-- Tokens Tab -->
                <Tokens
                  v-if="activeTab === 'tokens'"
                  :tokens="tokensWithBalances"
                  :balances-visible="balancesVisible"
                  :value-display="valueDisplay"
                  :btc-price="btcPrice"
                  :show-actions="true"
                  empty-title="Loading Assets..."
                  empty-description="Fetching your token balances"
                  @trade="tradeToken"
                  @stake="stakeToken"
                  @withdraw="openWithdrawModal"
                />

                <!-- Stakes Tab -->
                <Stakes
                  v-else-if="activeTab === 'stakes'"
                  :positions="filteredLiquidityPositions"
                  :loading="false"
                  :show-actions="true"
                  :empty-title="searchQuery ? 'No matching positions' : 'No liquidity positions'"
                  :empty-description="getEmptyDescription()"
                  @start-dissolving="startDissolving"
                  @stop-dissolving="stopDissolving"
                  @withdraw="withdrawPosition"
                  @claim-fees="claimFees"
                >
                  <template #cta>
                    <UButton 
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

                <!-- Transactions Tab -->
                <TransactionHistory
                  v-else-if="activeTab === 'transactions'"
                  :limit="20"
                  :target-user-id="auth.userProfile?.id?.toText?.() || null"
                  :transactions="filteredTransactionHistory"
                />
              </div>
            </div>


          </div>
        </div>
    </div>

    <!-- Withdrawal Modal -->
    <WithdrawalModal
      ref="withdrawalModal"
      :selected-token="selectedToken"
      :user-profile="userProfile"
      :balances-visible="balancesVisible"
      :user-balances="userBalances"
    />

    <!-- QR Code Modal -->
    <QRCodeModal
      :is-open="qrModalOpen"
      :address="qrAddress"
      :wallet-type="qrWalletType"
      @close="qrModalOpen = false"
    />

    <!-- Followers/Following Modal -->
    <FollowersFollowingModal 
      ref="followersModalRef" 
      :user-profile="userProfile" 
      :is-own-profile="true" 
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService, type SwapTransaction } from '@/services/CanisterService'
  import { priceService } from '@/services/PriceService'
  import { useToast } from '#imports'
  import { useColorTheme } from '@/composables/useColorTheme'
  import { useTheme } from '@/composables/useTheme'
  import { TokenService } from '@/services/TokenService'
  import PortfolioTracker from '@/components/PortfolioTracker.vue'
  import WithdrawalModal from '@/components/WithdrawalModal.vue'
  import QRCodeModal from '@/components/QRCodeModal.vue'
  import Tokens from '@/components/Tokens.vue'
  import Stakes from '@/components/Stakes.vue'
  import TransactionHistory from '@/components/TransactionHistory.vue'
  import FollowersFollowingModal from '@/components/FollowersFollowingModal.vue'

  const auth = useAuthStore()
  const loading = ref(true)
  const toast = useToast()
  const { colorTheme } = useColorTheme()
  const { theme } = useTheme()

  // Get user profile from auth store
  const userProfile = computed(() => auth.userProfile)
  const userPrincipal = computed(() => auth.userProfile?.id)

  // User initial for avatar
  const userInitial = computed(() => {
    if (!userProfile.value?.username) return 'U'
    return userProfile.value.username.charAt(0).toUpperCase()
  })

  // Token balances
  const userBalances = ref<Record<string, number>>({})
  const internalTokens = ref<any[]>([])
  const faucetClaimed = ref(false)
  const totalValue = ref(0)
  const valueDisplay = ref<'usd' | 'btc'>('usd')
  
  // Transaction history
  const transactionHistory = ref<SwapTransaction[]>([])
  const transactionHistoryLoading = ref(false)
  
  // Liquidity positions data  
  const liquidityPositions = ref<any[]>([])
  const allPools = ref<any[]>([])
  
  // Real price data from PriceService
  const tokenPrices = ref<Record<string, { usd: number; btc: number; change24h: number }>>({})
  const btcPrice = ref(45000) // Will be updated from PriceService
  let priceUnsubscribe: (() => void) | null = null
  
  // Balance visibility toggle
  const balancesVisible = ref(true)
  
  // Search functionality
  const searchQuery = ref('')
  
  // Tab state for My Assets section
  const tabs = [
    { id: 'tokens', label: 'Tokens', icon: 'i-heroicons-currency-dollar-20-solid' },
    { id: 'stakes', label: 'Stakes', icon: 'i-heroicons-banknotes-20-solid' },
    { id: 'transactions', label: 'Transactions', icon: 'i-heroicons-clock-20-solid' }
  ] as const
  const activeTab = ref<'tokens' | 'stakes' | 'transactions'>('tokens')
  
  // Filtered liquidity positions based on search
  const filteredLiquidityPositions = computed(() => {
    if (!searchQuery.value.trim()) {
      return liquidityPositions.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return liquidityPositions.value.filter(position => 
      position.token_symbol.toLowerCase().includes(query)
    )
  })

  // Filtered transaction history based on search
  const filteredTransactionHistory = computed(() => {
    if (!searchQuery.value.trim()) {
      return transactionHistory.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return transactionHistory.value.filter(transaction => 
      transaction.from_token.toLowerCase().includes(query) ||
      transaction.to_token.toLowerCase().includes(query)
    )
  })

  // Tab helper functions
  const getTabCount = () => {
    switch (activeTab.value) {
      case 'tokens': return tokensWithBalances.value.length
      case 'stakes': return filteredLiquidityPositions.value.length
      case 'transactions': return filteredTransactionHistory.value.length
      default: return 0
    }
  }
  
  const getTabLabel = () => {
    return activeTab.value === 'transactions' ? 'transactions' : 'assets'
  }

  // Get empty description for stakes
  const getEmptyDescription = () => {
    if (searchQuery.value) {
      return `No positions found for '${searchQuery.value}'`
    }
    return "You don't have any liquidity positions yet."
  }
  
  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null
  
  // Withdrawal modal state
  const withdrawalModal = ref<InstanceType<typeof WithdrawalModal>>()
  const selectedToken = ref('')
  
  // QR code modal state
  const qrModalOpen = ref(false)
  const qrAddress = ref('')
  const qrWalletType = ref('')
  
  // Followers modal state
  const followersModalRef = ref<{ open: (tab: 'followers' | 'following') => void } | null>(null)
  
  // Toggle balance visibility
  const toggleBalanceVisibility = () => {
    balancesVisible.value = !balancesVisible.value
  }

  // Update prices from PriceService
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

  // Watch for changes in prices, balances, or positions to recalculate total value
  watch([tokenPrices, userBalances, liquidityPositions], () => {
    if (Object.keys(tokenPrices.value).length > 0) {
      let total = 0
      
      // Add liquid token balances
      if (Object.keys(userBalances.value).length > 0) {
        total += Object.entries(userBalances.value).reduce((subtotal, [symbol, amount]) => {
          const token = internalTokens.value.find(t => t.symbol === symbol)
          if (token) {
            const decimals = token.decimals || 6
            const normalizedAmount = amount / Math.pow(10, decimals)
            const price = tokenPrices.value[symbol]
            if (price) {
              return subtotal + (normalizedAmount * price.usd)
            }
          }
          return subtotal
        }, 0)
      }
      
      // Add staked positions value + claimable fees
      if (liquidityPositions.value.length > 0) {
        total += liquidityPositions.value.reduce((subtotal, position) => {
          const price = tokenPrices.value[position.token_symbol]
          if (price) {
            // Add staked amount value
            const decimals = TokenService.getTokenDecimals(position.token_symbol)
            const normalizedStaked = Number(position.staked_amount) / Math.pow(10, decimals)
            let positionValue = normalizedStaked * price.usd
            
            // Add claimable fees value (only for non-dissolved positions)
            if (position.state && !position.state.Dissolved) {
              const claimableFees = calculateClaimableFees(position)
              positionValue += claimableFees * price.usd
            }
            
            return subtotal + positionValue
          }
          return subtotal
        }, 0)
      }
      
      totalValue.value = total
    }
  }, { deep: true })

  // Computed property to get all tokens with their balances, sorted by value
  const tokensWithBalances = computed(() => {
    const tokens = internalTokens.value
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
      .sort((a, b) => b.value - a.value) // Sort by value descending

    // Filter by search query if provided
    if (!searchQuery.value.trim()) {
      return tokens
    }

    const query = searchQuery.value.toLowerCase().trim()
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    )
  })

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    if (address.startsWith('bc1')) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    if (address.length > 20) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return address
  }

  // Format compact address for display (matches HeaderProfile.vue)
  const formatCompactAddress = (address: string) => {
    if (!address) return ''
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format token balance for display using TokenService
  const formatTokenBalance = (symbol: string) => {
    const balance = userBalances.value[symbol] || 0
    return TokenService.formatBalance(balance, symbol)
  }

  // Format token amount for display using TokenService
  const formatTokenAmount = (symbol: string, balance: number) => {
    return TokenService.formatBalance(balance, symbol)
  }

  // Format token value with commas
  const formatTokenValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format token price with commas
  const formatTokenPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format token value in BTC
  const formatTokenValueBTC = (value: number) => {
    const btcValue = value / btcPrice.value
    return `${btcValue.toFixed(8)} BTC`
  }

  // Format token price in BTC
  const formatTokenPriceBTC = (price: number) => {
    const btcValue = price / btcPrice.value
    return `${btcValue.toFixed(8)} BTC`
  }

  // Get token color for display
  const getTokenColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'USDT': 'bg-green-500',
      'BTC': 'bg-orange-500',
      'ETH': 'bg-blue-500',
      'SOL': 'bg-purple-500',
      'BNB': 'bg-yellow-500',
      'XRP': 'bg-zinc-500',
      'DOGE': 'bg-yellow-600',
      'ADA': 'bg-blue-600',
      'TRX': 'bg-red-500',
      'ICP': 'bg-cyan-500',
    }
    return colors[symbol] || 'bg-zinc-400'
  }



  // Format token supply for display
  const formatTokenSupply = (supply: number, decimals: number) => {
    const normalizedSupply = Number(supply) / Math.pow(10, decimals)
    if (normalizedSupply >= 1000000) {
      return (normalizedSupply / 1000000).toFixed(1) + 'M'
    } else if (normalizedSupply >= 1000) {
      return (normalizedSupply / 1000).toFixed(1) + 'K'
    }
    return normalizedSupply.toFixed(0)
  }


  // Format token change for display
  const formatTokenChange = (symbol: string) => {
    const price = tokenPrices.value[symbol]
    if (!price) return '0.00%'
    
    const change = price.change24h
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  // Get change class for styling
  const getChangeClass = (symbol: string) => {
    const price = tokenPrices.value[symbol]
    if (!price) return 'text-zinc-600 dark:text-zinc-300'
    
    if (price.change24h > 0) return 'text-green-600 dark:text-green-400'
    if (price.change24h < 0) return 'text-red-600 dark:text-red-400'
    return 'text-zinc-600 dark:text-zinc-300'
  }

  // Calculate claimable fees for a position
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

  // Refresh token balances (silent for auto-refresh)
  const refreshBalances = async (event?: Event, silent = false) => {
    // Prevent any default behavior that might cause page refresh
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!silent) {
      loading.value = true
    }
    
    try {
      await loadTokenData()
      if (!silent) {
        toast.add({
          title: 'Balances Refreshed',
          description: 'Your token balances have been updated',
          color: 'success',
        })
      }
    } catch (error) {
      console.error('Error refreshing balances:', error)
      if (!silent) {
        toast.add({
          title: 'Refresh Failed',
          description: 'Failed to refresh token balances',
          color: 'error',
        })
      }
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  // Start auto-refresh
  const startAutoRefresh = () => {
    // Refresh every 30 seconds
    refreshInterval = setInterval(() => {
      refreshBalances(undefined, true) // Silent refresh
      loadTransactionHistory() // Also refresh transaction history
      loadLiquidityPositions() // Also refresh liquidity positions
      loadAllPools() // Also refresh pool data for fee calculations
      refreshUserProfile() // Also refresh user profile for follower/following counts
    }, 30000)
  }

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // Trade token function
  const tradeToken = (symbol: string) => {
    toast.add({
      title: 'Trading Coming Soon',
      description: `Trading for ${symbol} will be available soon`,
      color: 'info',
    })
  }

  // Stake token function
  const stakeToken = (symbol: string) => {
    const url = `/liquidity?token=${symbol}&action=stake`
    console.log('🚀 Navigating to:', url)
    // Navigate to liquidity page with the token pre-selected for staking
    navigateTo(url)
  }

  // Get token balance for withdrawal modal
  const getTokenBalance = (symbol: string) => {
    return userBalances.value[symbol] || 0
  }

  // Open withdrawal modal
  const openWithdrawModal = (tokenSymbol: string) => {
    selectedToken.value = tokenSymbol
    withdrawalModal.value?.open()
  }

  // View token details
  const viewTokenDetails = (symbol: string) => {
    navigateTo(`/tokens/${symbol.toLowerCase()}`)
  }

  // Liquidity position actions
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

  // Copy to clipboard function
  const copyToClipboard = async (text: string, walletType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({
        title: `${walletType} Address Copied`,
        description: text,
        color: 'success',
      })
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast.add({
        title: `${walletType} Copy Failed`,
        description: 'Failed to copy address to clipboard.',
        color: 'error',
      })
    }
  }


  // Show QR code modal
  const showQRCode = (address: string, walletType: string) => {
    qrAddress.value = address
    qrWalletType.value = walletType
    qrModalOpen.value = true
  }

  // Open followers/following modal
  const openFollowersModal = (tab: 'followers' | 'following') => {
    if (followersModalRef.value) {
      followersModalRef.value.open(tab)
    }
  }

  // Transaction history methods
  const loadTransactionHistory = async () => {
    if (!auth.userProfile?.id) return

    if (!canisterService.isInitialized()) {
      console.log('CanisterService not ready, skipping transaction history load')
      return
    }

    transactionHistoryLoading.value = true
    try {
      const transactions = await canisterService.getUserSwapHistory(auth.userProfile.id.toText())
      // Sort by timestamp descending (newest first)
      transactionHistory.value = transactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    } catch (error) {
      console.error('Error loading transaction history:', error)
    } finally {
      transactionHistoryLoading.value = false
    }
  }

  const refreshTransactionHistory = async () => {
    await loadTransactionHistory()
    toast.add({
      title: 'Transaction History Refreshed',
      description: 'Your transaction history has been updated',
      color: 'success',
    })
  }

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Swap'
  }

  const formatAmount = (amount: bigint, token: string) => {
    return TokenService.formatBalance(Number(amount), token)
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  // Load liquidity positions for the user
  const loadLiquidityPositions = async () => {
    if (!auth.userProfile?.id || !canisterService.isInitialized()) return

    try {
      const positions = await canisterService.getLiquidityPositions(auth.userProfile.id as any)
      liquidityPositions.value = positions
    } catch (error) {
      console.error('Error loading liquidity positions:', error)
    }
  }

  // Load all pools for fee calculations
  const loadAllPools = async () => {
    if (!canisterService.isInitialized()) return
    
    try {
      const pools = await canisterService.getAllLiquidityPools()
      allPools.value = pools
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  // Refresh user profile to get updated follower/following counts
  const refreshUserProfile = async () => {
    if (!auth.userProfile?.id) return
    
    try {
      console.log('Refreshing user profile...')
      const updatedProfile = await canisterService.getMyProfile()
      if (updatedProfile) {
        // Update the auth store with the fresh profile data
        auth.userProfile = updatedProfile
        console.log('User profile refreshed with updated counts:', {
          followers: updatedProfile.followers_count,
          following: updatedProfile.following_count
        })
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  // Load user token balances and data
  const loadTokenData = async () => {
    if (!auth.userProfile?.id) return

    // Check if CanisterService is ready
    if (!canisterService.isInitialized()) {
      console.log('CanisterService not ready, waiting...')
      return
    }

    try {
      // Load user balances
      const balances = await canisterService.getUserBalances(auth.userProfile.id.toText())
      userBalances.value = balances

      // Load internal tokens
      const tokens = await canisterService.getAllInternalTokens()
      internalTokens.value = tokens

      // Check if user has claimed faucet
      const faucetClaim = await canisterService.getFaucetClaim(auth.userProfile.id.toText())
      faucetClaimed.value = !!faucetClaim

      // Load transaction history
      await loadTransactionHistory()

      // Load liquidity positions and pools
      await Promise.all([
        loadLiquidityPositions(),
        loadAllPools()
      ])

      // Refresh user profile to get updated follower/following counts
      await refreshUserProfile()

      // Note: Total value calculation is now handled by the watch function
      // which includes both liquid tokens and staked positions

    } catch (error) {
      console.error('Error loading token data:', error)
    }
  }

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Page became visible, refresh balances and profile
      refreshBalances(undefined, true)
      refreshUserProfile()
    }
  }

  // Watch for CanisterService initialization
  const canisterServiceReady = ref(false)
  
  watch(canisterServiceReady, async (isReady) => {
    if (isReady && auth.userProfile?.id) {
      console.log('CanisterService ready, loading wallet data...')
      await loadTokenData()
    }
  }, { immediate: true })

  onMounted(async () => {
    try {
      if (!auth.authenticated) {
        await navigateTo('/')
        return
      }

      if (!auth.userProfile) {
        // User profile should be loaded by auth store
        console.log('No user profile found, user may need to login')
      }

      // Subscribe to price updates
      priceUnsubscribe = priceService.subscribe(() => {
        updatePrices()
      })

      // Initial price update
      updatePrices()

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

      // Start auto-refresh
      startAutoRefresh()

      // Listen for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange)
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      loading.value = false
    }
  })

  onUnmounted(() => {
    if (priceUnsubscribe) {
      priceUnsubscribe()
    }
    stopAutoRefresh()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
</script>
