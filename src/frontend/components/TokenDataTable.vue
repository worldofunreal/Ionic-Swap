<template>
  <div class="overflow-x-auto flex-1">
    <table class="min-w-5xl w-full text-sm">
      <thead>
        <tr class="bg-neutral-100 dark:bg-neutral-800">
          <th
            v-for="col in columns"
            :key="col.key"
            class="p-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer select-none"
            @click="sort(col.key)"
          >
            <span>{{ col.label }}</span>
            <UIcon
              v-if="sortColumn === col.key"
              :name="sortOrder === 'asc' ? 'bxs:up-arrow' : 'bxs:down-arrow'"
              class="inline ml-1 text-xs"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="token in sortedTokens"
          :key="token.symbol"
          class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <!-- TOKEN -->
          <td class="p-4 flex items-center gap-2">
            <UIcon :name="token.icon" class="w-7 h-7 text-3xl" />
            <div class="min-w-0">
              <NuxtLink
                :to="`/tokens/${token.symbol}`"
                class="font-bold text-gray-900 dark:text-white hover:underline"
                >{{ token.symbol }}</NuxtLink
              >
              <div class="text-xs text-gray-600 dark:text-gray-500 truncate">
                {{ token.name }}
              </div>
            </div>
          </td>
          <!-- PRICE -->
          <td class="p-4 font-mono text-gray-900 dark:text-white">
            {{ token.price }}
          </td>
          <!-- 1H CHANGE -->
          <td
            class="p-4 font-mono"
            :class="
              token.change1h >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            <UIcon
              :name="token.change1h >= 0 ? 'bxs:up-arrow' : 'bxs:down-arrow'"
              class="inline text-xs"
            />
            {{ token.change1h }}%
          </td>
          <!-- 24H CHANGE -->
          <td
            class="p-4 font-mono"
            :class="
              token.change24h >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            <UIcon
              :name="token.change24h >= 0 ? 'bxs:up-arrow' : 'bxs:down-arrow'"
              class="inline text-xs"
            />
            {{ token.change24h }}%
          </td>
          <!-- 7D CHANGE -->
          <td
            class="p-4 font-mono"
            :class="
              token.change7d >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            <UIcon
              :name="token.change7d >= 0 ? 'bxs:up-arrow' : 'bxs:down-arrow'"
              class="inline text-xs"
            />
            {{ token.change7d }}%
          </td>
          <!-- 1D VOL -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ token.vol1d }}
          </td>
          <!-- MARKET CAP -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ token.marketCap }}
          </td>
          <!-- SUPPLY -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ token.supply }}
          </td>
          <!-- FDV -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ token.fdv }}
          </td>
          <!-- LAST 7D (Sparkline) -->
          <td class="p-4">
            <div
              class="h-6 w-24 bg-gradient-to-r from-primary-100 to-primary-300 dark:from-primary-900 dark:to-primary-700 rounded flex items-center justify-center text-xs text-primary-700 dark:text-primary-200"
            >
              [sparkline]
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed } from 'vue'

  interface TokenRow extends Record<string, any> {
    icon: string
    symbol: string
    name: string
    price: string
    change1h: number
    change24h: number
    change7d: number
    vol1d: string
    marketCap: string
    supply: string
    fdv: string
    sparkline: number[]
  }

  const columns = [
    { key: 'token', label: 'TOKEN' },
    { key: 'price', label: 'PRICE' },
    { key: 'change1h', label: '1H CHANGE' },
    { key: 'change24h', label: '24H CHANGE' },
    { key: 'change7d', label: '7D CHANGE' },
    { key: 'vol1d', label: '1D VOL' },
    { key: 'marketCap', label: 'MARKET CAP' },
    { key: 'supply', label: 'SUPPLY' },
    { key: 'fdv', label: 'FDV' },
    { key: 'sparkline', label: 'LAST 7D' },
  ]
  const sortColumn = ref<string>('marketCap')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const tokens = ref<TokenRow[]>([
    {
      icon: 'token-branded:icp',
      symbol: 'ICP',
      name: 'Internet Computer',
      price: '$12.34',
      change1h: 0.2,
      change24h: 4.2,
      change7d: 8.1,
      vol1d: '$12.3M',
      marketCap: '$5.1B',
      supply: '450M',
      fdv: '$6.2B',
      sparkline: [],
    },
    {
      icon: 'token-branded:ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: '$3,200',
      change1h: -0.1,
      change24h: 2.1,
      change7d: 5.7,
      vol1d: '$23.1B',
      marketCap: '$380B',
      supply: '120M',
      fdv: '$380B',
      sparkline: [],
    },
    {
      icon: 'token-branded:solana',
      symbol: 'SOL',
      name: 'Solana',
      price: '$145',
      change1h: 0.5,
      change24h: -1.1,
      change7d: 2.7,
      vol1d: '$2.3B',
      marketCap: '$65B',
      supply: '440M',
      fdv: '$65B',
      sparkline: [],
    },
    {
      icon: 'token-branded:bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '$67,000',
      change1h: 0.1,
      change24h: 0.5,
      change7d: 1.2,
      vol1d: '$34.2B',
      marketCap: '$1.3T',
      supply: '19.7M',
      fdv: '$1.3T',
      sparkline: [],
    },
  ])
  function sort(key: string) {
    if (sortColumn.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = key
      sortOrder.value = 'desc'
    }
  }
  const sortedTokens = computed(() => {
    const col = sortColumn.value
    const order = sortOrder.value
    return [...tokens.value].sort((a, b) => {
      if (typeof a[col] === 'string' && a[col][0] === '$') {
        // Remove $ and commas for numeric sort
        const numA = parseFloat(a[col].replace(/[$,MBT]/g, ''))
        const numB = parseFloat(b[col].replace(/[$,MBT]/g, ''))
        return order === 'asc' ? numA - numB : numB - numA
      }
      if (typeof a[col] === 'number') {
        return order === 'asc' ? a[col] - b[col] : b[col] - a[col]
      }
      return 0
    })
  })
</script>
