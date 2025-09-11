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
                  >What is an NFT?</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          What is an NFT?
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          A comprehensive guide to Non-Fungible Tokens
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">
            Understanding NFTs in Simple Terms
          </h2>
          <p class="text-lg mb-6">
            NFTs (Non-Fungible Tokens) are unique digital assets that represent
            ownership of a specific item on the blockchain. Unlike
            cryptocurrencies, each NFT is one-of-a-kind and cannot be exchanged
            for another identical item.
          </p>
          <div class="flex flex-wrap gap-4">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Unique</div>
              <div class="text-sm">Each NFT is distinct</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Verifiable</div>
              <div class="text-sm">Ownership is provable</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Tradeable</div>
              <div class="text-sm">Buy, sell, and trade</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- What Makes NFTs Special -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What Makes NFTs Special?
            </h3>
            <div class="space-y-4">
              <div class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                >
                  <span
                    class="text-blue-600 dark:text-blue-400 font-bold text-sm"
                    >1</span
                  >
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Uniqueness
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    Each NFT has a unique identifier that distinguishes it from
                    all other tokens. This makes them perfect for representing
                    one-of-a-kind digital items.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                >
                  <span
                    class="text-blue-600 dark:text-blue-400 font-bold text-sm"
                    >2</span
                  >
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Indivisibility
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    NFTs cannot be divided into smaller parts. You either own
                    the entire NFT or you don't own it at all.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                >
                  <span
                    class="text-blue-600 dark:text-blue-400 font-bold text-sm"
                    >3</span
                  >
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Verifiable Ownership
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    Blockchain technology ensures that ownership is transparent
                    and verifiable. Anyone can see who owns a specific NFT.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- How NFTs Work -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How Do NFTs Work?
            </h3>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    1. Creation (Minting)
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    An artist or creator uploads their digital asset to the
                    blockchain, creating a unique token with metadata.
                  </p>
                </div>
                <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    2. Storage
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    The NFT is stored on the blockchain with a unique identifier
                    and ownership information.
                  </p>
                </div>
                <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    3. Trading
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    NFTs can be bought, sold, or traded on marketplaces using
                    cryptocurrency.
                  </p>
                </div>
                <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    4. Ownership
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    Ownership is transferred through blockchain transactions,
                    recorded permanently.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Common Use Cases -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Common NFT Use Cases
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Digital Art
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Artists can sell their digital artwork as NFTs, ensuring
                  authenticity and enabling royalties on future sales.
                </p>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Collectibles
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Digital collectibles like trading cards, virtual pets, and
                  rare items in games.
                </p>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Gaming
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  In-game items, characters, and assets that players truly own
                  and can trade.
                </p>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Real Estate
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Virtual real estate in metaverses and fractional ownership of
                  physical properties.
                </p>
              </div>
            </div>
          </section>

          <!-- Benefits -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Benefits of NFTs
            </h3>
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <svg
                  class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Provenance & Authenticity
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    Every NFT has a complete history of ownership and creation,
                    making it impossible to forge.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <svg
                  class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Creator Royalties
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    Artists can earn royalties every time their NFT is resold,
                    creating ongoing revenue streams.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <svg
                  class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Global Accessibility
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    Anyone with an internet connection can buy, sell, and trade
                    NFTs from anywhere in the world.
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <svg
                  class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Programmable Features
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">
                    NFTs can have built-in features like unlockable content,
                    membership benefits, or interactive elements.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Navigation -->
          <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Learn More
            </h3>
            <nav class="space-y-2">
              <NuxtLink
                to="/learn/how-to-mint-nft"
                class="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                How to Mint an NFT →
              </NuxtLink>
              <NuxtLink
                to="/learn/web3-basics"
                class="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Web3 Basics →
              </NuxtLink>
              <NuxtLink
                to="/learn/nft-marketplaces"
                class="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                NFT Marketplaces →
              </NuxtLink>
              <NuxtLink
                to="/learn/crypto-wallets"
                class="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Crypto Wallets →
              </NuxtLink>
            </nav>
          </div>

          <!-- Key Terms -->
          <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Key Terms
            </h3>
            <div class="space-y-3">
              <div>
                <dt class="font-medium text-gray-900 dark:text-white">
                  Minting
                </dt>
                <dd class="text-sm text-gray-600 dark:text-gray-400">
                  The process of creating a new NFT on the blockchain
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-900 dark:text-white">
                  Gas Fee
                </dt>
                <dd class="text-sm text-gray-600 dark:text-gray-400">
                  Transaction fee paid to process operations on the blockchain
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-900 dark:text-white">
                  Metadata
                </dt>
                <dd class="text-sm text-gray-600 dark:text-gray-400">
                  Additional information stored with the NFT (name, description,
                  attributes)
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-900 dark:text-white">
                  Smart Contract
                </dt>
                <dd class="text-sm text-gray-600 dark:text-gray-400">
                  Self-executing code that manages NFT ownership and transfers
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  definePageMeta({
    title: 'What is an NFT? - Learn About Non-Fungible Tokens',
    description:
      'Learn what NFTs are, how they work, and their benefits. A comprehensive guide to Non-Fungible Tokens for beginners.',
  })
</script>
