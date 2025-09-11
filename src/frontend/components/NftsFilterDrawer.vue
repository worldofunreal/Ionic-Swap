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
      <!-- Tabs Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">View</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="
              selectedTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded font-medium text-sm"
            @click="selectedTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Time Range Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Time Range</h4>
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

      <!-- Category Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Category</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="
              selectedCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="px-3 py-2 rounded-full border text-sm font-medium"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Chains Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Chains</h4>
        <input
          type="text"
          placeholder="Search for chains"
          class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mb-2"
        >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="chain in chains"
            :key="chain.label"
            :class="
              selectedChain === chain.label
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            "
            class="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border"
            @click="selectedChain = chain.label"
          >
            <UIcon :name="chain.icon" class="text-base" /> {{ chain.label }}
          </button>
        </div>
      </div>

      <!-- Floor Price Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Floor Price</h4>
        <div class="flex flex-col gap-3">
          <select
            class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option>ETH</option>
          </select>
          <div class="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
            <span class="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
          </div>
          <button
            class="w-full px-3 py-2 rounded bg-primary-600 text-white font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Top Offer Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-white">Top Offer</h4>
        <div class="flex flex-col gap-3">
          <select
            class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option>WETH</option>
          </select>
          <div class="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
            <span class="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max"
              class="flex-1 min-w-0 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
          </div>
          <button
            class="w-full px-3 py-2 rounded bg-primary-600 text-white font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Is Verified Section -->
      <div class="flex items-center gap-3">
        <input
          id="mobile-is-verified"
          v-model="isVerified"
          type="checkbox"
          class="accent-primary-600 w-5 h-5"
        >
        <label
          for="mobile-is-verified"
          class="text-gray-700 dark:text-gray-200 font-medium"
          >Is Verified</label
        >
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
    tab: string
    time: string
    category: string
    chain: string
    isVerified: boolean
  }

  const emit = defineEmits<{
    close: []
    'apply-filters': [filters: Filters]
  }>()

  // Filter states
  const tabs = ['Top', 'Trending', 'Watchlist']
  const selectedTab = ref('Top')
  const times = ['All', '30d', '7d', '1d', '1h', '15m', '5m', '1m']
  const selectedTime = ref('All')
  const categories = [
    'All',
    'Art',
    'Gaming',
    'Memberships',
    'Music',
    'PFPs',
    'Photography',
    'Domain Names',
    'Sports Collectibles',
    'Virtual Worlds',
  ]
  const selectedCategory = ref('All')
  const chains = [
    { label: 'All', icon: 'token-branded:ethereum' },
    { label: 'Ethereum', icon: 'token-branded:ethereum' },
    { label: 'Abstract', icon: 'token-branded:ethereum' },
    { label: 'ApeChain', icon: 'token-branded:ethereum' },
    { label: 'Arbitrum', icon: 'token-branded:arbitrum-one' },
    { label: 'Avalanche', icon: 'token-branded:avalanche' },
    { label: 'Base', icon: 'token-branded:base' },
    { label: 'Polygon', icon: 'token-branded:polygon' },
    { label: 'Ronin', icon: 'token-branded:ronin' },
  ]
  const selectedChain = ref('All')
  const isVerified = ref(false)

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

  function resetFilters() {
    selectedTab.value = 'Top'
    selectedTime.value = 'All'
    selectedCategory.value = 'All'
    selectedChain.value = 'All'
    isVerified.value = false
  }

  function applyFilters() {
    const filters = {
      tab: selectedTab.value,
      time: selectedTime.value,
      category: selectedCategory.value,
      chain: selectedChain.value,
      isVerified: isVerified.value,
    }
    emit('apply-filters', filters)
    closeDrawer()
  }
</script>
