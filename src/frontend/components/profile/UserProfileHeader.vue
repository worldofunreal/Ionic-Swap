<template>
  <div
    class="bg-white dark:bg-neutral-950 rounded-lg shadow-lg overflow-hidden mb-8"
  >
    <!-- Banner Section -->
    <div
      class="relative bg-gradient-to-r from-blue-500 to-purple-600"
      style="aspect-ratio: 3/1"
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
    </div>

    <!-- Profile Info Section -->
    <div class="px-6 pb-6">
      <!-- Avatar Section -->
      <div class="flex justify-between items-start -mt-16 mb-4">
        <div class="relative">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt="Avatar"
            class="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-lg bg-white object-cover cursor-pointer hover:opacity-90 transition-opacity"
            crossorigin="anonymous"
            @click="openImageModal(avatarUrl, 'Avatar')"
          >
          <div
            v-else
            class="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <span class="text-white font-bold text-5xl">{{
              avatarInitial
            }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 mt-4 relative z-10">
          <!-- Follow/Unfollow Button (only for other users) -->
          <UButton
            v-if="!isOwnProfile"
            :color="
              !auth.authenticated
                ? 'primary'
                : isFollowing
                  ? 'neutral'
                  : 'primary'
            "
            :variant="
              !auth.authenticated ? 'solid' : isFollowing ? 'soft' : 'solid'
            "
            :loading="followLoading"
            class="follow-btn"
            @click="toggleFollow"
          >
            <UIcon
              :name="
                !auth.authenticated
                  ? 'i-heroicons-arrow-right-on-rectangle-20-solid'
                  : isFollowing
                    ? 'i-heroicons-user-minus-20-solid'
                    : 'i-heroicons-user-plus-20-solid'
              "
              class="w-4 h-4 mr-2"
            />
            {{
              !auth.authenticated
                ? 'Sign in to Follow'
                : isFollowing
                  ? 'Unfollow'
                  : 'Follow'
            }}
          </UButton>

          <!-- Edit Profile Button (own profile only) -->
          <UButton
            v-if="isOwnProfile"
            color="primary"
            variant="solid"
            class="edit-profile-btn"
            @click="editProfile"
          >
            <UIcon
              name="i-heroicons-pencil-square-20-solid"
              class="w-4 h-4 mr-2"
            />
            Edit Profile
          </UButton>
        </div>
      </div>

      <!-- User Info -->
      <div class="space-y-6">
        <!-- Row 1: Name/Username/Bio + Wallet Addresses -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <!-- Name, Username, and Bio -->
          <div class="space-y-4 text-left justify-self-start">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ displayName }}
                </h1>
                <span v-if="userProfile?.is_verified" class="text-blue-500">
                  <UIcon
                    name="i-heroicons-check-badge-20-solid"
                    class="w-5 h-5"
                  />
                </span>
              </div>
              <div
                v-if="
                  userProfile?.username && displayName !== userProfile.username
                "
                class="text-gray-600 dark:text-gray-400"
              >
                @{{ userProfile.username }}
              </div>
            </div>

            <!-- Bio -->
            <div
              v-if="bio"
              class="text-gray-900 dark:text-white"
              @click="handleMentionClick"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="formattedBio" />
            </div>
          </div>

          <!-- Wallet Addresses -->
          <div class="grid grid-cols-2 gap-3 justify-self-end">
            <!-- EVM Address -->
            <div
              v-if="userProfile?.evm_address?.[0]"
              class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span
                class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full"
                >EVM</span
              >
              <span class="truncate flex-1">{{
                formatAddress(userProfile.evm_address[0])
              }}</span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="cursor-pointer hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(userProfile.evm_address[0], 'EVM')"
              />
            </div>

            <!-- Bitcoin Address -->
            <div
              v-if="userProfile?.bitcoin_address?.[0]"
              class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span
                class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-semibold px-2 py-1 rounded-full"
                >BTC</span
              >
              <span class="truncate flex-1">{{
                formatAddress(userProfile.bitcoin_address[0])
              }}</span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="cursor-pointer hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                @click="
                  copyToClipboard(userProfile.bitcoin_address[0], 'Bitcoin')
                "
              />
            </div>

            <!-- Solana Address -->
            <div
              v-if="userProfile?.solana_address?.[0]"
              class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span
                class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold px-2 py-1 rounded-full"
                >SOL</span
              >
              <span class="truncate flex-1">{{
                formatAddress(userProfile.solana_address[0])
              }}</span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="cursor-pointer hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                @click="
                  copyToClipboard(userProfile.solana_address[0], 'Solana')
                "
              />
            </div>

            <!-- ICP Principal -->
            <div
              v-if="userProfile?.id"
              class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span
                class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full"
                >ICP</span
              >
              <span class="truncate flex-1">{{
                formatAddress(userProfile.id.toText())
              }}</span>
              <UIcon
                name="i-heroicons-document-duplicate-20-solid"
                class="cursor-pointer hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                @click="copyToClipboard(userProfile.id.toText(), 'ICP')"
              />
            </div>
          </div>
        </div>

        <!-- Row 2: Location/Website/Follow Stats + Portfolio Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <!-- Location, Website, Follow Stats -->
          <div class="space-y-4 text-left justify-self-start">
            <!-- Location & Website -->
            <div
              class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
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

            <!-- Follow Stats -->
            <div class="flex items-center gap-6 text-sm">
              <button
                class="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                @click="$emit('tabChange', 'Following')"
              >
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  userProfile?.following_count || 0
                }}</span>
                <span class="text-gray-600 dark:text-gray-400">Following</span>
              </button>
              <button
                class="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                @click="$emit('tabChange', 'Followers')"
              >
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  userProfile?.followers_count || 0
                }}</span>
                <span class="text-gray-600 dark:text-gray-400">Followers</span>
              </button>
            </div>
          </div>

          <!-- Portfolio Overview -->
          <div
            class="flex items-center gap-6 text-sm justify-self-end self-end"
          >
            <div class="flex items-center gap-1">
              <span class="text-gray-600 dark:text-gray-400">Portfolio:</span>
              <span class="font-semibold text-gray-900 dark:text-white"
                >{{ portfolioValueEth }} ETH</span
              >
            </div>
            <div class="flex items-center gap-1">
              <span class="text-gray-600 dark:text-gray-400">Tokens:</span>
              <span class="font-semibold text-gray-900 dark:text-white"
                >{{ tokenPercentage }}%</span
              >
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
      class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-4"
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
        <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {{ selectedImageTitle }}
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Profile Modal -->
  <EditProfileModal ref="editProfileModalRef" />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, inject } from 'vue'
  import type { Ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { useToast, navigateTo } from '#imports'
  import { useRoute } from 'vue-router'
  import EditProfileModal from '../EditProfileModal.vue'

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
    is_verified?: boolean
    am_following_them?: boolean
    is_following_me?: boolean
    updated_at?: number
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

  // Portfolio stats - using placeholder values for now
  const portfolioValueEth = computed(() => {
    return '0.00' // Portfolio data not available in current backend User type
  })

  const tokenPercentage = computed(() => {
    return '0' // Portfolio data not available in current backend User type
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

  // Image modal functionality
  const imageModalOpen = ref(false)
  const selectedImage = ref<string | null>(null)
  const selectedImageTitle = ref('')

  const openImageModal = (imageUrl: string, title: string) => {
    selectedImage.value = imageUrl
    selectedImageTitle.value = title
    imageModalOpen.value = true
  }

  // Define emits
  defineEmits<{
    tabChange: [tab: string]
  }>()
</script>
