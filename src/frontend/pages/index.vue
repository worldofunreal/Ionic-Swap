<template>
  <div
    class="min-h-screen bg-background grid grid-cols-1 md:grid-cols-4"
  >
    <!-- Left Column (Main Content) -->
    <div
      class="col-span-1 py-2 px-2 md:px-6 overflow-y-auto transition-all duration-300 ease-in-out"
      :class="
        sidebarStore.isStatsPanelVisible ? 'md:col-span-3' : 'md:col-span-4'
      "
    >
      <DiscoverCarousel class="mb-2" />
      <DeFi101 class="mb-2" />
    </div>
    <!-- Right Column (Token Prices) -->
    <div
      class="hidden md:block col-span-1 h-[calc(100vh-64px-48px)] sticky top-0 overflow-y-auto scrollbar-hide px-2 py-2.5 transition-all duration-300 ease-in-out"
      :class="
        sidebarStore.isStatsPanelVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full pointer-events-none'
      "
    >
      <TokenPriceList />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSidebarStore } from '@/stores/sidebar'

  // Stub components for layout
  import DiscoverCarousel from '@/components/DiscoverCarousel.vue'
  import DeFi101 from '@/components/DeFi101.vue'
  import TokenPriceList from '~/components/TokenPriceList.vue'

  const sidebarStore = useSidebarStore()
</script>

<style scoped>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
