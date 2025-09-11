<template>
  <div class="flex flex-wrap gap-2 items-center">
    <!-- Tabs -->
    <div class="flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="
          selectedTab === tab
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-800 text-gray-200'
        "
        class="px-3 py-2 rounded font-bold"
        @click="selectedTab = tab"
      >
        {{ tab }}
      </button>
    </div>
    <!-- Time Range Filters -->
    <div class="flex gap-1 ml-2">
      <button
        v-for="t in times"
        :key="t"
        :class="
          selectedTime === t
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-800 text-gray-200'
        "
        class="px-3 py-2 rounded font-bold text-sm"
        @click="selectedTime = t"
      >
        {{ t }}
      </button>
    </div>
    <!-- View Toggle -->
    <div class="flex gap-1 ml-auto">
      <button
        :class="
          view === 'grid'
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-800 text-gray-200'
        "
        class="p-2 rounded"
        @click="view = 'grid'"
      >
        <UIcon name="i-heroicons-squares-2x2-20-solid" />
      </button>
      <button
        :class="
          view === 'list'
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-800 text-gray-200'
        "
        class="p-2 rounded"
        @click="view = 'list'"
      >
        <UIcon name="i-heroicons-bars-3-20-solid" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const tabs = ['Top', 'Trending', 'Watchlist']
  const selectedTab = ref('Top')
  const times = ['All', '30d', '7d', '1d', '1h', '15m', '5m', '1m']
  const selectedTime = ref('All')
  const view = ref('grid')
</script>
