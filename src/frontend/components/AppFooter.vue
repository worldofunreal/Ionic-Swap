<template>
  <footer
    class="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 fixed bottom-0 left-0 z-30"
  >
    <div
      class="ml-12 flex justify-between items-center py-2 px-4 md:px-8 text-xs text-zinc-500 dark:text-zinc-400 w-full"
    >
      <!-- Left Side -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Live Indicator -->
        <span class="flex items-center gap-1 font-semibold text-primary">
          <UIcon name="fluent:live-24-filled" class="text-lg animate-pulse" />
          Live
        </span>
        <span class="hidden md:inline">|</span>
        <!-- Networks -->
        <UPopover>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            class="flex items-center gap-1"
          >
            <UIcon name="icon-park-solid:blockchain" class="text-base" />
            Networks
          </UButton>
          <template #panel>
            <div class="flex flex-col gap-2 p-2">
              <span class="flex items-center gap-2"
                ><UIcon name="token-branded:icp" /> ICP
                <UBadge color="primary" size="xs">Active</UBadge></span
              >
              <span class="flex items-center gap-2"
                ><UIcon name="token-branded:solana" /> Solana</span
              >
              <span class="flex items-center gap-2"
                ><UIcon name="token-branded:ethereum" /> Ethereum</span
              >
            </div>
          </template>
        </UPopover>
        <span class="hidden md:inline">|</span>
        <!-- Terms/Privacy -->
        <NuxtLink
          to="/terms"
          class="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <UIcon name="material-symbols:contract-rounded" class="text-lg" />
          Terms
        </NuxtLink>
        <span class="hidden md:inline">|</span>
        <NuxtLink
          to="/privacy"
          class="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <UIcon name="material-symbols:privacy-tip-rounded" class="text-lg" />
          Privacy
        </NuxtLink>
        <span class="hidden md:inline">|</span>
        <!-- Socials -->
        <a href="mailto:support@ionicswap.com" class="hover:text-primary"
          ><UIcon name="material-symbols:mail-rounded" class="text-lg"
        /></a>
        <a
          href="https://discord.gg/FmqGfyJ3"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary"
          ><UIcon name="ic:baseline-discord" class="text-lg"
        /></a>
        <a
          href="https://t.me/ionicswap"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary"
          ><UIcon name="ic:baseline-telegram" class="text-lg"
        /></a>
        <a
          href="https://x.com/ionicswap"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary"
          ><UIcon name="line-md:twitter-x" class="text-lg"
        /></a>
        <a
          href="https://medium.com/@ionicswap"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary"
          ><UIcon name="mdi:medium" class="text-lg"
        /></a>
        <a
          href="https://github.com/worldofunreal/Ionic-Swap"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary"
          ><UIcon name="mdi:github" class="text-lg"
        /></a>
      </div>
      <!-- Right Side -->
      <div class="mr-12 flex items-center gap-3 flex-wrap">
        <!-- Support -->
        <NuxtLink
          to="/support"
          class="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <UIcon name="ix:support" /> Support
        </NuxtLink>
        <span class="hidden md:inline">|</span>
        <!-- Theme Switcher -->
        <ClientOnly>
          <button
            aria-label="Toggle theme"
            class="flex items-center gap-1 px-2 py-1 rounded transition-colors border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
            @click="toggleTheme"
          >
            <UIcon
              :name="
                colorMode.value === 'dark'
                  ? 'ix:sun-filled'
                  : 'tabler:moon-filled'
              "
              class="text-lg"
            />
          </button>
        </ClientOnly>
        <span class="hidden md:inline">|</span>
        <!-- Color Theme Switcher -->
        <ClientOnly>
          <button
            class="relative w-7 h-7 rounded-lg transition-all duration-300 focus:ring-primary border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Toggle color theme"
            @click="toggleColorTheme"
          >
            <div
              class="w-2.5 h-2.5 rounded-full transition-all duration-300"
              :class="`color-circle-${colorTheme}`"
            />
          </button>
        </ClientOnly>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useNuxtApp } from '#imports'
  import { useTheme } from '@/composables/useTheme'
  import { useColorTheme } from '@/composables/useColorTheme'

  const { theme: colorMode, toggleTheme: toggleThemeAction } = useTheme()
  const { colorTheme, nextColorTheme } = useColorTheme()
  const { $trackButtonClick } = useNuxtApp()

  function toggleTheme() {
    toggleThemeAction()
    $trackButtonClick('Theme Toggle', {
      newTheme: colorMode.value,
      location: 'footer',
    })
  }

  const toggleColorTheme = (): void => {
    nextColorTheme()

    // Dispatch custom event for chart components to listen to
    window.dispatchEvent(
      new CustomEvent('color-theme-changed', {
        detail: { newTheme: colorTheme.value },
      })
    )

    $trackButtonClick('Color Theme Toggle', {
      newColorTheme: colorTheme.value,
      location: 'footer',
    })
  }
</script>
