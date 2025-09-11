<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Filtering Sidebar (Left) -->
    <aside
      class="hidden lg:block w-64 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950"
    >
      <CollectionFilters />
    </aside>
    <!-- Main Content (Right) -->
    <div class="flex-1 flex flex-col min-h-screen">
      <!-- Banner Section -->
      <CollectionBanner class="mb-4" />
      <!-- Tabs -->
      <CollectionTabs class="mb-4" />
      <!-- Top Controls -->
      <div class="px-4 mb-4">
        <CollectionTopControls />
      </div>
      <!-- NFT Grid/List -->
      <div class="flex-1 px-4 mb-14">
        <CollectionNFTGrid />
      </div>
      <!-- Buy Area (Bottom Bar) -->
      <div class="sticky bottom-11 left-0 w-full z-20">
        <CollectionBuyBar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import CollectionBanner from '@/components/CollectionBanner.vue'
  import CollectionTabs from '@/components/CollectionTabs.vue'
  import CollectionFilters from '@/components/CollectionFilters.vue'
  import CollectionTopControls from '@/components/CollectionTopControls.vue'
  import CollectionNFTGrid from '@/components/CollectionNFTGrid.vue'
  import CollectionBuyBar from '@/components/CollectionBuyBar.vue'
</script>
