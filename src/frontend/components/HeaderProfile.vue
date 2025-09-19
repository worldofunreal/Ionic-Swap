<template>
  <div class="relative profile-settings-icon">
    <div class="flex items-center gap-2 cursor-pointer" @click="toggleUserMenu">
      <!-- Avatar with Wallet Icon Overlay -->
      <div class="relative">
        <UAvatar
          :src="userAvatar"
          size="md"
          class="hover:opacity-80 transition-opacity"
          :alt="authStore.userProfile?.username || 'User profile'"
        >
          <template #fallback>
            <div
              class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm"
              :class="`bg-${currentTheme}-500`"
            >
              {{
                authStore.userProfile?.username?.charAt(0).toUpperCase() || 'U'
              }}
            </div>
          </template>
        </UAvatar>
        <!-- Wallet Icon Overlay -->
        <div
          class="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"
        >
          <component
            :is="getWalletIcon(authStore.nativeWallet).type"
            :src="getWalletIcon(authStore.nativeWallet).src"
            :name="getWalletIcon(authStore.nativeWallet).name"
            :alt="getWalletIcon(authStore.nativeWallet).alt"
            class="w-3 h-3 text-zinc-500 dark:text-zinc-400"
          />
        </div>
      </div>

      <!-- Username and Arrow -->
      <div class="flex items-center gap-1">
        <span class="text-sm font-medium text-zinc-900 dark:text-white">
          {{ authStore.userProfile?.username || 'User' }}
        </span>
        <UIcon
          :name="showUserMenu ? 'bxs:up-arrow' : 'bxs:down-arrow'"
          class="w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform"
        />
      </div>
    </div>

    <!-- User Menu Dropdown -->
    <div
      v-if="showUserMenu"
      class="absolute right-0 mt-2 w-80 bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50"
    >
      <div class="p-3">
        <!-- User Info -->
        <div class="flex items-center gap-3 mb-3">
          <UAvatar
            :src="userAvatar"
            size="lg"
            :alt="authStore.userProfile?.username || 'User profile'"
          >
            <template #fallback>
              <div
                class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
                :class="`bg-${currentTheme}-500`"
              >
                {{
                  authStore.userProfile?.username?.charAt(0).toUpperCase() ||
                  'U'
                }}
              </div>
            </template>
          </UAvatar>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-zinc-900 dark:text-white truncate">
              {{ authStore.userProfile?.username || 'User' }}
            </div>
            <div class="text-sm text-zinc-500 dark:text-zinc-400">
              {{ getWalletDisplayName(authStore.nativeWallet) }}
            </div>
          </div>
        </div>

        <!-- Follow Button (only for other users' profiles) -->
        <div v-if="showFollowButton" class="mb-4">
          <UButton
            :color="isFollowing ? 'neutral' : 'primary'"
            :variant="isFollowing ? 'soft' : 'solid'"
            :loading="followLoading"
            class="w-full"
            @click="toggleFollow"
            @mouseenter="handleFollowHover"
            @mouseleave="handleFollowLeave"
          >
            <UIcon
              :name="
                isFollowing
                  ? 'i-heroicons-user-minus-20-solid'
                  : 'i-heroicons-user-plus-20-solid'
              "
              class="w-4 h-4 mr-2"
            />
            {{ followButtonText }}
          </UButton>
        </div>

        <!-- Cross-Chain Addresses Section -->
        <div class="mb-3">
          <div
            class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2"
          >
            Addresses
          </div>

          <!-- ICP Principal -->
          <div v-if="authStore.principal" class="mb-2">
            <div
              class="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="token-branded:icp" class="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">ICP</span>
                <span class="text-xs font-mono text-zinc-900 dark:text-white truncate">
                  {{ formatCompactAddress(authStore.principal) }}
                </span>
              </div>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="w-3 h-3 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.principal, 'ICP')"
              />
            </div>
          </div>

          <!-- EVM Address -->
          <div v-if="authStore.evmAddress" class="mb-2">
            <div
              class="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="cryptocurrency:eth" class="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">EVM</span>
                <span class="text-xs font-mono text-zinc-900 dark:text-white truncate">
                  {{ formatCompactAddress(authStore.evmAddress) }}
                </span>
              </div>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="w-3 h-3 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.evmAddress, 'EVM')"
              />
            </div>
          </div>

          <!-- Solana Address -->
          <div v-if="authStore.solAddress" class="mb-2">
            <div
              class="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="cryptocurrency:sol" class="w-3 h-3 text-purple-500 flex-shrink-0" />
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">SOL</span>
                <span class="text-xs font-mono text-zinc-900 dark:text-white truncate">
                  {{ formatCompactAddress(authStore.solAddress) }}
                </span>
              </div>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="w-3 h-3 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.solAddress, 'Solana')"
              />
            </div>
          </div>

          <!-- Bitcoin Address -->
          <div v-if="authStore.btcAddress" class="mb-2">
            <div
              class="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="cryptocurrency:btc" class="w-3 h-3 text-orange-400 flex-shrink-0" />
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">BTC</span>
                <span class="text-xs font-mono text-zinc-900 dark:text-white truncate">
                  {{ formatCompactAddress(authStore.btcAddress) }}
                </span>
              </div>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="w-3 h-3 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.btcAddress, 'Bitcoin')"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="border-t border-zinc-200 dark:border-zinc-800 pt-2 space-y-2"
        >
          <!-- Profile Button -->
          <UButton
            block
            color="primary"
            variant="soft"
            icon="iconamoon:profile-fill"
            :to="
              authStore.userProfile?.username
                ? `/@${authStore.userProfile.username}`
                : '/profile'
            "
          >
            View Profile
          </UButton>

          <!-- Logout Button -->
          <UButton
            block
            color="error"
            variant="soft"
            icon="solar:logout-2-bold"
            @click="logout"
          >
            Logout
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
  import { useNuxtApp } from '#imports'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { useRoute } from 'vue-router'
  import { useColorTheme } from '@/composables/useColorTheme'

  defineOptions({
    name: 'HeaderProfile',
  })

  const authStore = useAuthStore()
  const route = useRoute()
  const { $trackInteraction, $trackButtonClick } = useNuxtApp()
  const { currentTheme } = useColorTheme()

  // Avatar URL - convert file paths to full URLs with cache busting
  const userAvatar = computed(() => {
    const avatarPath = authStore.userProfile?.avatar_url?.[0]
    if (!avatarPath) return ''

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      return avatarPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(avatarPath)
    const timestamp = Date.now()
    // Use a combination of timestamp and profile update trigger for better cache busting
    const cacheBuster = authStore.userProfile?.updated_at
      ? Number(authStore.userProfile.updated_at)
      : timestamp
    return `${baseUrl}?t=${timestamp}&v=${cacheBuster}&trigger=${Date.now()}`
  })
  const showUserMenu = ref(false)
  const followLoading = ref(false)
  const isFollowing = ref(false)
  const isHoveringFollow = ref(false)

  // Check if we're on a profile page and if it's not the current user's profile
  const showFollowButton = computed(() => {
    const isProfilePage = route.path.startsWith('/@')
    if (!isProfilePage) return false

    const routeUsername = route.params.username as string
    if (!routeUsername) return false

    // Remove @ symbol if present
    const cleanUsername = routeUsername.startsWith('@')
      ? routeUsername.slice(1)
      : routeUsername

    // Don't show follow button for own profile
    return cleanUsername !== authStore.userProfile?.username
  })

  // Get the username of the profile being viewed
  const viewedProfileUsername = computed(() => {
    const routeUsername = route.params.username as string
    if (!routeUsername) return null
    return routeUsername.startsWith('@')
      ? routeUsername.slice(1)
      : routeUsername
  })

  // Follow button text
  const followButtonText = computed(() => {
    if (isHoveringFollow.value && isFollowing.value) {
      return 'Unfollow'
    }
    return isFollowing.value ? 'Following' : 'Follow'
  })

  onMounted(() => {
    // Close menu when clicking outside
    document.addEventListener('click', handleClickOutside)
    // Check if we're following the viewed profile
    checkFollowingStatus()
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  // Check if current user is following this profile using the efficient method
  const checkFollowingStatus = async () => {
    if (!viewedProfileUsername.value) return

    try {
      // Get the viewed profile to get their principal
      const viewedProfile = await canisterService.getPublicProfile(
        viewedProfileUsername.value
      )
      if (!viewedProfile?.id) return

      // Use personal endpoint to get follow state
      const personalProfile = await canisterService.getUserPersonal(
        viewedProfile.id.toText(),
        authStore.principal
      )
      if (personalProfile) {
        isFollowing.value = personalProfile.am_following_them
      }
    } catch (error) {
      console.error('Error checking following status:', error)
    }
  }

  // Watch for route changes to update following status
  watch(
    () => route.params.username,
    () => {
      if (showUserMenu.value) {
        checkFollowingStatus()
      }
    }
  )

  // Watch for menu open to check following status
  watch(
    () => showUserMenu.value,
    isOpen => {
      if (isOpen) {
        checkFollowingStatus()
      }
    }
  )

  function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value
    $trackButtonClick('User Menu Toggle', {
      isOpen: showUserMenu.value,
      username: authStore.userProfile?.username,
    })
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      showUserMenu.value = false
    }
  }

  function handleFollowHover() {
    isHoveringFollow.value = true
  }

  function handleFollowLeave() {
    isHoveringFollow.value = false
  }

  async function toggleFollow() {
    if (!viewedProfileUsername.value || followLoading.value) return

    followLoading.value = true
    try {
      // Get the viewed profile to get their principal
      const viewedProfile = await canisterService.getPublicProfile(
        viewedProfileUsername.value
      )
      if (!viewedProfile?.id) {
        throw new Error('Profile not found')
      }

      if (isFollowing.value) {
        await canisterService.unfollowUser(viewedProfile.id.toText())
        isFollowing.value = false
        const toast = useToast()
        toast.add({
          title: 'Unfollowed',
          description: `You unfollowed @${viewedProfileUsername.value}`,
          color: 'success',
        })
      } else {
        try {
          await canisterService.followUser(viewedProfile.id.toText())
          isFollowing.value = true
          const toast = useToast()
          toast.add({
            title: 'Following',
            description: `You are now following @${viewedProfileUsername.value}`,
            color: 'success',
          })
        } catch (error: unknown) {
          // Handle "Already following" error gracefully
          if (
            error instanceof Error &&
            error.message?.includes('Already following this user')
          ) {
            isFollowing.value = true
            const toast = useToast()
            toast.add({
              title: 'Already Following',
              description: `You are already following @${viewedProfileUsername.value}`,
              color: 'info',
            })
            return
          }
          throw error
        }
      }

      $trackButtonClick('Toggle Follow', {
        action: isFollowing.value ? 'follow' : 'unfollow',
        targetUsername: viewedProfileUsername.value,
        username: authStore.userProfile?.username,
      })
    } catch (error) {
      console.error('Follow/Unfollow failed:', error)
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to follow/unfollow user. Please try again.',
        color: 'error',
      })
      $trackInteraction('Error', {
        error: 'Follow/Unfollow failed',
        targetUsername: viewedProfileUsername.value,
      })
    } finally {
      followLoading.value = false
    }
  }

  function copyToClipboard(text: string, walletType: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const toast = useToast()
        toast.add({
          title: `${walletType} Address Copied`,
          description: text,
          color: 'success',
        })
        $trackButtonClick('Copy to Clipboard', {
          textType: text.includes('icp') ? 'ICP Principal' : 'Wallet Address',
          textLength: text.length,
        })
      })
      .catch(err => {
        console.error('Failed to copy to clipboard:', err)
        const toast = useToast()
        toast.add({
          title: `${walletType} Copy Failed`,
          description: 'Failed to copy address to clipboard.',
          color: 'error',
        })
        $trackInteraction('Error', {
          error: 'Copy to clipboard failed',
          textType: text.includes('icp') ? 'ICP Principal' : 'Wallet Address',
        })
      })
  }

  function logout() {
    showUserMenu.value = false
    $trackButtonClick('Logout', {
      username: authStore.userProfile?.username,
      walletType: authStore.nativeWallet,
    })
    authStore.logout()
  }

  function getWalletIcon(walletType?: string) {
    if (!walletType) return { type: 'UIcon', name: 'solar:wallet-bold' }

    switch (walletType.toLowerCase()) {
      case 'local':
        return { type: 'img', src: '/wouid.svg', alt: 'Ionic Wallet' }
      case 'metamask':
        return { type: 'img', src: '/metamask.svg', alt: 'MetaMask' }
      case 'rabby':
        return { type: 'img', src: '/rabby.svg', alt: 'Rabby' }
      case 'magic-eden':
        return { type: 'img', src: '/magiceden.svg', alt: 'Magic Eden' }
      case 'phantom':
        return { type: 'img', src: '/phantom.svg', alt: 'Phantom' }
      case 'plug':
        return { type: 'img', src: '/plug.svg', alt: 'Plug' }
      case 'internetidentity':
      case 'icp':
        return { type: 'img', src: '/icons/tokens/icp.svg', alt: 'Internet Identity' }
      default:
        return { type: 'UIcon', name: 'solar:wallet-bold' }
    }
  }

  function getWalletDisplayName(walletType?: string): string {
    if (!walletType) return 'Unknown Wallet'
    
    switch (walletType.toLowerCase()) {
      case 'local':
        return 'Ionic Wallet'
      case 'metamask':
        return 'MetaMask'
      case 'rabby':
        return 'Rabby'
      case 'magic-eden':
        return 'Magic Eden'
      case 'phantom':
        return 'Phantom'
      case 'plug':
        return 'Plug'
      case 'internetidentity':
      case 'icp':
        return 'Internet Identity'
      default:
        return walletType.charAt(0).toUpperCase() + walletType.slice(1)
    }
  }

  function formatCompactAddress(address: string): string {
    if (!address) return ''
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
</script>
