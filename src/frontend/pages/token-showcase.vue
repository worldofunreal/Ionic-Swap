<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <UContainer>
      <div class="py-8 pt-32">
        <h1
          class="text-4xl md:text-5xl font-extrabold mb-10 text-center text-gray-900 dark:text-white tracking-tight"
        >
          Token Ecosystem
        </h1>
        <p
          class="text-xl text-gray-600 text-center dark:text-gray-500 max-w-3xl mx-auto"
        >
          Discover the diverse range of tokens available for cross-chain swapping on Ionic Swap.
        </p>
      </div>

      <!-- Top Filter Row (always at top, full width) -->
      <div class="w-full flex flex-col md:flex-row gap-4 mb-8">
        <select
          v-model="selectedCategory"
          class="w-full md:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All Categories</option>
          <option v-for="category in uniqueCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        <select
          v-model="selectedChain"
          class="w-full md:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All Chains</option>
          <option v-for="chain in uniqueChains" :key="chain" :value="chain">
            {{ chain }}
          </option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens..."
          class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
        >
      </div>
      <div class="py-8">
        <main>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            <UCard
              v-for="token in filteredTokens"
              :key="token.id"
              class="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-neutral-950"
            >
              <!-- Token Image -->
              <div class="relative h-48 overflow-hidden">
                <img
                  :src="token.image"
                  :alt="`${token.name} (${token.symbol}) - ${token.category} token on ${token.chains.join(', ')}`"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                >
                <div class="absolute bottom-4 left-4">
                  <span
                    class="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                  >
                    {{ token.category }}
                  </span>
                </div>
                <div class="absolute top-4 right-4">
                  <div class="flex gap-1">
                    <span
                      v-for="chain in token.chains"
                      :key="chain"
                      class="bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium"
                    >
                      {{ chain }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Token Content -->
              <div class="p-6">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ token.name }}
                  </h3>
                  <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {{ token.symbol }}
                  </span>
                </div>
                <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {{ token.description }}
                </p>
                
                <!-- Price Info -->
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-lg font-semibold text-gray-900 dark:text-white">
                      ${{ token.price.toFixed(2) }}
                    </p>
                    <p
                      class="text-sm font-medium"
                      :class="token.change24h >= 0 ? 'text-green-500' : 'text-red-500'"
                    >
                      {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      ${{ token.marketCap }}
                    </p>
                  </div>
                </div>

                <!-- Tech Stack -->
                <div class="flex flex-wrap gap-2 mb-4">
                  <UBadge
                    v-for="tech in token.tech"
                    :key="tech"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  >
                    {{ tech }}
                  </UBadge>
                </div>
                
                <!-- Action Button -->
                <UButton
                  color="primary"
                  variant="ghost"
                  class="w-full group-hover:bg-primary-50 dark:group-hover:bg-primary-950"
                  @click="swapToken(token)"
                >
                  Swap {{ token.symbol }}
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="ml-2 group-hover:rotate-180 transition-transform"
                  />
                </UButton>
              </div>
            </UCard>
          </div>
        </main>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useColorTheme } from '@/composables/useColorTheme'

const { currentTheme } = useColorTheme()

const selectedCategory = ref('All')
const selectedChain = ref('All')
const searchQuery = ref('')

