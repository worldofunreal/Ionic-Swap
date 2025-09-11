<template>
  <div
    class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors rounded-lg"
    @click="handleClick"
  >
    <!-- Avatar -->
    <div class="relative flex-shrink-0">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="user.username || 'User avatar'"
        class="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
        crossorigin="anonymous"
      >
      <div
        v-else
        class="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-700"
      >
        {{ user.username?.charAt(0).toUpperCase() || 'U' }}
      </div>
    </div>

    <!-- User Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 dark:text-white truncate">
          {{ displayName }}
        </span>
        <span v-if="user.is_verified" class="text-blue-500">
          <UIcon name="i-heroicons-check-badge-20-solid" class="w-4 h-4" />
        </span>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
        @{{ user.username }}
      </p>
      <p
        v-if="user.bio?.[0]"
        class="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1"
      >
        {{ user.bio[0] }}
      </p>
      <!-- Follows you indicator -->
      <p
        v-if="isFollowingMe"
        class="text-xs text-green-600 dark:text-green-400 mt-1"
      >
        Follows you
      </p>
    </div>

    <!-- Follow Status -->
    <div v-if="showFollowButton" class="flex-shrink-0">
      <UButton
        v-if="!isFollowing"
        size="xs"
        color="primary"
        variant="soft"
        :loading="followLoading"
        @click.stop="handleFollow"
      >
        Follow
      </UButton>
      <UButton
        v-else
        size="xs"
        color="neutral"
        variant="soft"
        :loading="followLoading"
        @click.stop="handleUnfollow"
        @mouseenter="isHoveringFollowButton = true"
        @mouseleave="isHoveringFollowButton = false"
      >
        {{ isHoveringFollowButton ? 'Unfollow' : 'Following' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'

  interface Props {
    user: any
    showFollowButton?: boolean
    clickable?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showFollowButton: true,
    clickable: true,
  })

  const emit = defineEmits<{
    click: [user: any]
    follow: [user: any]
    unfollow: [user: any]
  }>()

  const authStore = useAuthStore()
  const router = useRouter()
  const followLoading = ref(false)
  const isHoveringFollowButton = ref(false)

  // Display name (prefer display_name, fallback to username)
  const displayName = computed(() => {
    if (!props.user) return 'Anonymous User'
    const displayNameValue = Array.isArray(props.user.display_name)
      ? props.user.display_name[0]
      : props.user.display_name
    return displayNameValue || props.user.username || 'Anonymous User'
  })

  // Avatar URL - convert file paths to full URLs with cache busting
  const avatarUrl = computed(() => {
    const avatarPath = props.user?.avatar_url?.[0]
    if (!avatarPath) return null

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      return avatarPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(avatarPath)
    const timestamp = Date.now()
    // Use a combination of timestamp and profile update trigger for better cache busting
    const cacheBuster = props.user?.updated_at
      ? Number(props.user.updated_at)
      : timestamp
    return `${baseUrl}?t=${timestamp}&v=${cacheBuster}&trigger=${Date.now()}`
  })

  // Check if we should show follow button
  const showFollowButton = computed(() => {
    if (!props.showFollowButton) return false
    if (!authStore.authenticated) return false
    if (!props.user?.id) return false

    // Don't show follow button for own profile
    return props.user.id.toText() !== authStore.userProfile?.id?.toText()
  })

  // Use the follow status from the user object (provided by parent)
  // For public data, these will be false/undefined
  // For personal data, these will have actual values
  const isFollowing = computed(() => {
    // Only show following state if we have personal data (authenticated user)
    if (!authStore.authenticated) return false
    return props.user?.am_following_them === true
  })

  const isFollowingMe = computed(() => {
    // Only show following state if we have personal data (authenticated user)
    if (!authStore.authenticated) return false
    return props.user?.is_following_me === true
  })

  const handleFollow = async () => {
    if (!props.user?.id || followLoading.value) return

    followLoading.value = true
    try {
      await canisterService.followUser(props.user.id.toText())

      // Update the user's following status
      props.user.am_following_them = true

      // Clear cache to ensure fresh data
      canisterService.clearCache()

      const toast = useToast()
      toast.add({
        title: 'Following',
        description: `You are now following @${props.user.username}`,
        color: 'success',
      })

      // Emit event to parent to update its state
      emit('follow', props.user)
    } catch (error: any) {
      console.error('Follow failed:', error)

      // Handle "Already following" error gracefully
      if (error.message?.includes('Already following this user')) {
        props.user.am_following_them = true

        const toast = useToast()
        toast.add({
          title: 'Already Following',
          description: `You are already following @${props.user.username}`,
          color: 'info',
        })

        // Emit event to parent to update its state
        emit('follow', props.user)
        return
      }

      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to follow user. Please try again.',
        color: 'error',
      })
    } finally {
      followLoading.value = false
    }
  }

  const handleUnfollow = async () => {
    if (!props.user?.id || followLoading.value) return

    followLoading.value = true
    try {
      await canisterService.unfollowUser(props.user.id.toText())

      // Update the user's following status
      props.user.am_following_them = false

      // Clear cache to ensure fresh data
      canisterService.clearCache()

      const toast = useToast()
      toast.add({
        title: 'Unfollowed',
        description: `You unfollowed @${props.user.username}`,
        color: 'success',
      })

      // Emit event to parent to update its state
      emit('unfollow', props.user)
    } catch (error) {
      console.error('Unfollow failed:', error)

      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to unfollow user. Please try again.',
        color: 'error',
      })
    } finally {
      followLoading.value = false
    }
  }

  const handleClick = () => {
    if (props.clickable) {
      // Navigate to the new @username route
      router.push(`/@${props.user.username}`)
      emit('click', props.user)
    }
  }
</script>
