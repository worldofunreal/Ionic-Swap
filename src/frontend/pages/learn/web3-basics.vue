<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <nav class="flex mb-6" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <NuxtLink
                to="/learn"
                class="text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-300"
              >
                Learn
              </NuxtLink>
            </li>
            <li>
              <div class="flex items-center">
                <svg
                  class="w-6 h-6 text-zinc-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="ml-1 text-zinc-500 md:ml-2 dark:text-zinc-300"
                  >Web3 Basics</span
                >
              </div>
            </li>
          </ol>
        </nav>

        <h1 class="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Web3 Basics
        </h1>
        <p class="text-xl text-zinc-600 dark:text-zinc-300">
          Understanding the next evolution of the internet
        </p>
      </div>

      <!-- Hero Section -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 mb-8 text-white"
      >
        <div class="max-w-3xl">
          <h2 class="text-2xl font-bold mb-4">The Evolution of the Web</h2>
          <p class="text-lg mb-6">
            Web3 represents the next generation of the internet, built on
            blockchain technology and focused on decentralization, user
            ownership, and trustless interactions.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-zinc-50 bg-opacity-20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">Web1</div>
              <div class="text-sm">Read-only</div>
            </div>
            <div class="bg-zinc-50 bg-opacity-20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">Web2</div>
              <div class="text-sm">Read-write</div>
            </div>
            <div class="bg-zinc-50 bg-opacity-20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">Web3</div>
              <div class="text-sm">Read-write-own</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- What is Web3 -->
          <section class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              What is Web3?
            </h3>
            <p class="text-zinc-600 dark:text-zinc-300 mb-6">
              Web3 is the third generation of the internet, characterized by
              decentralization, blockchain technology, and user ownership of
              data and digital assets. It represents a fundamental shift from
              centralized platforms to distributed networks.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  Key Characteristics
                </h4>
                <ul class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <li>• Decentralized infrastructure</li>
                  <li>• User ownership of data</li>
                  <li>• Trustless interactions</li>
                  <li>• Programmable money</li>
                  <li>• Censorship resistance</li>
                </ul>
              </div>
              <div class="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  Core Technologies
                </h4>
                <ul class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <li>• Blockchain networks</li>
                  <li>• Smart contracts</li>
                  <li>• Cryptocurrencies</li>
                  <li>• Decentralized storage</li>
                  <li>• Zero-knowledge proofs</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Web Evolution -->
          <section class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              The Evolution of the Web
            </h3>
            <div class="space-y-6">
              <div class="border-l-4 border-gray-300 dark:border-gray-600 pl-6">
                <h4
                  class="text-lg font-semibold text-zinc-900 dark:text-white mb-2"
                >
                  Web1 (1990s - 2000s)
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 mb-2">
                  The first version of the web was primarily static and
                  read-only. Users could browse websites and consume content,
                  but interaction was limited.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• Static HTML pages</li>
                  <li>• Limited user interaction</li>
                  <li>• Centralized content creation</li>
                  <li>• Basic e-commerce</li>
                </ul>
              </div>

              <div class="border-l-4 border-blue-500 pl-6">
                <h4
                  class="text-lg font-semibold text-zinc-900 dark:text-white mb-2"
                >
                  Web2 (2000s - Present)
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 mb-2">
                  The social web enabled user-generated content, social media,
                  and interactive applications. However, data and value are
                  controlled by centralized platforms.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• Social media platforms</li>
                  <li>• User-generated content</li>
                  <li>• Centralized data ownership</li>
                  <li>• Platform monetization</li>
                </ul>
              </div>

              <div class="border-l-4 border-purple-500 pl-6">
                <h4
                  class="text-lg font-semibold text-zinc-900 dark:text-white mb-2"
                >
                  Web3 (Emerging)
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 mb-2">
                  The decentralized web gives users ownership of their data and
                  digital assets through blockchain technology and decentralized
                  applications (dApps).
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• Decentralized applications</li>
                  <li>• User-owned data</li>
                  <li>• Cryptocurrency integration</li>
                  <li>• Trustless interactions</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Blockchain Technology -->
          <section class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Blockchain Technology
            </h3>
            <p class="text-zinc-600 dark:text-zinc-300 mb-6">
              Blockchain is the foundational technology that powers Web3. It's a
              distributed ledger that records transactions across a network of
              computers in a secure, transparent, and immutable way.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-3">
                  How Blockchain Works
                </h4>
                <div class="space-y-3">
                  <div class="flex items-start space-x-3">
                    <div
                      class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span
                        class="text-blue-600 dark:text-blue-400 font-bold text-xs"
                        >1</span
                      >
                    </div>
                    <div>
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Transaction Creation
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        A transaction is created and broadcast to the network
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div
                      class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span
                        class="text-blue-600 dark:text-blue-400 font-bold text-xs"
                        >2</span
                      >
                    </div>
                    <div>
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Validation
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        Network nodes validate the transaction
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div
                      class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span
                        class="text-blue-600 dark:text-blue-400 font-bold text-xs"
                        >3</span
                      >
                    </div>
                    <div>
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Block Creation
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        Valid transactions are grouped into blocks
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div
                      class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span
                        class="text-blue-600 dark:text-blue-400 font-bold text-xs"
                        >4</span
                      >
                    </div>
                    <div>
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Chain Addition
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        Blocks are added to the chain permanently
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-3">
                  Key Features
                </h4>
                <div class="space-y-3">
                  <div class="flex items-start space-x-2">
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
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Decentralization
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        No single point of control or failure
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-2">
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
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Immutability
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        Data cannot be altered once recorded
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-2">
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
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Transparency
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        All transactions are publicly visible
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-2">
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
                      <h5
                        class="font-medium text-zinc-900 dark:text-white text-sm"
                      >
                        Security
                      </h5>
                      <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                        Cryptographic protection against tampering
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Smart Contracts -->
          <section class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Smart Contracts
            </h3>
            <p class="text-zinc-600 dark:text-zinc-300 mb-6">
              Smart contracts are self-executing programs that run on the
              blockchain. They automatically execute when predetermined
              conditions are met, enabling trustless and automated transactions.
            </p>

            <div class="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-6">
              <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                Example: NFT Marketplace Smart Contract
              </h4>
              <div
                class="bg-neutral-900 text-green-400 p-4 rounded text-sm font-mono overflow-x-auto"
              >
                <pre><code>contract NFTMarketplace {
    function listNFT(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        listings[tokenId] = price;
        emit NFTListed(tokenId, price);
    }
    
    function buyNFT(uint256 tokenId) public payable {
        require(listings[tokenId] > 0, "Not for sale");
        require(msg.value >= listings[tokenId], "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        _transfer(seller, msg.sender, tokenId);
        seller.transfer(msg.value);
        
        delete listings[tokenId];
        emit NFTSold(tokenId, msg.sender, msg.value);
    }
}</code></pre>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div
                  class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3"
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
                <h5 class="font-semibold text-zinc-900 dark:text-white">
                  Automated
                </h5>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                  Execute automatically when conditions are met
                </p>
              </div>
              <div
                class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div
                  class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h5 class="font-semibold text-zinc-900 dark:text-white">
                  Trustless
                </h5>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                  No need to trust intermediaries
                </p>
              </div>
              <div
                class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <div
                  class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3"
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
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h5 class="font-semibold text-zinc-900 dark:text-white">
                  Programmable
                </h5>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm">
                  Can implement complex business logic
                </p>
              </div>
            </div>
          </section>

          <!-- Web3 Applications -->
          <section class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Web3 Applications
            </h3>
            <p class="text-zinc-600 dark:text-zinc-300 mb-6">
              Web3 applications (dApps) are decentralized applications that run
              on blockchain networks. They provide the same functionality as
              traditional apps but with added benefits of decentralization.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  DeFi (Decentralized Finance)
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm mb-3">
                  Financial services built on blockchain technology, including
                  lending, borrowing, trading, and yield farming.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• Uniswap - Decentralized exchange</li>
                  <li>• Aave - Lending platform</li>
                  <li>• Compound - Interest-earning</li>
                </ul>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-5 h-5 text-purple-600 dark:text-purple-400"
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
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  NFT Marketplaces
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm mb-3">
                  Platforms for buying, selling, and trading non-fungible tokens
                  and digital collectibles.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• OpenSea - Largest NFT marketplace</li>
                  <li>• Rarible - Community-owned</li>
                  <li>• Foundation - Curated art</li>
                </ul>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  DAOs (Decentralized Autonomous Organizations)
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm mb-3">
                  Community-governed organizations that operate through smart
                  contracts and token voting.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• MakerDAO - Stablecoin governance</li>
                  <li>• Uniswap DAO - Protocol governance</li>
                  <li>• ConstitutionDAO - Community funding</li>
                </ul>
              </div>

              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-3"
                >
                  <svg
                    class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-2">
                  Gaming & Metaverse
                </h4>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm mb-3">
                  Blockchain-based games and virtual worlds where players own
                  their in-game assets.
                </p>
                <ul class="text-sm text-zinc-500 dark:text-zinc-300 space-y-1">
                  <li>• Axie Infinity - Play-to-earn game</li>
                  <li>• Decentraland - Virtual world</li>
                  <li>• The Sandbox - Gaming platform</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Navigation -->
          <div class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3
              class="text-lg font-semibold text-zinc-900 dark:text-white mb-4"
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
          <div class="bg-zinc-50 dark:bg-neutral-800 rounded-lg p-6 shadow">
            <h3
              class="text-lg font-semibold text-zinc-900 dark:text-white mb-4"
            >
              Key Terms
            </h3>
            <div class="space-y-3">
              <div>
                <dt class="font-medium text-zinc-900 dark:text-white">dApp</dt>
                <dd class="text-sm text-zinc-600 dark:text-zinc-300">
                  Decentralized application running on blockchain
                </dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-900 dark:text-white">DeFi</dt>
                <dd class="text-sm text-zinc-600 dark:text-zinc-300">
                  Decentralized finance applications
                </dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-900 dark:text-white">DAO</dt>
                <dd class="text-sm text-zinc-600 dark:text-zinc-300">
                  Decentralized Autonomous Organization
                </dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-900 dark:text-white">Gas</dt>
                <dd class="text-sm text-zinc-600 dark:text-zinc-300">
                  Fee paid for blockchain transactions
                </dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-900 dark:text-white">
                  Consensus
                </dt>
                <dd class="text-sm text-zinc-600 dark:text-zinc-300">
                  Agreement mechanism for blockchain validation
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
    title: 'Web3 Basics - Understanding the Decentralized Web',
    description:
      'Learn about Web3, blockchain technology, smart contracts, and decentralized applications. A comprehensive guide to the future of the internet.',
  })
</script>
