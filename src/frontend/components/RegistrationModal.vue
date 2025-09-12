<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-100 dark:border-gray-800"
    >
      <!-- Header with Logo -->
      <div
        class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800"
      >
        <div class="flex items-center gap-3">
          <img src="/logo.svg" alt="Ionic Swap" class="w-8 h-8" >
        </div>
        <button
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          @click="close()"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-5">
        <!-- Welcome Text -->
        <div class="text-center mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Welcome to Ionic Swap
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Choose your username to get started
          </p>
        </div>

        <!-- Username Input -->
        <div class="mb-6">
          <label
            class="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide"
            >Username</label
          >
          <input
            v-model="username"
            type="text"
            placeholder="Enter username"
            required
            maxlength="16"
            :disabled="loading"
            class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
            @input="checkUsernameAvailability"
          >

          <!-- Status Messages -->
          <div class="mt-2 space-y-1">
            <p
              v-if="usernameStatus"
              :class="[
                'text-xs',
                usernameStatus === 'available'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              ]"
            >
              {{ usernameMessage }}
            </p>
            <p
              v-if="usernameValidationError"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ usernameValidationError }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">
              {{ username.length }}/16 characters
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            type="button"
            :disabled="!canComplete || loading"
            class="w-full py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            @click="handleRegistration"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Profile...
            </span>
            <span v-else>Create Profile</span>
          </button>

          <button
            type="button"
            :disabled="loading"
            class="w-full py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            @click="close"
          >
            Cancel
          </button>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-xs text-red-600 dark:text-red-400 text-center">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'

  // Component state
  const show = ref(false)
  const loading = ref(false)
  const error = ref('')

  // Form data
  const username = ref('')

  // Cross-chain addresses (hidden from UI but used for registration)
  const principal = ref('')
  const evmAddress = ref('')
  const solAddress = ref('')
  const btcAddress = ref('')
  const walletType = ref('')

  // Username availability
  const usernameStatus = ref<'available' | 'taken' | 'checking' | null>(null)
  const usernameMessage = ref('')
  const usernameCheckTimeout = ref<NodeJS.Timeout | null>(null)
  const usernameValidationError = ref('')

  const auth = useAuthStore()
  const toast = useToast()

  // Computed properties
  const canComplete = computed(() => {
    return (
      username.value.trim().length > 0 &&
      usernameStatus.value === 'available' &&
      !usernameValidationError.value
    )
  })

  // Username validation function
  function validateUsername(usernameValue: string): string | null {
    if (usernameValue.length > 16) {
      return 'Username must be 16 characters or less'
    }

    // Allow any Unicode characters except whitespace and problematic characters
    if (/[\s/\\:*?"<>|]/.test(usernameValue)) {
      return 'Username cannot contain whitespace or special characters'
    }

    return null
  }

  // Username availability check
  async function checkUsernameAvailability() {
    const usernameValue = username.value.trim()

    // Clear previous validation error
    usernameValidationError.value = ''

    // Validate username format
    const validationError = validateUsername(usernameValue)
    if (validationError) {
      usernameValidationError.value = validationError
      usernameStatus.value = null
      usernameMessage.value = ''
      return
    }

    if (usernameValue.length === 0) {
      usernameStatus.value = null
      usernameMessage.value = ''
      return
    }

    // Clear previous timeout
    if (usernameCheckTimeout.value) {
      clearTimeout(usernameCheckTimeout.value)
    }

    // Set checking status
    usernameStatus.value = 'checking'
    usernameMessage.value = 'Checking availability...'

    // Debounce the check
    usernameCheckTimeout.value = setTimeout(async () => {
      try {
        // Call canister to check username availability
        const isAvailable =
          await canisterService.isUsernameAvailable(usernameValue)

        if (isAvailable) {
          usernameStatus.value = 'available'
          usernameMessage.value = 'Username is available'
        } else {
          usernameStatus.value = 'taken'
          usernameMessage.value = 'Username is already taken'
        }
      } catch (err) {
        console.error('Username availability check failed:', err)
        usernameStatus.value = null
        usernameMessage.value = 'Could not check availability'
      }
    }, 300)
  }

  // Public API
  const open = (
    principalValue: string,
    evmAddressValue: string,
    solAddressValue: string,
    btcAddressValue: string,
    walletTypeValue: string
  ) => {
    console.log('RegistrationModal.open() called with:', {
      principal: principalValue,
      evmAddress: evmAddressValue,
      solAddress: solAddressValue,
      btcAddress: btcAddressValue,
      walletType: walletTypeValue,
    })

    principal.value = principalValue
    evmAddress.value = evmAddressValue
    solAddress.value = solAddressValue
    btcAddress.value = btcAddressValue
    walletType.value = walletTypeValue

    show.value = true
    resetForm()
  }

  const close = () => {
    show.value = false
    resetForm()
  }

  function resetForm() {
    error.value = ''
    username.value = ''
    usernameStatus.value = null
    usernameMessage.value = ''
    usernameValidationError.value = ''
  }

  defineExpose({ open, close })

  // Main registration handler
  async function handleRegistration() {
    if (!canComplete.value) return

    loading.value = true
    error.value = ''

    try {
      console.log('Registration data:', {
        username: username.value.trim(),
        evmAddress: evmAddress.value,
        bitcoinAddress: btcAddress.value,
        solanaAddress: solAddress.value,
      })

      // Call the signup method with wallet addresses
      const profile = await canisterService.signup(
        username.value.trim(),
        evmAddress.value || undefined,
        btcAddress.value || undefined,
        solAddress.value || undefined
      )

      console.log('Registration successful:', profile)

      // Update auth store with the new profile
      await auth.completeRegistration(profile)

      // Show success notification
      toast.add({
        title: `Welcome to Ionic Swap ${profile.username}!`,
        description: `Let's get you started.`,
        color: 'success',
      })

      show.value = false

      // Navigate to profile page
      await navigateTo('/profile')
    } catch (err: unknown) {
      console.error('Registration error:', err)
      error.value =
        err instanceof Error
          ? err.message
          : 'Please try again and report this annoying bug on Social Media or email support@ionicswap.com'

      toast.add({
        title: 'Registration Failed',
        description: error.value,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }
</script>
