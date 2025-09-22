<script setup>
  useHead({
    title: 'Terms of Service - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Read our terms of service to understand the rules and guidelines for using Ionic Swap MVP.',
      },
      { property: 'og:title', content: 'Terms of Service - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Read our terms of service to understand the rules and guidelines for using Ionic Swap MVP.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ionicswap.com/terms' },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Terms of Service - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Read our terms of service to understand the rules and guidelines for using Ionic Swap MVP.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://ionicswap.com/terms' }],
  })
</script>
<template>
  <UContainer class="py-20">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-center">Terms of Service</h1>

      <div class="prose prose-lg dark:prose-invert max-w-none">
        <h2 class="text-2xl font-semibold mb-4">
          Terms of Service – Ionic-Swap (MVP)
        </h2>
        <p class="text-sm text-zinc-600 dark:text-zinc-300 mb-8">
          Effective Date: 16th September 2025
        </p>

        <div class="space-y-8">
          <section>
            <h3 class="text-xl font-semibold mb-4">1. Purpose of the MVP</h3>
            <p class="mb-4">
              Ionic-Swap is currently in its Minimum Viable Product (MVP) stage.
              The platform is provided for testing and demonstration purposes
              only.
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                All trading activity occurs on test networks (e.g., Solana
                Devnet, Ethereum Sepolia, ICP test environments).
              </li>
              <li>
                Any tokens, assets, or balances displayed in the MVP do not
                represent real-world value and cannot be exchanged for real
                currency, cryptocurrencies, or other assets.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">2. No Financial Services</h3>
            <p class="mb-4">
              Ionic-Swap MVP is not a financial product or service. It does not
              facilitate real transactions, custody assets of real value, or
              provide investment opportunities.
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                You acknowledge and agree that using the MVP does not involve
                actual financial risk or reward.
              </li>
              <li>
                Ionic-Swap is not responsible for any assumptions of financial
                value, profit, or loss based on MVP usage.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">3. User Responsibilities</h3>
            <p class="mb-4">By accessing the MVP, you agree that:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                You will use the platform solely for testing and evaluation.
              </li>
              <li>
                You will not attempt to trade, sell, or exchange MVP test assets
                for real-world value.
              </li>
              <li>
                You will comply with all applicable laws in your jurisdiction
                while using the MVP.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">
              4. Disclaimer of Liability
            </h3>
            <p class="mb-4">
              The MVP is provided "as is" without warranties of any kind.
              Ionic-Swap does not guarantee availability, accuracy, or security.
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                Ionic-Swap and World of Unreal LLC disclaim any liability for
                errors, interruptions, losses, or damages arising from MVP use.
              </li>
              <li>
                By participating, you accept that your use is entirely at your
                own risk.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">5. Intellectual Property</h3>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                All code, documentation, and branding associated with Ionic-Swap
                are the intellectual property of World of Unreal LLC unless
                otherwise stated.
              </li>
              <li>
                Open-source repositories may be subject to separate licenses.
                Please review the license files in our GitHub repositories
                before use.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">
              6. Support & Communication
            </h3>
            <p class="mb-4">
              For questions, issues, or feature requests, you can reach us at:
            </p>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5" />
                <span>Email: support@ionicswap.com</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </UContainer>
</template>
