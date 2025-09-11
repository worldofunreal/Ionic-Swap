<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Support Center
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Get help with cross-chain swapping, gasless transactions, and token
          trading
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
            <UIcon
              name="i-heroicons-question-mark-circle"
              class="w-6 h-6 text-blue-600 dark:text-blue-400"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            FAQ
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Find answers to common questions about swapping and DeFi
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
            <UIcon
              name="i-heroicons-chat-bubble-left-right"
              class="w-6 h-6 text-green-600 dark:text-green-400"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Live Chat
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Chat with our support team in real-time
          </p>
          <button
            class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            @click="activeSection = 'chat'"
          >
            Start Chat →
          </button>
        </div>

        <div
          class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow text-center"
        >
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <UIcon
              name="i-heroicons-envelope"
              class="w-6 h-6 text-purple-600 dark:text-purple-400"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Email Support
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Send us a detailed message about your issue
          </p>
          <button
            class="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            @click="activeSection = 'email'"
          >
            Send Email →
          </button>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="space-y-8">
        <!-- FAQ Section -->
        <div
          v-if="activeSection === 'faq'"
          class="bg-white dark:bg-neutral-800 rounded-lg shadow p-8"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>

          <div class="space-y-6">
            <div
              v-for="faq in faqs"
              :key="faq.id"
              class="border-b border-gray-200 dark:border-gray-700 pb-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                {{ faq.question }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ faq.answer }}
              </p>
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        <div
          v-if="activeSection === 'chat'"
          class="bg-white dark:bg-neutral-800 rounded-lg shadow p-8"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Live Chat Support
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Our support team is available 24/7 to help you with any questions
            about cross-chain swapping, gasless transactions, or token trading.
          </p>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center">
            <UIcon
              name="i-heroicons-chat-bubble-left-right"
              class="w-12 h-12 text-gray-400 mx-auto mb-4"
            />
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Live chat is coming soon! For now, please use email support.
            </p>
            <UButton color="primary" @click="activeSection = 'email'">
              Contact Email Support
            </UButton>
          </div>
        </div>

        <!-- Email Section -->
        <div
          v-if="activeSection === 'email'"
          class="bg-white dark:bg-neutral-800 rounded-lg shadow p-8"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Email Support
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Send us a detailed message about your issue and we'll get back to
            you within 24 hours.
          </p>

          <div class="space-y-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Subject
              </label>
              <UInput
                v-model="emailForm.subject"
                placeholder="Brief description of your issue"
                class="w-full"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message
              </label>
              <UTextarea
                v-model="emailForm.message"
                placeholder="Please provide as much detail as possible about your issue..."
                :rows="6"
                class="w-full"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Your Email
              </label>
              <UInput
                v-model="emailForm.email"
                type="email"
                placeholder="your@email.com"
                class="w-full"
              />
            </div>
            <UButton
              color="primary"
              size="lg"
              class="w-full"
              @click="sendEmail"
            >
              Send Support Request
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const activeSection = ref('faq')

  const emailForm = ref({
    subject: '',
    message: '',
    email: '',
  })

  const faqs = [
    {
      id: 1,
      question: 'How do gasless transactions work?',
      answer:
        'Gasless transactions use cryptographic permits that allow smart contracts to execute transactions on your behalf without requiring you to pay gas fees. You sign a permit with your wallet, and our system submits the transaction to the blockchain.',
    },
    {
      id: 2,
      question: 'Which blockchain networks are supported?',
      answer:
        'Ionic Swap supports Ethereum (EVM chains), Solana, and Internet Computer. You can swap tokens between any of these networks seamlessly.',
    },
    {
      id: 3,
      question: 'What token standards are supported?',
      answer:
        'We support ERC-20 tokens on EVM chains, SPL tokens on Solana, and ICRC tokens on Internet Computer. This covers the majority of tokens on these networks.',
    },
    {
      id: 4,
      question: 'How long do swaps take?',
      answer:
        'Swap times vary by network. Solana swaps are typically fastest (seconds), EVM swaps take 1-5 minutes depending on network congestion, and Internet Computer swaps are usually under 2 minutes.',
    },
    {
      id: 5,
      question: 'Are there any fees for swapping?',
      answer:
        "Ionic Swap uses gasless transactions, so you don't pay gas fees. However, there may be small network fees or liquidity provider fees depending on the specific swap route.",
    },
    {
      id: 6,
      question: 'Is my wallet secure?',
      answer:
        'Yes, Ionic Swap is non-custodial, meaning we never have access to your private keys or funds. All transactions are executed directly from your wallet using secure smart contracts.',
    },
  ]

  const sendEmail = () => {
    // In a real implementation, this would send the email
    const mailtoLink = `mailto:support@ionicswap.com?subject=${encodeURIComponent(emailForm.value.subject)}&body=${encodeURIComponent(emailForm.value.message + '\n\nFrom: ' + emailForm.value.email)}`
    window.open(mailtoLink)

    // Reset form
    emailForm.value = {
      subject: '',
      message: '',
      email: '',
    }
  }

  useHead({
    title: 'Support Center - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Get help with cross-chain swapping, gasless transactions, and token trading. Find answers to common questions and contact our support team.',
      },
      { property: 'og:title', content: 'Support Center - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Get help with cross-chain swapping, gasless transactions, and token trading.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ionicswap.com/support' },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Support Center - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Get help with cross-chain swapping, gasless transactions, and token trading.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://ionicswap.com/support' }],
  })
</script>
