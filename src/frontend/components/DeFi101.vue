<template>
  <div>
    <div class="mb-2">
      <h2 class="text-lg font-bold">DeFi 101</h2>
      <div class="text-xs text-gray-500">Learn about tokens, standards, and cross-chain swapping</div>
    </div>
    <div class="relative">
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
      <div
        ref="scrollRef"
        class="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style="scroll-snap-type: x mandatory"
      >
        <NuxtLink
          v-for="article in articles"
          :key="article.slug"
          :to="`/learn/${article.slug}`"
          class="min-w-[220px] max-w-xs bg-white dark:bg-neutral-950 rounded-xl shadow p-4 flex flex-col gap-2 hover:scale-105 transition-transform cursor-pointer"
          style="scroll-snap-align: start"
        >
          <!-- Article Icon with dynamic color -->
          <div class="flex items-center gap-3 mb-2">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="`bg-${currentTheme}-100 dark:bg-${currentTheme}-900`"
            >
              <UIcon 
                :name="article.icon" 
                :class="`w-5 h-5 text-${currentTheme}-600 dark:text-${currentTheme}-400`"
              />
            </div>
            <div class="flex-1">
              <div class="font-bold text-base mb-1">{{ article.title }}</div>
              <div class="text-xs text-gray-500">{{ article.subtitle }}</div>
            </div>
          </div>
          
          <!-- Article Description -->
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {{ article.description }}
          </div>
          
          <!-- Learn More Link -->
          <div
            class="mt-auto text-primary-600 text-xs font-semibold flex items-center gap-1"
          >
            Learn More
            <UIcon name="i-heroicons-arrow-right-20-solid" class="text-xs" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useColorTheme } from '@/composables/useColorTheme'

const { currentTheme } = useColorTheme()

const articles = [
  {
    slug: 'what-are-tokens',
    title: 'What are Tokens?',
    subtitle: 'Understanding digital assets',
    description: 'Learn about different types of tokens, their standards, and how they work across blockchains.',
    icon: 'i-heroicons-currency-dollar'
  },
  {
    slug: 'token-standards',
    title: 'Token Standards',
    subtitle: 'ERC-20, SPL, ICRC explained',
    description: 'Explore the different token standards used on Ethereum, Solana, and Internet Computer.',
    icon: 'i-heroicons-cog-6-tooth'
  },
  {
    slug: 'cross-chain-swapping',
    title: 'Cross-Chain Swapping',
    subtitle: 'Swap tokens across blockchains',
    description: 'Discover how to swap tokens between different blockchains seamlessly and securely.',
    icon: 'i-heroicons-arrow-path'
  },
  {
    slug: 'gasless-transactions',
    title: 'Gasless Transactions',
    subtitle: 'Swap without gas fees',
    description: 'Learn about gasless transaction technology and how it makes swapping more accessible.',
    icon: 'i-heroicons-bolt'
  },
  {
    slug: 'defi-basics',
    title: 'DeFi Basics',
    subtitle: 'Decentralized Finance 101',
    description: 'Get started with DeFi concepts, liquidity, and decentralized trading protocols.',
    icon: 'i-heroicons-banknotes'
  }
]

const scrollRef = ref<HTMLElement>()

const scrollLeft = () => {
  if (scrollRef.value) {
    scrollRef.value.scrollBy({ left: -240, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (scrollRef.value) {
    scrollRef.value.scrollBy({ left: 240, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>