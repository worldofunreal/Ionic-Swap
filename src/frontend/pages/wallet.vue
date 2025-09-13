<template>
  <div class="min-h-screen bg-background">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>

    <!-- Binance-Style Dashboard -->
    <div v-else class="flex">
      <!-- Left Sidebar Navigation -->
      <div class="w-64 bg-card border-r border-gray-200 dark:border-gray-800 min-h-screen">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">I</span>
            </div>
            <span class="text-xl font-bold text-foreground">Ionic Swap</span>
          </div>
          
          <nav class="space-y-2">
            <div class="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <UIcon name="i-heroicons-home-20-solid" class="w-5 h-5 text-primary" />
              <span class="font-medium text-primary">Dashboard</span>
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-wallet-20-solid" class="w-5 h-5" />
              <span>Assets</span>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-auto" />
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-chart-bar-20-solid" class="w-5 h-5" />
              <span>Orders</span>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-auto" />
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-gift-20-solid" class="w-5 h-5" />
              <span>Rewards Hub</span>
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-users-20-solid" class="w-5 h-5" />
              <span>Referral</span>
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-user-20-solid" class="w-5 h-5" />
              <span>Account</span>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-auto" />
            </div>
            <div class="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
              <UIcon name="i-heroicons-cog-6-tooth-20-solid" class="w-5 h-5" />
              <span>Settings</span>
            </div>
          </nav>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1">
        <!-- Top Header -->
        <div class="bg-card border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Portfolio</span>
                <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4" />
                <span>Overview</span>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="relative">
                <UIcon name="i-heroicons-magnifying-glass-20-solid" class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search coins, tokens, or addresses..."
                  class="pl-10 pr-4 py-2 w-80 bg-muted border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <UButton color="primary" size="lg" class="text-base font-semibold px-6 py-3 text-white">
                <UIcon name="i-heroicons-arrow-down-tray-20-solid" class="w-5 h-5 mr-2" />
                Deposit
              </UButton>
              
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-bell-20-solid" class="w-5 h-5 text-muted-foreground cursor-pointer" />
                <UIcon name="i-heroicons-chat-bubble-left-20-solid" class="w-5 h-5 text-muted-foreground cursor-pointer" />
                <UIcon name="i-heroicons-arrow-down-tray-20-solid" class="w-5 h-5 text-muted-foreground cursor-pointer" />
                <UIcon name="i-heroicons-globe-alt-20-solid" class="w-5 h-5 text-muted-foreground cursor-pointer" />
                <UIcon name="i-heroicons-moon-20-solid" class="w-5 h-5 text-muted-foreground cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Content -->
        <div class="p-6">
          <div class="max-w-7xl mx-auto">
            <!-- User Profile & Balance Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <!-- User Profile Card -->
              <div class="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-sm">{{ userInitial }}</span>
                  </div>
                  <div>
                    <h2 class="text-base font-semibold text-foreground">
                      {{ userProfile?.username || 'User' }}
                    </h2>
                    <div class="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>UID: {{ userProfile?.id?.toText().slice(-8) || 'N/A' }}</span>
                      <span>VIP Level: Regular User</span>
                    </div>
                  </div>
                </div>
                
                <!-- Social Stats -->
                <div class="flex items-center gap-4 text-xs">
                  <div class="flex items-center gap-1">
                    <span class="font-semibold text-foreground">{{ userProfile?.following_count || 0 }}</span>
                    <span class="text-muted-foreground">Following</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="font-semibold text-foreground">{{ userProfile?.followers_count || 0 }}</span>
                    <span class="text-muted-foreground">Followers</span>
                  </div>
                </div>
              </div>

              <!-- Estimated Balance Card -->
              <div class="lg:col-span-2 bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-foreground">
                    Estimated Balance
                  </h3>
                  <div class="flex items-center gap-2">
                    <!-- Value Toggle -->
                    <div class="flex bg-muted rounded-md p-1">
                      <button
                        :class="[
                          'px-3 py-1 text-sm rounded-md transition-colors',
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
                          'px-3 py-1 text-sm rounded-md transition-colors',
                          valueDisplay === 'btc'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/80',
                        ]"
                        @click="valueDisplay = 'btc'"
                      >
                        BTC
                      </button>
                    </div>
                    <UIcon 
                      :name="balancesVisible ? 'i-heroicons-eye-20-solid' : 'i-heroicons-eye-slash-20-solid'" 
                      class="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                      @click="toggleBalanceVisibility"
                    />
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-3xl font-bold text-foreground mb-1">
                      <span v-if="balancesVisible">
                        {{ valueDisplay === 'usd' ? `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${(totalValue / btcPrice).toFixed(8)} BTC` }}
                      </span>
                      <span v-else class="text-2xl">••••••••</span>
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{ valueDisplay === 'usd' ? 'Total Portfolio Value' : 'Total Portfolio Value' }}
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <div class="text-xs text-muted-foreground mb-1">
                      {{ faucetClaimed ? 'Faucet Claimed' : 'Welcome Bonus' }}
                    </div>
                    <div class="text-sm font-semibold text-green-500">
                      + 2M USDT
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 mt-4">
                  <UButton color="primary" size="md" class="text-sm font-semibold px-4 py-2 text-white">
                    <UIcon name="i-heroicons-arrow-down-tray-20-solid" class="w-4 h-4 mr-2" />
                    Deposit
                  </UButton>
                  <UButton color="neutral" variant="soft" size="md" class="text-sm font-semibold px-4 py-2">
                    <UIcon name="i-heroicons-arrow-up-tray-20-solid" class="w-4 h-4 mr-2" />
                    Withdraw
                  </UButton>
                  <UButton color="neutral" variant="soft" size="md" class="text-sm font-semibold px-4 py-2">
                    <UIcon name="i-heroicons-currency-dollar-20-solid" class="w-4 h-4 mr-2" />
                    Cash In
                  </UButton>
                </div>
              </div>
            </div>


            <!-- My Assets Section -->
            <div class="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <div class="p-4 border-b border-gray-200 dark:border-gray-800">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-foreground">My Assets</h3>
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

              <!-- Tokens Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Coin
                      </th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Coin Price / Cost Price
                      </th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Today's PnL
                      </th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-card divide-y divide-gray-200 dark:divide-gray-800">
                    <tr v-if="tokensWithBalances.length === 0">
                      <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                        <div class="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <UIcon name="i-heroicons-currency-dollar-20-solid" class="w-6 h-6" />
                        </div>
                        <p class="text-sm font-medium">Loading Assets...</p>
                        <p class="text-xs">Fetching your token balances</p>
                      </td>
                    </tr>
                    <tr
                      v-for="token in tokensWithBalances"
                      :key="token.symbol"
                      class="hover:bg-muted/50 transition-colors"
                    >
                      <!-- Coin Column -->
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mr-2">
                            <UIcon :name="getTokenIcon(token.symbol)" class="w-4 h-4" />
                          </div>
                          <div>
                            <div class="text-xs font-medium text-foreground">
                              {{ token.symbol }}
                            </div>
                            <div class="text-xs text-muted-foreground">
                              {{ token.name }}
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Amount Column -->
                      <td class="px-4 py-3 whitespace-nowrap text-right">
                        <div class="text-xs font-medium text-foreground">
                          <span v-if="balancesVisible">{{ token.normalizedBalance.toFixed(8) }}</span>
                          <span v-else>••••••••</span>
                        </div>
                        <div class="text-xs text-muted-foreground">
                          <span v-if="balancesVisible">${{ token.value.toFixed(2) }}</span>
                          <span v-else>••••••</span>
                        </div>
                      </td>

                      <!-- Coin Price / Cost Price Column -->
                      <td class="px-4 py-3 whitespace-nowrap text-right">
                        <div class="text-xs font-medium text-foreground">
                          <span v-if="balancesVisible">${{ token.price.toFixed(2) }}</span>
                          <span v-else>••••••</span>
                        </div>
                        <div class="text-xs text-muted-foreground">
                          --
                        </div>
                      </td>

                      <!-- Today's PnL Column -->
                      <td class="px-4 py-3 whitespace-nowrap text-right">
                        <div class="text-xs font-medium" :class="token.change24h >= 0 ? 'text-green-500' : 'text-red-500'">
                          <span v-if="balancesVisible">
                            {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
                          </span>
                          <span v-else>••••••</span>
                        </div>
                      </td>

                      <!-- Action Column -->
                      <td class="px-4 py-3 whitespace-nowrap text-right">
                        <div class="flex justify-end gap-1">
                          <button
                            @click="copyToClipboard(token.symbol, 'token')"
                            class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                          >
                            Copy
                          </button>
                          <button
                            @click="tradeToken(token.symbol)"
                            class="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Section: Wallet Addresses & Portfolio Stats -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Wallet Addresses Card -->
              <div class="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 class="text-lg font-semibold text-foreground mb-4">
                  Wallet Addresses
                </h3>
                
                <div class="space-y-3">
                  <!-- EVM Address -->
                  <div v-if="userProfile?.evm_address?.[0]" class="p-3 bg-muted rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full">EVM</span>
                      <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4 text-muted-foreground cursor-pointer" @click="copyToClipboard(userProfile.evm_address[0], 'EVM')" />
                    </div>
                    <div class="font-mono text-sm text-foreground">{{ formatAddress(userProfile.evm_address[0]) }}</div>
                  </div>

                  <!-- Bitcoin Address -->
                  <div v-if="userProfile?.bitcoin_address?.[0]" class="p-3 bg-muted rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-semibold px-2 py-1 rounded-full">BTC</span>
                      <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4 text-muted-foreground cursor-pointer" @click="copyToClipboard(userProfile.bitcoin_address[0], 'Bitcoin')" />
                    </div>
                    <div class="font-mono text-sm text-foreground">{{ formatAddress(userProfile.bitcoin_address[0]) }}</div>
                  </div>

                  <!-- Solana Address -->
                  <div v-if="userProfile?.solana_address?.[0]" class="p-3 bg-muted rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold px-2 py-1 rounded-full">SOL</span>
                      <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4 text-muted-foreground cursor-pointer" @click="copyToClipboard(userProfile.solana_address[0], 'Solana')" />
                    </div>
                    <div class="font-mono text-sm text-foreground">{{ formatAddress(userProfile.solana_address[0]) }}</div>
                  </div>

                  <!-- ICP Principal -->
                  <div v-if="userProfile?.id" class="p-3 bg-muted rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded-full">ICP</span>
                      <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4 text-muted-foreground cursor-pointer" @click="copyToClipboard(userProfile.id.toText(), 'ICP')" />
                    </div>
                    <div class="font-mono text-sm text-foreground">{{ formatAddress(userProfile.id.toText()) }}</div>
                  </div>
                </div>

                <UButton color="primary" variant="soft" size="lg" class="w-full mt-4 text-base font-semibold py-3 text-white" @click="editAddresses">
                  <UIcon name="i-heroicons-plus-20-solid" class="w-5 h-5 mr-2" />
                  Add/Edit Addresses
                </UButton>
              </div>

              <!-- Portfolio Stats Card -->
              <div class="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 class="text-lg font-semibold text-foreground mb-4">
                  Portfolio Stats
                </h3>
                
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">Total Value</span>
                    <span class="font-semibold text-foreground">
                      <span v-if="balancesVisible">
                        {{ valueDisplay === 'usd' ? `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${(totalValue / btcPrice).toFixed(8)} BTC` }}
                      </span>
                      <span v-else>••••••</span>
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">Tokens Held</span>
                    <span class="font-semibold text-foreground">{{ Object.keys(userBalances).length }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">Networks</span>
                    <span class="font-semibold text-foreground">4</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">Faucet Status</span>
                    <span class="font-semibold text-green-500">{{ faucetClaimed ? 'Claimed' : 'Available' }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">USDT Balance</span>
                    <span class="font-semibold text-foreground">{{ formatTokenBalance('USDT') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-muted-foreground">Account Age</span>
                    <span class="font-semibold text-foreground">New User</span>
                  </div>
                </div>

                <!-- Portfolio Allocation Chart -->
                <div class="mt-6">
                  <h4 class="text-sm font-medium text-foreground mb-3">Token Holdings</h4>
                  <div class="space-y-2">
                    <div v-for="(balance, symbol) in userBalances" :key="symbol" class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                          <UIcon :name="getTokenIcon(symbol)" class="w-3 h-3" />
                        </div>
                        <span class="text-sm text-muted-foreground">{{ symbol }}</span>
                      </div>
                      <span class="text-sm font-medium text-foreground">
                        <span v-if="balancesVisible">{{ formatTokenBalance(symbol) }}</span>
                        <span v-else>••••••</span>
                      </span>
                    </div>
                    <div v-if="Object.keys(userBalances).length === 0" class="text-center py-4 text-muted-foreground">
                      <p class="text-sm">No tokens yet</p>
                      <p class="text-xs">Complete signup to receive your welcome bonus!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { priceService } from '@/services/PriceService'
  import { useToast } from '#imports'
  import { useColorTheme } from '@/composables/useColorTheme'
  import { useTheme } from '@/composables/useTheme'

  const auth = useAuthStore()
  const loading = ref(true)
  const toast = useToast()
  const { colorTheme } = useColorTheme()
  const { theme } = useTheme()

  // Get user profile from auth store
  const userProfile = computed(() => auth.userProfile)

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
  
  // Real price data from PriceService
  const tokenPrices = ref<Record<string, { usd: number; btc: number; change24h: number }>>({})
  const btcPrice = ref(45000) // Will be updated from PriceService
  let priceUnsubscribe: (() => void) | null = null
  
  // Balance visibility toggle
  const balancesVisible = ref(true)
  
  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null
  
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

  // Watch for changes in prices or balances to recalculate total value
  watch([tokenPrices, userBalances], () => {
    if (Object.keys(userBalances.value).length > 0 && Object.keys(tokenPrices.value).length > 0) {
      totalValue.value = Object.entries(userBalances.value).reduce((total, [symbol, amount]) => {
        const token = internalTokens.value.find(t => t.symbol === symbol)
        if (token) {
          const decimals = token.decimals || 6
          const normalizedAmount = amount / Math.pow(10, decimals)
          const price = tokenPrices.value[symbol]
          if (price) {
            return total + (normalizedAmount * price.usd)
          }
        }
        return total
      }, 0)
    }
  }, { deep: true })

  // Computed property to get all tokens with their balances, sorted by value
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
      .sort((a, b) => b.value - a.value) // Sort by value descending
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

  // Format token balance for display
  const formatTokenBalance = (symbol: string) => {
    const balance = userBalances.value[symbol] || 0
    const token = internalTokens.value.find(t => t.symbol === symbol)
    const decimals = token?.decimals || 6
    const normalizedBalance = balance / Math.pow(10, decimals)
    
    if (normalizedBalance === 0) return '0.00'
    if (normalizedBalance < 0.01) return normalizedBalance.toFixed(6)
    if (normalizedBalance < 1) return normalizedBalance.toFixed(4)
    if (normalizedBalance < 1000) return normalizedBalance.toFixed(2)
    return normalizedBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  // Get token color for display
  const getTokenColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'USDT': 'bg-green-500',
      'BTC': 'bg-orange-500',
      'ETH': 'bg-blue-500',
      'SOL': 'bg-purple-500',
      'BNB': 'bg-yellow-500',
      'XRP': 'bg-gray-500',
      'DOGE': 'bg-yellow-600',
      'ADA': 'bg-blue-600',
      'TRX': 'bg-red-500',
      'ICP': 'bg-cyan-500',
    }
    return colors[symbol] || 'bg-gray-400'
  }

  // Get token icon for display (matching markets.vue)
  const getTokenIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      'BTC': 'logos:bitcoin',
      'ETH': 'token-branded:ethereum',
      'XRP': 'cryptocurrency-color:xrp',
      'USDT': 'cryptocurrency-color:usdt',
      'BNB': 'token-branded:binance',
      'SOL': 'token-branded:solana',
      'USDC': 'cryptocurrency-color:usdc',
      'DOGE': 'simple-icons:dogecoin',
      'ADA': 'logos:cardano-icon',
      'TRX': 'token-branded:tron',
      'ICP': 'token-branded:icp',
    }
    return icons[symbol] || 'cryptocurrency-color:generic'
  }

  // Get token name for display
  const getTokenName = (symbol: string) => {
    const names: Record<string, string> = {
      'USDT': 'Tether USD',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'BNB': 'BNB',
      'XRP': 'XRP',
      'DOGE': 'Dogecoin',
      'ADA': 'Cardano',
      'TRX': 'TRON',
      'ICP': 'Internet Computer',
    }
    return names[symbol] || symbol
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

  // Format token price for display
  const formatTokenPrice = (symbol: string) => {
    const price = tokenPrices.value[symbol]
    if (!price) return '$0.00'
    
    if (valueDisplay.value === 'usd') {
      return `$${price.usd.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: price.usd < 1 ? 6 : 2 
      })}`
    } else {
      return `${price.btc.toFixed(8)} BTC`
    }
  }

  // Format token value for display
  const formatTokenValue = (symbol: string) => {
    const balance = userBalances.value[symbol] || 0
    const token = internalTokens.value.find(t => t.symbol === symbol)
    const decimals = token?.decimals || 6
    const normalizedBalance = balance / Math.pow(10, decimals)
    const price = tokenPrices.value[symbol]
    
    if (!price) return '$0.00'
    
    const value = normalizedBalance * (valueDisplay.value === 'usd' ? price.usd : price.btc)
    
    if (valueDisplay.value === 'usd') {
      return `$${value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`
    } else {
      return `${value.toFixed(8)} BTC`
    }
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
    if (!price) return 'text-gray-600 dark:text-gray-400'
    
    if (price.change24h > 0) return 'text-green-600 dark:text-green-400'
    if (price.change24h < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
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

  // View token details
  const viewTokenDetails = (symbol: string) => {
    navigateTo(`/tokens/${symbol.toLowerCase()}`)
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

  // Edit addresses function
  const editAddresses = () => {
    toast.add({
      title: 'Coming Soon',
      description: 'Address editing will be available soon.',
      color: 'info',
    })
  }

  // Load user token balances and data
  const loadTokenData = async () => {
    if (!auth.userProfile?.id) return

    try {
      // Initialize canister service if needed
      if (!canisterService.isInitialized()) {
        await canisterService.initialize()
      }

      // Load user balances
      const balances = await canisterService.getUserBalances(auth.userProfile.id.toText())
      userBalances.value = balances

      // Load internal tokens
      const tokens = await canisterService.getAllInternalTokens()
      internalTokens.value = tokens

      // Check if user has claimed faucet
      const faucetClaim = await canisterService.getFaucetClaim(auth.userProfile.id.toText())
      faucetClaimed.value = !!faucetClaim

      // Calculate total value using real price data
      totalValue.value = Object.entries(balances).reduce((total, [symbol, amount]) => {
        const token = tokens.find(t => t.symbol === symbol)
        if (token) {
          const decimals = token.decimals || 6
          const normalizedAmount = amount / Math.pow(10, decimals)
          const price = tokenPrices.value[symbol]
          if (price) {
            return total + (normalizedAmount * price.usd)
          }
        }
        return total
      }, 0)

    } catch (error) {
      console.error('Error loading token data:', error)
    }
  }

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Page became visible, refresh balances
      refreshBalances(undefined, true)
    }
  }

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

      // Load token data
      await loadTokenData()

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