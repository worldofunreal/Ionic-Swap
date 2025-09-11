<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <h3 class="text-lg font-bold">Collection Offers</h3>
      <p class="text-sm text-gray-400 mt-1">
        Active offers for this collection
      </p>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <!-- Table Header -->
        <thead class="bg-neutral-800">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              TYPE
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              PRICE
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              QTY
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              FROM
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              EXPIRY
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              ACTION
            </th>
          </tr>
        </thead>
        <!-- Header Separator -->
        <tr class="border-b border-gray-700">
          <td colspan="6" class="h-px"/>
        </tr>

        <!-- Table Body -->
        <tbody class="divide-y divide-gray-700">
          <tr
            v-for="offer in offers"
            :key="offer.id"
            class="hover:bg-neutral-700 transition-colors"
          >
            <!-- Type -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  :class="getTypeColor(offer.type)"
                  class="w-2 h-2 rounded-full"
                />
                <span class="text-sm font-medium">{{ offer.type }}</span>
              </div>
            </td>

            <!-- Price -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img
                  src="https://placehold.co/16x16"
                  alt="WETH"
                  class="w-4 h-4 rounded-full"
                >
                <span class="font-mono text-sm">{{ offer.price }}</span>
              </div>
            </td>

            <!-- Quantity -->
            <td class="px-4 py-3">
              <span class="text-sm">{{ offer.quantity }}</span>
            </td>

            <!-- From -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img
                  :src="offer.from.avatar"
                  :alt="offer.from.name"
                  class="w-6 h-6 rounded-full"
                >
                <span class="text-sm font-medium">{{ offer.from.name }}</span>
                <UIcon
                  v-if="offer.from.verified"
                  name="material-symbols:verified"
                  class="w-4 h-4 text-primary-500"
                />
              </div>
            </td>

            <!-- Expiry -->
            <td class="px-4 py-3">
              <span class="text-sm text-gray-400">{{ offer.expiry }}</span>
            </td>

            <!-- Action -->
            <td class="px-4 py-3">
              <button
                class="px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded text-sm font-medium transition-colors"
              >
                Accept
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="offers.length === 0" class="p-8 text-center">
      <UIcon
        name="i-heroicons-inbox-20-solid"
        class="w-12 h-12 text-gray-500 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-300 mb-2">No offers yet</h3>
      <p class="text-gray-400">
        Be the first to make an offer on this collection
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const offers = ref([
    {
      id: 1,
      type: 'Bid',
      price: '45.50 WETH',
      quantity: '1',
      from: {
        name: 'CryptoWhale',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      expiry: '2 days',
    },
    {
      id: 2,
      type: 'Bid',
      price: '42.00 WETH',
      quantity: '1',
      from: {
        name: 'NFTCollector',
        avatar: 'https://placehold.co/24x24',
        verified: false,
      },
      expiry: '5 hours',
    },
    {
      id: 3,
      type: 'Bid',
      price: '40.25 WETH',
      quantity: '1',
      from: {
        name: 'ArtLover',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      expiry: '1 day',
    },
    {
      id: 4,
      type: 'Bid',
      price: '38.75 WETH',
      quantity: '1',
      from: {
        name: 'PunkHunter',
        avatar: 'https://placehold.co/24x24',
        verified: false,
      },
      expiry: '3 days',
    },
    {
      id: 5,
      type: 'Bid',
      price: '35.00 WETH',
      quantity: '1',
      from: {
        name: 'DigitalArtist',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      expiry: '12 hours',
    },
  ])

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bid':
        return 'bg-green-500'
      case 'ask':
        return 'bg-red-500'
      case 'offer':
        return 'bg-blue-500'
      default:
        return 'bg-neutral-500'
    }
  }
</script>
