<template>
  <div class="flex h-full bg-neutral-50 dark:bg-neutral-950">
    <!-- Sidebar (Left Panel) - Hidden on mobile -->
    <aside
      class="hidden md:block w-80 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950"
    >
      <NftsSidebar />
    </aside>
    <!-- Main Table (Right Panel) -->
    <div
      class="flex-1 w-0 flex flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <!-- Header Controls - Hidden on mobile -->
      <div
        class="hidden md:block p-4 flex-shrink-0 bg-white dark:bg-neutral-950"
      >
        <NftsHeaderControls />
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
      <!-- NFT Collections Table -->
      <div class="flex-1 px-4 pb-8 overflow-auto">
        <NftsCollectionsTable />
      </div>
    </div>

    <!-- Mobile Filter Drawer -->
    <NftsFilterDrawer
      :is-open="showFilterDrawer"
      @close="showFilterDrawer = false"
      @apply-filters="handleApplyFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import NftsSidebar from '@/components/NftsSidebar.vue'
  import NftsHeaderControls from '@/components/NftsHeaderControls.vue'
  import NftsCollectionsTable from '@/components/NftsCollectionsTable.vue'
  import NftsFilterDrawer from '@/components/NftsFilterDrawer.vue'

  const showFilterDrawer = ref(false)

  interface Filters {
    tab: string
    time: string
    category: string
    chain: string
    isVerified: boolean
  }

  function handleApplyFilters(filters: Filters) {
    console.log('Applied filters:', filters)
    // Here you would typically update the table data based on the filters
    // For now, we'll just log the filters
  }
</script>
