<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[10000] flex items-center justify-center"
  >
    <!-- Backdrop with blur effect -->
    <div class="absolute inset-0 bg-zinc-50/20 dark:bg-black/20 backdrop-blur-md" @click="close" />

    <!-- Modal Content -->
    <div
      class="relative bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full mx-4"
    >
      <div class="p-8">
        <!-- Header -->
        <div class="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Ionic Swap Logo" class="w-12 h-12 mb-2" >
          <h2 class="text-2xl font-bold text-center text-zinc-900 dark:text-white">Recover Ionic Wallet</h2>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Enter your 12-word recovery phrase to restore your account
          </p>
        </div>

        <!-- Success Message -->
        <div v-if="recoverySuccess" class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-check-circle-20-solid" class="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 class="text-sm font-medium text-green-900 dark:text-green-100">Account Recovered!</h3>
              <p class="text-sm text-green-700 dark:text-green-300">Welcome back to Ionic Swap</p>
            </div>
          </div>
        </div>

        <!-- Seed Phrase Input Grid -->
        <div v-if="!recoverySuccess" class="mb-6">
          <label class="block text-sm font-medium text-zinc-900 dark:text-white mb-4">
            Recovery Phrase (12 words)
          </label>
          
          <!-- Word grid with individual boxes -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div v-for="(word, index) in seedWords" :key="index" class="relative">
              <label :for="`word-${index}`" class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {{ index + 1 }}
              </label>
              <div class="relative">
                <input
                  :id="`word-${index}`"
                  v-model="seedWords[index]"
                  type="text"
                  @paste="handlePaste"
                  @keydown="handleKeyDown($event, index)"
                  :disabled="loading"
                  :class="[
                    'w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm font-mono transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    seedWords[index] && isWordValid(index) 
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                      : seedWords[index] && !isWordValid(index)
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                      : 'border-zinc-300 dark:border-zinc-600'
                  ]"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="word"
                />
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <UIcon 
                    v-if="seedWords[index] && isWordValid(index)" 
                    name="i-heroicons-check-circle-20-solid" 
                    class="w-4 h-4 text-green-500" 
                  />
                  <UIcon 
                    v-else-if="seedWords[index] && !isWordValid(index)" 
                    name="i-heroicons-x-circle-20-solid" 
                    class="w-4 h-4 text-red-500" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ validWordCount }}/12 words valid
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="!recoverySuccess" class="space-y-3">
          <UButton
            block
            size="lg"
            :loading="loading"
            :disabled="!isSeedPhraseValid"
            @click="recover"
            class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {{ loading ? 'Recovering...' : 'Recover Account' }}
          </UButton>

          <UButton
            block
            color="neutral"
            variant="soft"
            size="lg"
            @click="close"
            :disabled="loading"
          >
            Cancel
          </UButton>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h4 class="text-sm font-medium text-red-900 dark:text-red-100">Recovery Failed</h4>
              <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
            </div>
          </div>
        </div>
        
        <!-- Validation Messages -->
        <div v-if="!error && allWordsValidButInvalidChecksum" class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 class="text-sm font-medium text-yellow-900 dark:text-yellow-100">Invalid Checksum</h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">All words are valid, but they don't form a valid recovery phrase. Please check the word order.</p>
            </div>
          </div>
        </div>

        <div v-else-if="!error && isSeedPhraseValid && !recoverySuccess" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-check-circle-20-solid" class="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <h4 class="text-sm font-medium text-green-900 dark:text-green-100">Valid Recovery Phrase</h4>
              <p class="text-sm text-green-700 dark:text-green-300">Ready to recover your account</p>
            </div>
          </div>
        </div>
        
        <!-- Debug Information -->
        <div v-if="debugInfo" class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
          <details>
            <summary class="cursor-pointer font-medium text-yellow-900 dark:text-yellow-100">Debug Info (click to expand)</summary>
            <pre class="mt-2 whitespace-pre-wrap text-left text-yellow-800 dark:text-yellow-200">{{ debugInfo }}</pre>
          </details>
        </div>

        <!-- Info -->
        <div class="mt-6 text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Enter the 12-word recovery phrase from your Ionic wallet. You can paste the entire phrase or enter words individually.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { generateRandomUsername } from '@/utils/usernameGenerator'
  import { CrossChainSeedService } from '@/services/CrossChainSeedService'
  import { appCacheService } from '@/services/AppCacheService'
  import * as bip39 from 'bip39'

  const show = ref(false)
  const loading = ref(false)
  const error = ref('')
  const debugInfo = ref('')
  const recoverySuccess = ref(false)
  
  // Only grid mode - no switching bullshit
  const seedWords = ref(Array(12).fill(''))

  const auth = useAuthStore()
  const toast = useToast()

  defineExpose({
    open: () => {
      show.value = true
      error.value = ''
      debugInfo.value = ''
      recoverySuccess.value = false
      seedWords.value = Array(12).fill('')
    },
    close: () => {
      show.value = false
    },
  })

  // Normalize seed phrase - trim extra spaces and line breaks
  const normalizeSeedPhrase = (phrase: string): string => {
    if (!phrase) return ''
    return phrase.replace(/\s+/g, ' ').trim().toLowerCase()
  }

  // Validate each word individually
  const validateWord = (word: string): boolean => {
    if (!word) return false
    return bip39.wordlists.english.includes(word.toLowerCase().trim())
  }

  const isWordValid = (index: number): boolean => {
    const word = seedWords.value[index]
    return word ? validateWord(word) : true
  }

  // Computed properties
  const validWordCount = computed(() => {
    return seedWords.value.filter(word => word && validateWord(word)).length
  })

  const currentMnemonic = computed(() => {
    return normalizeSeedPhrase(seedWords.value.join(' '))
  })

  const isSeedPhraseValid = computed(() => {
    const mnemonic = currentMnemonic.value
    if (!mnemonic || mnemonic.split(' ').length !== 12) return false
    
    // Check if all words are valid
    const words = mnemonic.split(' ')
    const allWordsValid = words.every(word => validateWord(word))
    if (!allWordsValid) return false
    
    // Check BIP39 validation
    try {
      return bip39.validateMnemonic(mnemonic)
    } catch (error) {
      console.error('Error validating mnemonic:', error)
      return false
    }
  })

  const allWordsValidButInvalidChecksum = computed(() => {
    const mnemonic = currentMnemonic.value
    const words = mnemonic.split(' ').filter(w => w.trim())
    
    if (words.length !== 12) return false
    
    const allWordsValid = words.every(word => validateWord(word))
    const isValid = bip39.validateMnemonic(mnemonic)
    
    return allWordsValid && !isValid
  })

  // Handle paste event
  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    
    const pasteText = normalizeSeedPhrase((event.clipboardData || (window as any).clipboardData).getData('text'))
    const words = pasteText.split(/\s+/)
    
    console.log(`Pasted text contains ${words.length} words`)

    // Fill the grid inputs
    if (words.length >= 12) {
      seedWords.value = words.slice(0, 12)
    } else {
      const newSeedWords = Array(12).fill('')
      words.forEach((word, index) => {
        if (index < 12) newSeedWords[index] = word
      })
      seedWords.value = newSeedWords
    }
  }

  // Handle keyboard navigation for grid mode
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault()
      if (index < 11) {
        const nextInput = document.getElementById(`word-${index + 1}`) as HTMLInputElement
        nextInput?.focus()
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (index > 0) {
        const prevInput = document.getElementById(`word-${index - 1}`) as HTMLInputElement
        prevInput?.focus()
      }
    } else if (event.key === 'Enter' && isSeedPhraseValid.value) {
      recover()
    }
  }


  async function recover() {
    if (!isSeedPhraseValid.value) {
      error.value = 'Please enter a valid 12-word recovery phrase'
      return
    }

    loading.value = true
    error.value = ''
    debugInfo.value = ''

    try {
      const inputMnemonic = currentMnemonic.value
      console.log('Raw input words:', seedWords.value)
      console.log('Normalized mnemonic:', inputMnemonic)
      console.log('Starting recovery with mnemonic:', inputMnemonic.split(' ').slice(0, 3).join(' ') + '...')

      // 1. Validate mnemonic first
      if (!CrossChainSeedService.isValidMnemonic(inputMnemonic)) {
        throw new Error('Invalid mnemonic format - please check your recovery phrase')
      }

      // 2. Generate addresses from mnemonic (same as LocalWalletAdapter now)
      const recovered = await CrossChainSeedService.fromMnemonic(inputMnemonic)
      console.log('Generated addresses from mnemonic:', {
        principal: recovered.principal,
        evmAddress: recovered.evmAddress,
        solAddress: recovered.solAddress,
        btcAddress: recovered.btcAddress
      })

      // 3. Initialize canister service
      await canisterService.initialize(recovered.identity)
      console.log('Canister service initialized')

      // 4. Check if user exists
      const existingProfile = await canisterService.getMyProfile()
      console.log('Profile lookup result:', existingProfile ? 'found' : 'not found')

      if (existingProfile) {
        // Existing user - same as login success
        console.log('Existing user found, completing login...')
        
        // Update auth store
        auth.authenticated = true
        auth.registered = true
        auth.userProfile = existingProfile
        auth.principal = recovered.principal
        auth.evmAddress = recovered.evmAddress
        auth.solAddress = recovered.solAddress
        auth.btcAddress = recovered.btcAddress
        auth.nativeWallet = 'local'
        auth.canisterInitialized = true

        // Save session for persistence
        const sessionData = {
          authenticated: true,
          registered: true,
          principal: recovered.principal,
          evmAddress: recovered.evmAddress,
          solAddress: recovered.solAddress,
          btcAddress: recovered.btcAddress,
          nativeWallet: 'local',
          canisterInitialized: true,
          originalWalletType: 'local',
          originalMnemonic: inputMnemonic,
          originalSignature: `local-wallet-mnemonic-${inputMnemonic}`,
        }
        appCacheService.saveSession(sessionData)

        // Update legacy player object
        auth.player = {
          username: existingProfile.username,
          displayName: existingProfile.display_name.length > 0 ? existingProfile.display_name[0] : null,
          avatarPreset: 1,
          avatarUrl: existingProfile.avatar_url.length > 0 ? existingProfile.avatar_url[0] : null,
          bannerUrl: null,
          ethAddress: recovered.evmAddress,
          principal: recovered.principal,
          walletType: 'local',
        }

        auth.saveStateToLocalStorage()

        recoverySuccess.value = true
        
        // Close modal and navigate after showing success
        setTimeout(() => {
          show.value = false
          navigateTo('/profile')
        }, 2000)

        toast.add({
          title: 'Account Recovered!',
          description: `Welcome back, ${existingProfile.username}!`,
          color: 'success',
        })
      } else {
        // New user - AUTO-REGISTER (same as login flow)
        console.log('New user, auto-registering with random username...')
        
        // Generate a random username
        let username = generateRandomUsername()
        let attempts = 0
        const maxAttempts = 10

        // Try to find an available username
        while (attempts < maxAttempts) {
          const isAvailable = await canisterService.isUsernameAvailable(username)
          if (isAvailable) {
            break
          }
          username = generateRandomUsername()
          attempts++
        }

        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate available username. Please try again.')
        }

        console.log('Auto-registering user with username:', username)

        // Auto-register the user
        const profile = await canisterService.signup(
          username,
          recovered.evmAddress || undefined,
          recovered.btcAddress || undefined,
          recovered.solAddress || undefined
        )

        console.log('Auto-registration successful:', profile)

        // Update auth store
        auth.authenticated = true
        auth.registered = true
        auth.userProfile = profile
        auth.principal = recovered.principal
        auth.evmAddress = recovered.evmAddress
        auth.solAddress = recovered.solAddress
        auth.btcAddress = recovered.btcAddress
        auth.nativeWallet = 'local'
        auth.canisterInitialized = true

        // Save session for persistence
        const sessionData = {
          authenticated: true,
          registered: true,
          principal: recovered.principal,
          evmAddress: recovered.evmAddress,
          solAddress: recovered.solAddress,
          btcAddress: recovered.btcAddress,
          nativeWallet: 'local',
          canisterInitialized: true,
          originalWalletType: 'local',
          originalMnemonic: inputMnemonic,
          originalSignature: `local-wallet-mnemonic-${inputMnemonic}`,
        }
        appCacheService.saveSession(sessionData)

        // Update legacy player object
        auth.player = {
          username: profile.username,
          displayName: profile.display_name.length > 0 ? profile.display_name[0] : null,
          avatarPreset: 1,
          avatarUrl: profile.avatar_url.length > 0 ? profile.avatar_url[0] : null,
          bannerUrl: null,
          ethAddress: recovered.evmAddress,
          principal: recovered.principal,
          walletType: 'local',
        }

        auth.saveStateToLocalStorage()

        recoverySuccess.value = true

        // Close modal and navigate after showing success
        setTimeout(() => {
          show.value = false
          navigateTo('/profile')
        }, 2000)

        toast.add({
          title: `Welcome to Ionic Swap ${profile.username}!`,
          description: 'Your account has been recovered and you received 2M USDT automatically!',
          color: 'success',
        })
      }
    } catch (err: unknown) {
      console.error('Recovery failed:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Recovery failed. Please check your recovery phrase.'
      error.value = errorMessage

      // Generate detailed debug info
      let recovered: any = null
      const normalizedInput = currentMnemonic.value
      try {
        recovered = await CrossChainSeedService.fromMnemonic(normalizedInput)
      } catch (recoveryError) {
        // Ignore - we'll show this in debug info
      }

      debugInfo.value = JSON.stringify({
        rawInputWords: seedWords.value,
        normalizedInput: normalizedInput,
        inputMnemonic: normalizedInput.split(' ').slice(0, 3).join(' ') + '... (' + normalizedInput.split(' ').length + ' words)',
        mnemonicWordCount: normalizedInput.split(' ').length,
        isValidMnemonic: CrossChainSeedService.isValidMnemonic(normalizedInput),
        generatedPrincipal: recovered?.principal || 'failed to generate',
        generatedEvmAddress: recovered?.evmAddress || 'failed to generate',
        generatedSolAddress: recovered?.solAddress || 'failed to generate',
        generatedBtcAddress: recovered?.btcAddress || 'failed to generate',
        canisterInitialized: auth.canisterInitialized,
        errorMessage: errorMessage,
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        timestamp: new Date().toISOString()
      }, null, 2)

      toast.add({
        title: 'Recovery Failed',
        description: errorMessage,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  function close() {
    show.value = false
    error.value = ''
    debugInfo.value = ''
    recoverySuccess.value = false
    seedWords.value = Array(12).fill('')
  }

  // Focus first input on mount
  onMounted(() => {
    setTimeout(() => {
      const firstInput = document.getElementById('word-0') as HTMLInputElement
      firstInput?.focus()
    }, 100)
  })
</script>