<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 flex-col">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
      />
    </div>

    <!-- Redirect to username-based route -->
    <div
      v-else-if="username"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">
          Redirecting to your profile...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'

  const router = useRouter()
  const auth = useAuthStore()
  const loading = ref(true)
  const username = ref<string | null>(null)

  // Get current user's username and redirect
  const redirectToProfile = async () => {
    try {
      // Wait for auth to be initialized
      if (!auth.canisterInitialized) {
        // Initialize canister service
        await canisterService.initialize()
      }

      // Get current user profile
      const profile = await canisterService.getMyProfile()

      if (profile?.username) {
        username.value = profile.username
        // Redirect to the username-based route
        await router.push(`/@${profile.username}`)
      } else {
        // If no username, redirect to home
        await router.push('/')
      }
    } catch (error) {
      console.error('Error redirecting to profile:', error)
      await router.push('/')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    redirectToProfile()
  })
</script>
