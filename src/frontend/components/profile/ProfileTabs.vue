<template>
  <div
    class="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto"
  >
    <button
      v-for="tab in tabs"
      :key="tab"
      class="px-4 py-2 text-sm font-semibold border-b-2 transition whitespace-nowrap"
      :class="
        modelValue === tab
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-primary-600 dark:hover:text-primary-400'
      "
      @click="$emit('update:modelValue', tab)"
    >
      {{ tab }}
    </button>
  </div>
</template>
<script setup lang="ts">
  import { defineProps } from 'vue'
  type Tab = string
  const tabs: Tab[] = [
    'NFTs',
    'Tokens',
    'Listings',
    'Offers',
    'Portfolio',
    'Created',
    'Following',
    'Followers',
    'Activity',
  ]
  defineProps<{ modelValue: Tab }>()
</script>
