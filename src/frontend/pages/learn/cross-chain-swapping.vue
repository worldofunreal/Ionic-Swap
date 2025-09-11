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
                  >Cross-Chain Swapping</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Cross-Chain Swapping
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Swap tokens seamlessly across different blockchain networks
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-8 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">
            Bridge the Gap Between Blockchains
          </h2>
          <p class="text-lg opacity-90">
            Cross-chain swapping allows you to exchange tokens between different
            blockchain networks without the need for centralized exchanges or
            complex bridging processes.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- How It Works -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            How Cross-Chain Swapping Works
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="text-center">
              <div
                class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                1. Select Tokens
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Choose the token you want to swap from and the token you want to
                receive
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-cog-6-tooth"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                2. Smart Routing
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Our system finds the best route across multiple chains and
                liquidity pools
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-check-circle"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                3. Execute Swap
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Complete the swap with gasless transactions and receive your
                tokens
              </p>
            </div>
          </div>
        </div>

        <!-- Supported Chains -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Supported Blockchain Networks
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- EVM Chains -->
            <div
              class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-cog-6-tooth"
                    class="w-5 h-5 text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    EVM Chains
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ethereum-compatible networks
                  </p>
                </div>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Ethereum (ETH)</li>
                <li>• Polygon (MATIC)</li>
                <li>• BSC (BNB)</li>
                <li>• Arbitrum (ARB)</li>
                <li>• Optimism (OP)</li>
              </ul>
            </div>

            <!-- Solana -->
            <div
              class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-cog-6-tooth"
                    class="w-5 h-5 text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    Solana
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    High-speed blockchain
                  </p>
                </div>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Solana (SOL)</li>
                <li>• USDC (SPL)</li>
                <li>• Raydium (RAY)</li>
                <li>• Serum (SRM)</li>
                <li>• Jupiter (JUP)</li>
              </ul>
            </div>

            <!-- Internet Computer -->
            <div
              class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-cog-6-tooth"
                    class="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    Internet Computer
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Web3 infrastructure
                  </p>
                </div>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• ICP (Native)</li>
                <li>• ckBTC</li>
                <li>• ckETH</li>
                <li>• SNS Tokens</li>
                <li>• Dfinity (DFN)</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Benefits -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Benefits of Cross-Chain Swapping
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-bolt"
                  class="w-4 h-4 text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Gasless Transactions
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Swap tokens without paying gas fees using our innovative
                  permit system
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Best Rates
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Get the best exchange rates by comparing multiple liquidity
                  sources
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-shield-check"
                  class="w-4 h-4 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Secure
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Non-custodial swaps with smart contract security and audit
                  verification
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-clock"
                  class="w-4 h-4 text-orange-600 dark:text-orange-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Fast
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Quick settlement times with optimized routing across multiple
                  chains
                </p>
              </div>
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
    title: 'Cross-Chain Swapping - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Learn how to swap tokens across different blockchain networks with gasless transactions.',
      },
      { property: 'og:title', content: 'Cross-Chain Swapping - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Learn how to swap tokens across different blockchain networks with gasless transactions.',
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:url',
        content: 'https://ionicswap.com/learn/cross-chain-swapping',
      },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Cross-Chain Swapping - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Learn how to swap tokens across different blockchain networks with gasless transactions.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [
      {
        rel: 'canonical',
        href: 'https://ionicswap.com/learn/cross-chain-swapping',
      },
    ],
  })
</script>
