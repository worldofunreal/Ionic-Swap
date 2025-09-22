<template>
  <!-- Mobile Overlay -->

  <!-- Mobile Sidebar -->
  <aside
    class="fixed inset-0 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-[9999] md:hidden transition-transform duration-300 ease-in-out"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Header with close button -->
    <div
      class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800"
    >
      <div class="flex items-center gap-2">
        <img src="/logo.svg" alt="Ionic Swap Logo" class="h-8 w-8" >
        <img
          src="/logo-text.svg"
          alt="Ionic Swap Text Logo"
          class="h-6 w-auto"
        >
      </div>
      <button
        class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close sidebar"
        @click="closeSidebar"
      >
        <UIcon
          name="i-heroicons-x-mark-20-solid"
          class="w-6 h-6 text-zinc-600 dark:text-zinc-300"
        />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col py-4">
      <div class="px-4 space-y-2">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.label || 'hr'"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          :class="
            route.path === item.to
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : ''
          "
          @click="closeSidebar"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">

  // Define props
  interface Props {
    isOpen: boolean
  }

  defineProps<Props>()

  // Define emits
  const emit = defineEmits<{
    close: []
  }>()

  const route = useRoute()

  const menuItems = [
    { label: 'Discover', icon: 'eos-icons:compass', to: '/' },
    { label: 'Markets', icon: 'icon-park-solid:stock-market', to: '/markets' },
    { label: 'Trading', icon: 'heroicons:chart-bar', to: '/trading' },
    { label: 'Liquidity', icon: 'i-heroicons-beaker-20-solid', to: '/liquidity' },
    { label: 'Profile', icon: 'iconamoon:profile-fill', to: '/profile' },
    { label: 'Settings', icon: 'iconamoon:settings-fill', to: '/settings' },
    { label: 'Support', icon: 'ix:support', to: '/support' },
  ]

  function closeSidebar() {
    emit('close')
  }
</script>
