<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Price Service Test</h1>
    
    <div class="mb-4">
      <button @click="testFetchPrices" class="bg-blue-500 text-white px-4 py-2 rounded">
        Test Fetch Prices
      </button>
    </div>
    
    <div v-if="prices.size > 0" class="space-y-2">
      <h2 class="text-xl font-semibold">Current Prices:</h2>
      <div v-for="[symbol, price] in prices" :key="symbol" class="flex justify-between">
        <span>{{ symbol }}:</span>
        <span>${{ price.price.toFixed(2) }} ({{ price.change24h.toFixed(2) }}%)</span>
      </div>
    </div>
    
    <div v-if="error" class="text-red-500 mt-4">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { priceService, type TokenPrice } from '@/services/PriceService'

const prices = ref<Map<string, TokenPrice>>(new Map())
const error = ref('')

let unsubscribe: (() => void) | null = null

onMounted(() => {
  // Subscribe to price updates
  unsubscribe = priceService.subscribe((newPrices) => {
    prices.value = newPrices
    error.value = ''
  })
  
  // Fetch initial prices
  testFetchPrices()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const testFetchPrices = async () => {
  try {
    await priceService.fetchInitialPrices()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  }
}
</script>
