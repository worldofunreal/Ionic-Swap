<template>
  <div class="flex flex-col w-full p-4">
    <div
      v-if="collections.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=NFT"
        alt="NFT"
        class="w-24 h-24 rounded-lg shadow mb-4"
      >
      <div class="text-xl font-bold mb-2">No results found</div>
      <div class="text-gray-400 mb-4">
        No watchlist collections found. Add some to your watchlist.
      </div>
      <button class="px-4 py-2 rounded bg-primary-600 text-white font-semibold">
        Clear filters
      </button>
    </div>
    <div v-else class="overflow-x-auto flex-1">
      <table class="min-w-5xl w-full text-sm">
        <thead>
          <tr class="bg-neutral-100 dark:bg-neutral-800">
            <th
              class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Collection
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Floor Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Top Offer
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Vol
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Sales
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Owners
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Supply
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Last 7D
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200 dark:border-gray-700 h-px"/>
          <tr
            v-for="col in collections"
            :key="col.id"
            class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="col.logo"
                  alt="Collection"
                  class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-700 flex-shrink-0"
                >
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    col.name
                  }}</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >#{{ col.id }}</span
                  >
                </div>
              </div>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                col.floorPrice
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-green-600 dark:text-green-400">{{
                col.topOffer
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.vol
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.sales.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.owners.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                col.supply.toLocaleString()
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                :class="
                  col.last7d.startsWith('+')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ col.last7d }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
  const collections = [
    {
      id: 1,
      name: 'CryptoPunks',
      logo: 'https://placehold.co/32x32?text=CP',
      floorPrice: '2.1 ETH',
      topOffer: '2.3 ETH',
      vol: '1.3M ETH',
      sales: 24000,
      owners: 3843,
      supply: 9994,
      last7d: '+5%',
    },
    {
      id: 2,
      name: 'Bored Ape Yacht Club',
      logo: 'https://placehold.co/32x32?text=BAYC',
      floorPrice: '7.5 ETH',
      topOffer: '7.8 ETH',
      vol: '1.1M ETH',
      sales: 122472,
      owners: 11866,
      supply: 10000,
      last7d: '-2%',
    },
  ]
</script>
