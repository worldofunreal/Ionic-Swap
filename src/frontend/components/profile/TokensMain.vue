<template>
  <div class="flex flex-col gap-4 p-4 w-full">
    <!-- Mobile Filter Button - Only visible on mobile -->
    <div class="md:hidden flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Tokens
      </h2>
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        @click="isDrawerOpen = true"
      >
        <UIcon name="heroicons:funnel" class="w-4 h-4" />
        <span class="text-sm font-medium">Filters</span>
      </button>
    </div>

    <!-- Desktop Controls - Hidden on mobile -->
    <div
      class="hidden md:flex flex-wrap items-center gap-4 border-gray-200 dark:border-gray-800"
    >
      <input
        type="text"
        placeholder="Search for tokens"
        class="flex-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
      >
      <div class="flex gap-2">
        <button class="px-2 py-1 rounded bg-primary-600 text-white">
          List
        </button>
        <button class="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
          Grid
        </button>
      </div>
    </div>
    <div
      v-if="tokens.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=Token"
        alt="Token"
        class="w-24 h-24 rounded-lg shadow mb-4"
      >
      <div class="text-xl font-bold mb-2">No results found</div>
      <div class="text-gray-400 mb-4">We've been searching the blockchain.</div>
      <button class="px-4 py-2 rounded bg-primary-600 text-white font-semibold">
        Go to Discover
      </button>
    </div>
    <div v-else class="overflow-x-auto flex-1">
      <table class="min-w-5xl w-full text-sm">
        <thead>
          <tr class="bg-neutral-100 dark:bg-neutral-800">
            <th
              class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Token
            </th>
            <th
              class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Symbol
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Market Cap
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              24h Change
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Volume
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200 dark:border-gray-700 h-px" />
          <tr
            v-for="token in tokens"
            :key="token.id"
            class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="token.logo"
                  alt="Token"
                  class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex-shrink-0"
                >
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  token.name
                }}</span>
              </div>
            </td>
            <td class="p-4 text-left whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                token.symbol
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                token.price
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                token.marketCap
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                :class="
                  token.change.startsWith('+')
                    ? 'text-green-600 dark:text-green-400'
                    : token.change.startsWith('-')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-300'
                "
              >
                {{ token.change }}
              </span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                token.volume
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
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
          <!-- Search -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Search
            </h4>
            <input
              type="text"
              placeholder="Search for tokens"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
            >
          </div>

          <!-- Chains Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Chains
            </h4>
            <input
              type="text"
              placeholder="Search chains..."
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 mb-3"
            >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="chain in chains"
                :key="chain.label"
                class="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-colors"
                :class="chain.color"
              >
                <UIcon :name="chain.icon" class="w-4 h-4" />
                {{ chain.label }}
              </button>
            </div>
          </div>

          <!-- Market Cap Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Market Cap
            </h4>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cap in marketCaps"
                :key="cap"
                class="px-3 py-2 rounded-full border text-sm font-medium transition-colors"
                :class="
                  selectedMarketCap === cap
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                "
                @click="selectedMarketCap = cap"
              >
                {{ cap }}
              </button>
            </div>
          </div>

          <!-- Categories Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Categories
            </h4>
            <div class="space-y-2">
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600"
                >
                <span class="text-sm text-gray-700 dark:text-gray-300"
                  >Has NFT</span
                >
              </label>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600"
                >
                <span class="text-sm text-gray-700 dark:text-gray-300"
                  >Branded Token Page</span
                >
              </label>
            </div>
          </div>

          <!-- View Mode -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              View Mode
            </h4>
            <div class="flex gap-2">
              <button
                class="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium"
              >
                List
              </button>
              <button
                class="flex-1 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm font-medium"
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div
          class="p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0"
        >
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              @click="clearFilters"
            >
              Clear All
            </button>
            <button
              class="flex-1 px-4 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              @click="applyFilters"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'

  // Drawer state
  const isDrawerOpen = ref(false)

  // Filter states
  const selectedMarketCap = ref('All')
  const marketCaps = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Micro Cap']

  const chains = [
    {
      label: 'All',
      icon: 'logos:ethereum',
      color: 'bg-neutral-200 dark:bg-neutral-800',
    },
    {
      label: 'Ethereum',
      icon: 'logos:ethereum',
      color: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Solana',
      icon: 'token-branded:solana',
      color: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: 'Arbitrum',
      icon: 'token-branded:arbitrum-one',
      color: 'bg-indigo-100 dark:bg-indigo-900',
    },
    {
      label: 'Polygon',
      icon: 'token-branded:polygon',
      color: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      label: 'Base',
      icon: 'logos:base',
      color: 'bg-blue-200 dark:bg-blue-800',
    },
  ]

  // Filter functions
  const clearFilters = () => {
    selectedMarketCap.value = 'All'
    // Add more filter clearing logic here
    isDrawerOpen.value = false
  }

  const applyFilters = () => {
    // Add filter application logic here
    isDrawerOpen.value = false
  }

  const tokens = [
    {
      id: 1,
      name: 'Ethereum',
      symbol: 'ETH',
      logo: 'https://placehold.co/32x32?text=ETH',
      price: '$3,200',
      marketCap: '$380B',
      change: '+2.1%',
      volume: '$18B',
    },
    {
      id: 2,
      name: 'Solana',
      symbol: 'SOL',
      logo: 'https://placehold.co/32x32?text=SOL',
      price: '$150',
      marketCap: '$65B',
      change: '-1.3%',
      volume: '$2.5B',
    },
  ]
</script>
