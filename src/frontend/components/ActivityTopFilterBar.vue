<template>
  <div class="flex gap-2 items-center">
    <div
      v-for="filter in activeFilters"
      :key="filter"
      class="flex items-center gap-1 bg-primary-600 text-white px-3 py-2 rounded font-bold text-sm"
    >
      {{ filter }}
      <button class="ml-1" @click="removeFilter(filter)">
        <UIcon name="i-heroicons-x-mark-20-solid" class="text-xs" />
      </button>
    </div>
    <button
      v-if="activeFilters.length"
      class="ml-2 px-3 py-2 rounded bg-neutral-800 text-gray-200 text-sm font-bold"
      @click="clearFilters"
    >
      Clear
    </button>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const activeFilters = ref(['Sale (x)'])
  function removeFilter(filter: string) {
    activeFilters.value = activeFilters.value.filter(f => f !== filter)
  }
  function clearFilters() {
    activeFilters.value = []
  }
</script>
