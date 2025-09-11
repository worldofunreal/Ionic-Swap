<template>
  <div
    class="w-80 p-4 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-gray-800"
  >
    <SidebarSection
      title="View"
      :open="openSections.view"
      @toggle="openSections.view = !openSections.view"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="view in views"
          :key="view"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedView === view
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedView = view"
        >
          {{ view }}
        </button>
      </div>
    </SidebarSection>
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
      title="Offer Type"
      :open="openSections.offerType"
      @toggle="openSections.offerType = !openSections.offerType"
    >
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="type in offerTypes"
          :key="type"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedOfferType === type
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedOfferType = type"
        >
          {{ type }}
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
      >
      <div class="text-gray-400 text-xs">[Chain filter pills here]</div>
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
      >
      <div class="text-gray-400 text-xs">[Collection filter pills here]</div>
    </SidebarSection>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import SidebarSection from './SidebarSection.vue'
  const openSections = reactive({
    view: true,
    status: false,
    offerType: false,
    chains: false,
    collections: false,
  })
  const views = ['Offers Made', 'Item Offers Received']
  const selectedView = ref('Offers Made')
  const statuses = [
    'All',
    'Active',
    'Unfunded',
    'Completed',
    'Expired',
    'Cancelled',
  ]
  const selectedStatus = ref('All')
  const offerTypes = ['All', 'Item Offers', 'Collection Offers', 'Trait Offers']
  const selectedOfferType = ref('All')
</script>
