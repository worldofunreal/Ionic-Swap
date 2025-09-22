<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/50 flex items-center justify-center z-50"
    @click="close"
  >
    <div
      class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
      @click.stop
    >
      <!-- Header with Tabs -->
      <div class="border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            @click="close"
          >
            <UIcon name="i-heroicons-x-mark-20-solid" class="w-6 h-6" />
          </button>
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
            {{ username }}
          </h2>
          <div class="w-6 h-6" /> <!-- Spacer -->
        </div>
        
        <!-- Tabs -->
        <div class="flex">
          <button
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'followers'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            ]"
            @click="activeTab = 'followers'"
          >
            {{ followersCount }} Followers
          </button>
          <button
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'following'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            ]"
            @click="activeTab = 'following'"
          >
            {{ followingCount }} Following
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[60vh]">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>

        <!-- Followers Tab -->
        <div v-else-if="activeTab === 'followers'" class="p-4">
          <!-- Empty State -->
          <div v-if="followers.length === 0" class="text-center py-8">
            <UIcon
              name="i-heroicons-user-group-20-solid"
              class="w-12 h-12 mx-auto mb-4 text-zinc-400"
            />
            <h3 class="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              {{ isOwnProfile ? 'No followers yet' : `@${username} has no followers yet` }}
            </h3>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm">
              {{ isOwnProfile ? "When people follow you, they'll appear here." : `When people follow @${username}, they'll appear here.` }}
            </p>
          </div>

          <!-- Followers List -->
          <div v-else class="space-y-3">
            <CompactProfile
              v-for="user in followers"
              :key="user.id.toText()"
              :user="user"
              :show-follow-button="true"
              :clickable="true"
              @click="viewProfile"
              @follow="followUser"
            />
          </div>
        </div>

        <!-- Following Tab -->
        <div v-else-if="activeTab === 'following'" class="p-4">
          <!-- Empty State -->
          <div v-if="following.length === 0" class="text-center py-8">
            <UIcon
              name="i-heroicons-user-group-20-solid"
              class="w-12 h-12 mx-auto mb-4 text-zinc-400"
            />
            <h3 class="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              {{ isOwnProfile ? 'Not following anyone yet' : `@${username} is not following anyone yet` }}
            </h3>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm">
              {{ isOwnProfile ? "When you follow people, they'll appear here." : `When @${username} follows people, they'll appear here.` }}
            </p>
          </div>

          <!-- Following List -->
          <div v-else class="space-y-3">
            <CompactProfile
              v-for="user in following"
              :key="user.id.toText()"
              :user="user"
              :show-follow-button="true"
              :clickable="true"
              @click="viewProfile"
              @unfollow="unfollowUser"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { canisterService } from '@/services/CanisterService'
import CompactProfile from '@/components/CompactProfile.vue'

interface User {
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

interface Props {
  userProfile?: any
  isOwnProfile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userProfile: undefined,
  isOwnProfile: false,
})

const auth = useAuthStore()
const show = ref(false)
const loading = ref(false)
const activeTab = ref<'followers' | 'following'>('followers')
const followers = ref<User[]>([])
const following = ref<User[]>([])

// Computed properties
const username = computed(() => props.userProfile?.username || 'User')
const followersCount = computed(() => props.userProfile?.followers_count || 0)
const followingCount = computed(() => props.userProfile?.following_count || 0)
const targetPrincipal = computed(() => props.userProfile?.id?.toText() || auth.principal)

// Load followers
const loadFollowers = async () => {
  if (!targetPrincipal.value) return

  try {
    const result = await canisterService.getFollowers(targetPrincipal.value)
    followers.value = result
  } catch (error) {
    console.error('Failed to load followers:', error)
  }
}

// Load following
const loadFollowing = async () => {
  if (!targetPrincipal.value) return

  try {
    const result = await canisterService.getFollowing(targetPrincipal.value)
    following.value = result
  } catch (error) {
    console.error('Failed to load following:', error)
  }
}

// Load data based on active tab
const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'followers') {
      await loadFollowers()
    } else {
      await loadFollowing()
    }
  } finally {
    loading.value = false
  }
}

// Watch tab changes
watch(activeTab, () => {
  loadData()
})

// Follow user
const followUser = async (user: User) => {
  try {
    await canisterService.followUser(user.id.toText())
    
    // Update the user's following status
    const userIndex = followers.value.findIndex(u => u.id.toText() === user.id.toText())
    if (userIndex !== -1) {
      followers.value[userIndex].am_following_them = true
    }
  } catch (error) {
    console.error('Failed to follow user:', error)
  }
}

// Unfollow user
const unfollowUser = async (user: User) => {
  try {
    await canisterService.unfollowUser(user.id.toText())
    
    // Remove from following list if we're viewing following tab
    if (activeTab.value === 'following') {
      following.value = following.value.filter(u => u.id.toText() !== user.id.toText())
    }
  } catch (error) {
    console.error('Failed to unfollow user:', error)
  }
}

// View user profile
const viewProfile = (user: User) => {
  close()
  navigateTo(`/@${user.username}`)
}

// Public API
const open = (tab: 'followers' | 'following' = 'followers') => {
  show.value = true
  activeTab.value = tab
  loadData()
}

const close = () => {
  show.value = false
  followers.value = []
  following.value = []
}

defineExpose({ open, close })
</script>
