<template>
  <div class="transaction-history">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">
        Transaction History
      </h3>
      <div class="flex items-center space-x-2">
        <button
          @click="refreshHistory"
          :disabled="loading"
          class="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white disabled:opacity-50"
        >
          <UIcon 
            :name="loading ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-path'" 
            :class="loading ? 'animate-spin' : ''"
            class="w-3 h-3"
          />
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center space-x-1 mb-4">
      <button
        v-for="filter in transactionFilters"
        :key="filter.value"
        :class="[
          'px-3 py-1 text-xs rounded-md transition-colors',
          activeFilter === filter.value
            ? 'bg-primary text-primary-foreground'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        ]"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && transactions.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-zinc-500 dark:text-zinc-400" />
      <p class="text-zinc-500 dark:text-zinc-400">Loading transaction history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && transactions.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-4 text-zinc-500 dark:text-zinc-400" />
      <h4 class="text-lg font-medium text-zinc-900 dark:text-white mb-2">No transactions yet</h4>
      <p class="text-zinc-500 dark:text-zinc-400">
        Your trading history will appear here once you make your first swap.
      </p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-2">
      <div
        v-for="transaction in unifiedTransactions"
        :key="transaction.id"
        class="bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between">
          <!-- Transaction Type & Info -->
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs',
                getTransactionTypeColor(transaction)
              ]"
            >
              {{ getTransactionTypeIcon(transaction) }}
            </div>
            <div class="flex items-center space-x-2">
              <div class="font-semibold text-zinc-900 dark:text-white text-sm">
                {{ transaction.displayTitle }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ transaction.type === 'swap' ? 'Swap' : formatTransactionType(transaction.transaction_type) }}
              </div>
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="text-right">
            <div class="font-semibold text-zinc-900 dark:text-white text-sm">
              {{ transaction.displayAmount }}
            </div>
            <div v-if="transaction.type === 'swap'" class="text-xs text-zinc-500 dark:text-zinc-400">
              Rate: {{ formatPrice(transaction.to_price) }}
            </div>
            <div v-else-if="transaction.success === false" class="text-xs text-red-500">
              Failed
            </div>
          </div>
        </div>

        <!-- Transaction Metadata -->
        <div class="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div class="flex items-center space-x-2">
              <span>{{ formatDate(transaction.timestamp) }}</span>
              <span>•</span>
              <span>ID: {{ transaction.id.slice(0, 10) }}...</span>
            </div>
            <div v-if="transaction.position_id" class="text-right">
              <div>Position: {{ transaction.position_id.slice(-8) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="mt-6 text-center">
      <button
        @click="loadMore"
        class="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        Load More
      </button>
    </div>

    <!-- Loading More State -->
    <div v-if="loading && transactions.length > 0" class="mt-4 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mx-auto animate-spin text-zinc-500 dark:text-zinc-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { canisterService, type SwapTransaction } from '@/services/CanisterService'
import { useAuthStore } from '@/stores/auth'
import { TokenService } from '@/services/TokenService'

// Props
interface Props {
  limit?: number
  targetUserId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  limit: 20,
  targetUserId: null
})

// Stores
const auth = useAuthStore()

// Reactive data
const transactions = ref<SwapTransaction[]>([])
const liquidityTransactions = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(true)
const currentOffset = ref(0)
const activeFilter = ref('all')

// Transaction filters
const transactionFilters = [
  { label: 'All', value: 'all' },
  { label: 'Swaps', value: 'swaps' },
  { label: 'Staking', value: 'staking' }
]

// Computed
const isAuthenticated = computed(() => !!auth.userProfile?.id)
const userId = computed(() => props.targetUserId || auth.userProfile?.id?.toText?.())

// Unified transaction list with filtering
const unifiedTransactions = computed(() => {
  const swapTxs = transactions.value.map(tx => ({
    ...tx,
    type: 'swap',
    displayTitle: `${tx.from_token} → ${tx.to_token}`,
    displayAmount: `${formatAmount(tx.from_amount, tx.from_token)} → ${formatAmount(tx.to_amount, tx.to_token)}`,
    timestamp: tx.timestamp
  }))
  
  const liquidityTxs = liquidityTransactions.value.map(tx => ({
    ...tx,
    type: 'liquidity',
    displayTitle: getStakingDisplayTitle(tx),
    displayAmount: getStakingDisplayAmount(tx),
    timestamp: tx.timestamp
  }))
  
  // Combine and sort by timestamp (newest first)
  const combined = [...swapTxs, ...liquidityTxs]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
  
  // Apply filter
  if (activeFilter.value === 'swaps') {
    return combined.filter(tx => tx.type === 'swap')
  } else if (activeFilter.value === 'staking') {
    return combined.filter(tx => tx.type === 'liquidity')
  }
  
  return combined
})

// Methods
const loadTransactions = async (reset = false) => {
  if (!userId.value) {
    console.log('No user ID available, skipping transaction load')
    return
  }

  if (loading.value) return

  loading.value = true
  try {
    // Load both swap and liquidity transactions
    const [swapTxs, liquidityTxs] = await Promise.all([
      canisterService.getUserSwapHistory(userId.value),
      canisterService.getLiquidityTransactions(auth.userProfile?.id as any)
    ])

    if (reset) {
      transactions.value = swapTxs
      liquidityTransactions.value = liquidityTxs
      currentOffset.value = 0
    }

    // For now, disable pagination since we're loading all transactions
    hasMore.value = false
  } catch (error) {
    console.error('Error loading transaction history:', error)
  } finally {
    loading.value = false
  }
}

const refreshHistory = async () => {
  await loadTransactions(true)
}

// Expose methods to parent component
defineExpose({
  refreshHistory
})

const loadMore = async () => {
  await loadTransactions(false)
}


const formatTransactionType = (type: any) => {
  // Handle Candid enum format: {Stake: null}, {ClaimFees: null}, etc.
  if (type && typeof type === 'object') {
    const key = Object.keys(type)[0]
    if (key) {
      return key.replace(/([A-Z])/g, ' $1').trim() // Convert CamelCase to spaced
    }
  }
  
  // Handle string format
  if (typeof type === 'string') {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }
  
  return 'Unknown'
}

const formatAmount = (amount: bigint, token: string) => {
  return TokenService.formatBalance(Number(amount), token)
}

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`
}

const formatDate = (timestamp: bigint | number) => {
  const timestampNum = Number(timestamp)
  
  // Handle different timestamp formats
  let dateMs
  if (timestampNum > 1_000_000_000_000_000_000) {
    // Nanoseconds (liquidity transactions) - convert to milliseconds
    dateMs = timestampNum / 1_000_000
  } else if (timestampNum > 1_000_000_000_000) {
    // Milliseconds - use as is
    dateMs = timestampNum
  } else {
    // Seconds (swap transactions) - convert to milliseconds
    dateMs = timestampNum * 1000
  }
  
  const date = new Date(dateMs)
  return date.toLocaleString()
}

// Staking transaction helpers
const getStakingDisplayTitle = (tx: any) => {
  // Handle Candid enum format: {Stake: null}, {ClaimFees: null}, etc.
  let txType = ''
  if (tx.transaction_type && typeof tx.transaction_type === 'object') {
    txType = Object.keys(tx.transaction_type)[0]
  } else if (typeof tx.transaction_type === 'string') {
    txType = tx.transaction_type
  }
  
  switch (txType) {
    case 'Stake':
      return `Staked ${tx.token_symbol}`
    case 'ClaimFees':
      return `Claimed ${tx.token_symbol} Fees`
    case 'StartDissolving':
      return `Started Dissolving ${tx.token_symbol}`
    case 'CancelDissolving':
      return `Cancelled Dissolving ${tx.token_symbol}`
    case 'PartialWithdraw':
    case 'FullWithdraw':
      return `Withdrew ${tx.token_symbol}`
    default:
      return `${txType} ${tx.token_symbol}`
  }
}

const getStakingDisplayAmount = (tx: any) => {
  const amount = TokenService.formatLargeAmount(tx.amount, tx.token_symbol)
  return amount
}

const getTransactionTypeIcon = (tx: any) => {
  if (tx.type === 'swap') return '↔'
  
  // Handle Candid enum format
  let txType = ''
  if (tx.transaction_type && typeof tx.transaction_type === 'object') {
    txType = Object.keys(tx.transaction_type)[0]
  } else if (typeof tx.transaction_type === 'string') {
    txType = tx.transaction_type
  }
  
  switch (txType) {
    case 'Stake': return '🏛'
    case 'ClaimFees': return '💰'
    case 'StartDissolving': return '⏳'
    case 'CancelDissolving': return '❌'
    case 'PartialWithdraw':
    case 'FullWithdraw': return '🏦'
    default: return '🔄'
  }
}

const getTransactionTypeColor = (tx: any) => {
  if (tx.type === 'swap') return 'bg-blue-500'
  
  // Handle Candid enum format
  let txType = ''
  if (tx.transaction_type && typeof tx.transaction_type === 'object') {
    txType = Object.keys(tx.transaction_type)[0]
  } else if (typeof tx.transaction_type === 'string') {
    txType = tx.transaction_type
  }
  
  switch (txType) {
    case 'Stake': return 'bg-green-500'
    case 'ClaimFees': return 'bg-purple-500'
    case 'StartDissolving': return 'bg-yellow-500'
    case 'CancelDissolving': return 'bg-zinc-500'
    case 'PartialWithdraw':
    case 'FullWithdraw': return 'bg-orange-500'
    default: return 'bg-zinc-500'
  }
}

// Lifecycle
onMounted(async () => {
  if (userId.value) {
    await loadTransactions(true)
  }
})

// Watch for user ID changes
watch(userId, async (newUserId) => {
  if (newUserId) {
    await loadTransactions(true)
  } else {
    transactions.value = []
    currentOffset.value = 0
    hasMore.value = true
  }
}, { immediate: true })

// Watch for authentication changes (for backward compatibility)
watch(() => auth.userProfile, async (newProfile) => {
  if (newProfile?.id && !props.targetUserId) {
    await loadTransactions(true)
  } else if (!newProfile?.id && !props.targetUserId) {
    transactions.value = []
    currentOffset.value = 0
    hasMore.value = true
  }
})
</script>

<style scoped>
/* All styles are inline classes */
</style>
