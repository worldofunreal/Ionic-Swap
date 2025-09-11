<template>
  <div class="fixed bottom-4 right-4 z-50">
    <UButton
      v-if="!showTourModal"
      color="primary"
      variant="solid"
      size="sm"
      icon="i-heroicons-question-mark-circle"
      class="shadow-lg"
      @click="showTourModal = true"
    >
      Start Tour
    </UButton>

    <!-- Tour Selection Modal -->
    <div v-if="showTourModal">
      <UCard class="w-full max-w-md">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Available Tours
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showTourModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Register Tour -->
          <div
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon
                  name="i-heroicons-user-plus"
                  class="w-6 h-6 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Registration Tour
                </h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Complete guide for new user registration
                </p>
              </div>
            </div>
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              @click="startRegisterTour"
            >
              Start
            </UButton>
          </div>

          <!-- Marketplace Tour (Disabled) -->
          <div
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon
                  name="i-heroicons-shopping-bag"
                  class="w-6 h-6 text-gray-400"
                />
              </div>
              <div>
                <h4
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Marketplace Tour
                </h4>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Learn how to swap tokens across chains
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" size="sm" disabled>
              Coming Soon
            </UButton>
          </div>

          <!-- Portfolio Tour (Disabled) -->
          <div
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon
                  name="i-heroicons-chart-bar"
                  class="w-6 h-6 text-gray-400"
                />
              </div>
              <div>
                <h4
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Portfolio Tour
                </h4>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Manage your token portfolio and analytics
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" size="sm" disabled>
              Coming Soon
            </UButton>
          </div>

          <!-- Trading Tour (Disabled) -->
          <div
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="w-6 h-6 text-gray-400"
                />
              </div>
              <div>
                <h4
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Trading Tour
                </h4>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Advanced trading features and strategies
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" size="sm" disabled>
              Coming Soon
            </UButton>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showTourModal = false"
            >
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useOnboarding } from '@/composables/useOnboarding'

  const { startTour } = useOnboarding()

  // Modal state
  const showTourModal = ref(false)

  const startRegisterTour = () => {
    showTourModal.value = false
    startTour('registration')
  }
</script>
