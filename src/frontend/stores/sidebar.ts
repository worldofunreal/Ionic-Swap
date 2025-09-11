import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', () => {
  const isStatsPanelVisible = ref(true)

  function toggleStatsPanel() {
    isStatsPanelVisible.value = !isStatsPanelVisible.value
  }

  return {
    isStatsPanelVisible,
    toggleStatsPanel,
  }
})
