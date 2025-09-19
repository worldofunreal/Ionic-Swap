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
              class="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm"
            >
              {{
                authStore.userProfile?.username?.charAt(0).toUpperCase() || 'U'
              }}
            </div>
          </template>
        </UAvatar>
        <!-- Wallet Icon Overlay -->
        <div
          class="absolute -bottom-1 -right-1 w-5 h-5 bg-background-elevated rounded-full border-2 border-background-elevated flex items-center justify-center"
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
      class="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50"
    >
      <div class="p-4">
        <!-- User Info -->
        <div class="flex items-center gap-3 mb-4">
          <UAvatar
            :src="userAvatar"
            size="lg"
            :alt="authStore.userProfile?.username || 'User profile'"
          >
            <template #fallback>
              <div
                class="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg"
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
              {{ authStore.nativeWallet.toUpperCase() }}
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
        <div class="mb-4">
          <div
            class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2"
          >
            Cross-Chain Addresses
          </div>

          <!-- ICP Principal -->
          <div v-if="authStore.principal" class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="token-branded:icp" class="w-4 h-4 text-orange-500" />
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >ICP</span
              >
            </div>
            <div
              class="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <span
                class="text-sm font-mono text-zinc-900 dark:text-white truncate"
              >
                {{ authStore.principal }}
              </span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.principal, 'ICP')"
              />
            </div>
          </div>

          <!-- EVM Address -->
          <div v-if="authStore.evmAddress" class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="cryptocurrency:eth" class="w-4 h-4 text-blue-500" />
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >EVM</span
              >
            </div>
            <div
              class="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <span
                class="text-sm font-mono text-zinc-900 dark:text-white truncate"
              >
                {{ authStore.evmAddress }}
              </span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.evmAddress, 'EVM')"
              />
            </div>
          </div>

          <!-- Solana Address -->
          <div v-if="authStore.solAddress" class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                name="cryptocurrency:sol"
                class="w-4 h-4 text-purple-500"
              />
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >SOL</span
              >
            </div>
            <div
              class="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <span
                class="text-sm font-mono text-zinc-900 dark:text-white truncate"
              >
                {{ authStore.solAddress }}
              </span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.solAddress, 'Solana')"
              />
            </div>
          </div>

          <!-- Bitcoin Address -->
          <div v-if="authStore.btcAddress" class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                name="cryptocurrency:btc"
                class="w-4 h-4 text-orange-400"
              />
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >BTC</span
              >
            </div>
            <div
              class="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <span
                class="text-sm font-mono text-zinc-900 dark:text-white truncate"
              >
                {{ authStore.btcAddress }}
              </span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:text-white transition flex-shrink-0"
                @click="copyToClipboard(authStore.btcAddress, 'Bitcoin')"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="border-t border-neutral-200 dark:border-neutral-700 pt-3 space-y-2"
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

  defineOptions({
    name: 'HeaderProfile',
  })

  const authStore = useAuthStore()
  const route = useRoute()
  const { $trackInteraction, $trackButtonClick } = useNuxtApp()

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
        return { type: 'img', src: '/wouid.svg', alt: 'Local Wallet' }
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
        return { type: 'img', src: '/icp.svg', alt: 'Internet Identity' }
      default:
        return { type: 'UIcon', name: 'solar:wallet-bold' }
    }
  }
</script>
