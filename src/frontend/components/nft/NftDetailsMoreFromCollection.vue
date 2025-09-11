<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-heroicons-squares-2x2-20-solid"
          class="text-primary-500"
        />
        <span class="font-bold">More from this collection</span>
        <button class="ml-2" @click="isExpanded = !isExpanded">
          <UIcon
            :name="
              isExpanded
                ? 'i-heroicons-chevron-up-20-solid'
                : 'i-heroicons-chevron-down-20-solid'
            "
            class="text-gray-400"
          />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="p-4">
      <div class="relative">
        <!-- Scrollable Container -->
        <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <div
            v-for="nft in moreNfts"
            :key="nft.id"
            class="flex-shrink-0 w-48 bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <!-- NFT Image -->
            <div
              class="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 relative"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-20 h-20 bg-blue-200 border-2 border-black relative"
                >
                  <!-- Mini Character -->
                  <div
                    class="absolute top-2 left-2 w-6 h-6 bg-yellow-600 rounded-full"
                  />
                  <div
                    class="absolute top-3 left-3 w-3 h-3 bg-green-500 rounded-full"
                  />
                  <div
                    class="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full"
                  />
                  <div
                    class="absolute top-6 left-6 w-2 h-2 bg-neutral rounded-full"
                  />
                  <div
                    class="absolute top-8 left-5 w-3 h-1 bg-neutral rounded"
                  />
                </div>
              </div>
            </div>

            <!-- NFT Info -->
            <div class="p-3">
              <div class="font-semibold text-sm mb-2">
                CryptoPunk #{{ nft.id }}
              </div>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-400">Current</span>
                  <span class="font-mono">{{ nft.currentPrice }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Last Sale</span>
                  <span class="font-mono">{{ nft.lastSale }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll Indicators -->
        <div
          class="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center opacity-50"
        >
          <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4" />
        </div>
        <div
          class="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center opacity-50"
        >
          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4" />
        </div>
      </div>

      <!-- View All Button -->
      <div class="mt-4 text-center">
        <button
          class="px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition-colors"
        >
          View All 10,000 Items
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const isExpanded = ref(false)

  const moreNfts = [
    {
      id: '6588',
      currentPrice: '52.00 ETH',
      lastSale: '48.50 ETH',
    },
    {
      id: '2486',
      currentPrice: '45.75 ETH',
      lastSale: '42.00 ETH',
    },
    {
      id: '7711',
      currentPrice: '38.90 ETH',
      lastSale: '35.25 ETH',
    },
    {
      id: '1234',
      currentPrice: '61.20 ETH',
      lastSale: '58.00 ETH',
    },
    {
      id: '5678',
      currentPrice: '29.45 ETH',
      lastSale: '27.80 ETH',
    },
    {
      id: '9012',
      currentPrice: '73.10 ETH',
      lastSale: '70.50 ETH',
    },
  ]
</script>

<style scoped>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
