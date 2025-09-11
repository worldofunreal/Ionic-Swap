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
                  >Crypto Wallets</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Crypto Wallets
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Your gateway to the world of cryptocurrencies and NFTs
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-8 mb-8 text-white"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">Understanding Crypto Wallets</h2>
          <p class="text-lg mb-6">
            A cryptocurrency wallet is a digital tool that allows you to store,
            send, and receive cryptocurrencies and NFTs. It's your personal
            interface to the blockchain, keeping your digital assets secure and
            accessible.
          </p>
          <div class="flex flex-wrap gap-4">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Secure</div>
              <div class="text-sm">Private key protection</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Accessible</div>
              <div class="text-sm">24/7 global access</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="text-2xl font-bold">Versatile</div>
              <div class="text-sm">Multiple crypto support</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- What is a Crypto Wallet -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What is a Crypto Wallet?
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              A cryptocurrency wallet is a software program or hardware device
              that stores your private keys and allows you to interact with
              blockchain networks. It doesn't actually store your
              cryptocurrencies - those exist on the blockchain. Instead, it
              stores the keys that give you access to your digital assets.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Private Key
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  A secret code that proves ownership of your cryptocurrencies
                  and allows you to sign transactions.
                </p>
                <div
                  class="bg-neutral-900 text-green-400 p-3 rounded text-xs font-mono"
                >
                  0x1234567890abcdef1234567890abcdef12345678
                </div>
              </div>
              <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  Public Address
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  A public identifier that others can use to send you
                  cryptocurrencies.
                </p>
                <div
                  class="bg-neutral-900 text-blue-400 p-3 rounded text-xs font-mono"
                >
                  0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
                </div>
              </div>
            </div>
          </section>

          <!-- Types of Wallets -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Types of Crypto Wallets
            </h3>
            <div class="space-y-6">
              <!-- Hot Wallets -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div class="flex items-center space-x-4 mb-4">
                  <div
                    class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4
                      class="text-xl font-semibold text-gray-900 dark:text-white"
                    >
                      Hot Wallets
                    </h4>
                    <p class="text-gray-600 dark:text-gray-400">
                      Connected to the internet for easy access
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white mb-2">
                      Types
                    </h5>
                    <ul
                      class="text-sm text-gray-600 dark:text-gray-400 space-y-1"
                    >
                      <li>• Web wallets (MetaMask, WalletConnect)</li>
                      <li>• Mobile wallets (Trust Wallet, Coinbase Wallet)</li>
                      <li>• Desktop wallets (Exodus, Atomic Wallet)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white mb-2">
                      Pros & Cons
                    </h5>
                    <div class="space-y-2">
                      <div class="flex items-start space-x-2">
                        <svg
                          class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                          >Easy to use, convenient access</span
                        >
                      </div>
                      <div class="flex items-start space-x-2">
                        <svg
                          class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                          >Vulnerable to online attacks</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cold Wallets -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div class="flex items-center space-x-4 mb-4">
                  <div
                    class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4
                      class="text-xl font-semibold text-gray-900 dark:text-white"
                    >
                      Cold Wallets
                    </h4>
                    <p class="text-gray-600 dark:text-gray-400">
                      Offline storage for maximum security
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white mb-2">
                      Types
                    </h5>
                    <ul
                      class="text-sm text-gray-600 dark:text-gray-400 space-y-1"
                    >
                      <li>• Hardware wallets (Ledger, Trezor)</li>
                      <li>• Paper wallets (printed private keys)</li>
                      <li>• Air-gapped computers</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white mb-2">
                      Pros & Cons
                    </h5>
                    <div class="space-y-2">
                      <div class="flex items-start space-x-2">
                        <svg
                          class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                          >Maximum security, offline protection</span
                        >
                      </div>
                      <div class="flex items-start space-x-2">
                        <svg
                          class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                          >Less convenient, requires physical device</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Popular Wallets -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Crypto Wallets
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- MetaMask -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3 mb-3">
                  <div
                    class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center"
                  >
                    <span
                      class="text-orange-600 dark:text-orange-400 font-bold text-sm"
                      >MM</span
                    >
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      MetaMask
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Browser extension wallet
                    </p>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Supports Ethereum and EVM chains</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Easy dApp integration</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Free to use</span>
                  </div>
                </div>
              </div>

              <!-- Trust Wallet -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3 mb-3">
                  <div
                    class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"
                  >
                    <span
                      class="text-blue-600 dark:text-blue-400 font-bold text-sm"
                      >TW</span
                    >
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      Trust Wallet
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Mobile wallet
                    </p>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Multi-chain support</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Built-in DEX</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>User-friendly interface</span>
                  </div>
                </div>
              </div>

              <!-- Ledger -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3 mb-3">
                  <div
                    class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
                  >
                    <span
                      class="text-green-600 dark:text-green-400 font-bold text-sm"
                      >L</span
                    >
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      Ledger
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Hardware wallet
                    </p>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Maximum security</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Supports 1000+ cryptocurrencies</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Requires physical device ($59+)</span>
                  </div>
                </div>
              </div>

              <!-- Coinbase Wallet -->
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3 mb-3">
                  <div
                    class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center"
                  >
                    <span
                      class="text-purple-600 dark:text-purple-400 font-bold text-sm"
                      >CW</span
                    >
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      Coinbase Wallet
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Mobile & browser wallet
                    </p>
                  </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Easy integration with Coinbase</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Multi-chain support</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>User-friendly for beginners</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Security Best Practices -->
          <section class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Security Best Practices
            </h3>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Essential Security
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-red-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Never Share Private Keys
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          Keep your private keys secret and never share them
                          with anyone
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-red-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Backup Seed Phrase
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          Write down your seed phrase and store it securely
                          offline
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-red-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Use Hardware Wallets
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          For large amounts, use hardware wallets for maximum
                          security
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    Additional Tips
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Verify URLs
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          Always verify you're on the official website
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Enable 2FA
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          Use two-factor authentication when available
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <svg
                        class="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <div>
                        <h5
                          class="font-medium text-gray-900 dark:text-white text-sm"
                        >
                          Test Small Amounts
                        </h5>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                          Test with small amounts before large transactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <div class="flex items-start space-x-2">
                  <svg
                    class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h5 class="font-medium text-red-800 dark:text-red-200">
                      Warning
                    </h5>
                    <p class="text-red-700 dark:text-red-300 text-sm">
                      If you lose your private keys or seed phrase, you will
                      permanently lose access to your cryptocurrencies. There is
                      no way to recover them.
                    </p>
                  </div>
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
                to="/learn/what-is-an-nft"
                class="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                What is an NFT? →
              </NuxtLink>
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
            </nav>
          </div>

          <!-- Wallet Comparison -->
          <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Wallet Comparison
            </h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400"
                  >Security Level</span
                >
                <div class="flex space-x-1">
                  <div class="w-3 h-3 bg-red-400 rounded" />
                  <div class="w-3 h-3 bg-yellow-400 rounded" />
                  <div class="w-3 h-3 bg-green-400 rounded" />
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400"
                  >Ease of Use</span
                >
                <div class="flex space-x-1">
                  <div class="w-3 h-3 bg-green-400 rounded" />
                  <div class="w-3 h-3 bg-green-400 rounded" />
                  <div class="w-3 h-3 bg-yellow-400 rounded" />
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Cost</span>
                <div class="flex space-x-1">
                  <div class="w-3 h-3 bg-green-400 rounded" />
                  <div class="w-3 h-3 bg-green-400 rounded" />
                  <div class="w-3 h-3 bg-red-400 rounded" />
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                Hot Wallets • Hardware Wallets
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
    title: 'Crypto Wallets - Secure Your Digital Assets',
    description:
      'Learn about cryptocurrency wallets, their types, security best practices, and how to choose the right wallet for your needs.',
  })
</script>
