<template>
  <!-- Simple Modal Overlay -->
  <div
    id="withdrawal-modal"
    :class="[
      'fixed inset-0 z-[9999] flex items-center justify-center',
      show ? '' : 'hidden',
    ]"
  >oklch(21% 0.006 285.885)
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-zinc-50/20 dark:bg-black/20 backdrop-blur-md"
      @click="close"
    />
    <!-- Modal Content -->
    <div
      class="relative bg-zinc-50 dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full mx-4"
    >
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-zinc-900 dark:text-white">
            Withdraw {{ selectedToken }}
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="close"
          />
        </div>

        <div class="space-y-6">
          <!-- Development Notice -->
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div class="flex items-start">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 class="text-sm font-medium text-amber-800 dark:text-amber-200">Withdrawals in Development</h4>
                <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Withdrawal functionality is currently under development. This feature will be available soon.
                </p>
              </div>
            </div>
          </div>

          <!-- Available Balance -->
          <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-zinc-500 dark:text-zinc-400">Available Balance</span>
              <span class="text-lg font-semibold text-zinc-900 dark:text-white">
                <span v-if="balancesVisible">
                  {{ formatTokenAmount(selectedToken, getTokenBalance(selectedToken)) }} {{ selectedToken }}
                </span>
                <span v-else>•••••• {{ selectedToken }}</span>
              </span>
            </div>
          </div>

          <!-- Wallet Selection -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-zinc-900 dark:text-white">Select Withdrawal Wallet</h4>
            
            <div class="space-y-3">
              <!-- EVM Wallet -->
              <div 
                v-if="userProfile?.evm_address?.[0]" 
                class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                :class="{ 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedWallet === 'evm' }"
                @click="selectedWallet = 'evm'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <UIcon name="i-heroicons-cube" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 dark:text-white">EVM Wallet</div>
                      <div class="text-sm text-zinc-500 dark:text-zinc-400">Ethereum, BSC, Polygon</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-zinc-500 dark:text-zinc-400">Address</div>
                    <div class="text-sm font-mono text-zinc-900 dark:text-white">{{ formatAddress(userProfile.evm_address[0]) }}</div>
                  </div>
                </div>
              </div>

              <!-- Bitcoin Wallet -->
              <div 
                v-if="userProfile?.bitcoin_address?.[0]" 
                class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                :class="{ 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20': selectedWallet === 'bitcoin' }"
                @click="selectedWallet = 'bitcoin'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <UIcon name="logos:bitcoin" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 dark:text-white">Bitcoin Wallet</div>
                      <div class="text-sm text-zinc-500 dark:text-zinc-400">Bitcoin Network</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-zinc-500 dark:text-zinc-400">Address</div>
                    <div class="text-sm font-mono text-zinc-900 dark:text-white">{{ formatAddress(userProfile.bitcoin_address[0]) }}</div>
                  </div>
                </div>
              </div>

              <!-- Solana Wallet -->
              <div 
                v-if="userProfile?.solana_address?.[0]" 
                class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                :class="{ 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20': selectedWallet === 'solana' }"
                @click="selectedWallet = 'solana'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <UIcon name="token-branded:solana" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 dark:text-white">Solana Wallet</div>
                      <div class="text-sm text-zinc-500 dark:text-zinc-400">Solana Network</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-zinc-500 dark:text-zinc-400">Address</div>
                    <div class="text-sm font-mono text-zinc-900 dark:text-white">{{ formatAddress(userProfile.solana_address[0]) }}</div>
                  </div>
                </div>
              </div>

              <!-- ICP Wallet -->
              <div 
                v-if="userProfile?.id" 
                class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                :class="{ 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/20': selectedWallet === 'icp' }"
                @click="selectedWallet = 'icp'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                      <UIcon name="token-branded:icp" class="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 dark:text-white">ICP Wallet</div>
                      <div class="text-sm text-zinc-500 dark:text-zinc-400">Internet Computer</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-zinc-500 dark:text-zinc-400">Principal</div>
                    <div class="text-sm font-mono text-zinc-900 dark:text-white">{{ formatAddress(userProfile.id.toText()) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <UButton
            color="gray"
            variant="soft"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :disabled="!selectedWallet"
            @click="confirmWithdrawal"
          >
            Continue Withdrawal
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '#imports'
import { TokenService } from '@/services/TokenService'

interface Props {
  selectedToken: string
  userProfile: any
  balancesVisible: boolean
  userBalances: Record<string, number>
}

const props = defineProps<Props>()

const show = ref(false)
const selectedWallet = ref('')
const toast = useToast()

// Format address for display
const formatAddress = (address: string) => {
  if (!address) return ''
  if (address.startsWith('0x')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  if (address.startsWith('bc1')) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  if (address.length > 20) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  return address
}

// Format token amount for display using TokenService
const formatTokenAmount = (symbol: string, balance: number) => {
  return TokenService.formatBalance(balance, symbol)
}

// Get token balance
const getTokenBalance = (symbol: string) => {
  return props.userBalances[symbol] || 0
}

// Confirm withdrawal
const confirmWithdrawal = () => {
  if (!selectedWallet.value) return
  
  toast.add({
    title: 'Withdrawals Coming Soon',
    description: `Withdrawal functionality for ${props.selectedToken} is currently under development`,
    color: 'info',
  })
  
  close()
}

// Close modal
const close = () => {
  show.value = false
  selectedWallet.value = ''
}

// Open modal
const open = () => {
  show.value = true
  selectedWallet.value = ''
}

defineExpose({
  open,
  close,
})
</script>
