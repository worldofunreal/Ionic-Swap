<template>
  <div
    class="flex items-center gap-4 bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-gray-800 px-6 py-3 shadow-lg rounded-t-2xl"
  >
    <div class="flex items-center gap-2">
      <span class="font-semibold">Qty:</span>
      <input
        v-model="qty"
        type="number"
        min="1"
        class="w-16 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
      >
    </div>
    <div class="flex items-center gap-2">
      <span class="font-semibold">Max Price:</span>
      <input
        v-model="maxPrice"
        type="number"
        min="0"
        step="0.0001"
        class="w-24 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950"
      >
      <span class="text-gray-500">ETH</span>
    </div>
    <button
      class="ml-auto px-4 py-2 rounded bg-primary-600 text-white font-semibold"
    >
      Buy floor
    </button>
    <button
      class="px-4 py-2 rounded bg-neutral-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-semibold"
    >
      Make collection offer
    </button>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const qty = ref(1)
  const maxPrice = ref('')
</script>
