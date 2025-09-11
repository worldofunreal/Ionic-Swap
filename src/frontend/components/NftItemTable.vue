<template>
  <div>
    <!-- Search & Sorting -->
    <div class="flex flex-wrap gap-2 items-center mb-4">
      <input
        type="text"
        placeholder="Search items..."
        class="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-sm w-48"
      >
      <select
        class="px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 text-sm"
      >
        <option>Recently received</option>
        <option>Recently listed</option>
        <option>Price low to high</option>
        <option>Price high to low</option>
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
            view === 'table'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-500'
          "
          class="px-3 py-2 font-bold"
          @click="view = 'table'"
        >
          Table
        </button>
        <button
          :class="
            view === 'compact'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-gray-500'
          "
          class="px-3 py-2 rounded-r font-bold"
          @click="view = 'compact'"
        >
          Compact
        </button>
      </div>
    </div>
    <!-- Table Columns -->
    <div
      v-if="items.length"
      class="overflow-x-auto rounded-xl shadow bg-white dark:bg-neutral-950"
    >
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 font-bold text-left select-none"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-b border-gray-100 dark:border-gray-800 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
          >
            <td class="px-4 py-2">{{ item.listingPrice }}</td>
            <td class="px-4 py-2">{{ item.rarity }}</td>
            <td class="px-4 py-2">{{ item.floorPrice }}</td>
            <td class="px-4 py-2">{{ item.topOffer }}</td>
            <td class="px-4 py-2">{{ item.cost }}</td>
            <td class="px-4 py-2">{{ item.received }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState v-else />
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import EmptyState from '@/components/EmptyState.vue'
  const view = ref('table')
  const columns = [
    { key: 'listingPrice', label: 'Listing Price' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'floorPrice', label: 'Floor Price' },
    { key: 'topOffer', label: 'Top Offer' },
    { key: 'cost', label: 'Cost' },
    { key: 'received', label: 'Received' },
  ]
  const items = ref([
    // Uncomment to test with data
    // { id: 1, listingPrice: '0.08 ETH', rarity: '#1,234', floorPrice: '0.07 ETH', topOffer: '0.06 ETH', cost: '0.05 ETH', received: '0.08 ETH' }
  ])
</script>
