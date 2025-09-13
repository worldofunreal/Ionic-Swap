<template>
  <div class="flex flex-col gap-6">
    <!-- Search for Chains (not expandable) -->
    <div>
      <div class="font-bold mb-2">Search for Chains</div>
      <div class="relative">
        <input
          type="text"
          placeholder="Search chains..."
          class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
        >
        <UIcon
          name="ri:search-line"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
    <SidebarSection
      title="Chains"
      :open="openSections.chains"
      @toggle="openSections.chains = !openSections.chains"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="chain in chains"
          :key="chain"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedChains.includes(chain)
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="toggleChain(chain)"
        >
          {{ chain }}
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Market Cap"
      :open="openSections.marketCap"
      @toggle="openSections.marketCap = !openSections.marketCap"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="cap in marketCaps"
          :key="cap"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedMarketCaps.includes(cap)
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="toggleMarketCap(cap)"
        >
          {{ cap }}
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Category"
      :open="openSections.category"
      @toggle="openSections.category = !openSections.category"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="cat in categories"
          :key="cat.label"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedCategoryOptions[cat.label]?.includes(cat.label)
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="toggleCategoryOption(cat.label, cat.label)"
        >
          {{ cat.label }}
        </button>
      </div>
    </SidebarSection>
    <!-- Has NFT Toggle -->
    <div class="flex items-center gap-2">
      <input id="has-nft" type="checkbox" >
      <label for="has-nft">Has NFT</label>
    </div>
    <!-- Branded Token Page Toggle -->
    <div class="flex items-center gap-2">
      <input id="branded-token" type="checkbox" >
      <label for="branded-token">Branded Token Page</label>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import SidebarSection from './profile/SidebarSection.vue'
  const openSections = reactive({
    chains: true,
    marketCap: false,
    category: false,
  })
  const chains = [
    'Ethereum',
    'Solana',
    'Arbitrum',
    'Base',
    'Optimism',
    'Polygon',
  ]
  const selectedChains = ref<string[]>([])
  function toggleChain(chain: string) {
    if (selectedChains.value.includes(chain)) {
      selectedChains.value = selectedChains.value.filter(c => c !== chain)
    } else {
      selectedChains.value.push(chain)
    }
  }
  const marketCaps = [
    '<$100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M - $10M',
    '$10M+',
  ]
  const selectedMarketCaps = ref<string[]>([])
  function toggleMarketCap(cap: string) {
    if (selectedMarketCaps.value.includes(cap)) {
      selectedMarketCaps.value = selectedMarketCaps.value.filter(c => c !== cap)
    } else {
      selectedMarketCaps.value.push(cap)
    }
  }
  const categories = [
    { label: 'All', open: true, options: ['All'] },
    { label: 'Layer 1', open: false, options: ['Ethereum', 'Solana'] },
    {
      label: 'Layer 2',
      open: false,
      options: ['Arbitrum', 'Optimism', 'Base'],
    },
    { label: 'Stablecoins', open: false, options: ['USDT', 'DAI'] },
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
  function toggleCategoryOption(label: string, opt: string) {
    if (!selectedCategoryOptions.value[label])
      selectedCategoryOptions.value[label] = []
    if (selectedCategoryOptions.value[label].includes(opt)) {
      selectedCategoryOptions.value[label] = selectedCategoryOptions.value[
        label
      ].filter(o => o !== opt)
    } else {
      selectedCategoryOptions.value[label].push(opt)
    }
  }
</script>
