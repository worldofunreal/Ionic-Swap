<template>
  <div class="flex flex-wrap gap-2 items-center">
    <input
      type="text"
      placeholder="Search item or trait"
      class="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-sm w-48"
    >
    <select
      class="px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-sm"
    >
      <option>Price low to high</option>
      <option>Price high to low</option>
      <option>Recently listed</option>
      <option>Recently sold</option>
    </select>
    <div class="flex gap-1 ml-2">
      <button
        :class="
          view === 'grid'
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-100 dark:bg-neutral-800 text-gray-500'
        "
        class="px-3 py-2 rounded-l font-bold"
        @click="view = 'grid'"
      >
        Grid
      </button>
      <button
        :class="
          view === 'list'
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-100 dark:bg-neutral-800 text-gray-500'
        "
        class="px-3 py-2 rounded-r font-bold"
        @click="view = 'list'"
      >
        List
      </button>
    </div>
    <button
      class="ml-auto px-4 py-2 rounded bg-primary-600 text-white font-semibold flex items-center gap-1"
    >
      <UIcon name="ion:stats-chart" class="text-lg" /> Insights
    </button>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const view = ref('grid')
</script>
