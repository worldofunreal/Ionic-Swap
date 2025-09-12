<template>
  <aside
    class="hidden md:block z-100 fixed top-0 left-0 h-screen bg-white/90 dark:bg-neutral-950/90 border-r border-gray-200 dark:border-gray-800 overflow-hidden group"
    :style="{
      width: collapsed ? '4rem' : '13rem',
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
    }"
    @mouseenter="collapsed = false"
    @mouseleave="collapsed = true"
  >
    <div class="flex items-center justify-center py-3 gap-1">
      <img
        src="/logo.svg"
        alt="Ionic Swap Logo"
        class="h-7 w-7 transition-all duration-100"
      >
      <img
        v-show="!collapsed"
        src="/logo-text.svg"
        alt="Ionic Swap Text Logo"
        class="h-6 w-auto transition-all duration-100"
      >
    </div>
    <nav class="flex-1 flex flex-col gap-1 py-2 px-1">
      <SidebarItem
        v-for="item in menuItems"
        :key="item.label || 'hr'"
        :icon="item.icon"
        :label="item.label"
        :to="item.to"
        :collapsed="collapsed"
        :hr="item.hr"
        icon-size="1.3rem"
      />
    </nav>
  </aside>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import SidebarItem from './SidebarItem.vue'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()

  const collapsed = ref(true)

  const menuItems = computed(() => {
    const items: Array<{
      label?: string
      icon?: string
      to?: string
      hr?: boolean
    }> = [
      { label: 'Discover', icon: 'eos-icons:compass', to: '/' },
      { label: 'Markets', icon: 'icon-park-solid:stock-market', to: '/markets' },
      { label: 'Trading', icon: 'hugeicons:coins-swap', to: '/trading' },
      { label: 'History', icon: 'tabler:activity', to: '/activity' },
    ]

    // Only show profile and settings if user is logged in
    if (auth.userProfile) {
      items.push({
        label: 'Profile',
        icon: 'iconamoon:profile-fill',
        to: auth.userProfile.username
          ? `/@${auth.userProfile.username}`
          : '/profile',
      })
      items.push({ hr: true })
      items.push({
        label: 'Settings',
        icon: 'iconamoon:settings-fill',
        to: '/settings',
      })
    }

    items.push({ label: 'Support', icon: 'ix:support', to: '/support' })

    return items
  })
</script>

<style scoped>
</style>
