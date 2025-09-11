<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <button
        v-for="cat in categories"
        :key="cat.label"
        class="flex items-center gap-1 px-2 py-1 rounded-md border transition font-medium text-xs whitespace-nowrap"
        :class="
          selected === cat.label
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary'
        "
        @click="selected = cat.label"
      >
        <UIcon v-if="cat.icon" :name="cat.icon" class="text-lg" />
        <span>{{ cat.label }}</span>
      </button>
    </div>
    <div class="flex items-center gap-1">
      <!-- Stats Icon Button -->
      <UTooltip
        :text="
          sidebarStore.isStatsPanelVisible
            ? 'Hide stats panel'
            : 'Show stats panel'
        "
        position="bottom"
      >
        <button
          class="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
          :class="
            sidebarStore.isStatsPanelVisible
              ? 'text-primary-600'
              : 'text-gray-400'
          "
          @click="sidebarStore.toggleStatsPanel()"
        >
          <UIcon name="tabler:activity" class="text-xl" />
        </button>
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useSidebarStore } from '@/stores/sidebar'
  import UTooltip from './UTooltip.vue'

  const sidebarStore = useSidebarStore()

  const categories = [
    { label: 'All', icon: null },
    { label: 'Gaming', icon: 'streamline-plump:controller-1-solid' },
    { label: 'Art', icon: 'mdi:art' },
    { label: 'PFPs', icon: 'mdi:face' },
    { label: 'Music', icon: 'mdi:music' },
    { label: 'Photography', icon: 'mynaui:aperture-solid' },
  ]
  const selected = ref('All')
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
