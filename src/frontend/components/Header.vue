<template>
  <header
    :class="[
      'sticky z-50 top-0 left-0 w-full transition-all duration-500 ease-in-out',
      scrolled
        ? 'bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-md'
        : 'bg-transparent',
      'border-b border-zinc-200 dark:border-zinc-800',
    ]"
  >
    <div class="flex justify-between items-center h-14 mx-4 md:mx-4">
      <!-- Left: Mobile Menu Button and Search Bar -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle mobile menu"
          @click="toggleMobileSidebar"
        >
          <UIcon
            name="i-heroicons-bars-3-20-solid"
            class="w-6 h-6 text-zinc-700 dark:text-zinc-300"
          />
        </button>
        <!-- Search Bar -->
        <div
          class="hidden md:flex items-center ml-2 search-tokens-section relative"
        >
          <UInput
            v-model="search"
            placeholder="Search Ionic Swap"
            size="lg"
            class="w-96 h-12 text-lg [&>input]:bg-zinc-50 [&>input]:dark:bg-zinc-800 [&>input]:border-zinc-200 [&>input]:dark:border-zinc-700"
            icon="ri:search-line"
            @input="handleSearchInput"
            @focus="showSearchResults = true"
            @blur="handleSearchBlur"
          />

          <!-- Search Results Dropdown -->
          <div
            v-if="
              showSearchResults &&
              (searchResults.length > 0 || searchLoading || searchError)
            "
            class="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-y-auto z-50"
            @mousedown.prevent
          >
            <!-- Loading State -->
            <div v-if="searchLoading" class="p-4 text-center">
              <div
                class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"
              />
              <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Searching...
              </p>
            </div>

            <!-- Error State -->
            <div v-else-if="searchError" class="p-4 text-center">
              <UIcon
                name="i-heroicons-exclamation-triangle-20-solid"
                class="w-6 h-6 text-red-500 mx-auto"
              />
              <p class="text-sm text-red-500 mt-2">{{ searchError }}</p>
            </div>

            <!-- Results -->
            <div v-else-if="searchResults.length > 0" class="py-2">
              <CompactProfile
                v-for="user in searchResults"
                :key="user.id.toText()"
                :user="user"
                :show-follow-button="true"
                :clickable="true"
                @click="selectUser"
                @follow="handleFollow"
                @unfollow="handleUnfollow"
              />
            </div>

            <!-- No Results -->
            <div v-else-if="search.trim().length >= 2" class="p-4 text-center">
              <UIcon
                name="i-heroicons-magnifying-glass-20-solid"
                class="w-6 h-6 text-zinc-400 mx-auto"
              />
              <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                No users found
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- Right: Actions -->
      <div class="flex items-center gap-2 ml-auto">

        <!-- Connect Wallet Button -->
        <UButton
          v-if="!authStore.authenticated"
          color="primary"
          icon="solar:wallet-bold"
          class="!flex connect-wallet-btn text-white text-sm px-3 py-1.5 !visible !opacity-100"
          style="
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          "
          @click="openLoginPanel"
        >
          <span class="hidden md:inline">Connect Wallet</span>
          <span class="md:hidden">Connect</span>
        </UButton>

        <!-- Profile Avatar with Dropdown -->
        <HeaderProfile v-if="authStore.authenticated" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, inject, type Ref } from 'vue'
  import { useNuxtApp } from '#imports'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import CompactProfile from '@/components/CompactProfile.vue'

  defineOptions({
    name: 'AppHeader',
  })

  const authStore = useAuthStore()
  const { $trackButtonClick } = useNuxtApp()

  interface SearchUser {
    id: { toText(): string }
    username: string
    display_name?: string | string[]
    avatar_url?: string[]
    am_following_them?: boolean
  }

  const scrolled = ref(false)
  const search = ref('')
  const searchResults = ref<SearchUser[]>([])
  const searchLoading = ref(false)
  const searchError = ref('')
  const showSearchResults = ref(false)
  const searchTimeout = ref<NodeJS.Timeout | null>(null)

  // Inject the login panel ref from the app
  const loginPanelRef = inject('loginPanelRef') as Ref<{
    open: () => void
  }> | null

  const onScroll = () => {
    scrolled.value = window.scrollY > 10
  }


  const toggleMobileSidebar = (): void => {
    // Emit event to parent component to control mobile sidebar visibility
    emit('toggle-mobile-sidebar')
  }

  // Search functionality
  const handleSearchInput = () => {
    // Clear previous timeout
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }

    // Clear results if search is too short
    if (search.value.trim().length < 2) {
      searchResults.value = []
      searchError.value = ''
      return
    }

    // Set loading state
    searchLoading.value = true
    searchError.value = ''

    // Debounce the search
    searchTimeout.value = setTimeout(async () => {
      await performSearch()
    }, 300)
  }

  const performSearch = async () => {
    if (search.value.trim().length < 2) {
      searchLoading.value = false
      return
    }

    try {
      // Initialize canister service if needed
      if (!canisterService.isInitialized()) {
        await canisterService.initializeAnonymous()
      }

      // Wait for auth store to be fully initialized
      if (authStore.authenticated && !authStore.principal) {
        // Wait a bit for session restoration to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Use personal search if authenticated, otherwise use public search
      if (authStore.authenticated && authStore.principal) {
        const results = await canisterService.searchUsersPersonal(
          search.value.trim(),
          10,
          authStore.principal
        )
        searchResults.value = results
      } else {
        const results = await canisterService.searchUsers(
          search.value.trim(),
          10
        )
        searchResults.value = results
      }

      searchError.value = ''
    } catch (error) {
      console.error('Search failed:', error)
      searchError.value = 'Search failed. Please try again.'
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  const handleSearchBlur = (event: FocusEvent) => {
    // Check if the related target (what we're focusing on) is within the search results
    const relatedTarget = event.relatedTarget as HTMLElement
    const searchResultsContainer = document.querySelector(
      '.search-tokens-section'
    )

    if (relatedTarget && searchResultsContainer?.contains(relatedTarget)) {
      // Don't close if clicking within search results
      return
    }

    // Delay hiding results to allow for clicks
    setTimeout(() => {
      showSearchResults.value = false
    }, 200)
  }

  const selectUser = (user: SearchUser) => {
    // Navigate to user profile
    navigateTo(`/@${user.username}`)
    search.value = ''
    showSearchResults.value = false
    searchResults.value = []

    $trackButtonClick('Search Result Click', {
      username: user.username,
      searchTerm: search.value,
    })
  }

  const handleFollow = (user: SearchUser) => {
    // Update the user's following status in search results
    const userIndex = searchResults.value.findIndex(u => u.id.toText() === user.id.toText())
    if (userIndex !== -1 && searchResults.value[userIndex]) {
      searchResults.value[userIndex].am_following_them = true
    }

    // Track the action
    $trackButtonClick('Follow from Search', {
      targetUsername: user.username,
      searchTerm: search.value,
    })
  }

  const handleUnfollow = (user: SearchUser) => {
    // Update the user's following status in search results
    const userIndex = searchResults.value.findIndex(u => u.id.toText() === user.id.toText())
    if (userIndex !== -1 && searchResults.value[userIndex]) {
      searchResults.value[userIndex].am_following_them = false
    }

    // Track the action
    $trackButtonClick('Unfollow from Search', {
      targetUsername: user.username,
      searchTerm: search.value,
    })
  }

  // Define emits
  const emit = defineEmits<{
    'toggle-mobile-sidebar': []
  }>()

  onMounted(() => {
    window.addEventListener('scroll', onScroll)
    onScroll() // Initialize scroll state
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    // Clear search timeout
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }
  })

  const openLoginPanel = (): void => {
    console.log('openLoginPanel called')
    console.log('loginPanelRef:', loginPanelRef)
    $trackButtonClick('Connect Wallet', {
      location: 'header',
      authenticated: authStore.authenticated,
    })
    loginPanelRef?.value?.open()
  }
</script>
