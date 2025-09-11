<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Support Center
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          We're here to help you with any questions or issues
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div
          class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow text-center"
        >
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            FAQ
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Find answers to common questions
          </p>
          <button
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            @click="activeSection = 'faq'"
          >
            Browse FAQ →
          </button>
        </div>

        <div
          class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow text-center"
        >
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4"
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Contact Us
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Get in touch with our support team
          </p>
          <button
            class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            @click="activeSection = 'contact'"
          >
            Contact Support →
          </button>
        </div>

        <div
          class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow text-center"
        >
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4"
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Documentation
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Read our guides and tutorials
          </p>
          <button
            class="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            @click="activeSection = 'docs'"
          >
            View Docs →
          </button>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="bg-white dark:bg-neutral-800 rounded-lg shadow">
        <!-- FAQ Section -->
        <div v-if="activeSection === 'faq'" class="p-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>

          <div class="space-y-4">
            <div
              v-for="(faq, index) in faqs"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <button
                class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700"
                @click="faq.open = !faq.open"
              >
                <span class="font-medium text-gray-900 dark:text-white">{{
                  faq.question
                }}</span>
                <svg
                  :class="[
                    'w-5 h-5 text-gray-500 transform transition-transform',
                    faq.open ? 'rotate-180' : '',
                  ]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div v-if="faq.open" class="px-6 pb-4">
                <p class="text-gray-600 dark:text-gray-400">{{ faq.answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Section -->
        <div v-if="activeSection === 'contact'" class="p-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Contact Support
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Get in Touch
              </h3>
              <div class="space-y-4">
                <div class="flex items-center">
                  <svg
                    class="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-400"
                    >support@nftropoly.com</span
                  >
                </div>
                <div class="flex items-center">
                  <svg
                    class="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-400"
                    >+1 (555) 123-4567</span
                  >
                </div>
                <div class="flex items-center">
                  <svg
                    class="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-400"
                    >24/7 Support Available</span
                  >
                </div>
              </div>
            </div>

            <div>
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Send us a Message
              </h3>
              <form class="space-y-4">
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Name</label
                  >
                  <input
                    type="text"
                    class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Email</label
                  >
                  <input
                    type="email"
                    class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Subject</label
                  >
                  <select
                    class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>Bug Report</option>
                  </select>
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Message</label
                  >
                  <textarea
                    rows="4"
                    class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-neutral-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Documentation Section -->
        <div v-if="activeSection === 'docs'" class="p-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Documentation & Guides
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="(doc, index) in documentation"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div
                class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4"
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-2"
              >
                {{ doc.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ doc.description }}
              </p>
              <a
                href="#"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Read Guide →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const activeSection = ref('faq')

  const faqs = ref([
    {
      question: 'How do I create an NFT?',
      answer:
        'To create an NFT, connect your wallet, click "Create" in the top navigation, upload your digital asset, fill in the details, and mint your NFT. Make sure you have enough cryptocurrency to cover gas fees.',
      open: false,
    },
    {
      question: 'What cryptocurrencies do you support?',
      answer:
        'We support Ethereum (ETH), Polygon (MATIC), and other major cryptocurrencies. You can view the full list of supported networks in your wallet settings.',
      open: false,
    },
    {
      question: 'How do I sell my NFT?',
      answer:
        'To sell your NFT, go to your profile, select the NFT you want to sell, click "List for Sale", set your price, and confirm the transaction. Your NFT will be available for purchase immediately.',
      open: false,
    },
    {
      question: 'What are gas fees?',
      answer:
        'Gas fees are transaction fees paid to miners to process and validate transactions on the blockchain. Fees vary based on network congestion and transaction complexity.',
      open: false,
    },
    {
      question: 'How do I connect my wallet?',
      answer:
        'Click the "Connect Wallet" button in the top right corner and select your preferred wallet (MetaMask, WalletConnect, etc.). Follow the prompts to connect your wallet to our platform.',
      open: false,
    },
    {
      question: 'Is my NFT secure?',
      answer:
        'Yes, NFTs are secured by blockchain technology. Once minted, your NFT is permanently recorded on the blockchain and cannot be altered or deleted. We also implement additional security measures to protect your assets.',
      open: false,
    },
  ])

  const documentation = ref([
    {
      title: 'Getting Started',
      description:
        'Learn the basics of NFTs and how to get started on our platform',
      icon: 'book',
    },
    {
      title: 'Wallet Setup',
      description:
        'Complete guide to setting up and connecting your cryptocurrency wallet',
      icon: 'wallet',
    },
    {
      title: 'Creating NFTs',
      description:
        'Step-by-step tutorial on creating and minting your first NFT',
      icon: 'create',
    },
    {
      title: 'Buying & Selling',
      description: 'Learn how to buy, sell, and trade NFTs on our marketplace',
      icon: 'trade',
    },
    {
      title: 'Security Best Practices',
      description: 'Important security tips to keep your NFTs and wallet safe',
      icon: 'security',
    },
    {
      title: 'API Documentation',
      description:
        'Technical documentation for developers building on our platform',
      icon: 'api',
    },
  ])
</script>
