<template>
  <div class="mb-2">
    <button
      class="flex items-center w-full justify-between font-bold text-sm py-2 focus:outline-none"
      @click="$emit('toggle')"
    >
      <span>{{ title }}</span>
      <svg
        :class="['transition-transform', open ? 'rotate-90' : '']"
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <transition name="fade">
      <div v-show="open" class="overflow-hidden">
        <slot />
      </div>
    </transition>
  </div>
</template>
<script setup lang="ts">
  defineProps<{ title: string; open: boolean }>()
</script>
<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.2s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    max-height: 0;
  }
  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
    max-height: 500px;
  }
</style>
