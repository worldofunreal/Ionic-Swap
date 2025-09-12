<template>
  <div class="flex flex-col w-full p-4">
    <div
      v-if="activities.length === 0"
      class="flex flex-col items-center justify-center flex-1 py-16"
    >
      <img
        src="https://placehold.co/96x96?text=NFT"
        alt="NFT"
        class="w-24 h-24 rounded-lg shadow mb-4"
      />
      <div class="text-xl font-bold mb-2">No results found</div>
      <div class="text-gray-400 mb-4">
        Try removing some filters to view more results
      </div>
      <button class="px-4 py-2 rounded bg-primary-600 text-white font-semibold">
        Clear filters
      </button>
    </div>
    <div v-else class="overflow-x-auto flex-1">
      <table class="min-w-5xl w-full text-sm">
        <thead>
          <tr class="bg-neutral-800">
            <th
              class="p-4 text-left font-medium text-gray-300 whitespace-nowrap"
            >
              Event
            </th>
            <th
              class="p-4 text-left font-medium text-gray-300 whitespace-nowrap"
            >
              Item
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              Price
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              Rarity
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              Qty
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              From
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              To
            </th>
            <th
              class="p-4 text-right font-medium text-gray-300 whitespace-nowrap"
            >
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-700 h-px" />
          <tr
            v-for="act in activities"
            :key="act.id"
            class="border-b border-gray-800 hover:bg-neutral-900/50 transition-colors"
          >
            <td class="p-4 text-left whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-900/20 text-green-400': act.event === 'Sale',
                  'bg-blue-900/20 text-blue-400': act.event === 'Mint',
                  'bg-purple-900/20 text-purple-400': act.event === 'Transfer',
                }"
              >
                {{ act.event }}
              </span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-3">
                <img
                  :src="act.image"
                  alt="NFT"
                  class="w-12 h-12 rounded-lg border border-gray-700 flex-shrink-0"
                />
                <div class="flex flex-col">
                  <span class="font-semibold text-white">{{ act.name }}</span>
                  <span class="text-sm text-gray-400">#{{ act.id }}</span>
                </div>
              </div>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="font-medium text-white">{{ act.price }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-900/20 text-green-400': act.rarity === 'Rare',
                  'bg-purple-900/20 text-purple-400': act.rarity === 'Epic',
                  'bg-blue-900/20 text-blue-400': act.rarity === 'Common',
                }"
              >
                {{ act.rarity }}
              </span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-300">{{ act.qty }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-400 text-sm">{{ act.from }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-400 text-sm">{{ act.to }}</span>
            </td>
            <td class="p-4 text-right whitespace-nowrap">
              <span class="text-gray-400 text-sm">{{ act.time }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
  const activities = [
    {
      id: 1,
      event: 'Sale',
      name: 'CryptoPunk #1234',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '2.5 ETH',
      rarity: 'Rare',
      qty: 1,
      from: '0x123...abcd',
      to: '0x456...efgh',
      time: '2024-06-01 12:00',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
    {
      id: 2,
      event: 'Mint',
      name: 'Bored Ape #5678',
      image: 'https://placehold.co/40x40?text=NFT',
      price: '0 ETH',
      rarity: 'Epic',
      qty: 1,
      from: '0x000...0000',
      to: '0x456...efgh',
      time: '2024-05-20 09:30',
    },
  ]
</script>
