<template>
  <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">Portfolio Overview</h3>
      <div class="flex items-center gap-2">
        <!-- Value Toggle -->
        <div class="flex bg-zinc-100 dark:bg-zinc-700 rounded-md p-1">
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              valueDisplay === 'usd'
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-600',
            ]"
            @click="updateValueDisplay('usd')"
          >
            USD
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              valueDisplay === 'btc'
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-600',
            ]"
            @click="updateValueDisplay('btc')"
          >
            BTC
          </button>
        </div>
        <UIcon 
          :name="balancesVisible ? 'i-heroicons-eye-20-solid' : 'i-heroicons-eye-slash-20-solid'" 
          class="w-5 h-5 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:text-white transition-colors" 
          @click="toggleBalanceVisibility"
        />
      </div>
    </div>

    <div v-if="loading && !portfolioData" class="space-y-2">
      <USkeleton class="h-4 w-32 mb-2" />
      <USkeleton class="h-8 w-24 mb-2" />
      <USkeleton class="h-3 w-20" />
    </div>

    <div v-else-if="portfolioData" class="space-y-4">
      <!-- Portfolio Value -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Portfolio Value</span>
          <span class="text-2xl font-bold text-zinc-900 dark:text-white">
            <span v-if="balancesVisible">
              {{ valueDisplay === 'usd' ? `$${formatNumber(localPortfolioValue, 2)}` : `${(localPortfolioValue / btcPrice).toFixed(8)} BTC` }}
            </span>
            <span v-else class="text-2xl">••••••••</span>
          </span>
          <span class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Includes liquid tokens + staked positions + claimable fees</span>
        </div>
        
        <!-- 24h Change (from backend) -->
        <div class="flex flex-col items-end">
          <div class="flex items-center gap-1 mb-1">
            <UIcon 
              :name="portfolioData.change_24h >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              :class="portfolioData.change_24h >= 0 ? 'text-green-500' : 'text-red-500'"
            />
            <span 
              :class="portfolioData.change_24h >= 0 ? 'text-green-500' : 'text-red-500'"
              class="text-sm font-medium"
            >
              <span v-if="balancesVisible">
                ${{ formatNumber(Math.abs(portfolioData.change_24h), 2) }}
                ({{ formatNumber(portfolioData.change_24h_percent, 2) }}%)
              </span>
              <span v-else>••••••</span>
            </span>
          </div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">24h</span>
        </div>
      </div>

      <!-- Action Buttons and Chart -->
      <div class="flex items-end justify-between pt-2">
        <!-- Action Buttons -->
        <div class="flex gap-3">
          <UButton color="primary" size="md" class="text-sm font-semibold px-4 py-2 text-white">
            <UIcon name="i-heroicons-arrow-down-tray-20-solid" class="w-4 h-4 mr-2" />
            Deposit
          </UButton>
          <UButton color="neutral" variant="soft" size="md" class="text-sm font-semibold px-4 py-2">
            <UIcon name="i-heroicons-arrow-up-tray-20-solid" class="w-4 h-4 mr-2" />
            Withdraw
          </UButton>
        </div>

        <!-- Mini Sparkline Chart (Bottom Right) -->
        <div class="flex justify-end">
          <PortfolioSparkline 
            :portfolio-history="portfolioData.portfolio_history"
            :is-positive="portfolioData.change_24h >= 0"
            :width="180"
            :height="50"
          />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-8 text-center">
      <UIcon name="i-heroicons-chart-bar" class="text-gray-400 text-2xl mb-2" />
      <p class="text-zinc-500 dark:text-zinc-400 text-sm">No portfolio data available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PortfolioData } from '~/services/CanisterService'
import { canisterService } from '~/services/CanisterService'
import PortfolioSparkline from './PortfolioSparkline.vue'

interface Props {
  userPrincipal: string
  localPortfolioValue: number
  btcPrice: number
  balancesVisible: boolean
}

const props = defineProps<Props>()

const portfolioData = ref<PortfolioData | null>(null)
const loading = ref(false)
const valueDisplay = ref<'usd' | 'btc'>('usd')

// Emit events for parent component
const emit = defineEmits<{
  'toggle-balance-visibility': []
  'update-value-display': [value: 'usd' | 'btc']
}>()

// Toggle balance visibility
const toggleBalanceVisibility = () => {
  emit('toggle-balance-visibility')
}

// Update value display
const updateValueDisplay = (value: 'usd' | 'btc') => {
  valueDisplay.value = value
  emit('update-value-display', value)
}

// Load portfolio data (for 24h change and sparkline only)
const loadPortfolioData = async () => {
  if (!props.userPrincipal) return
  
  loading.value = true
  try {
    portfolioData.value = await canisterService.getPortfolioData(props.userPrincipal)
  } catch (error) {
    console.error('Error loading portfolio data:', error)
  } finally {
    loading.value = false
  }
}

// Format numbers with commas
const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

onMounted(() => {
  loadPortfolioData()
})
</script>

