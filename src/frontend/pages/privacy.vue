<script setup>
  useHead({
    title: 'Privacy Policy - Ionic Swap',
    meta: [
      {
        name: 'description',
        content:
          'Read our privacy policy to learn how Ionic Swap handles your data and privacy.',
      },
      { property: 'og:title', content: 'Privacy Policy - Ionic Swap' },
      {
        property: 'og:description',
        content:
          'Read our privacy policy to learn how Ionic Swap handles your data and privacy.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ionicswap.com/privacy' },
      { property: 'og:image', content: '/logo.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Privacy Policy - Ionic Swap' },
      {
        name: 'twitter:description',
        content:
          'Read our privacy policy to learn how Ionic Swap handles your data and privacy.',
      },
      { name: 'twitter:image', content: '/logo.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://ionicswap.com/privacy' }],
  })
</script>
<template>
  <UContainer class="py-20">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>

      <div class="prose prose-lg dark:prose-invert max-w-none">
        <h2 class="text-2xl font-semibold mb-4">
          Privacy Policy – Ionic-Swap (MVP)
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Effective Date: 16th September 2025
        </p>

        <div class="space-y-8">
          <section>
            <h3 class="text-xl font-semibold mb-4">1. Scope</h3>
            <p class="mb-4">
              This Privacy Policy applies to the Ionic-Swap MVP. The MVP is
              provided solely for testing and evaluation purposes on
              non-production networks (e.g., Solana Devnet, Ethereum Sepolia,
              and ICP test environments).
            </p>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">2. Public Nature of Data</h3>
            <ul class="list-disc pl-6 space-y-2 mb-4">
              <li>
                All activity on the MVP (transactions, orders, staking, and
                related operations) is executed on-chain.
              </li>
              <li>
                By design, on-chain activity is public and permanently recorded.
              </li>
              <li>
                This means that profile information, transactions, and
                operations are viewable by anyone with access to the respective
                blockchain explorers.
              </li>
            </ul>
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg"
            >
              <p class="text-yellow-800 dark:text-yellow-200 font-medium">
                <strong>Recommendation:</strong> Do not use personal or
                sensitive information you do not wish to be public.
              </p>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">
              3. No Collection of Personal Data
            </h3>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                Ionic-Swap MVP does not actively collect personal information
                such as names, addresses, or identification data.
              </li>
              <li>
                Any data displayed (wallet addresses, orders, balances) comes
                directly from blockchain networks.
              </li>
              <li>
                We do not store private keys, seed phrases, or wallet
                credentials. Users are responsible for the security of their
                accounts.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">4. Use of Data</h3>
            <p class="mb-4">
              Data generated on Ionic-Swap MVP may be used for:
            </p>
            <ul class="list-disc pl-6 space-y-2 mb-4">
              <li>Platform testing and debugging</li>
              <li>
                Performance analytics (e.g., number of trades, liquidity flows)
              </li>
              <li>Improving future versions of Ionic-Swap</li>
            </ul>
            <p class="font-medium">
              No personal data is sold, rented, or shared with third parties.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">5. Third-Party Services</h3>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                The MVP may connect to public APIs (e.g., Binance, Coingecko,
                KuCoin) to fetch pricing information.
              </li>
              <li>
                These services have their own privacy practices, which users
                should review separately.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">6. User Responsibility</h3>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                You acknowledge that by using Ionic-Swap MVP, your blockchain
                activity is public.
              </li>
              <li>
                You are responsible for safeguarding your wallet credentials.
              </li>
              <li>
                Do not use sensitive personal identifiers (e.g., real names) in
                wallet profiles or transactions.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-semibold mb-4">
              7. Communication & Support
            </h3>
            <p class="mb-4">
              For privacy or support questions, contact us through:
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
