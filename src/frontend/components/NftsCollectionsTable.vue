<template>
  <div class="overflow-x-auto flex-1">
    <table class="min-w-5xl w-full text-sm">
      <thead>
        <tr class="bg-neutral-100 dark:bg-neutral-800">
          <th
            v-for="col in columns"
            :key="col.key"
            class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap select-none"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-200 dark:border-gray-700 h-px"/>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <!-- Collection -->
          <td class="p-4 flex items-center gap-2 min-w-[200px]">
            <button class="text-yellow-500 dark:text-yellow-400">
              <UIcon name="i-heroicons-star-20-solid" />
            </button>
            <img
              :src="row.avatar"
              alt="avatar"
              class="w-8 h-8 rounded border border-gray-300 dark:border-gray-700 flex-shrink-0"
            >
            <div class="min-w-0">
              <div
                class="flex items-center gap-1 font-semibold text-gray-900 dark:text-white truncate"
              >
                {{ row.name }}
                <UIcon
                  v-if="row.verified"
                  name="material-symbols:verified"
                  class="text-sky-500 text-xl"
                />
                <span
                  v-if="row.isNew"
                  class="ml-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  >NEW</span
                >
              </div>
            </div>
          </td>
          <!-- Floor Price -->
          <td class="p-4 font-mono text-gray-900 dark:text-white">
            {{ row.floorPrice }}
          </td>
          <!-- 1D Change -->
          <td
            class="p-4 font-mono"
            :class="
              row.change1d > 0
                ? 'text-green-600 dark:text-green-400'
                : row.change1d < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-300'
            "
          >
            {{ row.change1d > 0 ? '+' : '' }}{{ row.change1d }}%
          </td>
          <!-- Top Offer -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.topOffer }}
          </td>
          <!-- 1D Vol -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.vol1d }}
          </td>
          <!-- 1D Sales -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.sales1d }}
          </td>
          <!-- Owners -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.owners }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
  const columns = [
    { key: 'collection', label: 'Collection' },
    { key: 'floorPrice', label: 'Floor Price' },
    { key: 'change1d', label: '1D Change' },
    { key: 'topOffer', label: 'Top Offer' },
    { key: 'vol1d', label: '1D Vol' },
    { key: 'sales1d', label: '1D Sales' },
    { key: 'owners', label: 'Owners' },
  ]
  const rows = [
    {
      id: 1,
      avatar:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80',
      name: 'Pudgy Penguins',
      verified: true,
      isNew: true,
      floorPrice: '16.07 ETH',
      change1d: 4.8,
      topOffer: '15.16 WETH',
      vol1d: '962.41 ETH',
      sales1d: 61,
      owners: 4948,
    },
    {
      id: 2,
      avatar:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
      name: 'CryptoPunks',
      verified: true,
      isNew: false,
      floorPrice: '45.00 ETH',
      change1d: 0.0,
      topOffer: '44.50 WETH',
      vol1d: '1,200.00 ETH',
      sales1d: 12,
      owners: 10000,
    },
    {
      id: 3,
      avatar:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      name: 'Fidenza by Tyler Hobbs',
      verified: false,
      isNew: false,
      floorPrice: '80.00 ETH',
      change1d: -1.2,
      topOffer: '79.00 WETH',
      vol1d: '500.00 ETH',
      sales1d: 3,
      owners: 300,
    },
    {
      id: 4,
      avatar:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      name: 'Doodles',
      verified: false,
      isNew: true,
      floorPrice: '2.50 ETH',
      change1d: 2.1,
      topOffer: '2.40 WETH',
      vol1d: '100.00 ETH',
      sales1d: 20,
      owners: 5000,
    },
  ]
</script>
