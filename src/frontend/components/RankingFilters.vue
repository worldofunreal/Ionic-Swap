<template>
  <div class="flex items-center gap-2 w-full">
    <!-- Ranking Filters -->
    <button
      v-for="f in rankingFilters"
      :key="f.label"
      class="flex items-center gap-1 px-3 h-8 rounded-md border text-xs font-semibold transition"
      :class="
        selectedRanking === f.label
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-500'
      "
      @click="selectedRanking = f.label"
    >
      <UIcon :name="f.icon" class="text-base" />
      <span>{{ f.label }}</span>
    </button>
    <!-- View Modes (icon only) -->
    <button
      v-for="v in viewModes"
      :key="v.label"
      class="flex items-center justify-center w-8 h-8 rounded-md border text-xs font-semibold transition"
      :class="
        selectedView === v.label
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-500'
      "
      @click="selectedView = v.label"
    >
      <UIcon :name="v.icon" class="text-base" />
    </button>
    <!-- Time Filter Dropdown -->
    <div ref="dropdownRef" class="relative">
      <button
        class="flex items-center gap-1 px-3 h-8 rounded-md border text-xs font-semibold transition bg-white dark:bg-neutral-950 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-500"
        @click="showDropdown = !showDropdown"
      >
        <span>{{ selectedTime }}</span>
        <UIcon name="mdi:chevron-down" class="text-base" />
      </button>
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-1 w-24 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-700 rounded shadow z-10"
      >
        <button
          v-for="t in timeFilters"
          :key="t"
          class="block w-full text-left px-3 h-8 rounded-md text-xs font-semibold hover:bg-primary-50 dark:hover:bg-primary-500 transition"
          :class="
            selectedTime === t
              ? 'text-primary-600'
              : 'text-gray-700 dark:text-gray-200'
          "
          @click="selectTime(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>
    <!-- Collapse Button (desktop only, only when visible) -->
    <UTooltip
      v-if="sidebarStore.isStatsPanelVisible"
      text="Collapse stats panel"
      position="bottom"
    >
      <button
        class="hidden md:flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition text-gray-500 ml-2"
        @click="sidebarStore.toggleStatsPanel()"
      >
        <UIcon
          name="tabler:layout-sidebar-right-collapse-filled"
          class="text-xl"
        />
      </button>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { useSidebarStore } from '@/stores/sidebar'
  import UTooltip from './UTooltip.vue'

  const sidebarStore = useSidebarStore()

  const rankingFilters = [
    { label: 'Top', icon: 'solar:cup-bold' },
    { label: 'Trending', icon: 'streamline:trending-content-solid' },
  ]
  const viewModes = [
    { label: 'Table', icon: 'material-symbols:table' },
    { label: 'Compact', icon: 'teenyicons:table-solid' },
  ]
  const timeFilters = ['5m', '15m', '1d', '30d', 'All']
  const selectedRanking = ref('Top')
  const selectedView = ref('Table')
  const selectedTime = ref('1d')
  const showDropdown = ref(false)

  function selectTime(t: string) {
    selectedTime.value = t
    showDropdown.value = false
  }

  const dropdownRef = ref<HTMLElement | null>(null)

  function handleClickOutside(event: MouseEvent) {
    if (
      showDropdown.value &&
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      showDropdown.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })
</script>
