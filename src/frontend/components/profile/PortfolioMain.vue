<template>
  <div class="flex flex-col gap-4 p-4 w-full">
    <!-- Mobile Filter Button - Only visible on mobile -->
    <div class="md:hidden flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Portfolio
      </h2>
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        @click="isDrawerOpen = true"
      >
        <UIcon name="heroicons:funnel" class="w-4 h-4" />
        <span class="text-sm font-medium">Filters</span>
      </button>
    </div>
    <div
      v-if="collections.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=NFT"
        alt="NFT"
        class="w-24 h-24 rounded-lg shadow mb-4"
      >
      <div class="text-xl font-bold mb-2">No collections found</div>
      <div class="text-gray-400 mb-4">Discover new collections on OS2</div>
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
              Collection
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Held
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Value
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Top Offer
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Floor Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Vol
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Sales
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Owners
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Supply
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Last 7D
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200 dark:border-gray-700 h-px"/>
          <tr
            v-for="col in collections"
            :key="col.id"
            class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="col.logo"
                  alt="Collection"
                  class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-700 flex-shrink-0"
                >
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    col.name
                  }}</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >#{{ col.id }}</span
                  >
                </div>
              </div>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                col.held
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                col.value
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-green-600 dark:text-green-400">{{
                col.topOffer
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.floorPrice
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.vol
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.sales.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.owners.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.supply.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                :class="
                  col.last7d.startsWith('+')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ col.last7d }}
              </span>
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
      <div class="absolute inset-0 bg-black/50"/>

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
          <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"/>
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
              placeholder="Search collections..."
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

          <!-- Sort Options -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Sort By
            </h4>
            <select
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
            >
              <option>Value: High to Low</option>
              <option>Value: Low to High</option>
              <option>Held: High to Low</option>
              <option>Held: Low to High</option>
              <option>Last 7D: High to Low</option>
              <option>Last 7D: Low to High</option>
            </select>
          </div>

          <!-- Value Range -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Value Range
            </h4>
            <div class="space-y-3">
              <input
                type="text"
                placeholder="Min value"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
              >
              <input
                type="text"
                placeholder="Max value"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
              >
            </div>
          </div>

          <!-- Performance Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Performance
            </h4>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="perf in performance"
                :key="perf"
                class="px-3 py-2 rounded-full border text-sm font-medium transition-colors"
                :class="
                  selectedPerformance === perf
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                "
                @click="selectedPerformance = perf"
              >
                {{ perf }}
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
  const selectedPerformance = ref('All')
  const performance = ['All', 'Gainers', 'Losers', 'Stable']

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
    selectedPerformance.value = 'All'
    // Add more filter clearing logic here
    isDrawerOpen.value = false
  }

  const applyFilters = () => {
    // Add filter application logic here
    isDrawerOpen.value = false
  }

  const collections = [
    {
      id: 1,
      name: 'CryptoPunks',
      logo: 'https://placehold.co/32x32?text=CP',
      held: 2,
      value: '5.0 ETH',
      topOffer: '2.3 ETH',
      floorPrice: '2.1 ETH',
      vol: '1.3M ETH',
      sales: 24000,
      owners: 3843,
      supply: 9994,
      last7d: '+5%',
    },
    {
      id: 2,
      name: 'Bored Ape Yacht Club',
      logo: 'https://placehold.co/32x32?text=BAYC',
      held: 1,
      value: '8.0 ETH',
      topOffer: '7.8 ETH',
      floorPrice: '7.5 ETH',
      vol: '1.1M ETH',
      sales: 122472,
      owners: 11866,
      supply: 10000,
      last7d: '-2%',
    },
  ]
</script>
