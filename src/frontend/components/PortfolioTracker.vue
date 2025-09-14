<template>
  <div class="bg-card rounded-lg p-4 border border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-foreground">Portfolio Overview</h3>
      <div>
        <UButton 
          :loading="loading" 
          @click="refreshPortfolio"
          size="xs"
          variant="ghost"
          icon="i-heroicons-arrow-path"
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
          <span class="text-sm text-muted-foreground mb-1">Total Value</span>
          <span class="text-2xl font-bold text-foreground">
            ${{ formatNumber(portfolioData.current_value_usdt, 2) }}
          </span>
        </div>
        
        <!-- 24h Change -->
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
              ${{ formatNumber(Math.abs(portfolioData.change_24h), 2) }}
              ({{ formatNumber(portfolioData.change_24h_percent, 2) }}%)
            </span>
          </div>
          <span class="text-xs text-muted-foreground">24h</span>
        </div>
      </div>

      <!-- Mini Sparkline Chart -->
      <div class="flex justify-center py-2">
        <PortfolioSparkline 
          :portfolio-history="portfolioData.portfolio_history"
          :is-positive="portfolioData.change_24h >= 0"
          :width="120"
          :height="30"
        />
      </div>

      <!-- Additional Stats -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-muted-foreground mb-1">All Time High</span>
          <span class="text-sm font-medium text-foreground">${{ formatNumber(portfolioData.all_time_high, 2) }}</span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-muted-foreground mb-1">Total Trades</span>
          <span class="text-sm font-medium text-foreground">{{ portfolioData.total_trades }}</span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-xs text-muted-foreground mb-1">Initial Value</span>
          <span class="text-sm font-medium text-foreground">${{ formatNumber(portfolioData.initial_value_usdt, 2) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-8 text-center">
      <UIcon name="i-heroicons-chart-bar" class="text-gray-400 text-2xl mb-2" />
      <p class="text-muted-foreground text-sm">No portfolio data available</p>
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
}

const props = defineProps<Props>()

const portfolioData = ref<PortfolioData | null>(null)
const loading = ref(false)

// Load portfolio data
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

// Refresh portfolio data
const refreshPortfolio = () => {
  loadPortfolioData()
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

