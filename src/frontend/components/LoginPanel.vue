<template>
  <!-- Simple Modal Overlay -->
  <div
    id="login-panel"
    :class="[
      'fixed inset-0 z-[9999] flex items-center justify-center',
      show ? '' : 'hidden',
    ]"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-white/80 dark:bg-black/90"
      @click="show = false"
    />
    <!-- Modal Content -->
    <div
      class="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4"
    >
      <div class="p-8">
        <!-- Logo Section -->
        <div class="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Ionic Swap Logo" class="w-12 h-12 mb-2" />
          <img src="/logo-text.svg" alt="Ionic Swap" class="h-6 light:invert" />
        </div>

        <h2 class="text-2xl font-bold mb-6 text-center">
          Sign in to Ionic Swap
        </h2>
        <div class="login-panel-buttons space-y-4">
          <UButton
            id="internet-identity-btn"
            block
            size="xl"
            color="neutral"
            variant="soft"
            class="h-12 text-sm font-normal bg-gray-200 dark:bg-neutral-800 hover:bg-primary-400 dark:hover:bg-primary-600 text-gray-800 dark:text-gray-200 justify-start"
            :loading="loading && loginMethod === 'internet-identity'"
            @click="login('internet-identity')"
          >
            <div class="flex items-center gap-3">
              <UIcon name="token-branded:icp" class="text-2xl" />
              <span
                >Sign in with Internet Identity
                <span class="text-gray-500 text-xs">(Recommended)</span></span
              >
            </div>
          </UButton>

          <UButton
            id="metamask-btn"
            block
            size="xl"
            color="neutral"
            variant="soft"
            class="h-12 text-sm font-normal bg-gray-200 dark:bg-neutral-800 hover:bg-primary-400 dark:hover:bg-primary-600 text-gray-800 dark:text-gray-200 justify-start"
            :loading="loading && loginMethod === 'metamask'"
            @click="login('metamask')"
          >
            <div class="flex items-center gap-3">
              <UIcon name="token-branded:metamask" class="text-2xl" />
              <span>Sign in with MetaMask</span>
            </div>
          </UButton>
          <UButton
            id="phantom-btn"
            block
            size="xl"
            color="neutral"
            variant="soft"
            class="h-12 text-sm font-normal bg-gray-200 dark:bg-neutral-800 hover:bg-primary-400 dark:hover:bg-primary-600 text-gray-800 dark:text-gray-200 justify-start"
            :loading="loading && loginMethod === 'phantom'"
            @click="login('phantom')"
          >
            <div class="flex items-center gap-3">
              <UIcon name="token-branded:phantom" class="text-2xl" />
              <span>Sign in with Phantom</span>
            </div>
          </UButton>
          <UButton
            id="plug-btn"
            block
            size="xl"
            color="neutral"
            variant="soft"
            class="h-12 text-sm font-normal bg-gray-200 dark:bg-neutral-800 hover:bg-primary-400 dark:hover:bg-primary-600 text-gray-800 dark:text-gray-200 justify-start"
            :loading="loading && loginMethod === 'plug'"
            @click="login('plug')"
          >
            <div class="flex items-center gap-3">
              <UIcon name="fa6-solid:plug" class="text-2xl" />
              <span>Sign in with Plug</span>
            </div>
          </UButton>
        </div>
        <hr class="my-6 border-gray-200 dark:border-gray-700" />
        <UButton
          block
          color="neutral"
          variant="soft"
          size="lg"
          class="h-12 text-base"
          @click="show = false"
        >
          Cancel
        </UButton>
        <div v-if="error" class="mt-4 text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <!-- Terms and Privacy Policy -->
        <div
          class="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed"
        >
          By signing in and using Nftropoly, you agree to our
          <NuxtLink to="/terms" class="text-primary hover:underline"
            >Terms of Service</NuxtLink
          >
          and
          <NuxtLink to="/privacy" class="text-primary hover:underline"
            >Privacy Policy</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
  <RegistrationModal
    ref="registrationModalRef"
    :class="[showRegistrationModal ? '' : 'hidden']"
  />
