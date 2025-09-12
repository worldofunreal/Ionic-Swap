<template>
  <!-- Mobile Filter Drawer -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 z-[9998] md:hidden"
    @click="closeDrawer"
  />

  <div
    class="fixed flex flex-col bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-[9999] md:hidden transition-transform duration-300 ease-in-out max-h-[90vh] overflow-hidden"
    :class="isOpen ? 'translate-y-0' : 'translate-y-full'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Filters
      </h3>
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Close filters"
        @click="closeDrawer"
      >
        <UIcon
          name="i-heroicons-x-mark-20-solid"
          class="w-6 h-6 text-gray-600 dark:text-gray-300"
        />
      </button>
    </div>

    <!-- Filter Content - Scrollable -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Token Type Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Token Type</h4>
        <div class="flex gap-1">
          <button
            :class="
              type === 'NFTs'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-l font-medium text-sm"
            @click="type = 'NFTs'"
          >
            NFTs
          </button>
          <button
            :class="
              type === 'Tokens'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-r font-medium text-sm"
            @click="type = 'Tokens'"
          >
            Tokens
          </button>
        </div>
      </div>

      <!-- Trending/Top/New Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Filter</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter"
            :class="
              selectedFilter === filter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded font-medium text-sm"
            @click="selectedFilter = filter"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <!-- Time Period Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Time Period</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="time in times"
            :key="time"
            :class="
              selectedTime === time
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded font-medium text-sm"
            @click="selectedTime = time"
          >
            {{ time }}
          </button>
        </div>
      </div>

      <!-- Search for Chains Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">
          Search for Chains
        </h4>
        <div class="relative">
          <input
            type="text"
            placeholder="Search chains..."
            class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
          <UIcon
            name="ri:search-line"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <!-- Chains Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Chains</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="chain in chains"
            :key="chain"
            :class="
              selectedChains.includes(chain)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-full border text-sm font-medium"
            @click="toggleChain(chain)"
          >
            {{ chain }}
          </button>
        </div>
      </div>

      <!-- Market Cap Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Market Cap</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cap in marketCaps"
            :key="cap"
            :class="
              selectedMarketCaps.includes(cap)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-full border text-sm font-medium"
            @click="toggleMarketCap(cap)"
          >
            {{ cap }}
          </button>
        </div>
      </div>

      <!-- Category Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Category</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat.label"
            :class="
              selectedCategoryOptions[cat.label]?.includes(cat.label)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-full border text-sm font-medium"
            @click="toggleCategoryOption(cat.label, cat.label)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Checkboxes Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Options</h4>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <input
              id="mobile-has-nft"
              v-model="hasNft"
              type="checkbox"
              class="accent-primary-600 w-5 h-5"
            >
            <label
              for="mobile-has-nft"
              class="text-gray-700 dark:text-gray-200 font-medium"
              >Has NFT</label
            >
          </div>
          <div class="flex items-center gap-3">
            <input
              id="mobile-branded-token"
              v-model="brandedToken"
              type="checkbox"
              class="accent-primary-600 w-5 h-5"
            >
            <label
              for="mobile-branded-token"
              class="text-gray-700 dark:text-gray-200 font-medium"
              >Branded Token Page</label
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0"
    >
      <button
        class="flex-1 px-4 py-3 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium"
        @click="resetFilters"
      >
        Reset
      </button>
      <button
        class="flex-1 px-4 py-3 rounded bg-primary-600 text-white font-medium"
        @click="applyFilters"
      >
        Apply Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watchEffect, onUnmounted } from 'vue'

  interface Props {
    isOpen: boolean
  }

  const props = defineProps<Props>()

  interface Filters {
    type: string
    filter: string
    time: string
    chains: string[]
    marketCaps: string[]
    categories: Record<string, string[]>
    hasNft: boolean
    brandedToken: boolean
  }

  const emit = defineEmits<{
    close: []
    'apply-filters': [filters: Filters]
  }>()

  // Filter states
  const type = ref('Tokens')
  const filters = ['Trending', 'Top', 'New']
  const selectedFilter = ref('Trending')
  const times = ['1D', '7D', 'Last 7D']
  const selectedTime = ref('1D')

  const chains = [
    'Ethereum',
    'Solana',
    'Arbitrum',
    'Base',
    'Optimism',
    'Polygon',
  ]
  const selectedChains = ref<string[]>([])

  const marketCaps = [
    '<$100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M - $10M',
    '$10M+',
  ]
  const selectedMarketCaps = ref<string[]>([])

  const categories = [
    { label: 'All', open: true, options: ['All'] },
    { label: 'Layer 1', open: false, options: ['Ethereum', 'Solana'] },
    {
      label: 'Layer 2',
      open: false,
      options: ['Arbitrum', 'Optimism', 'Base'],
    },
    { label: 'Stablecoins', open: false, options: ['USDT', 'USDC', 'DAI'] },
    {
      label: 'Smart Contract Platform',
      open: false,
      options: ['Ethereum', 'Solana', 'Polygon'],
    },
    { label: 'DeFi', open: false, options: ['Uniswap', 'Aave'] },
    { label: 'Pump.fun', open: false, options: ['Pump.fun'] },
    { label: 'Dog Themed', open: false, options: ['DOGE', 'SHIB'] },
  ]
  const selectedCategoryOptions = ref<Record<string, string[]>>({})

  const hasNft = ref(false)
  const brandedToken = ref(false)

  // Prevent body scrolling when drawer is open
  watchEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      if (props.isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  })

  // Clean up on component unmount
  onUnmounted(() => {
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = ''
    }
  })

  function closeDrawer() {
    emit('close')
  }

  function toggleChain(chain: string) {
    if (selectedChains.value.includes(chain)) {
      selectedChains.value = selectedChains.value.filter(c => c !== chain)
    } else {
      selectedChains.value.push(chain)
    }
  }

  function toggleMarketCap(cap: string) {
    if (selectedMarketCaps.value.includes(cap)) {
      selectedMarketCaps.value = selectedMarketCaps.value.filter(c => c !== cap)
    } else {
      selectedMarketCaps.value.push(cap)
    }
  }

  function toggleCategoryOption(label: string, opt: string) {
    if (!selectedCategoryOptions.value[label]) {
      selectedCategoryOptions.value[label] = []
    }
    if (selectedCategoryOptions.value[label].includes(opt)) {
      selectedCategoryOptions.value[label] = selectedCategoryOptions.value[
        label
      ].filter(o => o !== opt)
    } else {
      selectedCategoryOptions.value[label].push(opt)
    }
  }

  function resetFilters() {
    type.value = 'Tokens'
    selectedFilter.value = 'Trending'
    selectedTime.value = '1D'
    selectedChains.value = []
    selectedMarketCaps.value = []
    selectedCategoryOptions.value = {}
    hasNft.value = false
    brandedToken.value = false
  }

  function applyFilters() {
    const filters = {
      type: type.value,
      filter: selectedFilter.value,
      time: selectedTime.value,
      chains: selectedChains.value,
      marketCaps: selectedMarketCaps.value,
      categories: selectedCategoryOptions.value,
      hasNft: hasNft.value,
      brandedToken: brandedToken.value,
    }
    emit('apply-filters', filters)
    closeDrawer()
  }
</script>
