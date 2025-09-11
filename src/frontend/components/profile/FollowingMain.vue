<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Following
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{
            isOwnProfile
              ? 'People you follow'
              : `People @${targetUser?.username} follows`
          }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="following.length === 0" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500">
          <UIcon
            name="i-heroicons-user-group-20-solid"
            class="w-12 h-12 mx-auto mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{
              isOwnProfile
                ? 'Not following anyone yet'
                : `@${targetUser?.username} is not following anyone yet`
            }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            {{
              isOwnProfile
                ? "When you follow people, they'll appear here."
                : `When @${targetUser?.username} follows people, they'll appear here.`
            }}
          </p>
        </div>
      </div>

      <!-- Following List -->
      <div v-else class="space-y-4">
        <CompactProfile
          v-for="user in following"
          :key="user.id"
          :user="user"
          :show-follow-button="true"
          :clickable="true"
          @click="viewProfile"
          @unfollow="unfollowUser"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-6">
        <UButton
          color="primary"
          variant="soft"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load More
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import CompactProfile from '@/components/CompactProfile.vue'

  interface Props {
    targetUser?: any
    isOwnProfile?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    targetUser: undefined,
    isOwnProfile: false,
  })

  const auth = useAuthStore()
  const loading = ref(false)
  const loadingMore = ref(false)
  const unfollowingUser = ref<string | null>(null)
  const following = ref<any[]>([])
  const hasMore = ref(false)

  // Get the principal to use for loading following data
  const targetPrincipal = computed(() => {
    return props.targetUser?.id?.toText() || auth.principal
  })

  // Load following list
  const loadFollowing = async () => {
    if (!targetPrincipal.value) return

    loading.value = true
    try {
      const result = await canisterService.getFollowing(targetPrincipal.value)
      following.value = result
    } catch (error) {
      console.error('Failed to load following:', error)
    } finally {
      loading.value = false
    }
  }

  // Watch for target user changes
  watch(
    () => props.targetUser?.id,
    () => {
      if (props.targetUser?.id) {
        loadFollowing()
      }
    }
  )

  // Load more following
  const loadMore = async () => {
    if (loadingMore.value) return

    loadingMore.value = true
    try {
      // TODO: Implement pagination
      console.log('Loading more following...')
    } catch (error) {
      console.error('Failed to load more following:', error)
    } finally {
      loadingMore.value = false
    }
  }

  // Unfollow user
  const unfollowUser = async (user: any) => {
    unfollowingUser.value = user.id
    try {
      await canisterService.unfollowUser(user.id.toText())

      // Remove from list
      following.value = following.value.filter(u => u.id !== user.id)
    } catch (error) {
      console.error('Failed to unfollow user:', error)
    } finally {
      unfollowingUser.value = null
    }
  }

  // View user profile
  const viewProfile = (user: any) => {
    navigateTo(`/@${user.username}`)
  }

  onMounted(() => {
    loadFollowing()
  })
</script>
