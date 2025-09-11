<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Live Cryptocurrency Prices
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Real-time price data and charts for all supported tokens
        </p>
      </div>

      <!-- Price List -->
      <div class="mb-8">
        <PriceList @token-select="handleTokenSelect" />
      </div>

      <!-- Selected Token Chart -->
      <div v-if="selectedToken" class="mb-8">
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ selectedToken }} Price Chart
          </h2>
        </div>
        <PriceChart :token-symbol="selectedToken" :height="400" />
      </div>

      <!-- All Charts Grid -->
      <div v-if="!selectedToken" class="space-y-8">
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            All Token Charts
          </h2>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            v-for="token in availableTokens"
            :key="token"
            class="chart-card"
          >
            <PriceChart :token-symbol="token" :height="300" />
          </div>
        </div>
      </div>

      <!-- Market Overview -->
      <div class="mt-12">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Market Overview
          </h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="overview-card">
            <div class="overview-icon">
              <UIcon name="heroicons:chart-bar" class="w-8 h-8" />
            </div>
            <div class="overview-content">
              <div class="overview-label">Total Market Cap</div>
              <div class="overview-value">$2.1T</div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <UIcon name="heroicons:arrow-trending-up" class="w-8 h-8" />
            </div>
            <div class="overview-content">
              <div class="overview-label">24h Volume</div>
              <div class="overview-value">$45.2B</div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <UIcon name="heroicons:currency-dollar" class="w-8 h-8" />
            </div>
            <div class="overview-content">
              <div class="overview-label">Bitcoin Dominance</div>
              <div class="overview-value">42.3%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PriceList from '@/components/PriceList.vue'
import PriceChart from '@/components/PriceChart.vue'

// Available tokens
const availableTokens = [
  'BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 
  'USDC', 'DOGE', 'ADA', 'TRX', 'ICP'
]

const selectedToken = ref<string | null>(null)

// Handle token selection
const handleTokenSelect = (symbol: string) => {
  selectedToken.value = symbol
}

// Page meta
useHead({
  title: 'Live Prices - Ionic Swap',
  meta: [
    {
      name: 'description',
      content: 'Real-time cryptocurrency prices and charts for Bitcoin, Ethereum, Solana, and more.',
    },
  ],
})
</script>

<style scoped>
.chart-card {
  @apply bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
}

.overview-card {
  @apply bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  @apply flex items-center gap-4;
}

.overview-icon {
  @apply w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center;
  @apply text-blue-600 dark:text-blue-400;
}

.overview-content {
  @apply flex flex-col;
}

.overview-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.overview-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}
</style>