</template>

<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import RegistrationModal from './RegistrationModal.vue'
  import type { WalletType } from '@/services/wallets/types'

  // TypeScript declarations for wallet extensions
  declare global {
    interface Window {
      ic?: {
        plug?: {
          isConnected(): Promise<boolean>
          requestConnect(
            options?: Record<string, unknown>
          ): Promise<{ principal: string }>
          agent: {
            getPrincipal(): Promise<{ toText(): string }>
          }
        }
      }
    }
  }

  const show = ref(false)
  const loading = ref(false)
  const error = ref('')
  const loginMethod = ref('')

  const showRegistrationModal = ref(false)
  const registrationModalRef = ref<{
    open: (
      principalValue: string,
      evmAddressValue: string,
      solAddressValue: string,
      btcAddressValue: string,
      walletTypeValue: string
    ) => void
    close: () => void
  } | null>(null)
  const toast = useToast()

  // Function to signal successful login completion
  const signalLoginSuccess = () => {
    // Set a flag that the tour can check
    ;(window as unknown as Record<string, unknown>).loginCompleted = true
  }

  // Watch for changes to show value
  watch(show, newVal => {
    console.log('LoginPanel show value changed to:', newVal)
  })

  defineExpose({
    open: () => {
      console.log('LoginPanel open() called')
      show.value = true
      console.log('show.value set to:', show.value)
    },
    close: () => {
      show.value = false
      error.value = ''
      showRegistrationModal.value = false
    },
    showRegistrationModal: () => {
      console.log('LoginPanel showRegistrationModal() called')
      showRegistrationModal.value = true
      nextTick(() => {
        if (registrationModalRef.value) {
          console.log('Opening registration modal with cross-chain addresses')
          registrationModalRef.value.open(
            auth.principal,
            auth.evmAddress || '',
            auth.solAddress || '',
            auth.btcAddress || '',
            auth.nativeWallet
          )
        } else {
          console.error('registrationModalRef.value is null/undefined!')
        }
      })
    },
  })

  const auth = useAuthStore()

  async function login(walletType: WalletType) {
    error.value = ''
    loading.value = true
    loginMethod.value = walletType

    try {
      console.log(`Starting ${walletType} login...`)

      // Use the new simplified auth system
      const loginResult = await auth.login(walletType)
      console.log('Login completed:', loginResult)

      if (loginResult.existing) {
        // User already exists, redirect to profile
        console.log('Existing user found, redirecting to profile...')
        show.value = false

        // Show success toast
        toast.add({
          title: ` Welcome Back ${loginResult.profile?.username || 'user'}!`,
          description: 'Great to see you again',
          color: 'success',
        })

        // Navigate to profile page
        await navigateTo('/profile')
      } else {
        // New user, show registration modal
        console.log('New user, opening registration modal...')
        show.value = false
        showRegistrationModal.value = true

        await nextTick()

        if (registrationModalRef.value) {
          console.log('Opening registration modal with cross-chain addresses')
          registrationModalRef.value.open(
            auth.principal,
            auth.evmAddress || '',
            auth.solAddress || '',
            auth.btcAddress || '',
            auth.nativeWallet
          )

          // Signal successful login completion for the tour
          signalLoginSuccess()
        } else {
          console.error('registrationModalRef.value is null/undefined!')
        }
      }
    } catch (err: unknown) {
      console.error(`${walletType} login error:`, err)
      error.value = err?.message || `${walletType} login failed.`

      // Show error toast
      toast.add({
        title: 'Login Failed',
        description: err?.message || `${walletType} login failed`,
        color: 'error',
      })
    } finally {
      loading.value = false
      loginMethod.value = ''
    }
  }
</script>
