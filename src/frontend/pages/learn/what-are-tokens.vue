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
                  >What are Tokens?</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          What are Tokens?
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          A comprehensive guide to digital tokens and blockchain standards
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="rounded-lg p-8 mb-8 text-white"
        :class="`bg-gradient-to-r from-${currentTheme}-600 to-${currentTheme}-800`"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">
            Understanding Digital Tokens
          </h2>
          <p class="text-lg opacity-90">
            Tokens are digital assets that represent value or utility on blockchain networks. 
            They enable decentralized applications, cross-chain interoperability, and new forms of digital economy.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Article -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-8">
            <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              What are Digital Tokens?
            </h2>
            
            <div class="prose prose-lg dark:prose-invert max-w-none">
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Digital tokens are programmable digital assets that exist on blockchain networks. 
                They can represent various forms of value, from currencies and commodities to 
                access rights and governance power.
              </p>

              <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Key Characteristics
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                <li><strong>Fungible:</strong> Each token is identical and interchangeable</li>
                <li><strong>Programmable:</strong> Smart contracts define token behavior</li>
                <li><strong>Decentralized:</strong> No single entity controls the network</li>
                <li><strong>Transparent:</strong> All transactions are publicly verifiable</li>
                <li><strong>Borderless:</strong> Global accessibility without intermediaries</li>
              </ul>

              <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Types of Tokens
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Utility Tokens</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Provide access to services or products within a specific ecosystem
                  </p>
                </div>
                <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Payment Tokens</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Used as digital currency for transactions and value transfer
                  </p>
                </div>
                <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Governance Tokens</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Enable holders to participate in protocol decision-making
                  </p>
                </div>
                <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Stablecoins</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Maintain stable value pegged to fiat currencies or commodities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Token Standards -->
          <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Token Standards
            </h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">ERC-20</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Ethereum standard for fungible tokens</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">SPL</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Solana Program Library tokens</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">ICRC</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Internet Computer token standard</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Learn More
            </h3>
            <div class="space-y-3">
              <NuxtLink
                to="/learn/token-standards"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span class="text-gray-700 dark:text-gray-300">Token Standards</span>
              </NuxtLink>
              <NuxtLink
                to="/learn/cross-chain-swapping"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span class="text-gray-700 dark:text-gray-300">Cross-Chain Swapping</span>
              </NuxtLink>
              <NuxtLink
                to="/learn/gasless-transactions"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span class="text-gray-700 dark:text-gray-300">Gasless Transactions</span>
              </NuxtLink>
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
  title: 'What are Tokens? - Ionic Swap',
  meta: [
    {
      name: 'description',
      content: 'Learn about digital tokens, blockchain standards, and how they work across different networks.',
    },
    { property: 'og:title', content: 'What are Tokens? - Ionic Swap' },
    {
      property: 'og:description',
      content: 'Learn about digital tokens, blockchain standards, and how they work across different networks.',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: 'https://ionicswap.com/learn/what-are-tokens' },
    { property: 'og:image', content: '/logo.svg' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'What are Tokens? - Ionic Swap' },
    {
      name: 'twitter:description',
      content: 'Learn about digital tokens, blockchain standards, and how they work across different networks.',
    },
    { name: 'twitter:image', content: '/logo.svg' },
  ],
  link: [{ rel: 'canonical', href: 'https://ionicswap.com/learn/what-are-tokens' }],
})
</script>