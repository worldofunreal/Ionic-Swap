<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-10 dark:bg-black/10 flex items-center justify-center z-[9999]"
  >
    <div
      class="bg-zinc-50 dark:bg-neutral-950 rounded-lg shadow-lg p-6 max-w-sm mx-4 text-center"
    >
      <!-- Spinner -->
      <div class="flex justify-center mb-4">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
        />
      </div>

      <!-- Message -->
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ title }}
      </h3>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ message }}
      </p>

      <!-- Progress bar (optional) -->
      <div v-if="showProgress" class="mt-4">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ progress }}%
        </p>
      </div>

      <!-- Cancel button (optional) -->
      <button
        v-if="showCancel"
        class="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    show: boolean
    title?: string
    message?: string
    showProgress?: boolean
    progress?: number
    showCancel?: boolean
  }

  interface Emits {
    (e: 'cancel'): void
  }

  withDefaults(defineProps<Props>(), {
    title: 'Loading...',
    message: 'Please wait while we process your request.',
    showProgress: false,
    progress: 0,
    showCancel: false,
  })

  defineEmits<Emits>()
</script>
