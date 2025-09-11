<template>
  <div>
    <div class="mb-2">
      <h2 class="text-lg font-bold">NFT 101</h2>
      <div class="text-xs text-gray-500">Learn about NFTs, Web3 and more</div>
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
          <div class="font-bold text-base mb-1">{{ article.title }}</div>
          <div class="text-xs text-gray-500 mb-2">{{ article.subtitle }}</div>
          <div
            class="mb-12 mt-auto text-primary-600 text-xs font-semibold flex items-center gap-1"
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
  const articles = [
    {
      slug: 'what-is-an-nft',
      title: 'What is an NFT?',
      subtitle: 'A beginner’s guide to non-fungible tokens.',
    },
    {
      slug: 'how-to-mint-nft',
      title: 'How to Mint an NFT',
      subtitle: 'Step-by-step guide to creating your first NFT.',
    },
    {
      slug: 'web3-basics',
      title: 'Web3 Basics',
      subtitle: 'Understanding the decentralized web.',
    },
    {
      slug: 'nft-marketplaces',
      title: 'NFT Marketplaces',
      subtitle: 'Where to buy, sell, and trade NFTs.',
    },
    {
      slug: 'crypto-wallets',
      title: 'Crypto Wallets',
      subtitle: 'How to store and manage your NFTs.',
    },
  ]
  const scrollRef = ref(null)
  function scrollLeft() {
    if (scrollRef.value)
      (scrollRef.value as HTMLElement).scrollBy({
        left: -250,
        behavior: 'smooth',
      })
  }
  function scrollRight() {
    if (scrollRef.value)
      (scrollRef.value as HTMLElement).scrollBy({
        left: 250,
        behavior: 'smooth',
      })
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
</style>
