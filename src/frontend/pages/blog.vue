<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Header -->
    <section class="py-20 bg-white dark:bg-neutral-950 pt-32">
      <UContainer>
        <div class="text-center">
          <h1
            class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            DeFi Insights & Token Analysis: Ionic Swap Blog
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Stay informed with the latest insights on DeFi, cross-chain
            swapping, token standards, gasless transactions, and the future of
            decentralized finance.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- Blog Posts -->
    <section class="py-20">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <UCard
            v-for="post in blogPosts"
            :key="post._path"
            class="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-neutral-950"
            @click="navigateTo(post._path)"
          >
            <!-- Post Image -->
            <div class="relative h-48 overflow-hidden">
              <img
                :src="post.image"
                :alt="`${post.title} – ${post.category} | DeFi, Cross-Chain, Token Swapping, Gasless Transactions`"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div class="absolute top-4 left-4">
                <span
                  class="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                >
                  {{ post.category }}
                </span>
              </div>
            </div>

            <!-- Post Content -->
            <div class="p-6">
              <div
                class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3"
              >
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                <span>{{ post.date }}</span>
                <UIcon name="i-heroicons-clock" class="w-4 h-4 ml-2" />
                <span>{{ post.readTime }}</span>
              </div>
              <h2
                class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
              >
                {{ post.title }}
              </h2>
              <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {{ post.description }}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="tag in post.tags"
                    :key="tag"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  >
                    {{ tag }}
                  </UBadge>
                </div>
                <UIcon
                  name="i-heroicons-arrow-right"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
  const blogPosts = [
    {
      _path: '/blog/cross-chain-swapping-guide',
      title: 'Complete Guide to Cross-Chain Token Swapping',
      description:
        "Learn how to swap tokens across different blockchain networks seamlessly with Ionic Swap's innovative cross-chain technology.",
      category: 'Tutorial',
      date: '2024-01-15',
      readTime: '8 min read',
      image: '/blog/cross-chain-swapping.jpg',
      tags: ['Cross-Chain', 'Tutorial', 'DeFi'],
    },
    {
      _path: '/blog/gasless-transactions-explained',
      title: 'Gasless Transactions: The Future of DeFi',
      description:
        "Discover how gasless transactions work and why they're revolutionizing the DeFi space by eliminating gas fees.",
      category: 'Technology',
      date: '2024-01-10',
      readTime: '6 min read',
      image: '/blog/gasless-transactions.jpg',
      tags: ['Gasless', 'Technology', 'DeFi'],
    },
    {
      _path: '/blog/token-standards-comparison',
      title: 'ERC-20 vs SPL vs ICRC: Token Standards Compared',
      description:
        'A comprehensive comparison of token standards across Ethereum, Solana, and Internet Computer networks.',
      category: 'Analysis',
      date: '2024-01-05',
      readTime: '10 min read',
      image: '/blog/token-standards.jpg',
      tags: ['Token Standards', 'Analysis', 'Blockchain'],
    },
    {
      _path: '/blog/defi-liquidity-pools',
      title: 'Understanding Liquidity Pools in DeFi',
      description:
        'Learn how liquidity pools work, their role in automated market makers, and how they enable token swapping.',
      category: 'Education',
      date: '2024-01-01',
      readTime: '7 min read',
      image: '/blog/liquidity-pools.jpg',
      tags: ['Liquidity', 'Education', 'AMM'],
    },
    {
      _path: '/blog/security-best-practices',
      title: 'DeFi Security: Best Practices for Safe Trading',
      description:
        'Essential security tips and best practices to keep your tokens safe while trading in the DeFi ecosystem.',
      category: 'Security',
      date: '2023-12-28',
      readTime: '9 min read',
      image: '/blog/security.jpg',
      tags: ['Security', 'Best Practices', 'DeFi'],
    },
    {
      _path: '/blog/ionic-swap-roadmap',
      title: "Ionic Swap Roadmap: What's Coming Next",
      description:
        "Get an exclusive look at Ionic Swap's development roadmap and upcoming features for 2024.",
      category: 'Updates',
      date: '2023-12-25',
      readTime: '5 min read',
      image: '/blog/roadmap.jpg',
      tags: ['Roadmap', 'Updates', 'Ionic Swap'],
    },
  ]

  useHead({
    title: 'DeFi Blog - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Stay informed with the latest insights on DeFi, cross-chain swapping, token standards, and gasless transactions.',
      },
      { property: 'og:title', content: 'DeFi Blog - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Stay informed with the latest insights on DeFi, cross-chain swapping, token standards, and gasless transactions.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ionicswap.com/blog' },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'DeFi Blog - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Stay informed with the latest insights on DeFi, cross-chain swapping, token standards, and gasless transactions.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://ionicswap.com/blog' }],
  })
</script>

<style scoped>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
