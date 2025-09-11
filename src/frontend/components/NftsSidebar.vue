<template>
  <div class="flex flex-col gap-6">
    <SidebarSection
      title="Category"
      :open="openSections.category"
      @toggle="openSections.category = !openSections.category"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="cat in categories"
          :key="cat"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedCategory === cat
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
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
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 mb-2 mt-2"
      >
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chain in chains"
          :key="chain.label"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
          :class="
            selectedChain === chain.label
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedChain = chain.label"
        >
          <UIcon :name="chain.icon" class="text-base" /> {{ chain.label }}
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Floor Price"
      :open="openSections.floorPrice"
      @toggle="openSections.floorPrice = !openSections.floorPrice"
    >
      <div class="flex flex-col gap-2 items-center mb-2 mt-2">
        <select
          class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 w-full"
        >
          <option>ETH</option>
        </select>
        <div class="flex gap-2 items-center w-full">
          <input
            type="number"
            placeholder="Min"
            class="w-16 px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
          >
          <span class="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max"
            class="w-16 px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
          >
        </div>
        <button class="px-3 py-1 rounded bg-primary-600 text-white w-full">
          Apply
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Top Offer"
      :open="openSections.topOffer"
      @toggle="openSections.topOffer = !openSections.topOffer"
    >
      <div class="flex flex-col gap-2 items-center mb-2 mt-2">
        <select
          class="px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 w-full"
        >
          <option>WETH</option>
        </select>
        <div class="flex gap-2 items-center w-full">
          <input
            type="number"
            placeholder="Min"
            class="w-16 px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
          >
          <span class="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max"
            class="w-16 px-2 py-1 flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
          >
        </div>
        <button class="px-3 py-1 rounded bg-primary-600 text-white w-full">
          Apply
        </button>
      </div>
    </SidebarSection>
    <!-- Is Verified -->
    <div class="flex items-center gap-2 mt-4">
      <input
        id="is-verified"
        v-model="isVerified"
        type="checkbox"
        class="accent-primary-600"
      >
      <label for="is-verified" class="text-gray-700 dark:text-gray-200"
        >Is Verified</label
      >
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import SidebarSection from './profile/SidebarSection.vue'
  const openSections = reactive({
    category: true,
    chains: false,
    floorPrice: false,
    topOffer: false,
  })
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
</script>
