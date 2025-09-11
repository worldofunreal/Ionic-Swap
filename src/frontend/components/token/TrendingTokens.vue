<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <UIcon name="i-heroicons-fire" class="w-6 h-6 text-orange-500" />
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Trending Tokens
        </h2>
      </div>
      <UButton variant="outline" color="neutral" size="sm" class="shadow-sm">
        View All
      </UButton>
    </div>

    <!-- Token Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="token in trendingTokens"
        :key="token.name"
        class="bg-white dark:bg-neutral-900 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
            >
              {{ token.symbol }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">
                {{ token.name }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ token.symbol }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold text-gray-900 dark:text-white">
              ${{ token.price }}
            </div>
            <div
              class="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1"
            >
              <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
              <span>{{ token.change }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const trendingTokens = ref([
    {
      name: 'Definitive EDGE',
      symbol: 'D',
      price: '0.1794',
      change: '110.5%',
    },
    {
      name: 'Zircuit ZRC',
      symbol: 'Z',
      price: '0.1794',
      change: '63.4%',
    },
    {
      name: 'Stader SD',
      symbol: 'S',
      price: '0.1794',
      change: '48.5%',
    },
    {
      name: 'LETSTOP STOP',
      symbol: 'L',
      price: '0.1794',
      change: '45.9%',
    },
    {
      name: 'Talos T',
      symbol: 'T',
      price: '0.1794',
      change: '45.1%',
    },
    {
      name: 'HOPR HOPR',
      symbol: 'H',
      price: '0.1794',
      change: '39.8%',
    },
  ])
</script>
