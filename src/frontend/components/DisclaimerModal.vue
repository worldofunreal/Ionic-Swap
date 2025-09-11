<template>
  <!-- Simple Modal Overlay -->
  <div
    v-if="show"
    class="fixed inset-0 z-[9999] flex items-center justify-center"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="closeModal" />
    <!-- Modal Content -->
    <div
      class="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4"
    >
      <div class="p-6">
        <!-- Logo Section -->
        <div class="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="NFTropoly Logo" class="w-12 h-12 mb-2" >
          <img src="/logo-text.svg" alt="NFTropoly" class="h-6 light:invert" >
        </div>

        <!-- Disclaimer Content -->
        <div class="text-center mb-6">
          <h2 class="text-lg font-bold mb-1 text-gray-900 dark:text-white">
            Disclaimer
          </h2>
          <p
            class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4"
          >
            WCHL 2025 participant, application is under construction using mock
            data for demonstration purposes.
          </p>
        </div>

        <!-- Accept Button -->
        <div class="flex justify-center">
          <UButton color="primary" class="px-6 py-2" @click="acceptDisclaimer">
            Accept & Continue
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const show = ref(false)

  // Emit events for parent components
  const emit = defineEmits<{
    close: []
  }>()

  // Mark disclaimer as accepted
  const acceptDisclaimer = () => {
    closeModal()
  }

  // Close modal and emit event
  const closeModal = () => {
    show.value = false
    emit('close')
  }

  // Show disclaimer on mount every time
  onMounted(() => {
    show.value = true
  })

  defineExpose({
    open: () => {
      show.value = true
    },
    close: () => {
      closeModal()
    },
  })
</script>
