<template>
  <div
    class="flex flex-col gap-6 w-[220px] max-w-[260px] p-4 bg-zinc-50 dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-gray-800"
  >
    <!-- Status -->
    <div>
      <div class="font-bold mb-2">Status</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="status in statuses"
          :key="status"
          class="px-3 py-1 rounded-full border text-xs font-semibold"
          :class="
            selectedStatus === status
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-zinc-50 dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
          "
          @click="selectedStatus = status"
        >
          {{ status }}
        </button>
      </div>
    </div>
    <!-- Chains -->
    <div>
      <div class="font-bold mb-2">Chains</div>
      <input
        type="text"
        placeholder="Search chains..."
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-zinc-50 dark:bg-neutral-950 mb-2"
      >
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
    </div>
    <!-- Collections -->
    <div>
      <div class="font-bold mb-2">Collections</div>
      <input
        type="text"
        placeholder="Search collections..."
        class="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-zinc-50 dark:bg-neutral-950 mb-2"
      >
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const statuses = ['All', 'Listed', 'Not Listed', 'Hidden']
  const selectedStatus = ref('All')
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
</script>
