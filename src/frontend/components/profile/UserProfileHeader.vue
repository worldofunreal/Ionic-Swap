<template>
  <div
    class="h-full overflow-y-auto"
  >
    <!-- Compact Banner Section -->
    <div
      class="relative"
      style="height: 120px; background: linear-gradient(to right, #4F8CEE, #64C4AA);"
    >
      <img
        v-if="bannerUrl"
        :src="bannerUrl"
        alt="Banner"
        class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
        crossorigin="anonymous"
        @click="openImageModal(bannerUrl, 'Banner')"
      >
      <div v-else class="w-full h-full flex items-center justify-center">
        <!-- Empty banner placeholder -->
      </div>
      
      <!-- Edit Profile Button (positioned on banner) -->
      <button
        v-if="isOwnProfile"
        class="absolute top-18 right-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm font-semibold rounded-lg transition-colors edit-profile-btn"
        @click="editProfile"
      >
        <UIcon
          name="i-heroicons-pencil-square-20-solid"
          class="w-4 h-4 mr-1"
        />
        Edit Profile
      </button>
    </div>

    <!-- Profile Info Section -->
    <div class="px-4 pb-4">
      <!-- Avatar Section -->
      <div class="flex justify-between items-end -mt-12 mb-4">
        <div class="relative">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt="Avatar"
            class="w-20 h-20 rounded-full border-4 border-zinc-100 dark:border-zinc-900 bg-zinc-50 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            crossorigin="anonymous"
            @click="openImageModal(avatarUrl, 'Avatar')"
          >
          <div
            v-else
            class="w-20 h-20 rounded-full border-4 border-zinc-100 dark:border-zinc-900 flex items-center justify-center"
            style="background: linear-gradient(to bottom right, #4F8CEE, #64C4AA);"
          >
            <span class="text-white font-bold text-2xl">{{
              avatarInitial
            }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 relative z-10">
          <!-- Follow/Unfollow Button (only for other users) -->
          <button
            v-if="!isOwnProfile"
            :disabled="followLoading"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            :class="
              !auth.authenticated
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : isFollowing
                  ? 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
            "
            @click="toggleFollow"
          >
            <UIcon
              v-if="!followLoading"
              :name="
                !auth.authenticated
                  ? 'i-heroicons-arrow-right-on-rectangle-20-solid'
                  : isFollowing
                    ? 'i-heroicons-user-minus-20-solid'
                    : 'i-heroicons-user-plus-20-solid'
              "
              class="w-4 h-4"
            />
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {{
              !auth.authenticated
                ? 'Sign in to Follow'
                : isFollowing
                  ? 'Unfollow'
                  : 'Follow'
            }}
          </button>
        </div>
      </div>

      <!-- User Info -->
      <div class="space-y-4">
        <!-- Row 1: Name/Username + Portfolio Stats -->
        <div class="flex justify-between items-start">
          <!-- Name and Username -->
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-zinc-900 dark:text-white">
                {{ displayName }}
              </h1>
              <span v-if="userProfile?.is_verified" class="text-blue-500">
                <UIcon
                  name="i-heroicons-check-badge-20-solid"
                  class="w-4 h-4"
                />
              </span>
            </div>
            <div
              v-if="
                userProfile?.username && displayName !== userProfile.username
              "
              class="text-zinc-600 dark:text-zinc-400 text-sm"
            >
              @{{ userProfile.username }}
            </div>
          </div>

          <!-- Social Stats -->
          <div class="flex items-center gap-6 text-sm">
            <button 
              class="text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors"
              @click="openFollowersModal('following')"
            >
              <div class="font-semibold text-zinc-900 dark:text-white text-lg">
                {{ userProfile?.following_count || 0 }}
              </div>
              <div class="text-zinc-600 dark:text-zinc-400 text-xs">Following</div>
            </button>
            <button 
              class="text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors"
              @click="openFollowersModal('followers')"
            >
              <div class="font-semibold text-zinc-900 dark:text-white text-lg">
                {{ userProfile?.followers_count || 0 }}
              </div>
              <div class="text-zinc-600 dark:text-zinc-400 text-xs">Followers</div>
            </button>
          </div>
        </div>

        <!-- Row 2: Bio -->
        <div
          v-if="bio"
          class="text-zinc-900 dark:text-white text-sm"
          @click="handleMentionClick"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="formattedBio" />
        </div>

        <!-- Row 3: Location/Website/Join Date -->
        <div
          class="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400"
        >
          <div v-if="location" class="flex items-center gap-1">
            <UIcon name="i-heroicons-map-pin-20-solid" class="w-4 h-4" />
            <span>{{ location }}</span>
          </div>
          <div v-if="website" class="flex items-center gap-1">
            <UIcon name="i-heroicons-link-20-solid" class="w-4 h-4" />
            <a
              :href="website"
              target="_blank"
              class="hover:text-blue-500 transition"
            >
              {{ formatWebsite(website) }}
            </a>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar-20-solid" class="w-4 h-4" />
            <span
              >Joined
              {{
                userProfile?.created_at
                  ? formatDate(userProfile.created_at)
                  : ''
              }}</span
            >
          </div>
        </div>

        <!-- Row 4: Wallet Addresses -->
        <div v-if="hasWalletAddresses" class="space-y-3">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">Wallet Addresses</h3>
          
          <!-- Bitcoin Address -->
          <div v-if="userProfile?.bitcoin_address?.[0]" class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div class="flex items-center gap-3">
              <img
                :src="TokenService.getTokenIcon('BTC')"
                alt="Bitcoin icon"
                class="w-8 h-8"
              />
              <div>
                <div class="text-sm font-medium text-zinc-900 dark:text-white">Bitcoin</div>
                <div class="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {{ formatAddress(userProfile.bitcoin_address[0]) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyToClipboard(userProfile.bitcoin_address[0], 'Bitcoin')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Copy address"
              >
                <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
              </button>
              <button
                @click="showQRCode(userProfile.bitcoin_address[0], 'Bitcoin')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Show QR code"
              >
                <UIcon name="i-heroicons-qr-code-20-solid" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Ethereum Address -->
          <div v-if="userProfile?.evm_address?.[0]" class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div class="flex items-center gap-3">
              <img
                :src="TokenService.getTokenIcon('ETH')"
                alt="Ethereum icon"
                class="w-8 h-8"
              />
              <div>
                <div class="text-sm font-medium text-zinc-900 dark:text-white">Ethereum</div>
                <div class="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {{ formatAddress(userProfile.evm_address[0]) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyToClipboard(userProfile.evm_address[0], 'Ethereum')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Copy address"
              >
                <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
              </button>
              <button
                @click="showQRCode(userProfile.evm_address[0], 'Ethereum')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Show QR code"
              >
                <UIcon name="i-heroicons-qr-code-20-solid" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Solana Address -->
          <div v-if="userProfile?.solana_address?.[0]" class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div class="flex items-center gap-3">
              <img
                :src="TokenService.getTokenIcon('SOL')"
                alt="Solana icon"
                class="w-8 h-8"
              />
              <div>
                <div class="text-sm font-medium text-zinc-900 dark:text-white">Solana</div>
                <div class="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {{ formatAddress(userProfile.solana_address[0]) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyToClipboard(userProfile.solana_address[0], 'Solana')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Copy address"
              >
                <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
              </button>
              <button
                @click="showQRCode(userProfile.solana_address[0], 'Solana')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Show QR code"
              >
                <UIcon name="i-heroicons-qr-code-20-solid" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- ICP Principal -->
          <div v-if="userProfile?.id" class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div class="flex items-center gap-3">
              <img
                :src="TokenService.getTokenIcon('ICP')"
                alt="ICP icon"
                class="w-8 h-8"
              />
              <div>
                <div class="text-sm font-medium text-zinc-900 dark:text-white">ICP Principal</div>
                <div class="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {{ formatAddress(userProfile.id.toText()) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyToClipboard(userProfile.id.toText(), 'ICP')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Copy address"
              >
                <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
              </button>
              <button
                @click="showQRCode(userProfile.id.toText(), 'ICP')"
                class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Show QR code"
              >
                <UIcon name="i-heroicons-qr-code-20-solid" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Modal -->
  <div
    v-if="imageModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    @click="imageModalOpen = false"
  >
    <div
      class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 max-w-4xl mx-4"
      @click.stop
    >
      <div class="text-center">
        <img
          v-if="selectedImage"
          :src="selectedImage"
          :alt="selectedImageTitle"
          class="max-w-full max-h-[80vh] object-contain rounded-lg"
          crossorigin="anonymous"
        >
        <div class="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {{ selectedImageTitle }}
        </div>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div
    v-if="qrModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    @click="qrModalOpen = false"
  >
    <div
      class="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 max-w-sm mx-4 w-full"
      @click.stop
    >
      <div class="text-center">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
            {{ qrWalletType }} Address
          </h3>
          <button
            @click="qrModalOpen = false"
            class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark-20-solid" class="w-5 h-5" />
          </button>
        </div>

        <!-- QR Code -->
        <div class="bg-white p-4 rounded-lg mb-4 inline-block">
          <canvas ref="qrCanvas" class="max-w-full"></canvas>
        </div>

        <!-- Address -->
        <div class="mb-4">
          <div class="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Address</div>
          <div class="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
            <div class="text-sm font-mono text-zinc-900 dark:text-white break-all">
              {{ qrAddress }}
            </div>
          </div>
        </div>

        <!-- Copy Button -->
        <button
          @click="copyToClipboard(qrAddress, qrWalletType)"
          class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
          Copy Address
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Profile Modal -->
  <EditProfileModal ref="editProfileModalRef" />
  
  <!-- Followers/Following Modal -->
  <FollowersFollowingModal 
    ref="followersModalRef" 
    :user-profile="userProfile" 
    :is-own-profile="isOwnProfile" 
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, inject, nextTick } from 'vue'
  import type { Ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { useToast, navigateTo } from '#imports'
  import { useRoute } from 'vue-router'
  import EditProfileModal from '../EditProfileModal.vue'
  import FollowersFollowingModal from '../FollowersFollowingModal.vue'
  import { TokenService } from '@/services/TokenService'
  import QRCode from 'qrcode'

  // Inject login panel ref
  const loginPanelRef = inject('loginPanelRef') as Ref<{
    open: () => void
    showRegistrationModal: () => void
  } | null>

  interface UserProfile {
    id: { toText(): string }
    username: string
    display_name?: string | string[]
    bio?: string[]
    avatar_url?: string[]
    banner_url?: string[]
    location?: string | string[]
    website?: string | string[]
    evm_address?: string[]
    bitcoin_address?: string[]
    solana_address?: string[]
    is_verified?: boolean
    am_following_them?: boolean
    is_following_me?: boolean
    updated_at?: number
    created_at?: bigint
    following_count?: number
    followers_count?: number
  }

  // Props
  interface Props {
    userProfile?: UserProfile
    isOwnProfile?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    userProfile: undefined,
    isOwnProfile: undefined,
  })

  const auth = useAuthStore()
  const _route = useRoute()
  const followLoading = ref(false)
  const editProfileModalRef = ref<{ open: () => void } | null>(null)
  const followersModalRef = ref<{ open: (tab: 'followers' | 'following') => void } | null>(null)
  const isFollowing = ref(false)

  // User profile data - use props if provided, otherwise use auth store
  const userProfile = computed(() => props.userProfile || auth.userProfile)

  // Force recomputation of avatar/banner URLs when profile updates
  const profileUpdateTrigger = ref(0)

  // Use props if provided, otherwise fall back to computed logic
  const isOwnProfile = computed(() => {
    if (props.isOwnProfile !== undefined) {
      return props.isOwnProfile
    }
    const currentPrincipal = auth.principal
    const profilePrincipal = userProfile.value?.id
    return currentPrincipal === profilePrincipal?.toText()
  })

  // Check if current user is following this profile
  const checkFollowingStatus = async () => {
    if (!userProfile.value?.id || isOwnProfile.value) return

    // Only check following status if user is authenticated
    if (!auth.authenticated || !auth.principal) {
      console.log('User not authenticated, skipping follow status check')
      return
    }

    try {
      const personalProfile = await canisterService.getUserPersonal(
        userProfile.value.id.toText(),
        auth.principal
      )
      if (personalProfile) {
        isFollowing.value = personalProfile.am_following_them
      }
    } catch (error) {
      console.error('Error checking following status:', error)
    }
  }

  // Watch for profile changes to update following status
  watch(
    () => userProfile.value?.id,
    () => {
      checkFollowingStatus()
    }
  )

  // Watch for profile changes to force recomputation of avatar/banner URLs
  watch(
    () => userProfile.value,
    () => {
      profileUpdateTrigger.value++
    },
    { deep: true }
  )

  onMounted(() => {
    checkFollowingStatus()
  })

  // Avatar initial (first letter of username)
  const avatarInitial = computed(() => {
    if (!userProfile.value?.username) return 'U'
    return userProfile.value.username.charAt(0).toUpperCase()
  })

  // Display name (prefer display_name, fallback to username)
  const displayName = computed(() => {
    if (!userProfile.value) return 'Anonymous User'
    // Handle array format from Candid
    const displayNameValue = Array.isArray(userProfile.value.display_name)
      ? userProfile.value.display_name[0]
      : userProfile.value.display_name
    return displayNameValue || userProfile.value.username || 'Anonymous User'
  })

  // Bio text
  const bio = computed(() => {
    if (!userProfile.value?.bio) return ''
    // Handle array format from Candid
    return Array.isArray(userProfile.value.bio)
      ? userProfile.value.bio[0]
      : userProfile.value.bio
  })

  // Location
  const location = computed(() => {
    if (!userProfile.value?.location) return ''
    return Array.isArray(userProfile.value.location)
      ? userProfile.value.location[0]
      : userProfile.value.location
  })

  // Website
  const website = computed(() => {
    if (!userProfile.value?.website) return ''
    return Array.isArray(userProfile.value.website)
      ? userProfile.value.website[0]
      : userProfile.value.website
  })

  // Avatar URL - convert file paths to full URLs with cache busting
  const avatarUrl = computed(() => {
    // Force recomputation when profile updates
    void profileUpdateTrigger.value

    const avatarPath = userProfile.value?.avatar_url?.[0]
    if (!avatarPath) return null

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      return avatarPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(avatarPath)
    const timestamp = Date.now()
    // Use a combination of timestamp and profile update trigger for better cache busting
    const cacheBuster = userProfile.value?.updated_at
      ? Number(userProfile.value.updated_at)
      : timestamp
    return `${baseUrl}?t=${timestamp}&v=${cacheBuster}&trigger=${profileUpdateTrigger.value}`
  })

  // Banner URL - convert file paths to full URLs with cache busting
  const bannerUrl = computed(() => {
    // Force recomputation when profile updates
    void profileUpdateTrigger.value

    const bannerPath = userProfile.value?.banner_url?.[0]
    if (!bannerPath) return null

    // If it's already a full URL, return as is
    if (bannerPath.startsWith('http')) {
      return bannerPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(bannerPath)
    const timestamp = Date.now()
    // Use a combination of timestamp and profile update trigger for better cache busting
    const cacheBuster = userProfile.value?.updated_at
      ? Number(userProfile.value.updated_at)
      : timestamp
    return `${baseUrl}?t=${timestamp}&v=${cacheBuster}&trigger=${profileUpdateTrigger.value}`
  })


  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    if (address.startsWith('0x')) {
      // EVM: first 6, last 4
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    if (address.startsWith('bc1')) {
      // Bitcoin: first 4, last 4
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    if (address.length > 20) {
      // Solana and others: first 4, last 4
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return address
  }

  // Format website URL for display
  const formatWebsite = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  // Format date for display
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000) // Convert from nanoseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  // Computed property for formatted bio with clickable @mentions
  const formattedBio = computed(() => {
    if (!bio.value) return ''

    // Regular expression to match @username patterns
    // Matches @ followed by alphanumeric characters, underscores, and hyphens
    // Also handles edge cases like @username. or @username, or @username!
    const mentionRegex = /@([a-zA-Z0-9_-]+)(?=[\s.,!?]|$)/g

    // Replace @mentions with clickable links
    return bio.value.replace(
      mentionRegex,
      (match: string, username: string) => {
        // Basic validation: username should be at least 1 character and not too long
        if (username.length < 1 || username.length > 20) {
          return match // Return original text if username is invalid
        }

        // Create a clickable link that navigates to the user's profile
        return `<a href="/@${username}" class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200" data-username="${username}">@${username}</a>`
      }
    )
  })

  // Handle mention clicks
  const handleMentionClick = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'A' && target.classList.contains('cursor-pointer')) {
      event.preventDefault()
      const username = target.getAttribute('data-username')
      if (username) {
        // Add visual feedback
        target.style.transform = 'scale(0.95)'
        setTimeout(() => {
          target.style.transform = ''
        }, 150)

        // Use Vue Router to navigate
        navigateTo(`/@${username}`)
      }
    }
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string, walletType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      const toast = useToast()
      toast.add({
        title: `${walletType} Address Copied`,
        description: text,
        color: 'success',
      })
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      const toast = useToast()
      toast.add({
        title: `${walletType} Copy Failed`,
        description: 'Failed to copy address to clipboard.',
        color: 'error',
      })
    }
  }

  // Follow/Unfollow functionality
  const toggleFollow = async () => {
    if (!userProfile.value || isOwnProfile.value) return

    // Check if user is authenticated
    if (!auth.authenticated) {
      console.log('User not authenticated, showing login panel')

      // Show login panel
      if (loginPanelRef?.value) {
        loginPanelRef.value.open()
      }

      return
    }

    followLoading.value = true
    try {
      if (isFollowing.value) {
        await canisterService.unfollowUser(userProfile.value.id.toText())
        isFollowing.value = false
        const toast = useToast()
        toast.add({
          title: 'Unfollowed',
          description: `You unfollowed @${userProfile.value.username}`,
          color: 'success',
        })
      } else {
        try {
          await canisterService.followUser(userProfile.value.id.toText())
          isFollowing.value = true
          const toast = useToast()
          toast.add({
            title: 'Following',
            description: `You are now following @${userProfile.value.username}`,
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
              description: `You are already following @${userProfile.value.username}`,
              color: 'info',
            })
            return
          }
          throw error
        }
      }
      // Refresh profile data
      await canisterService.getMyProfile()
    } catch (error) {
      console.error('Follow/Unfollow failed:', error)
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to follow/unfollow user. Please try again.',
        color: 'error',
      })
    } finally {
      followLoading.value = false
    }
  }

  // Edit profile function
  const editProfile = () => {
    if (editProfileModalRef.value) {
      editProfileModalRef.value.open()
    }
  }

  // Open followers/following modal
  const openFollowersModal = (tab: 'followers' | 'following') => {
    if (followersModalRef.value) {
      followersModalRef.value.open(tab)
    }
  }

  // Image modal functionality
  const imageModalOpen = ref(false)
  const selectedImage = ref<string | null>(null)
  const selectedImageTitle = ref('')

  const openImageModal = (imageUrl: string, title: string) => {
    selectedImage.value = imageUrl
    selectedImageTitle.value = title
    imageModalOpen.value = true
  }

  // QR code modal functionality
  const qrModalOpen = ref(false)
  const qrAddress = ref('')
  const qrWalletType = ref('')
  const qrCanvas = ref<HTMLCanvasElement | null>(null)

  const showQRCode = async (address: string, walletType: string) => {
    qrAddress.value = address
    qrWalletType.value = walletType
    qrModalOpen.value = true
    
    // Generate QR code after modal is rendered
    await nextTick()
    if (qrCanvas.value) {
      try {
        await QRCode.toCanvas(qrCanvas.value, address, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }
  }

  // Check if user has any wallet addresses
  const hasWalletAddresses = computed(() => {
    return !!(
      userProfile.value?.bitcoin_address?.[0] ||
      userProfile.value?.evm_address?.[0] ||
      userProfile.value?.solana_address?.[0] ||
      userProfile.value?.id
    )
  })

  // Define emits
  defineEmits<{
    tabChange: [tab: string]
  }>()
</script>
