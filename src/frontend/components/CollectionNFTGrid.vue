<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
  >
    <div
      v-for="nft in nfts"
      :key="nft.id"
      class="bg-white dark:bg-neutral-950 rounded-xl shadow p-3 flex flex-col gap-2 hover:scale-105 transition-transform cursor-pointer"
    >
      <div class="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden mb-1">
        <img
          :src="nft.image"
          :alt="nft.name"
          class="object-cover w-full h-full"
        >
      </div>
      <div class="font-bold text-base">{{ nft.name }}</div>
      <div class="flex items-center gap-2 text-xs">
        <span class="text-gray-500">Price:</span>
        <span class="font-bold">{{ nft.price }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="text-gray-500">Last Sale:</span>
        <span>{{ nft.lastSale }}</span>
      </div>
      <div class="text-xs text-gray-400">Token ID: {{ nft.tokenId }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
  const nfts = [
    {
      id: 1,
      name: 'WANT_3',
      image: 'https://placehold.co/300x300',
      price: '0.0792 ETH',
      lastSale: '0.07 ETH',
      tokenId: '123',
    },
    {
      id: 2,
      name: 'WANT_4',
      image: 'https://placehold.co/300x300',
      price: '0.0810 ETH',
      lastSale: '0.08 ETH',
      tokenId: '124',
    },
    {
      id: 3,
      name: 'WANT_5',
      image: 'https://placehold.co/300x300',
      price: '0.0750 ETH',
      lastSale: '0.075 ETH',
      tokenId: '125',
    },
    {
      id: 4,
      name: 'WANT_6',
      image: 'https://placehold.co/300x300',
      price: '0.0900 ETH',
      lastSale: '0.09 ETH',
      tokenId: '126',
    },
    {
      id: 5,
      name: 'WANT_7',
      image: 'https://placehold.co/300x300',
      price: '0.0850 ETH',
      lastSale: '0.085 ETH',
      tokenId: '127',
    },
    {
      id: 6,
      name: 'WANT_8',
      image: 'https://placehold.co/300x300',
      price: '0.0800 ETH',
      lastSale: '0.08 ETH',
      tokenId: '128',
    },
    {
      id: 7,
      name: 'WANT_9',
      image: 'https://placehold.co/300x300',
      price: '0.0820 ETH',
      lastSale: '0.082 ETH',
      tokenId: '129',
    },
    {
      id: 8,
      name: 'WANT_10',
      image: 'https://placehold.co/300x300',
      price: '0.0780 ETH',
      lastSale: '0.078 ETH',
      tokenId: '130',
    },
  ]
</script>
<style scoped>
  .aspect-w-1 {
    aspect-ratio: 1/1;
  }
</style>
