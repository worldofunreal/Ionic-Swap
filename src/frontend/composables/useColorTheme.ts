import { ref, watch, onMounted, computed } from 'vue'
import { useAppConfig, useState } from '#imports'

export type ColorTheme =
  | 'emerald'
  | 'pink'
  | 'red'
  | 'orange'
  | 'sky'
  | 'fuchsia'
  | 'purple'
  | 'teal'

export const useColorTheme = () => {
  // Use a shared global state so all components observe the same ref
  const colorTheme = useState<ColorTheme>(
    'ionic-swap-color-theme-state',
    () => 'emerald'
  )
  const isClient = ref(false)
  const appConfig = useAppConfig()

  // Color theme configurations - map to Tailwind color names
  const colorThemes = {
    emerald: 'emerald',
    pink: 'pink',
    red: 'red',
    orange: 'orange',
    sky: 'sky',
    fuchsia: 'fuchsia',
    purple: 'purple',
    teal: 'teal',
  }

  // Initialize color theme from localStorage
  const initColorTheme = (): void => {
    if (typeof window === 'undefined') return

    const savedColorTheme = localStorage.getItem(
      'ionic-swap-color-theme'
    ) as ColorTheme | null

    if (savedColorTheme && savedColorTheme in colorThemes) {
      colorTheme.value = savedColorTheme
    }

    applyColorTheme()
  }

  // Apply color theme using Nuxt UI's native system
  const applyColorTheme = (): void => {
    if (typeof window === 'undefined') return

    const themeKey = colorTheme.value

    if (!(themeKey in colorThemes)) return

    const newPrimaryColor = colorThemes[themeKey]

    // Update Nuxt UI's primary color in app config
    if (appConfig.ui) {
      appConfig.ui.colors = {
        ...appConfig.ui.colors,
        primary: newPrimaryColor,
      }
    }

    // Update Intro.js tour styles if tour is active
    setTimeout(() => {
      const { updateTourStyles } = useOnboarding()
      updateTourStyles()
    }, 100)
  }

  // Set specific color theme
  const setColorTheme = (newColorTheme: ColorTheme): void => {
    if (newColorTheme in colorThemes) {
      colorTheme.value = newColorTheme
      localStorage.setItem('ionic-swap-color-theme', newColorTheme)
      applyColorTheme()
    }
  }

  // Get next color theme (for cycling) - optimized for speed
  const nextColorTheme = (): void => {
    const themes: ColorTheme[] = [
      'emerald',
      'pink',
      'red',
      'orange',
      'sky',
      'fuchsia',
      'purple',
      'teal',
    ]
    const currentIndex = themes.indexOf(colorTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]

    if (nextTheme) {
      colorTheme.value = nextTheme

      // Apply color theme immediately for instant feedback
      if (typeof window !== 'undefined' && appConfig.ui) {
        appConfig.ui.colors = {
          ...appConfig.ui.colors,
          primary: colorThemes[nextTheme],
        }
      }

      // Save to localStorage in the background (non-blocking)
      localStorage.setItem('ionic-swap-color-theme', nextTheme)
    }
  }

  // Get current theme configuration
  const currentTheme = computed(() => colorThemes[colorTheme.value])

  // Watch for theme changes
  watch(colorTheme, () => {
    applyColorTheme()
  })

  // Initialize on mount
  onMounted(() => {
    isClient.value = true
    initColorTheme()
  })

  return {
    colorTheme,
    currentTheme,
    isClient,
    setColorTheme,
    nextColorTheme,
    colorThemes,
  }
}
