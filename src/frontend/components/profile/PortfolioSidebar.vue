<template>
  <div
    class="w-80 p-4 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-gray-800"
  >
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
              : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
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
      title="Floor Price"
      :open="openSections.floorPrice"
      @toggle="openSections.floorPrice = !openSections.floorPrice"
    >
      <div class="flex flex-col gap-2 mt-2">
        <select
          v-model="floorCurrency"
          class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs w-full"
        >
          <option value="ETH">ETH</option>
          <option value="WETH">WETH</option>
        </select>
        <div class="flex items-center gap-2">
          <input
            v-model="floorMin"
            type="number"
            placeholder="Min"
            class="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs"
          />
          <span>to</span>
          <input
            v-model="floorMax"
            type="number"
            placeholder="Max"
            class="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs"
          />
        </div>
        <button
          class="w-full px-2 py-1 rounded bg-primary-600 text-white text-xs"
        >
          Apply
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Top Offer"
      :open="openSections.topOffer"
      @toggle="openSections.topOffer = !openSections.topOffer"
    >
      <div class="flex flex-col gap-2 mt-2">
        <select
          v-model="offerCurrency"
          class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs w-full"
        >
          <option value="WETH">WETH</option>
          <option value="ETH">ETH</option>
        </select>
        <div class="flex items-center gap-2">
          <input
            v-model="offerMin"
            type="number"
            placeholder="Min"
            class="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs"
          />
          <span>to</span>
          <input
            v-model="offerMax"
            type="number"
            placeholder="Max"
            class="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-xs"
          />
        </div>
        <button
          class="w-full px-2 py-1 rounded bg-primary-600 text-white text-xs"
        >
          Apply
        </button>
      </div>
    </SidebarSection>
    <SidebarSection
      title="Is Verified"
      :open="openSections.isVerified"
      @toggle="openSections.isVerified = !openSections.isVerified"
    >
      <div class="flex items-center gap-2 mt-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="isVerified"
            type="checkbox"
            class="form-checkbox rounded"
          />
          <span class="text-xs">Is Verified</span>
        </label>
      </div>
    </SidebarSection>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import SidebarSection from './SidebarSection.vue'
  const openSections = reactive({
    category: true,
    chains: false,
    floorPrice: false,
    topOffer: false,
    isVerified: false,
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
  const floorCurrency = ref('ETH')
  const floorMin = ref('')
  const floorMax = ref('')
  const offerCurrency = ref('WETH')
  const offerMin = ref('')
  const offerMax = ref('')
  const isVerified = ref(false)
</script>
