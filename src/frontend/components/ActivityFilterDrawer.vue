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
      <!-- Status Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Status</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="status in statuses"
            :key="status"
            :class="
              selectedStatuses.includes(status)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-full border text-sm font-medium"
            @click="toggleStatus(status)"
          >
            {{ status }}
          </button>
        </div>
      </div>

      <!-- Price Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Price</h4>
        <div class="flex flex-col gap-3">
          <select
            class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option>USD</option>
            <option>ETH</option>
          </select>
          <div class="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            />
            <span class="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            />
          </div>
          <button
            class="w-full px-3 py-2 rounded bg-primary-600 text-white font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Marketplaces Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Marketplaces</h4>
        <div class="flex flex-col gap-2">
          <label
            v-for="m in marketplaces"
            :key="m"
            class="flex items-center gap-2"
          >
            <input
              v-model="selectedMarketplaces"
              type="checkbox"
              :value="m"
              class="accent-primary-600 w-5 h-5"
            />
            <span class="text-gray-700 dark:text-gray-200 font-medium">{{
              m
            }}</span>
          </label>
        </div>
      </div>

      <!-- Chains Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Chains</h4>
        <input
          type="text"
          placeholder="Search chains..."
          class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mb-2"
        />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="chain in chains"
            :key="chain.label"
            :class="
              selectedChains.includes(chain.label)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border"
            @click="toggleChain(chain.label)"
          >
            <UIcon :name="chain.icon" class="text-base" /> {{ chain.label }}
          </button>
        </div>
      </div>

      <!-- Collections Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Collections</h4>
        <input
          type="text"
          placeholder="Search for collections"
          class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mb-2"
        />
        <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
          <label
            v-for="col in collections"
            :key="col.name"
            class="flex items-center gap-2"
          >
            <input
              v-model="selectedCollections"
              type="checkbox"
              :value="col.name"
              class="accent-primary-600 w-5 h-5"
            />
            <span>{{ col.name }}</span>
            <UIcon
              v-if="col.verified"
              name="material-symbols:verified"
              class="text-primary-500 text-xs"
            />
          </label>
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
    statuses: string[]
    priceCurrency: string
    priceMin: string
    priceMax: string
    marketplaces: string[]
    chains: string[]
    collections: string[]
  }

  const emit = defineEmits<{
    close: []
    'apply-filters': [filters: Filters]
  }>()

  // Filter states
  const statuses = [
    'All',
    'Sale',
    'Mint',
    'Transfer',
    'Listing',
    'Item Offer',
    'Collection Offer',
    'Trait Offer',
  ]
  const selectedStatuses = ref<string[]>(['All'])
  function toggleStatus(status: string) {
    if (selectedStatuses.value.includes(status)) {
      selectedStatuses.value = selectedStatuses.value.filter(s => s !== status)
    } else {
      selectedStatuses.value.push(status)
    }
  }
  const marketplaces = ['OpenSea', 'Blur', 'MagicEden', 'CryptoPunks']
  const selectedMarketplaces = ref<string[]>([])
  const chains = [
    { label: 'All', icon: 'logos:ethereum' },
    { label: 'Ethereum', icon: 'logos:ethereum' },
    { label: 'Solana', icon: 'token-branded:solana' },
    { label: 'Arbitrum', icon: 'token-branded:arbitrum-one' },
    { label: 'Polygon', icon: 'token-branded:polygon' },
    { label: 'Base', icon: 'logos:base' },
  ]
  const selectedChains = ref<string[]>([])
  function toggleChain(chain: string) {
    if (selectedChains.value.includes(chain)) {
      selectedChains.value = selectedChains.value.filter(c => c !== chain)
    } else {
      selectedChains.value.push(chain)
    }
  }
  const collections = [
    { name: 'X FIGURES', verified: true },
    { name: 'CryptoPunks', verified: true },
    { name: 'Cool Cats', verified: false },
    { name: 'Bored Apes', verified: true },
    { name: 'Doodles', verified: false },
  ]
  const selectedCollections = ref<string[]>([])
  const priceCurrency = ref('USD')
  const priceMin = ref('')
  const priceMax = ref('')

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

  function resetFilters() {
    selectedStatuses.value = ['All']
    priceCurrency.value = 'USD'
    priceMin.value = ''
    priceMax.value = ''
    selectedMarketplaces.value = []
    selectedChains.value = []
    selectedCollections.value = []
  }

  function closeDrawer() {
    emit('close')
  }

  function applyFilters() {
    const filters = {
      statuses: selectedStatuses.value,
      priceCurrency: priceCurrency.value,
      priceMin: priceMin.value,
      priceMax: priceMax.value,
      marketplaces: selectedMarketplaces.value,
      chains: selectedChains.value,
      collections: selectedCollections.value,
    }
    emit('apply-filters', filters)
    closeDrawer()
  }
</script>
