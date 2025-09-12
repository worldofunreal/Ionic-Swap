<template>
  <div
    class="w-80 p-4 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-gray-800"
  >
    <SidebarSection
      title="Chains"
      :open="openSections.chains"
      @toggle="openSections.chains = !openSections.chains"
    >
      <input
        type="text"
        placeholder="Search for chains"
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 mb-2 mt-2"
      />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chain in chains"
          :key="chain.label"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
          :class="chain.color"
        >
          <UIcon :name="chain.icon" class="text-base" /> {{ chain.label }}
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
          class="px-3 py-1 rounded-full border text-xs font-semibold bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
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
      <div class="flex flex-col gap-2 mt-2">
        <label class="flex items-center gap-2">
          <input
            v-model="hasNFT"
            type="checkbox"
            class="form-checkbox rounded"
          />
          Has NFT
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="brandedTokenPage"
            type="checkbox"
            class="form-checkbox rounded"
          />
          Branded Token Page
        </label>
      </div>
    </SidebarSection>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import SidebarSection from './SidebarSection.vue'
  const openSections = reactive({
    chains: true,
    marketCap: false,
    category: false,
  })
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
  const marketCaps = [
    '< $100K',
    '$100K-$500K',
    '$500K-$1M',
    '$1M-$10M',
    '$10M-$100M',
    '$100M-$1B',
    '$1B+',
  ]
  const hasNFT = ref(false)
  const brandedTokenPage = ref(false)
</script>
