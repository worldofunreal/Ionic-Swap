<template>
  <div
    class="relative inline-block"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @mousemove="updatePosition"
  >
    <slot />
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showTooltip"
        ref="tooltipRef"
        class="fixed z-50 px-2 py-1 mt-6 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
        :style="tooltipStyle"
      >
        {{ text }}
        <div
          class="absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"
          :class="arrowClasses"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  interface Props {
    text: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    offset?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    position: 'bottom',
    offset: 8,
  })

  const showTooltip = ref(false)
  const tooltipRef = ref<HTMLElement>()
  const mouseX = ref(0)
  const mouseY = ref(0)

  const updatePosition = (event: MouseEvent) => {
    mouseX.value = event.clientX
    mouseY.value = event.clientY
  }

  const arrowClasses = computed(() => {
    switch (props.position) {
      case 'top':
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
      case 'left':
        return 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
      case 'right':
        return 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
      default:
        return ''
    }
  })

  const tooltipStyle = computed(() => {
    const offset = props.offset
    let left = mouseX.value
    let top = mouseY.value

    // Adjust position based on tooltip position preference
    switch (props.position) {
      case 'top':
        left -= 50 // Center horizontally
        top -= offset + 30 // Position above cursor
        break
      case 'bottom':
        left -= 50 // Center horizontally
        top += offset // Position below cursor
        break
      case 'left':
        left -= offset + 80 // Position to the left
        top -= 15 // Center vertically
        break
      case 'right':
        left += offset // Position to the right
        top -= 15 // Center vertically
        break
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  })

  // Handle escape key to close tooltip
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      showTooltip.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
</script>
