<template>
  <div class="flex flex-col w-full p-4">
    <!-- Activity Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Activity
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{
            isOwnProfile
              ? 'Your transaction history'
              : `@${targetUser?.username}'s transaction history`
          }}
        </p>
      </div>
    </div>

    <!-- Transaction History Component -->
    <TransactionHistory 
      :target-user-id="targetUserId"
      :limit="50"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import TransactionHistory from '@/components/TransactionHistory.vue'

  // Props
  interface Props {
    targetUser?: any
    isOwnProfile?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    targetUser: undefined,
    isOwnProfile: false,
  })

  // Computed properties
  const targetUserId = computed(() => {
    return props.targetUser?.id?.toText?.() || null
  })
</script>