const tokens = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'Store of Value',
    description: 'The original cryptocurrency and digital gold. Bitcoin serves as a decentralized store of value and medium of exchange.',
    image: '/icons/btc.svg',
    price: 65000,
    change24h: 1.25,
    marketCap: '1.2T',
    chains: ['EVM', 'ICP'],
    tech: ['PoW', 'Store of Value', 'Digital Gold']
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    category: 'Smart Contracts',
    description: 'The leading smart contract platform enabling decentralized applications, DeFi, and NFT ecosystems.',
    image: '/icons/eth.svg',
    price: 3500,
    change24h: -0.75,
    marketCap: '420B',
    chains: ['EVM', 'ICP'],
    tech: ['Smart Contracts', 'DeFi', 'PoS']
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    category: 'High Performance',
    description: 'High-speed blockchain platform designed for decentralized apps and crypto-currencies with sub-second finality.',
    image: '/icons/sol.svg',
    price: 150,
    change24h: -1.50,
    marketCap: '65B',
    chains: ['Solana', 'ICP'],
    tech: ['High Speed', 'Low Fees', 'PoH']
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    category: 'Stablecoin',
    description: 'Fully-backed US dollar stablecoin providing stability and liquidity in the crypto ecosystem.',
    image: '/icons/usdc.svg',
    price: 1.0,
    change24h: 0.00,
    marketCap: '28B',
    chains: ['EVM', 'Solana', 'ICP'],
    tech: ['Stablecoin', 'USD Backed', 'Regulated']
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    category: 'Stablecoin',
    description: 'The most widely adopted stablecoin, providing stability and liquidity across multiple blockchain networks.',
    image: '/icons/usdt.svg',
    price: 1.0,
    change24h: 0.01,
    marketCap: '95B',
    chains: ['EVM', 'ICP'],
    tech: ['Stablecoin', 'Liquidity', 'Cross-Chain']
  },
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    category: 'Web3 Infrastructure',
    description: 'Blockchain computer that extends the internet with smart contract functionality and web speed.',
    image: '/icons/icp.svg',
    price: 12.0,
    change24h: 4.50,
    marketCap: '5.5B',
    chains: ['ICP'],
    tech: ['Web3', 'Smart Contracts', 'Chain Key']
  },
  {
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    category: 'Exchange Token',
    description: 'Binance Coin powers the Binance ecosystem and provides utility across multiple blockchain networks.',
    image: '/icons/bnb.svg',
    price: 600,
    change24h: 0.90,
    marketCap: '90B',
    chains: ['EVM', 'ICP'],
    tech: ['Exchange', 'Utility', 'BSC']
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    category: 'Payment',
    description: 'Digital asset built for payments, enabling fast and low-cost cross-border transactions.',
    image: '/icons/xrp.svg',
    price: 0.5,
    change24h: 2.10,
    marketCap: '28B',
    chains: ['EVM', 'ICP'],
    tech: ['Payments', 'Cross-Border', 'Fast']
  },
  {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGE',
    category: 'Meme Coin',
    description: 'The original meme cryptocurrency with a strong community and growing utility in payments.',
    image: '/icons/doge.svg',
    price: 0.15,
    change24h: 3.40,
    marketCap: '21B',
    chains: ['EVM', 'ICP'],
    tech: ['Meme', 'Community', 'Payments']
  }
]

const uniqueCategories = computed(() => {
  const categories = new Set(tokens.map(token => token.category))
  return Array.from(categories).sort()
})

const uniqueChains = computed(() => {
  const chains = new Set(tokens.flatMap(token => token.chains))
  return Array.from(chains).sort()
})

const filteredTokens = computed(() => {
  return tokens.filter(token => {
    const matchesCategory = selectedCategory.value === 'All' || token.category === selectedCategory.value
    const matchesChain = selectedChain.value === 'All' || token.chains.includes(selectedChain.value)
    const matchesSearch = searchQuery.value === '' || 
      token.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      token.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesCategory && matchesChain && matchesSearch
  })
})

const swapToken = (token: any) => {
  // Navigate to swap page with pre-selected token
  navigateTo(`/?from=${token.symbol}`)
}

useHead({
  title: 'Token Showcase - Ionic Swap',
  meta: [
    {
      name: 'description',
      content: 'Discover the diverse range of tokens available for cross-chain swapping on Ionic Swap. Explore Bitcoin, Ethereum, Solana, and more.',
    },
    { property: 'og:title', content: 'Token Showcase - Ionic Swap' },
    {
      property: 'og:description',
      content: 'Discover the diverse range of tokens available for cross-chain swapping on Ionic Swap.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://ionicswap.com/token-showcase' },
    { property: 'og:image', content: '/logo.svg' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Token Showcase - Ionic Swap' },
    {
      name: 'twitter:description',
      content: 'Discover the diverse range of tokens available for cross-chain swapping on Ionic Swap.',
    },
    { name: 'twitter:image', content: '/logo.svg' },
  ],
  link: [{ rel: 'canonical', href: 'https://ionicswap.com/token-showcase' }],
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>