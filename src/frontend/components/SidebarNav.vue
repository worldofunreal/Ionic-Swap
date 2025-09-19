<template>
  <aside
    class="hidden md:block z-100 fixed top-0 left-0 h-screen bg-background border-r border-themed overflow-hidden group backdrop-blur-sm"
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
    }> = []

    if (!auth.userProfile) {
      // Non-logged users - Limited menu
      items.push(
        { label: 'Discovery', icon: 'eos-icons:compass', to: '/' },
        { label: 'Markets', icon: 'mdi:bank', to: '/markets' },
        { label: 'Wallet', icon: 'heroicons:wallet-20-solid', to: '#login' }
      )
    } else {
      // Logged users - Full menu
      items.push(
        { label: 'Wallet', icon: 'heroicons:wallet-20-solid', to: '/wallet' },
        { label: 'Trade', icon: 'i-heroicons-chart-bar-20-solid', to: '/trading' },
        { label: 'Liquidity', icon: 'i-heroicons-beaker-20-solid', to: '/liquidity' },
        { label: 'Profile', icon: 'iconamoon:profile-fill', 
          to: auth.userProfile.username ? `/@${auth.userProfile.username}` : '/profile' },
        { label: 'Settings', icon: 'iconamoon:settings-fill', to: '/settings' },
        { hr: true },
        { label: 'Discovery', icon: 'eos-icons:compass', to: '/' },
        { label: 'Markets', icon: 'mdi:bank', to: '/markets' }
      )
    }

    return items
  })
</script>

<style scoped></style>
