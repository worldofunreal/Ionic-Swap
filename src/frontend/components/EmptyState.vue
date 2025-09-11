<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 mb-4 text-gray-400">
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No items found
    </h3>
    <p class="text-gray-500 dark:text-gray-400 text-center max-w-sm">
      There are no items to display at the moment. Try adjusting your search or
      filters.
    </p>
  </div>
</template>

<script setup lang="ts">
  // EmptyState component for when no data is available
</script>
