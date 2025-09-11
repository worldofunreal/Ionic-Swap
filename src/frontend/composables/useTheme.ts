import { ref, watch } from 'vue'
import { useColorMode } from '#imports'

export const useTheme = () => {
  const colorMode = useColorMode()

  // Initialize theme from localStorage (Nuxt will handle this automatically now)
  const initTheme = () => {
    // Nuxt color mode will automatically read from localStorage['ionic-swap-theme']
    // No need to manually set it
  }

  // Toggle theme - Nuxt will automatically save to localStorage
  const toggleTheme = () => {
    colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
  }

  // Set specific theme - Nuxt will automatically save to localStorage
  const setTheme = (theme: 'light' | 'dark') => {
    colorMode.preference = theme
  }

  return {
    theme: colorMode,
    initTheme,
    toggleTheme,
    setTheme,
  }
}
