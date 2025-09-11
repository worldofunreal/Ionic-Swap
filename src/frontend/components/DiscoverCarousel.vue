<template>
  <div class="relative w-full">
    <!-- Navigation Buttons -->
    <button
      class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 p-0 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
      style="transform: translateY(-50%)"
      @click="scrollLeft"
    >
      <UIcon name="i-heroicons-chevron-left-20-solid" class="text-base" />
    </button>
    <button
      class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 p-0 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
      style="transform: translateY(-50%)"
      @click="scrollRight"
    >
      <UIcon name="i-heroicons-chevron-right-20-solid" class="text-base" />
    </button>

    <!-- Carousel -->
    <div
      ref="scrollRef"
      class="relative w-full overflow-x-auto scrollbar-hide"
      style="scroll-snap-type: x mandatory; scroll-behavior: smooth"
    >
      <div class="flex mt-1 gap-6 min-w-full">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="w-full flex-shrink-0 bg-white dark:bg-neutral-950 rounded-2xl shadow flex flex-col"
          style="scroll-snap-align: start; min-width: 100%; max-width: 100%"
        >
          <!-- Feature Content -->
          <div
            class="w-full rounded-xl overflow-hidden relative p-8"
            style="height: 360px"
          >
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
              <div
                class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700"
              />
            </div>

            <!-- Content -->
            <div class="relative z-10 h-full flex flex-col justify-between">
              <!-- Top Section -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center"
                  >
                    <UIcon
                      :name="feature.icon"
                      class="w-6 h-6 text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                      {{ feature.title }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ feature.subtitle }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl font-bold text-primary-600 dark:text-primary-400"
                  >
                    {{ feature.stat }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ feature.statLabel }}
                  </div>
                </div>
              </div>

              <!-- Middle Section -->
              <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                  <div
                    class="text-4xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    {{ feature.mainValue }}
                  </div>
                  <div class="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {{ feature.mainLabel }}
                  </div>
                  <div class="flex items-center justify-center gap-4">
                    <div
                      v-for="chain in feature.chains"
                      :key="chain"
                      class="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      <div
                        class="w-2 h-2 rounded-full"
                        :class="getChainColor(chain)"
                      />
                      <span
                        class="text-xs font-medium text-gray-700 dark:text-gray-300"
                        >{{ chain }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom Section -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-arrow-trending-up"
                    class="w-4 h-4 text-green-500"
                  />
                  <span
                    class="text-sm text-green-600 dark:text-green-400 font-medium"
                    >{{ feature.change }}</span
                  >
                </div>
                <UButton
                  :color="feature.buttonColor"
                  size="sm"
                  :icon="feature.buttonIcon"
                  @click="handleFeatureClick(feature)"
                >
                  {{ feature.buttonText }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  interface Feature {
    id: string
    title: string
    subtitle: string
    icon: string
    stat: string
    statLabel: string
    mainValue: string
    mainLabel: string
    chains: string[]
    change: string
    buttonText: string
    buttonIcon: string
    buttonColor: string
  }

  const scrollRef = ref<HTMLElement>()

  // Swap-focused features
  const features = ref<Feature[]>([
    {
      id: '1',
      title: 'Cross-Chain Swaps',
      subtitle: 'Seamless token swapping across multiple blockchains',
      icon: 'i-heroicons-arrow-path',
      stat: '11',
      statLabel: 'Supported Tokens',
      mainValue: '$2.4M',
      mainLabel: 'Total Volume (24h)',
      chains: ['EVM', 'Solana', 'ICP'],
      change: '+12.5%',
      buttonText: 'Start Swapping',
      buttonIcon: 'i-heroicons-arrow-right',
      buttonColor: 'primary',
    },
    {
      id: '2',
      title: 'Gasless Transactions',
      subtitle: 'Swap tokens without paying gas fees',
      icon: 'i-heroicons-bolt',
      stat: '98%',
      statLabel: 'Gasless Success Rate',
      mainValue: '1,247',
      mainLabel: 'Gasless Swaps Today',
      chains: ['EVM', 'Solana', 'ICP'],
      change: '+8.3%',
      buttonText: 'Learn More',
      buttonIcon: 'i-heroicons-information-circle',
      buttonColor: 'green',
    },
    {
      id: '3',
      title: 'Real-Time Prices',
      subtitle: 'Live price feeds from multiple sources',
      icon: 'i-heroicons-chart-bar',
      stat: '0.1%',
      statLabel: 'Average Slippage',
      mainValue: '24/7',
      mainLabel: 'Price Updates',
      chains: ['EVM', 'Solana', 'ICP'],
      change: '+2.1%',
      buttonText: 'View Markets',
      buttonIcon: 'i-heroicons-eye',
      buttonColor: 'blue',
    },
  ])

  const getChainColor = (chain: string): string => {
    const colors = {
      EVM: 'bg-blue-500',
      Solana: 'bg-purple-500',
      ICP: 'bg-cyan-500',
    }
    return colors[chain as keyof typeof colors] || 'bg-gray-500'
  }

  const scrollLeft = () => {
    if (scrollRef.value) {
      scrollRef.value.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.value) {
      scrollRef.value.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const handleFeatureClick = (feature: Feature) => {
    console.log('Feature clicked:', feature.title)
    // TODO: Implement feature-specific actions
    switch (feature.id) {
      case '1':
        // Navigate to swap interface
        break
      case '2':
        // Show gasless info modal
        break
      case '3':
        // Navigate to markets
        break
    }
  }

  onMounted(() => {
    // Auto-scroll functionality could be added here
  })
</script>

<style scoped>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
