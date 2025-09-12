<template>
  <div>
    <hr v-if="hr" class="my-2 border-gray-200 dark:border-gray-800" >
    <NuxtLink
      v-else
      :to="to"
      class="flex items-center gap-4 px-3 py-2 rounded-sm transition-all hover:bg-primary/70 dark:hover:bg-primary/60 text-gray-500 dark:text-gray-300 font-light"
      :class="collapsed ? 'justify-center' : ''"
      active-class="bg-primary/20 dark:bg-primary/60"
    >
      <UIcon :name="icon" class="text-lg" />
      <span v-if="!collapsed" class="truncate text-sm">{{ label }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    icon: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    to: {
      type: String,
      default: '/',
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    hr: {
      type: Boolean,
      default: false,
    },
  })
</script>
