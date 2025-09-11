import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('dark')

  // Initialize theme from localStorage
  const initTheme = () => {
    if (import.meta.client) {
      const savedTheme = localStorage.getItem('ionic-swap-theme') as
        | 'light'
        | 'dark'
        | null
      if (savedTheme) {
        theme.value = savedTheme
      }
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (import.meta.client) {
      localStorage.setItem('ionic-swap-theme', theme.value)
    }
  }

  // Set specific theme
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    if (import.meta.client) {
      localStorage.setItem('ionic-swap-theme', newTheme)
    }
  }

  return {
    theme: readonly(theme),
    initTheme,
    toggleTheme,
    setTheme,
  }
})
