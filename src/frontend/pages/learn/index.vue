<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Learn DeFi
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Master the fundamentals of decentralized finance, token standards, and
          cross-chain swapping. Start your journey into the future of finance.
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-12 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-4">
            Your Gateway to DeFi Education
          </h2>
          <p class="text-lg opacity-90 mb-6">
            From basic concepts to advanced trading strategies, learn everything
            you need to know about decentralized finance and cross-chain token
            swapping.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <div
              class="flex items-center gap-2 bg-zinc-50/20 rounded-full px-4 py-2"
            >
              <UIcon name="i-heroicons-academic-cap" class="w-5 h-5" />
              <span class="text-sm font-medium">Beginner Friendly</span>
            </div>
            <div
              class="flex items-center gap-2 bg-zinc-50/20 rounded-full px-4 py-2"
            >
              <UIcon name="i-heroicons-clock" class="w-5 h-5" />
              <span class="text-sm font-medium">5-10 min reads</span>
            </div>
            <div
              class="flex items-center gap-2 bg-zinc-50/20 rounded-full px-4 py-2"
            >
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
              <span class="text-sm font-medium">Expert Reviewed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Learning Paths -->
      <div class="mb-12">
        <h2
          class="text-2xl font-bold text-zinc-900 dark:text-white mb-8 text-center"
        >
          Choose Your Learning Path
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Beginner Path -->
          <div
            class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-academic-cap"
                  class="w-6 h-6 text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                  Beginner
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Start here if you're new to DeFi
                </p>
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Learn the basics of tokens, blockchain standards, and how DeFi
              works.
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/learn/what-are-tokens"
                class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-currency-dollar"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300"
                    >What are Tokens?</span
                  >
                </div>
              </NuxtLink>
              <NuxtLink
                to="/learn/defi-basics"
                class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-banknotes"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300"
                    >DeFi Basics</span
                  >
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Intermediate Path -->
          <div
            class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-cog-6-tooth"
                  class="w-6 h-6 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                  Intermediate
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Understand the technical details
                </p>
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Dive deeper into token standards and cross-chain technology.
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/learn/token-standards"
                class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-cog-6-tooth"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300"
                    >Token Standards</span
                  >
                </div>
              </NuxtLink>
              <NuxtLink
                to="/learn/cross-chain-swapping"
                class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300"
                    >Cross-Chain Swapping</span
                  >
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Advanced Path -->
          <div
            class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-bolt"
                  class="w-6 h-6 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                  Advanced
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Master cutting-edge features
                </p>
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Learn about gasless transactions and advanced DeFi concepts.
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/learn/gasless-transactions"
                class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-bolt"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300"
                    >Gasless Transactions</span
                  >
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- All Articles Grid -->
      <div class="mb-12">
        <h2
          class="text-2xl font-bold text-zinc-900 dark:text-white mb-8 text-center"
        >
          All Articles
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="article in articles"
            :key="article.slug"
            :to="`/learn/${article.slug}`"
            class="group bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="`bg-${currentTheme}-100 dark:bg-${currentTheme}-900`"
              >
                <UIcon
                  :name="article.icon"
                  :class="`w-6 h-6 text-${currentTheme}-600 dark:text-${currentTheme}-400`"
                />
              </div>
              <div class="flex-1">
                <h3
                  class="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                >
                  {{ article.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ article.difficulty }}
                </p>
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {{ article.description }}
            </p>
            <div class="flex items-center justify-between">
              <div
                class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
              >
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                <span>{{ article.readTime }}</span>
              </div>
              <UIcon
                name="i-heroicons-arrow-right"
                class="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center">
        <div
          class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700"
        >
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Ready to Start Swapping?
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Now that you understand the basics, try swapping tokens across
            different blockchain networks with our gasless transaction system.
          </p>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            :class="`bg-${currentTheme}-600 hover:bg-${currentTheme}-700`"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
            Start Swapping
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useColorTheme } from '@/composables/useColorTheme'

  const { currentTheme } = useColorTheme()

  const articles = [
    {
      slug: 'what-are-tokens',
      title: 'What are Tokens?',
      description:
        'Learn about different types of tokens, their standards, and how they work across blockchains.',
      icon: 'i-heroicons-currency-dollar',
      difficulty: 'Beginner',
      readTime: '5 min read',
    },
    {
      slug: 'defi-basics',
      title: 'DeFi Basics',
      description:
        'Get started with DeFi concepts, liquidity, and decentralized trading protocols.',
      icon: 'i-heroicons-banknotes',
      difficulty: 'Beginner',
      readTime: '8 min read',
    },
    {
      slug: 'token-standards',
      title: 'Token Standards',
      description:
        'Explore the different token standards used on Ethereum, Solana, and Internet Computer.',
      icon: 'i-heroicons-cog-6-tooth',
      difficulty: 'Intermediate',
      readTime: '10 min read',
    },
    {
      slug: 'cross-chain-swapping',
      title: 'Cross-Chain Swapping',
      description:
        'Discover how to swap tokens between different blockchains seamlessly and securely.',
      icon: 'i-heroicons-arrow-path',
      difficulty: 'Intermediate',
      readTime: '7 min read',
    },
    {
      slug: 'gasless-transactions',
      title: 'Gasless Transactions',
      description:
        'Learn about gasless transaction technology and how it makes swapping more accessible.',
      icon: 'i-heroicons-bolt',
      difficulty: 'Advanced',
      readTime: '9 min read',
    },
  ]

  useHead({
    title: 'Learn DeFi - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Master the fundamentals of decentralized finance, token standards, and cross-chain swapping. Start your DeFi journey today.',
      },
      { property: 'og:title', content: 'Learn DeFi - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Master the fundamentals of decentralized finance, token standards, and cross-chain swapping. Start your DeFi journey today.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ionicswap.com/learn' },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Learn DeFi - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Master the fundamentals of decentralized finance, token standards, and cross-chain swapping. Start your DeFi journey today.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://ionicswap.com/learn' }],
  })
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
