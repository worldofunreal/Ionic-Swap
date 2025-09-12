<template>
  <div
    class="w-80 p-4 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-gray-800"
  >
    <SidebarSection
      title="Status"
      :open="openSections.status"
      @toggle="openSections.status = !openSections.status"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="status in statuses"
          :key="status"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedStatus === status
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedStatus = status"
        >
          {{ status }}
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Marketplaces"
      :open="openSections.marketplaces"
      @toggle="openSections.marketplaces = !openSections.marketplaces"
    >
      <div class="flex flex-col gap-2 mt-2">
        <label
          v-for="mp in marketplaces"
          :key="mp"
          class="flex items-center gap-2"
        >
          <input
            v-model="selectedMarketplaces"
            type="checkbox"
            :value="mp"
            class="form-checkbox rounded"
          />
          {{ mp }}
        </label>
      </div>
    </SidebarSection>
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
      title="Collections"
      :open="openSections.collections"
      @toggle="openSections.collections = !openSections.collections"
    >
      <input
        type="text"
        placeholder="Search for collections"
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 mb-2 mt-2"
      />
      <div class="text-gray-400 text-xs">[Collection filter pills here]</div>
    </SidebarSection>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import SidebarSection from './SidebarSection.vue'
  const openSections = reactive({
    status: true,
    marketplaces: false,
    chains: false,
    collections: false,
  })
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
  const selectedStatus = ref('All')
  const marketplaces = ['OpenSea', 'Blur', 'MagicEden', 'CryptoPunks']
  const selectedMarketplaces = ref([])
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
</script>
