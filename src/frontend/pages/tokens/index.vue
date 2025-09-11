<template>
  <div class="flex h-full items-stretch bg-neutral-50 dark:bg-neutral-950">
    <!-- Left Sidebar: Filters - Hidden on mobile -->
    <aside
      class="hidden md:block w-80 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950"
    >
      <TokenFilterSection />
    </aside>
    <!-- Main Display Area -->
    <div class="flex-1 flex flex-col w-0 overflow-hidden">
      <!-- Top Controls - Hidden on mobile -->
      <div class="hidden md:block p-4 flex-shrink-0">
        <TokenListHeaderControls />
      </div>
      <!-- Mobile Filter Button -->
      <div class="md:hidden p-4 flex-shrink-0 bg-white dark:bg-neutral-950">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="showFilterDrawer = true"
        >
          <UIcon name="i-heroicons-funnel-20-solid" class="w-5 h-5" />
          <span class="font-medium">Filters</span>
        </button>
      </div>
      <!-- Token Data Table -->
      <div class="flex-1 px-4 pb-8 overflow-auto">
        <TokenDataTable />
      </div>
    </div>

    <!-- Mobile Filter Drawer -->
    <TokensFilterDrawer
      :is-open="showFilterDrawer"
      @close="showFilterDrawer = false"
      @apply-filters="handleApplyFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import TokenFilterSection from '@/components/TokenFilterSection.vue'
  import TokenListHeaderControls from '@/components/TokenListHeaderControls.vue'
  import TokenDataTable from '@/components/TokenDataTable.vue'
  import TokensFilterDrawer from '@/components/TokensFilterDrawer.vue'

  const showFilterDrawer = ref(false)

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

  function handleApplyFilters(filters: Filters) {
    console.log('Applied filters:', filters)
    // Here you would typically update the table data based on the filters
    // For now, we'll just log the filters
  }
</script>
