<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="positions.length === 0" class="text-center py-8">
      <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-banknotes-20-solid" class="w-8 h-8" />
      </div>
      <p class="text-base font-medium text-zinc-900 dark:text-white mb-2">{{ emptyTitle }}</p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{{ emptyDescription }}</p>
      <slot name="cta" />
    </div>

    <!-- Positions List -->
    <div v-else class="space-y-4">
      <div
        v-for="position in positions"
        :key="position.id"
        class="bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-4 border border-transparent hover:border-primary-500 transition-colors"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <img :src="TokenService.getTokenIcon(position.token_symbol)" :alt="`${position.token_symbol} icon`" class="w-10 h-10" />
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white">{{ position.token_symbol }} Pool</div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">ID: {{ position.id.slice(-8) }}</div>
            </div>
          </div>
          <div 
            :class="[
              'px-3 py-1 text-xs rounded-full font-medium',
              getNeuronStateClass(position.state)
            ]"
          >
            {{ formatNeuronState(position.state) }}
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div class="text-zinc-500 dark:text-zinc-400 mb-1">Staked Amount</div>
            <div class="font-semibold text-zinc-900 dark:text-white">
              {{ TokenService.formatBalance(typeof position.staked_amount === 'bigint' ? Number(position.staked_amount) : position.staked_amount, position.token_symbol) }} {{ position.token_symbol }}
            </div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-400 mb-1">Voting Power</div>
            <div class="font-semibold text-zinc-900 dark:text-white">{{ calculateVotingPower(position).toFixed(2) }}</div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-400 mb-1">Dissolve Delay</div>
            <div class="font-semibold text-zinc-900 dark:text-white">{{ formatDuration(position.dissolve_delay_seconds) }}</div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-400 mb-1">Age</div>
            <div class="font-semibold text-zinc-900 dark:text-white">{{ formatAge(position.created_at) }}</div>
          </div>
        </div>

        <!-- Claimable Fees -->
        <div class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-500 dark:text-zinc-400">Claimable Fees</span>
            <div class="text-right">
              <div class="font-semibold text-zinc-900 dark:text-white">
                {{ calculateClaimableFees(position).toFixed(6) }} {{ position.token_symbol }}
              </div>
            </div>
          </div>
        </div>

        <!-- Position Actions (only show if showActions is true) -->
        <div v-if="showActions" class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div class="flex gap-2">
            <button
              v-if="position.state.Locked"
              @click="$emit('start-dissolving', position)"
              class="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Start Dissolving
            </button>
            <button
              v-if="position.state.Dissolving"
              @click="$emit('stop-dissolving', position)"
              class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Stop Dissolving
            </button>
            <button
              v-if="position.state.Dissolved"
              @click="$emit('withdraw', position)"
              class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Withdraw
            </button>
            <button
              @click="$emit('claim-fees', position)"
              class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Claim Fees
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { TokenService } from '@/services/TokenService'

  interface Position {
    id: string
    token_symbol: string
    staked_amount: number | bigint
    dissolve_delay_seconds: number | bigint
    created_at: number | bigint
    state: any
    last_fee_index?: number
  }

  interface Props {
    positions: Position[]
    loading?: boolean
    showActions?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    showActions: true,
    emptyTitle: 'No liquidity positions',
    emptyDescription: "You don't have any liquidity positions yet."
  })

  defineEmits<{
    'start-dissolving': [position: Position]
    'stop-dissolving': [position: Position]
    'withdraw': [position: Position]
    'claim-fees': [position: Position]
  }>()

  // Helper functions
  const formatNeuronState = (state: any) => {
    if (state && typeof state === 'object') {
      if ('Locked' in state) return 'Locked'
      if ('Dissolving' in state) return 'Dissolving'
      if ('Dissolved' in state) return 'Dissolved'
    }
    return 'Unknown'
  }

  const getNeuronStateClass = (state: any) => {
    if (state.Locked) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (state.Dissolving) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (state.Dissolved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
  }

  const formatDuration = (seconds: number | bigint) => {
    const secondsNum = typeof seconds === 'bigint' ? Number(seconds) : seconds
    const days = Math.floor(secondsNum / (24 * 3600))
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''}`
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`
    if (days >= 7) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
    const hours = Math.floor(secondsNum / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const formatAge = (timestamp: number | bigint) => {
    const now = Date.now() / 1000
    const age = now - Number(timestamp)
    return formatDuration(age)
  }

  const calculateVotingPower = (position: Position) => {
    const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    return stakeAmount * delayMultiplier * ageMultiplier
  }

  const calculateClaimableFees = (position: Position) => {
    // Simplified calculation - in real implementation this would need pool data
    // For now, use a basic calculation based on the position's fee index if available
    const feeIndexDifference = (position.last_fee_index || 0)
    const stakeAmount = Number(position.staked_amount)
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    const rawVotingPower = stakeAmount * delayMultiplier * ageMultiplier
    
    const claimableFeesRaw = feeIndexDifference * rawVotingPower
    
    return claimableFeesRaw / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
  }
</script>
