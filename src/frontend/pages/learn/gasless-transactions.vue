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
                  >Gasless Transactions</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Gasless Transactions
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Swap tokens without paying gas fees using innovative permit technology
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-8 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">
            Zero Gas Fees, Maximum Convenience
          </h2>
          <p class="text-lg opacity-90">
            Our gasless transaction system eliminates the need to pay gas fees
            while maintaining full security and decentralization. Experience
            seamless token swapping without the friction.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- How Gasless Works -->
        <div class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            How Gasless Transactions Work
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="text-center">
              <div
                class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-pencil-square"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                1. Sign Permit
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Sign a cryptographic permit that authorizes the transaction
                without paying gas
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-server"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                2. Submit Transaction
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Our system submits the transaction to the blockchain using the
                signed permit
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
                3. Transaction Complete
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Receive your swapped tokens without ever paying gas fees
              </p>
            </div>
          </div>
        </div>

        <!-- Permit Technology -->
        <div class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Permit Technology Explained
          </h2>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Permits are cryptographic signatures that allow smart contracts to
              execute transactions on behalf of users without requiring them to
              pay gas fees. This technology is based on the EIP-2612 standard
              for Ethereum and similar implementations on other chains.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Key Components
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Digital Signature
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  A cryptographic signature that proves you authorize the
                  transaction without revealing your private key.
                </p>
                <div
                  class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                >
                  0x1234...5678
                </div>
              </div>
              <div
                class="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Transaction Data
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Contains all the necessary information about the swap
                  including amounts, tokens, and deadlines.
                </p>
                <div
                  class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                >
                  { amount: 100, token: "USDT", deadline: 1234567890 }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Supported Chains -->
        <div class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Gasless Support Across Chains
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
                    EIP-2612 Standard
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
                    SPL Token Permits
                  </p>
                </div>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Native SPL tokens</li>
                <li>• USDT (SPL)</li>
                <li>• Custom SPL tokens</li>
                <li>• Wrapped tokens</li>
                <li>• Liquidity tokens</li>
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
                    ICRC Permits
                  </p>
                </div>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• ICP (Native)</li>
                <li>• ckBTC</li>
                <li>• ckETH</li>
                <li>• SNS tokens</li>
                <li>• ICRC-1 tokens</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Benefits -->
        <div class="bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Benefits of Gasless Transactions
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-currency-dollar"
                  class="w-4 h-4 text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Cost Savings
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Eliminate gas fees completely, saving money on every
                  transaction
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-users"
                  class="w-4 h-4 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Accessibility
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Make DeFi accessible to users who don't have native tokens for
                  gas
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
                  Security
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Maintain full security with cryptographic signatures and smart
                  contract verification
                </p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div
                class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-sparkles"
                  class="w-4 h-4 text-orange-600 dark:text-orange-400"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                  User Experience
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Seamless experience without worrying about gas price
                  fluctuations
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
    title: 'Gasless Transactions - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Learn about gasless transactions and how to swap tokens without paying gas fees.',
      },
      { property: 'og:title', content: 'Gasless Transactions - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Learn about gasless transactions and how to swap tokens without paying gas fees.',
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:url',
        content: 'https://ionicswap.com/learn/gasless-transactions',
      },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Gasless Transactions - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Learn about gasless transactions and how to swap tokens without paying gas fees.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [
      {
        rel: 'canonical',
        href: 'https://ionicswap.com/learn/gasless-transactions',
      },
    ],
  })
</script>
