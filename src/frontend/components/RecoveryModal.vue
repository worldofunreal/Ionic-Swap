<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[9999] flex items-center justify-center"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-white/80 dark:bg-black/90" @click="close" />

    <!-- Modal Content -->
    <div
      class="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4"
    >
      <div class="p-8">
        <!-- Header -->
        <div class="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="NFTropoly Logo" class="w-12 h-12 mb-2" >
          <h2 class="text-2xl font-bold text-center">Recover Account</h2>
        </div>

        <!-- Recovery Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">
              Recovery Phrase (12 or 24 words)
            </label>
            <textarea
              v-model="mnemonic"
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              rows="3"
              placeholder="Enter your recovery phrase..."
            />
          </div>

          <UButton
            block
            size="lg"
            :loading="loading"
            :disabled="!mnemonic.trim()"
            @click="recover"
          >
            Recover Account
          </UButton>

          <UButton
            block
            color="neutral"
            variant="soft"
            size="lg"
            @click="close"
          >
            Cancel
          </UButton>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <!-- Info -->
        <div class="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          Enter the 12 or 24-word recovery phrase you received when you first
          created your account.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const show = ref(false)
  const loading = ref(false)
  const error = ref('')
  const mnemonic = ref('')

  const auth = useAuthStore()
  const toast = useToast()

  defineExpose({
    open: () => {
      show.value = true
      error.value = ''
      mnemonic.value = ''
    },
    close: () => {
      show.value = false
    },
  })

  async function recover() {
    if (!mnemonic.value.trim()) {
      error.value = 'Please enter your recovery phrase'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const result = await auth.recover(mnemonic.value.trim())

      if (result.existing) {
        show.value = false

        toast.add({
          title: 'Account Recovered!',
          description: `Welcome back, ${result.profile?.username || 'user'}!`,
          color: 'success',
        })

        await navigateTo('/profile')
      }
    } catch (err: any) {
      error.value =
        err?.message || 'Recovery failed. Please check your recovery phrase.'

      toast.add({
        title: 'Recovery Failed',
        description: error.value,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  function close() {
    show.value = false
    error.value = ''
    mnemonic.value = ''
  }
</script>
