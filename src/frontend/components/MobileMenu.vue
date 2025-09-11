<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 md:hidden flex flex-col">
    <!-- Overlay Animation -->
    <div
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 250 } }"
      class="absolute inset-0 bg-neutral/40 backdrop-blur-lg"
    >
      <div
        class="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-fuchsia-700/10 to-transparent opacity-80 pointer-events-none"
      />
    </div>
    <!-- Theme Switcher (top left) -->
    <div
      v-motion
      :initial="{ opacity: 0, y: -30 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 120, duration: 350 } }"
      class="absolute top-6 left-6 z-20"
    >
      <ClientOnly>
        <button
          aria-label="Toggle theme"
          class="relative w-14 h-10 rounded-full border border-cyan-400 bg-neutral/60 flex items-center justify-start transition-colors duration-300 focus:outline-none shadow-md overflow-hidden"
          @click="toggleTheme"
        >
          <span
            class="absolute top-1.2 left-0.5 w-8 h-8 transition-all duration-500 flex items-center justify-center"
            :class="
              colorMode.value === 'dark' ? 'translate-x-5' : 'translate-x-1'
            "
          >
            <UIcon
              :name="
                colorMode.value === 'dark'
                  ? 'ix:sun-filled'
                  : 'tabler:moon-filled'
              "
              class="w-8 h-8 transition-colors duration-300"
              :class="
                colorMode.value === 'dark' ? 'text-yellow-400' : 'text-cyan-600'
              "
            />
          </span>
        </button>
      </ClientOnly>
    </div>
    <!-- Close Button (top right) -->
    <button
      v-motion
      :initial="{ opacity: 0, y: -30 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 180, duration: 350 } }"
      class="absolute top-6 right-6 z-20 text-cyan-200 hover:text-cyan-400 text-5xl focus:outline-none"
      @click="handleClose"
    >
      <UIcon name="i-heroicons-x-mark-20-solid" />
    </button>

    <!-- Main Content (centered) -->
    <div
      class="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-md mx-auto px-12 py-10"
    >
      <div
        class="flex flex-col items-center justify-center w-full gap-8 pt-20 pb-32"
      >
        <!-- CTA Button -->
        <component
          :is="Motion"
          :initial="{ opacity: 0, scale: 0.15 }"
          :enter="{
            opacity: 1,
            scale: 1,
            transition: { delay: 250 + routes.length * 80 + 80, duration: 350 },
          }"
          class="w-full flex justify-center"
        >
          <UButton
            to="/"
            color="primary"
            variant="solid"
            size="xl"
            label="Home"
            class="items-center justify-center w-full neon-btn text-2xl font-bold py-4 mt-4"
            @click="handleMobileHomeClick"
          />
        </component>
        <!-- Navigation -->
        <nav
          class="w-full flex flex-col items-center gap-6 text-2xl font-semibold text-cyan-100"
        >
          <component
            :is="Motion"
            v-for="(route, i) in routes"
            :key="route.path"
            class="w-full"
            :initial="{ opacity: 0, y: 30 }"
            :enter="{
              opacity: 1,
              y: 0,
              transition: { delay: 250 + i * 80, duration: 350 },
            }"
          >
            <NuxtLink
              :to="route.path"
              class="flex items-center justify-center gap-3 py-3 rounded-xl hover:text-cyan-400 transition-all neon-nav-link text-2xl font-bold"
              active-class="text-cyan-400"
              @click="handleClose"
            >
              <UIcon
                v-if="route.icon"
                :name="route.icon"
                class="text-cyan-400 text-2xl"
              />
              {{ route.name }}
            </NuxtLink>
          </component>
        </nav>
      </div>
    </div>
    <!-- Social Icons (bottom center) -->
    <div
      v-motion
      :initial="{ opacity: 0, y: 30 }"
      :enter="{
        opacity: 1,
        y: 0,
        transition: { delay: 250 + routes.length * 80 + 200, duration: 350 },
      }"
      class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full flex items-center justify-center gap-8"
    >
      <a
        href="https://x.com/worldofunreal"
        target="_blank"
        rel="noopener"
        class="text-cyan-300 hover:text-cyan-400 transition text-3xl"
      >
        <UIcon name="i-fa6-brands-twitter" />
      </a>
      <a
        href="https://github.com/worldofunreal"
        target="_blank"
        rel="noopener"
        class="text-cyan-300 hover:text-cyan-400 transition text-3xl"
      >
        <UIcon name="i-fa6-brands-github" />
      </a>
      <a
        href="https://www.linkedin.com/company/worldofunreal/"
        target="_blank"
        rel="noopener"
        class="text-cyan-300 hover:text-cyan-400 transition text-3xl"
      >
        <UIcon name="i-fa6-brands-linkedin" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { resolveComponent } from 'vue'
  import { useNuxtApp } from '#imports'
  import { useRoute } from 'vue-router'
  import { useTheme } from '@/composables/useTheme'
  const route = useRoute()
  const Motion = resolveComponent('Motion')
  const { theme: colorMode, toggleTheme: toggleThemeAction } = useTheme()
  const { $trackButtonClick, $trackNavigation } = useNuxtApp()

  function toggleTheme() {
    toggleThemeAction()
    $trackButtonClick('Theme Toggle', {
      newTheme: colorMode.value,
      location: 'mobile_menu',
    })
  }

  interface Route {
    name: string
    path: string
    icon?: string
  }

  interface Props {
    routes: Route[]
    isOpen: boolean
  }

  interface Emits {
    close: []
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const handleClose = () => {
    $trackButtonClick('Mobile Menu Close', {
      currentRoute: route.path,
    })
    emit('close')
  }

  function handleMobileHomeClick(): void {
    $trackButtonClick('Mobile Home Click', {
      currentRoute: route.path,
      action: route.path === '/' ? 'scroll_to_top' : 'navigate_home',
    })

    if (route.path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      handleClose()
    } else {
      // Let Nuxt handle navigation
      $trackNavigation(route.path, '/')
      handleClose()
    }
  }
</script>
