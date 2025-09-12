<template>
  <div class="flex flex-col gap-6">
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
            selectedStatuses.includes(status)
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="toggleStatus(status)"
        >
          {{ status }}
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Price"
      :open="openSections.price"
      @toggle="openSections.price = !openSections.price"
    >
      <div class="flex flex-col gap-2 items-center mb-2 mt-2">
        <select
          class="px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 w-full text-center"
        >
          <option>USD</option>
          <option>ETH</option>
        </select>
        <div class="flex gap-2 items-center w-full">
          <input
            type="number"
            placeholder="Min"
            class="w-16 px-2 py-1 flex-1 rounded border"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            class="w-16 px-2 py-1 flex-1 rounded border"
          />
        </div>
        <button class="px-3 py-1 rounded bg-primary-600 text-white w-full">
          Apply
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Marketplaces"
      :open="openSections.marketplaces"
      @toggle="openSections.marketplaces = !openSections.marketplaces"
    >
      <div class="flex flex-col gap-1 mt-2">
        <label v-for="m in marketplaces" :key="m"
          ><input type="checkbox" /> {{ m }}</label
        >
      </div>
    </SidebarSection>
    <SidebarSection
      title="Chains"
      :open="openSections.chains"
      @toggle="openSections.chains = !openSections.chains"
    >
      <input
        type="text"
        placeholder="Search chains..."
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 mb-2 mt-2"
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
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 mb-2 mt-2"
      />
      <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
        <label
          v-for="col in collections"
          :key="col.name"
          class="flex items-center gap-1"
        >
          <input type="checkbox" />
          <span>{{ col.name }}</span>
          <UIcon
            v-if="col.verified"
            name="material-symbols:verified"
            class="text-primary-500 text-xs"
          />
        </label>
      </div>
    </SidebarSection>
  </div>
</template>
<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import SidebarSection from './profile/SidebarSection.vue'
  const openSections = reactive({
    status: true,
    price: false,
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
  const selectedStatuses = ref(['All'])
  function toggleStatus(status: string) {
    if (selectedStatuses.value.includes(status)) {
      selectedStatuses.value = selectedStatuses.value.filter(s => s !== status)
    } else {
      selectedStatuses.value.push(status)
    }
  }
  const marketplaces = ['OpenSea', 'Blur', 'MagicEden', 'CryptoPunks']
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
  const collections = [
    { name: 'X FIGURES', verified: true },
    { name: 'CryptoPunks', verified: true },
    { name: 'Cool Cats', verified: false },
    { name: 'Bored Apes', verified: true },
    { name: 'Doodles', verified: false },
  ]
</script>
