<template>
  <div>
    <!-- Intro.js will render the tour overlay here -->
  </div>
</template>

<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import { useOnboarding } from '@/composables/useOnboarding'
  const { stopTour, startTour } = useOnboarding()

  // Cleanup on unmount
  onUnmounted(() => {
    stopTour()
  })

  // Expose methods for parent components
  defineExpose({
    stopTour,
    startTour,
  })
</script>

<style scoped>
  /* Component-specific styles can be added here if needed */
</style>
