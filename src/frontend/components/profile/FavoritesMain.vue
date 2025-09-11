<template>
  <div class="flex flex-col w-full p-4">
    <div
      v-if="nfts.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=NFT"
        alt="NFT"
        class="w-24 h-24 rounded-lg shadow mb-4"
      >
      <div class="text-xl font-bold mb-2">No favorites found</div>
      <div class="text-gray-400 mb-4">Discover new items on OS2</div>
      <button class="px-4 py-2 rounded bg-primary-600 text-white font-semibold">
        Go to Discover
      </button>
    </div>
    <div v-else class="overflow-x-auto flex-1">
      <table class="min-w-5xl w-full text-sm">
        <thead>
          <tr class="bg-neutral-100 dark:bg-neutral-800">
            <th
              class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Item
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Rarity
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Top Offer
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Last Sale
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Owner
            </th>
            <th
              class="p-4 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Listed
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200 dark:border-gray-700 h-px"/>
          <tr
            v-for="nft in nfts"
            :key="nft.id"
            class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="nft.image"
                  alt="NFT"
                  class="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-700 flex-shrink-0"
                >
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    nft.name
                  }}</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >#{{ nft.id }}</span
                  >
                </div>
              </div>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400':
                    nft.rarity === 'Rare',
                  'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400':
                    nft.rarity === 'Epic',
                  'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400':
                    nft.rarity === 'Common',
                }"
              >
                {{ nft.rarity }}
              </span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-gray-900 dark:text-white">{{
                nft.price
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-green-600 dark:text-green-400">{{
                nft.topOffer
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-300">{{
                nft.lastSale
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-600 dark:text-gray-400 text-sm">{{
                nft.owner
              }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400':
                    nft.listed === 'Yes',
                  'bg-gray-100 dark:bg-neutral-900/20 text-gray-600 dark:text-gray-400':
                    nft.listed === 'No',
                }"
              >
                {{ nft.listed }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
  const nfts = [
    {
      id: 1,
      name: 'CryptoPunk #1234',
      image: 'https://placehold.co/40x40?text=NFT',
      rarity: 'Rare',
      price: '2.5 ETH',
      topOffer: '2.3 ETH',
      lastSale: '2.2 ETH',
      owner: '0x123...abcd',
      listed: 'Yes',
    },
    {
      id: 2,
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      rarity: 'Epic',
      price: '8.0 ETH',
      topOffer: '7.8 ETH',
      lastSale: '7.7 ETH',
      owner: '0x456...efgh',
      listed: 'No',
    },
  ]
</script>
