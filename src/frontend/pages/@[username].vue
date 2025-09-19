<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 flex-col">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          User Not Found
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          The user "{{ username }}" could not be found.
        </p>
        <UButton color="primary" @click="$router.push('/')"> Go Home </UButton>
      </div>
    </div>

    <!-- Profile Content -->
    <div
      v-else-if="userProfile"
      class="flex flex-col lg:flex-row min-h-screen bg-neutral-50 dark:bg-neutral-950"
    >
      <!-- Left Column: Fixed User Profile Header -->
      <div class="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white dark:bg-neutral-950 lg:border-r border-gray-200 dark:border-gray-800 lg:border-b-0 border-b">
        <UserProfileHeader
          :user-profile="userProfile"
          :is-own-profile="isOwnProfile"
          @tab-change="activeTab = $event"
        />
      </div>

      <!-- Right Column: Scrollable Tabs and Content -->
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Navigation Tabs -->
        <div class="px-4 pt-4 pb-2 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <ProfileTabs v-model="activeTab" />
        </div>
        
        <!-- Tabbed Content Area -->
        <div class="flex-1 flex w-full min-h-0 overflow-hidden">
          <!-- Main Content Area - Full Width -->
          <div class="w-full min-h-0 overflow-y-auto">
            <component
              :is="tabComponent"
              :target-user="userProfile"
              :is-own-profile="isOwnProfile"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import UserProfileHeader from '~/components/profile/UserProfileHeader.vue'
  import ProfileTabs from '~/components/profile/ProfileTabs.vue'

  // Main area components for each tab
  import PortfolioMain from '@/components/profile/PortfolioMain.vue'
  import FollowingMain from '@/components/profile/FollowingMain.vue'
  import FollowersMain from '@/components/profile/FollowersMain.vue'
  import ActivityMain from '@/components/profile/ActivityMain.vue'

  const route = useRoute()
  const auth = useAuthStore()

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

  const loading = ref(true)
  const error = ref(false)
  const userProfile = ref<UserProfile | null>(null)
  const activeTab = ref('Portfolio')

  // Extract username from route (remove @ symbol)
  const username = computed(() => {
    const routeUsername = route.params.username as string
    return routeUsername.startsWith('@')
      ? routeUsername.slice(1)
      : routeUsername
  })

  // SSR: Fetch profile data on server-side
  const { data: ssrProfile } = await useFetch(
    `/api/profile/${username.value}`,
    {
      key: `profile-${username.value}`,
      default: () => null,
      server: true,
      // Don't fail if SSR API is not available
      onResponseError: () => {
        console.log('SSR API not available, will use client-side fetching')
      },
    }
  )

  // If SSR data is available and valid, use it immediately
  if (ssrProfile.value && ssrProfile.value.success !== false) {
    userProfile.value = ssrProfile.value.data
    loading.value = false
  }

  // Check if this is the current user's profile
  const isOwnProfile = computed(() => {
    if (!userProfile.value || !auth.userProfile) return false
    return userProfile.value.id?.toText() === auth.userProfile.id?.toText()
  })

  // SEO: Generate meta tags and structured data
  const profileDisplayName = computed(() => {
    if (!userProfile.value?.display_name) return username.value
    return Array.isArray(userProfile.value.display_name)
      ? userProfile.value.display_name[0]
      : userProfile.value.display_name
  })

  const profileBio = computed(() => {
    if (!userProfile.value?.bio) return ''
    return Array.isArray(userProfile.value.bio)
      ? userProfile.value.bio[0]
      : userProfile.value.bio
  })

  const profileAvatarUrl = computed(() => {
    const avatarPath = userProfile.value?.avatar_url?.[0]
    if (!avatarPath) return 'https://ionicswap.com/logo.svg'

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
    return `${baseUrl}?t=${timestamp}&v=${cacheBuster}&trigger=${Date.now()}`
  })

  // Set page meta tags for SEO
  useHead({
    title: computed(() =>
      userProfile.value
        ? `${profileDisplayName.value} (@${username.value}) - Ionic Swap`
        : 'Profile Not Found - Ionic Swap'
    ),
    meta: [
      {
        name: 'description',
        content: computed(() =>
          userProfile.value
            ? profileBio.value ||
              `View ${profileDisplayName.value}'s token portfolio and activity on Ionic Swap - Cross-Chain Token Swapping`
            : 'Profile not found on Ionic Swap'
        ),
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      // Open Graph tags
      {
        property: 'og:title',
        content: computed(() =>
          userProfile.value
            ? `${profileDisplayName.value} (@${username.value}) - Ionic Swap`
            : 'Profile Not Found - Ionic Swap'
        ),
      },
      {
        property: 'og:description',
        content: computed(() =>
          userProfile.value
            ? profileBio.value ||
              `View ${profileDisplayName.value}'s token portfolio and activity on Ionic Swap`
            : 'Profile not found on Ionic Swap'
        ),
      },
      {
        property: 'og:type',
        content: 'profile',
      },
      {
        property: 'og:url',
        content: computed(() => `https://ionicswap.com/@${username.value}`),
      },
      {
        property: 'og:image',
        content: computed(() => profileAvatarUrl.value),
      },
      // Twitter Card tags
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        name: 'twitter:title',
        content: computed(() =>
          userProfile.value
            ? `${profileDisplayName.value} (@${username.value}) - Ionic Swap`
            : 'Profile Not Found - Ionic Swap'
        ),
      },
      {
        name: 'twitter:description',
        content: computed(() =>
          userProfile.value
            ? profileBio.value ||
              `View ${profileDisplayName.value}'s token portfolio and activity on Ionic Swap`
            : 'Profile not found on Ionic Swap'
        ),
      },
      {
        name: 'twitter:image',
        content: computed(() => profileAvatarUrl.value),
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: computed(() => `https://ionicswap.com/@${username.value}`),
      },
    ],
  })

  // Structured data for search engines
  useHead({
    script: computed(() => {
      if (!userProfile.value) return []

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `https://ionicswap.com/@${username.value}`,
        name: profileDisplayName.value,
        alternateName: `@${username.value}`,
        description: profileBio.value,
        image: profileAvatarUrl.value,
        url: `https://ionicswap.com/@${username.value}`,
        sameAs: [
          // Add social media links if available
          ...(userProfile.value.website ? [userProfile.value.website] : []),
        ],
        worksFor: {
          '@type': 'Organization',
          name: 'Ionic Swap',
          url: 'https://ionicswap.com',
        },
        knowsAbout: ['DeFi', 'Cryptocurrency', 'Token Trading', 'Blockchain'],
        hasOccupation: {
          '@type': 'Occupation',
          name: 'Token Trader & DeFi User',
        },
      }

      return [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(structuredData),
        },
      ]
    }),
  })

  const tabComponent = computed(() => {
    switch (activeTab.value) {
      case 'Portfolio':
        return PortfolioMain
      case 'Following':
        return FollowingMain
      case 'Followers':
        return FollowersMain
      case 'Activity':
        return ActivityMain
      default:
        return PortfolioMain
    }
  })


  // Load user profile (fallback for when SSR fails)
  const loadUserProfile = async () => {
    // Skip if we already have SSR data
    if (userProfile.value) {
      return
    }

    loading.value = true
    error.value = false

    try {
      // Initialize canister service if needed (works for both authenticated and public access)
      if (!canisterService.isInitialized()) {
        await canisterService.initializeAnonymous()
      }

      // Get user profile by username (works for both authenticated and public access)
      const profile = await canisterService.getPublicProfile(username.value)

      if (profile) {
        userProfile.value = profile
      } else {
        error.value = true
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    // Always ensure we have data, fall back to client-side if SSR failed
    if (!userProfile.value) {
      loadUserProfile()
    } else {
      // SSR data is available, we're done loading
      loading.value = false
    }
  })

  // Watch for route changes
  watch(
    () => route.params.username,
    () => {
      // Reset and reload for new username
      userProfile.value = null
      loadUserProfile()
    }
  )

  // Watch for auth store profile updates and sync if it's the same user
  watch(
    () => auth.userProfile,
    newAuthProfile => {
      if (newAuthProfile && userProfile.value && isOwnProfile.value) {
        // Update the local userProfile ref with the latest data from auth store
        userProfile.value = newAuthProfile
      }
    },
    { deep: true }
  )
</script>
