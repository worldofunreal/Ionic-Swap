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
        v-for="transaction in transactions"
        :key="transaction.id"
        class="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between">
          <!-- Transaction Type & Pair -->
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs',
                getTransactionTypeClass(transaction)
              ]"
            >
              {{ getTransactionIcon(transaction) }}
            </div>
            <div class="flex items-center space-x-2">
              <div class="font-semibold text-zinc-900 dark:text-white text-sm">
                {{ transaction.from_token }} → {{ transaction.to_token }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ formatTransactionType(transaction.transaction_type) }}
              </div>
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="text-right">
            <div class="font-semibold text-zinc-900 dark:text-white text-sm">
              {{ formatAmount(transaction.from_amount, transaction.from_token) }} 
              {{ transaction.from_token }} → {{ formatAmount(transaction.to_amount, transaction.to_token) }} 
              {{ transaction.to_token }}
            </div>
          </div>
        </div>

        <!-- Transaction Metadata -->
        <div class="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div class="flex items-center space-x-2">
              <span>{{ formatDate(transaction.timestamp) }}</span>
              <span>•</span>
              <span>ID: {{ transaction.id }}</span>
            </div>
            <div class="text-right">
              <div>Price: {{ formatPrice(transaction.to_price) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="mt-6 text-center">
      <button
        @click="loadMore"
        class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
const loading = ref(false)
const hasMore = ref(true)
const currentOffset = ref(0)

// Computed
const isAuthenticated = computed(() => !!auth.userProfile?.id)
const userId = computed(() => props.targetUserId || auth.userProfile?.id?.toText?.())

// Methods
const loadTransactions = async (reset = false) => {
  if (!userId.value) {
    console.log('No user ID available, skipping transaction load')
    return
  }

  if (loading.value) return

  loading.value = true
  try {
    const offset = reset ? 0 : currentOffset.value
    const newTransactions = await canisterService.getUserSwapHistoryPaginated(
      userId.value,
      props.limit,
      offset
    )

    if (reset) {
      transactions.value = newTransactions
      currentOffset.value = newTransactions.length
    } else {
      transactions.value.push(...newTransactions)
      currentOffset.value += newTransactions.length
    }

    hasMore.value = newTransactions.length === props.limit
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

const getTransactionTypeClass = (transaction: SwapTransaction) => {
  return 'bg-neutral-600 dark:bg-neutral-700' // Match dark theme
}

const getTransactionIcon = (transaction: SwapTransaction) => {
  return '↔' // Swap icon
}

const formatTransactionType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
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
