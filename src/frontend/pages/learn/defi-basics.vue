<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <nav class="flex mb-6" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <NuxtLink
                to="/learn"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Learn
              </NuxtLink>
            </li>
            <li>
              <div class="flex items-center">
                <svg
                  class="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="ml-1 text-gray-500 md:ml-2 dark:text-gray-400"
                  >DeFi Basics</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          DeFi Basics
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Introduction to Decentralized Finance and trading protocols
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-8 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">
            Welcome to Decentralized Finance
          </h2>
          <p class="text-lg opacity-90">
            DeFi represents a new paradigm in finance, where traditional
            financial services are recreated on blockchain networks without
            intermediaries.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- What is DeFi -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            What is Decentralized Finance (DeFi)?
          </h2>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              DeFi is a financial system built on blockchain technology that
              operates without traditional financial intermediaries like banks,
              brokers, or exchanges. It uses smart contracts to create financial
              instruments and services.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Key Principles
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Decentralization
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  No single entity controls the system. Decisions are made
                  through consensus mechanisms.
                </p>
              </div>
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Transparency
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  All transactions and smart contract code are publicly
                  verifiable on the blockchain.
                </p>
              </div>
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Permissionless
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Anyone can access DeFi services without approval from
                  centralized authorities.
                </p>
              </div>
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Interoperability
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Different DeFi protocols can work together to create complex
                  financial products.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- DeFi Services -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Common DeFi Services
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Decentralized Exchanges (DEXs)
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Trade tokens directly with other users without intermediaries
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-banknotes"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Lending & Borrowing
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Earn interest on deposits or borrow against collateral
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-chart-bar"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Yield Farming
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Provide liquidity to earn rewards and trading fees
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-shield-check"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Insurance
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Protect against smart contract risks and protocol failures
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Liquidity and AMMs -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Liquidity and Automated Market Makers (AMMs)
          </h2>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Liquidity is the lifeblood of DeFi. Automated Market Makers (AMMs)
              use mathematical formulas to determine token prices based on
              supply and demand in liquidity pools.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              How AMMs Work
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div
                  class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-users"
                    class="w-8 h-8 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Liquidity Providers
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Users deposit token pairs into pools to earn trading fees
                </p>
              </div>
              <div class="text-center">
                <div
                  class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-calculator"
                    class="w-8 h-8 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Price Discovery
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  AMM algorithms automatically calculate token prices based on
                  pool ratios
                </p>
              </div>
              <div class="text-center">
                <div
                  class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="w-8 h-8 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Trading
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Users swap tokens directly with the pool, paying fees to
                  liquidity providers
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Risks and Considerations -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Risks and Considerations
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              class="p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
            >
              <h3 class="font-semibold text-red-900 dark:text-red-400 mb-3">
                Smart Contract Risk
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300">
                Bugs in smart contracts can lead to loss of funds. Always use
                audited protocols.
              </p>
            </div>
            <div
              class="p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
            >
              <h3
                class="font-semibold text-yellow-900 dark:text-yellow-400 mb-3"
              >
                Impermanent Loss
              </h3>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Providing liquidity can result in losses if token prices change
                significantly.
              </p>
            </div>
            <div
              class="p-6 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
            >
              <h3
                class="font-semibold text-orange-900 dark:text-orange-400 mb-3"
              >
                Market Risk
              </h3>
              <p class="text-sm text-orange-700 dark:text-orange-300">
                Cryptocurrency markets are highly volatile and can experience
                rapid price changes.
              </p>
            </div>
            <div
              class="p-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
            >
              <h3 class="font-semibold text-blue-900 dark:text-blue-400 mb-3">
                Regulatory Risk
              </h3>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                DeFi regulations are still evolving and may impact protocol
                operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useColorTheme } from '@/composables/useColorTheme'

  const { currentTheme } = useColorTheme()

  useHead({
    title: 'DeFi Basics - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Learn the fundamentals of Decentralized Finance, including DEXs, liquidity, and AMMs.',
      },
      { property: 'og:title', content: 'DeFi Basics - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Learn the fundamentals of Decentralized Finance, including DEXs, liquidity, and AMMs.',
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:url',
        content: 'https://ionicswap.com/learn/defi-basics',
      },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'DeFi Basics - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Learn the fundamentals of Decentralized Finance, including DEXs, liquidity, and AMMs.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [
      { rel: 'canonical', href: 'https://ionicswap.com/learn/defi-basics' },
    ],
  })
</script>
