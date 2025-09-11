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
                  >Token Standards</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Token Standards
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Understanding ERC-20, SPL, and ICRC token standards
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-8 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">Blockchain Token Standards</h2>
          <p class="text-lg opacity-90">
            Token standards define the rules and functionality for digital
            assets on different blockchain networks. Each standard ensures
            interoperability and consistency across the ecosystem.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- ERC-20 Standard -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-cog-6-tooth"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                ERC-20
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                Ethereum Request for Comments 20
              </p>
            </div>
          </div>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              ERC-20 is the most widely adopted token standard on the Ethereum
              blockchain. It defines a common set of rules that all Ethereum
              tokens must follow.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Key Features
            </h3>
            <ul
              class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6"
            >
              <li><strong>Transfer:</strong> Move tokens between addresses</li>
              <li>
                <strong>Balance:</strong> Check token balance of any address
              </li>
              <li>
                <strong>Approval:</strong> Allow third parties to spend tokens
              </li>
              <li>
                <strong>Total Supply:</strong> Fixed or dynamic token supply
              </li>
              <li>
                <strong>Decimals:</strong> Specify token precision (usually 18)
              </li>
            </ul>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Popular ERC-20 Tokens
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  USDC
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  USD Coin - Stablecoin
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  USDT
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Tether - Stablecoin
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  LINK
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Chainlink - Oracle
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- SPL Standard -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-cog-6-tooth"
                class="w-6 h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                SPL
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                Solana Program Library
              </p>
            </div>
          </div>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              SPL tokens are the standard for fungible tokens on the Solana
              blockchain. They leverage Solana's high-speed, low-cost
              architecture.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Key Features
            </h3>
            <ul
              class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6"
            >
              <li>
                <strong>Fast Transactions:</strong> Sub-second confirmation
                times
              </li>
              <li>
                <strong>Low Fees:</strong> Fraction of a penny per transaction
              </li>
              <li>
                <strong>Scalable:</strong> Thousands of transactions per second
              </li>
              <li><strong>Programmable:</strong> Custom token logic support</li>
              <li>
                <strong>Interoperable:</strong> Works with all Solana programs
              </li>
            </ul>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Popular SPL Tokens
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">SOL</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Solana - Native token
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  USDC
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  USD Coin - Stablecoin
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">RAY</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Raydium - DEX token
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ICRC Standard -->
        <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-cog-6-tooth"
                class="w-6 h-6 text-cyan-600 dark:text-cyan-400"
              />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                ICRC
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                Internet Computer Request for Comments
              </p>
            </div>
          </div>

          <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              ICRC is the token standard for the Internet Computer blockchain.
              It provides a unified interface for fungible tokens with enhanced
              security and governance.
            </p>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Key Features
            </h3>
            <ul
              class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6"
            >
              <li>
                <strong>Canister-based:</strong> Tokens run as smart contracts
                (canisters)
              </li>
              <li>
                <strong>Governance:</strong> Built-in governance mechanisms
              </li>
              <li><strong>Metadata:</strong> Rich token metadata support</li>
              <li>
                <strong>Standards:</strong> ICRC-1 (fungible), ICRC-2 (approval)
              </li>
              <li>
                <strong>Interoperable:</strong> Works across Internet Computer
                ecosystem
              </li>
            </ul>

            <h3
              class="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
            >
              Popular ICRC Tokens
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">ICP</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Internet Computer - Native token
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">SNS</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Service Nervous System tokens
                </p>
              </div>
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  ckBTC
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Chain-key Bitcoin
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
    title: 'Token Standards - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Learn about ERC-20, SPL, and ICRC token standards used across different blockchain networks.',
      },
      { property: 'og:title', content: 'Token Standards - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Learn about ERC-20, SPL, and ICRC token standards used across different blockchain networks.',
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:url',
        content: 'https://ionicswap.com/learn/token-standards',
      },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Token Standards - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Learn about ERC-20, SPL, and ICRC token standards used across different blockchain networks.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [
      { rel: 'canonical', href: 'https://ionicswap.com/learn/token-standards' },
    ],
  })
</script>
