<template>
  <div class="flex flex-col gap-4 p-4 w-full">
    <!-- Mobile Filter Button - Only visible on mobile -->
    <div class="md:hidden flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">NFTs</h2>
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
        placeholder="Search for items"
        class="flex-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
      >
      <select
        class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
      >
        <option>Recently received</option>
        <option>Recently listed</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
      </select>
      <div class="flex gap-2">
        <button class="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
          Grid
        </button>
        <button class="px-2 py-1 rounded bg-primary-600 text-white">
          List
        </button>
        <button class="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
          Compact
        </button>
      </div>
    </div>
    <div
      v-if="nfts.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=NFT"
        alt="NFT"
        class="w-24 h-24 rounded-lg shadow mb-4"
      >
      <div class="text-xl font-bold mb-2">No items found</div>
      <div class="text-gray-400 mb-4">Discover new collections on OS2</div>
      <button class="px-4 py-2 rounded bg-primary-600 text-white font-semibold">
        Go to Discover
      </button>
    </div>
    <div v-else class="overflow-x-auto flex-1">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-neutral-100 dark:bg-neutral-800">
            <th
              class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Item
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Listing Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Rarity
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Floor Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Top Offer
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Cost
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Received
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200 dark:border-gray-700 h-px" />
          <tr
            v-for="nft in nfts"
            :key="nft.id"
            class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="nft.image"
                  alt="NFT"
                  class="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-700 flex-shrink-0"
                >
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    nft.name
                  }}</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >#{{ nft.id }}</span
                  >
                </div>
              </div>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                nft.listingPrice
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-900/20 text-green-400': nft.rarity === 'Rare',
                  'bg-purple-900/20 text-purple-400': nft.rarity === 'Epic',
                  'bg-blue-900/20 text-blue-400': nft.rarity === 'Common',
                }"
              >
                {{ nft.rarity }}
              </span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                nft.floorPrice
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-green-600 dark:text-green-400">{{
                nft.topOffer
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                nft.cost
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-400 text-sm">{{
                nft.received
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
          <!-- Status Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Status
            </h4>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="status in statuses"
                :key="status"
                class="px-3 py-2 rounded-full border text-sm font-medium transition-colors"
                :class="
                  selectedStatus === status
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                "
                @click="selectedStatus = status"
              >
                {{ status }}
              </button>
            </div>
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

          <!-- Collections Filter -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Collections
            </h4>
            <input
              type="text"
              placeholder="Search collections..."
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
            >
          </div>

          <!-- Search and Sort -->
          <div class="space-y-4">
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                Search & Sort
              </h4>
              <input
                type="text"
                placeholder="Search for items"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 mb-3"
              >
              <select
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
              >
                <option>Recently received</option>
                <option>Recently listed</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                View Mode
              </h4>
              <div class="flex gap-2">
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm font-medium"
                >
                  Grid
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium"
                >
                  List
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm font-medium"
                >
                  Compact
                </button>
              </div>
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
  const selectedStatus = ref('All')
  const statuses = ['All', 'Listed', 'Not Listed', 'Hidden']

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
    selectedStatus.value = 'All'
    // Add more filter clearing logic here
    isDrawerOpen.value = false
  }

  const applyFilters = () => {
    // Add filter application logic here
    isDrawerOpen.value = false
  }

  const nfts = [
    {
      id: 1,
      name: 'CryptoPunk #1234',
      image: 'https://placehold.co/40x40?text=NFT',
      listingPrice: '2.5 ETH',
      rarity: 'Rare',
      floorPrice: '2.1 ETH',
      topOffer: '2.3 ETH',
      cost: '1.8 ETH',
      received: '2024-06-01',
    },
    {
      id: 2,
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      listingPrice: '8.0 ETH',
      rarity: 'Epic',
      floorPrice: '7.5 ETH',
      topOffer: '7.8 ETH',
      cost: '6.9 ETH',
      received: '2024-05-20',
    },
  ]
</script>
