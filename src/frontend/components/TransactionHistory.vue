<template>
  <div class="transaction-history">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Transaction History
      </h3>
      <div class="flex items-center space-x-2">
        <button
          @click="refreshHistory"
          :disabled="loading"
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
        >
          <UIcon 
            :name="loading ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-path'" 
            :class="loading ? 'animate-spin' : ''"
            class="w-4 h-4"
          />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && transactions.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
      <p class="text-gray-500 dark:text-gray-400">Loading transaction history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && transactions.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h4>
      <p class="text-gray-500 dark:text-gray-400">
        Your trading history will appear here once you make your first swap.
      </p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-3">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between">
          <!-- Transaction Type & Pair -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  getTransactionTypeClass(transaction)
                ]"
              >
                {{ getTransactionIcon(transaction) }}
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ transaction.from_token }} → {{ transaction.to_token }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatTransactionType(transaction.transaction_type) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="text-right">
            <div class="font-semibold text-gray-900 dark:text-white">
              {{ formatAmount(transaction.from_amount, transaction.from_token) }} 
              {{ transaction.from_token }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              → {{ formatAmount(transaction.to_amount, transaction.to_token) }} 
              {{ transaction.to_token }}
            </div>
          </div>
        </div>

        <!-- Transaction Metadata -->
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div class="flex items-center space-x-4">
              <span>{{ formatDate(transaction.timestamp) }}</span>
              <span>•</span>
              <span>ID: {{ transaction.id.slice(0, 8) }}...</span>
            </div>
            <div class="text-right">
              <div>Rate: {{ formatPrice(transaction.from_price) }} → {{ formatPrice(transaction.to_price) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="mt-6 text-center">
      <button
        @click="loadMore"
        class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Load More
      </button>
    </div>

    <!-- Loading More State -->
    <div v-if="loading && transactions.length > 0" class="mt-4 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mx-auto animate-spin text-gray-400" />
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
}

const props = withDefaults(defineProps<Props>(), {
  limit: 20
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

// Methods
const loadTransactions = async (reset = false) => {
  if (!isAuthenticated.value) {
    console.log('User not authenticated, skipping transaction load')
    return
  }

  if (loading.value) return

  loading.value = true
  try {
    const offset = reset ? 0 : currentOffset.value
    const newTransactions = await canisterService.getUserSwapHistoryPaginated(
      auth.userProfile!.id.toString(),
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

const loadMore = async () => {
  await loadTransactions(false)
}

const getTransactionTypeClass = (transaction: SwapTransaction) => {
  return 'bg-blue-500' // Default to blue for market swaps
}

const getTransactionIcon = (transaction: SwapTransaction) => {
  return '↔' // Swap icon
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

// Lifecycle
onMounted(async () => {
  if (isAuthenticated.value) {
    await loadTransactions(true)
  }
})

// Watch for authentication changes
watch(() => auth.userProfile, async (newProfile) => {
  if (newProfile?.id) {
    await loadTransactions(true)
  } else {
    transactions.value = []
    currentOffset.value = 0
    hasMore.value = true
  }
}, { immediate: true })
</script>

<style scoped>
/* All styles are inline classes */
</style>
