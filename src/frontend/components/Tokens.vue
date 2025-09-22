<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-zinc-100 dark:bg-zinc-900">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Coin
          </th>
          <th class="px-6 py-3 text-right text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Amount
          </th>
          <th class="px-6 py-3 text-right text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Price
          </th>
          <th class="px-6 py-3 text-right text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Today's PnL
          </th>
          <th v-if="showActions" class="px-6 py-3 text-right text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody class="bg-zinc-100 dark:bg-zinc-900 divide-y divide-default">
        <tr v-if="tokens.length === 0">
          <td :colspan="showActions ? 5 : 4" class="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
            <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-currency-dollar-20-solid" class="w-8 h-8" />
            </div>
            <p class="text-base font-medium">{{ emptyTitle }}</p>
            <p class="text-sm">{{ emptyDescription }}</p>
          </td>
        </tr>
        <tr
          v-for="token in tokens"
          :key="token.symbol"
          class="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <!-- Coin Column -->
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <img :src="TokenService.getTokenIcon(token.symbol)" :alt="`${token.symbol} icon`" class="w-10 h-10 mr-3" />
              <div>
                <div class="text-sm font-semibold text-zinc-900 dark:text-white">
                  {{ token.symbol }}
                </div>
                <div class="text-sm text-zinc-500 dark:text-zinc-400">
                  {{ TokenService.getTokenName(token.symbol) }}
                </div>
              </div>
            </div>
          </td>

          <!-- Amount Column -->
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <div class="text-sm font-bold text-zinc-900 dark:text-white">
              <span v-if="balancesVisible">{{ formatTokenAmount(token.symbol, token.balance) }}</span>
              <span v-else>••••••••</span>
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              <span v-if="balancesVisible">{{ valueDisplay === 'usd' ? formatTokenValue(token.value) : formatTokenValueBTC(token.value) }}</span>
              <span v-else>••••••</span>
            </div>
          </td>

          <!-- Coin Price / Cost Price Column -->
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <div class="text-sm font-semibold text-zinc-900 dark:text-white">
              <span v-if="balancesVisible">{{ valueDisplay === 'usd' ? formatTokenPrice(token.price) : formatTokenPriceBTC(token.price) }}</span>
              <span v-else>••••••</span>
            </div>
          </td>

          <!-- Today's PnL Column -->
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <div class="text-sm font-semibold" :class="token.change24h >= 0 ? 'text-green-500' : 'text-red-500'">
              <span v-if="balancesVisible">
                {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
              </span>
              <span v-else>••••••</span>
            </div>
          </td>

          <!-- Action Column -->
          <td v-if="showActions" class="px-6 py-4 whitespace-nowrap text-right">
            <div class="flex justify-end gap-2">
              <button
                @click="$emit('trade', token.symbol)"
                class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Trade
              </button>
              <button
                @click="$emit('stake', token.symbol)"
                class="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Stake
              </button>
              <button
                @click="$emit('withdraw', token.symbol)"
                class="px-4 py-2 bg-zinc-500 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Withdraw
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { TokenService } from '@/services/TokenService'

  interface TokenRow {
    symbol: string
    balance: number
    value: number
    price: number
    change24h: number
  }

  interface Props {
    tokens: TokenRow[]
    balancesVisible?: boolean
    valueDisplay?: 'usd' | 'btc'
    btcPrice?: number
    showActions?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    balancesVisible: true,
    valueDisplay: 'usd',
    btcPrice: 45000,
    showActions: true,
    emptyTitle: 'Loading Assets...',
    emptyDescription: 'Fetching token balances'
  })

  defineEmits<{
    trade: [symbol: string]
    stake: [symbol: string]
    withdraw: [symbol: string]
  }>()

  // Format functions
  const formatTokenAmount = (symbol: string, balance: number) => {
    return TokenService.formatBalance(balance, symbol)
  }

  const formatTokenValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTokenPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTokenValueBTC = (value: number) => {
    const btcValue = value / props.btcPrice
    return `${btcValue.toFixed(8)} BTC`
  }

  const formatTokenPriceBTC = (price: number) => {
    const btcValue = price / props.btcPrice
    return `${btcValue.toFixed(8)} BTC`
  }
</script>
