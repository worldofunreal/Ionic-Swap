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
                  >How to Mint an NFT</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          How to Mint an NFT
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          A complete step-by-step guide to creating your first NFT
        </p>
      </div>

      <!-- Prerequisites -->
      <div
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8"
      >
        <h2 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Prerequisites
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-blue-800 dark:text-blue-200"
              >A cryptocurrency wallet (MetaMask, WalletConnect, etc.)</span
            >
          </div>
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-blue-800 dark:text-blue-200"
              >Cryptocurrency for gas fees (ETH, MATIC, etc.)</span
            >
          </div>
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-blue-800 dark:text-blue-200"
              >Digital asset (image, video, audio, etc.)</span
            >
          </div>
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-blue-800 dark:text-blue-200"
              >Basic understanding of blockchain networks</span
            >
          </div>
        </div>
      </div>

      <!-- Step-by-Step Guide -->
      <div class="space-y-8">
        <!-- Step 1 -->
        <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <div class="flex items-start space-x-4">
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg"
                >1</span
              >
            </div>
            <div class="flex-1">
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                Prepare Your Digital Asset
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Before minting, ensure your digital asset meets the platform's
                requirements and is ready for upload.
              </p>

              <div
                class="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-4"
              >
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                  File Requirements:
                </h4>
                <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Supported formats: JPG, PNG, GIF, MP4, MP3, GLB</li>
                  <li>• Maximum file size: 100MB</li>
                  <li>• Recommended resolution: 1920x1920 pixels or higher</li>
                  <li>• Ensure you own the rights to the content</li>
                </ul>
              </div>

              <div
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <div class="flex items-start space-x-2">
                  <svg
                    class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
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
                      class="font-medium text-yellow-800 dark:text-yellow-200"
                    >
                      Important Note
                    </h5>
                    <p class="text-yellow-700 dark:text-yellow-300 text-sm">
                      Only mint content that you own or have permission to use.
                      Copyright infringement can result in legal consequences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <div class="flex items-start space-x-4">
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg"
                >2</span
              >
            </div>
            <div class="flex-1">
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                Connect Your Wallet
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Connect your cryptocurrency wallet to the NFT marketplace where
                you want to mint.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                    Popular Wallets:
                  </h4>
                  <ul
                    class="space-y-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <li>• MetaMask</li>
                    <li>• WalletConnect</li>
                    <li>• Coinbase Wallet</li>
                    <li>• Trust Wallet</li>
                  </ul>
                </div>
                <div
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                    Supported Networks:
                  </h4>
                  <ul
                    class="space-y-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <li>• Ethereum (ETH)</li>
                    <li>• Polygon (MATIC)</li>
                    <li>• Binance Smart Chain</li>
                    <li>• Solana (SOL)</li>
                  </ul>
                </div>
              </div>

              <div
                class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div class="flex items-start space-x-2">
                  <svg
                    class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h5 class="font-medium text-green-800 dark:text-green-200">
                      Security Tip
                    </h5>
                    <p class="text-green-700 dark:text-green-300 text-sm">
                      Always verify you're on the correct website and never
                      share your private keys or seed phrase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <div class="flex items-start space-x-4">
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg"
                >3</span
              >
            </div>
            <div class="flex-1">
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                Upload Your Asset
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Upload your digital file to the marketplace. This will be stored
                on IPFS or similar decentralized storage.
              </p>

              <div
                class="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-4"
              >
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                  Upload Process:
                </h4>
                <ol class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>1. Click "Create" or "Mint NFT" button</li>
                  <li>2. Drag and drop your file or click to browse</li>
                  <li>3. Wait for the file to upload and process</li>
                  <li>4. Verify the preview looks correct</li>
                </ol>
              </div>

              <div
                class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
              >
                <div class="flex items-start space-x-2">
                  <svg
                    class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h5
                      class="font-medium text-purple-800 dark:text-purple-200"
                    >
                      Storage Note
                    </h5>
                    <p class="text-purple-700 dark:text-purple-300 text-sm">
                      Your file will be stored on decentralized storage (IPFS)
                      to ensure it remains accessible and cannot be censored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <div class="flex items-start space-x-4">
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg"
                >4</span
              >
            </div>
            <div class="flex-1">
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                Add Metadata
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Fill in the details about your NFT, including name, description,
                and attributes.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="space-y-3">
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Name</label
                    >
                    <input
                      type="text"
                      placeholder="My Awesome NFT"
                      class="w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Description</label
                    >
                    <textarea
                      rows="3"
                      placeholder="Describe your NFT..."
                      class="w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Collection</label
                    >
                    <select
                      class="w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Create New Collection</option>
                      <option>My Art Collection</option>
                      <option>Photography</option>
                    </select>
                  </div>
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Royalties (%)</label
                    >
                    <input
                      type="number"
                      min="0"
                      max="50"
                      placeholder="10"
                      class="w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                </div>
              </div>

              <div
                class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              >
                <div class="flex items-start space-x-2">
                  <svg
                    class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <h5 class="font-medium text-blue-800 dark:text-blue-200">
                      Pro Tip
                    </h5>
                    <p class="text-blue-700 dark:text-blue-300 text-sm">
                      Add detailed descriptions and attributes to make your NFT
                      more discoverable and valuable. Consider adding unlockable
                      content for additional value.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5 -->
        <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <div class="flex items-start space-x-4">
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg"
                >5</span
              >
            </div>
            <div class="flex-1">
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                Mint Your NFT
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Confirm the transaction and pay the gas fees to mint your NFT on
                the blockchain.
              </p>

              <div
                class="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-4"
              >
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                  Before Minting:
                </h4>
                <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Review all details carefully</li>
                  <li>• Check gas fees and ensure sufficient balance</li>
                  <li>• Verify you're on the correct network</li>
                  <li>• Confirm the transaction in your wallet</li>
                </ul>
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
                      Once minted, NFT details cannot be changed. Double-check
                      everything before confirming the transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Best Practices -->
      <div class="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow mt-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Best Practices
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Before Minting
            </h3>
            <ul class="space-y-2 text-gray-600 dark:text-gray-400">
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Research the marketplace and its community</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Choose the right blockchain network</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Ensure high-quality digital assets</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Write compelling descriptions</span>
              </li>
            </ul>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              After Minting
            </h3>
            <ul class="space-y-2 text-gray-600 dark:text-gray-400">
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Promote your NFT on social media</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Engage with the NFT community</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Consider creating a collection</span>
              </li>
              <li class="flex items-start space-x-2">
                <svg
                  class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Monitor gas fees for optimal timing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  definePageMeta({
    title: 'How to Mint an NFT - Step-by-Step Guide',
    description:
      'Learn how to mint your first NFT with our comprehensive step-by-step guide. From preparation to minting, we cover everything you need to know.',
  })
</script>
