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
      class="absolute inset-0 bg-background/80"
      @click="show = false"
    />
    <!-- Modal Content -->
    <div
      class="relative bg-card rounded-lg shadow-xl max-w-md w-full mx-4"
    >
      <div class="p-8">
        <!-- Logo Section -->
        <div class="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Ionic Swap Logo" class="w-12 h-12 mb-2" >
          <img src="/logo-text.svg" alt="Ionic Swap" class="h-6" >
        </div>

        <h2 class="text-2xl font-bold mb-6 text-center text-foreground">
          Sign in to Ionic Swap
        </h2>
        
        <!-- Primary Methods Section -->
        <div class="space-y-4 mb-6">
          <!-- Local Wallet -->
          <UButton
            id="local-btn"
            block
            size="xl"
            color="primary"
            variant="solid"
            class="h-12 text-sm font-normal bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white justify-start"
            :loading="loading && loginMethod === 'local'"
            @click="login('local')"
          >
            <div class="flex items-center gap-3">
              <img src="/wouid.svg" alt="Local Wallet" class="w-6 h-6" />
              <span>Try Ionic Swap <span class="text-muted-foreground text-xs">(Fastest)</span></span>
            </div>
          </UButton>

          <!-- Internet Identity -->
          <UButton
            id="internet-identity-btn"
            block
            size="xl"
            color="neutral"
            variant="soft"
            class="h-12 text-sm font-normal bg-surface hover:bg-surface-elevated text-foreground justify-start"
            :loading="loading && loginMethod === 'internet-identity'"
            @click="login('internet-identity')"
          >
            <div class="flex items-center gap-3">
              <img src="/icp.svg" alt="Internet Identity" class="w-6 h-6" />
              <span
                >Continue with Internet Identity
                <span class="text-muted-foreground text-xs">(Recommended)</span></span
              >
            </div>
          </UButton>
        </div>

        <!-- Divider -->
        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-themed"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-card text-muted-foreground">or connect with wallet</span>
          </div>
        </div>

        <!-- Wallet Icons Grid -->
        <div class="grid grid-cols-5 gap-2 mb-6">
          <!-- MetaMask -->
          <button
            id="metamask-btn"
            class="flex flex-col items-center justify-center p-3 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
            :class="{ 'opacity-50 pointer-events-none': loading && loginMethod === 'metamask' }"
            @click="login('metamask')"
            :disabled="loading && loginMethod === 'metamask'"
          >
            <img src="/metamask.svg" alt="MetaMask" class="w-6 h-6 mb-1" />
            <span class="text-xs text-muted-foreground">MetaMask</span>
          </button>

          <!-- Phantom -->
          <button
            id="phantom-btn"
            class="flex flex-col items-center justify-center p-3 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
            :class="{ 'opacity-50 pointer-events-none': loading && loginMethod === 'phantom' }"
            @click="login('phantom')"
            :disabled="loading && loginMethod === 'phantom'"
          >
            <img src="/phantom.svg" alt="Phantom" class="w-6 h-6 mb-1" />
            <span class="text-xs text-muted-foreground">Phantom</span>
          </button>

          <!-- Rabby -->
          <button
            id="rabby-btn"
            class="flex flex-col items-center justify-center p-3 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
            :class="{ 'opacity-50 pointer-events-none': loading && loginMethod === 'rabby' }"
            @click="login('rabby')"
            :disabled="loading && loginMethod === 'rabby'"
          >
            <img src="/rabby.svg" alt="Rabby" class="w-6 h-6 mb-1" />
            <span class="text-xs text-muted-foreground">Rabby</span>
          </button>

          <!-- Magic Eden -->
          <button
            id="magic-eden-btn"
            class="flex flex-col items-center justify-center p-3 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
            :class="{ 'opacity-50 pointer-events-none': loading && loginMethod === 'magic-eden' }"
            @click="login('magic-eden')"
            :disabled="loading && loginMethod === 'magic-eden'"
          >
            <img src="/magiceden.svg" alt="Magic Eden" class="w-6 h-6 mb-1" />
            <span class="text-xs text-muted-foreground">Magic Eden</span>
          </button>

          <!-- Plug -->
          <button
            id="plug-btn"
            class="flex flex-col items-center justify-center p-3 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
            :class="{ 'opacity-50 pointer-events-none': loading && loginMethod === 'plug' }"
            @click="login('plug')"
            :disabled="loading && loginMethod === 'plug'"
          >
            <img src="/plug.svg" alt="Plug" class="w-6 h-6 mb-1" />
            <span class="text-xs text-muted-foreground">Plug</span>
          </button>
        </div>

        <hr class="my-6 border-themed" >
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
        <div v-if="error" class="mt-4 text-error text-sm text-center">
          {{ error }}
        </div>

        <!-- Terms and Privacy Policy -->
        <div
          class="mt-6 text-xs text-muted-foreground text-center leading-relaxed"
        >
          By signing in and using Ionic Swap, you agree to our
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
</template>

<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { generateRandomUsername } from '@/utils/usernameGenerator'
  import type { WalletType } from '@/services/wallets/types'

  // TypeScript declarations are handled by global types

  const show = ref(false)
  const loading = ref(false)
  const error = ref('')
  const loginMethod = ref('')

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
        // New user, auto-register with random username
        console.log('New user, auto-registering with random username...')
        
        try {
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
            auth.evmAddress || undefined,
            auth.btcAddress || undefined,
            auth.solAddress || undefined
          )

          console.log('Auto-registration successful:', profile)

          // Update auth store with the new profile
          await auth.completeRegistration(profile)

          // Show success toast
          toast.add({
            title: `Welcome to Ionic Swap ${profile.username}!`,
            description: 'Your account has been created and you received 2M USDT automatically!',
            color: 'success',
          })

          show.value = false

          // Signal successful login completion for the tour
          signalLoginSuccess()

          // Navigate to profile page
          await navigateTo('/profile')
        } catch (registrationError) {
          console.error('Auto-registration failed:', registrationError)
          throw new Error(`Auto-registration failed: ${registrationError instanceof Error ? registrationError.message : 'Unknown error'}`)
        }
      }
    } catch (err: unknown) {
      console.error(`${walletType} login error:`, err)
      const errorMessage = err instanceof Error ? err.message : `${walletType} login failed.`
      error.value = errorMessage

      // Show error toast
      toast.add({
        title: 'Login Failed',
        description: errorMessage,
        color: 'error',
      })
    } finally {
      loading.value = false
      loginMethod.value = ''
    }
  }
</script>
