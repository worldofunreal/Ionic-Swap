<template>
  <div
    class="flex flex-col gap-2 bg-zinc-50 dark:bg-neutral-950 rounded-xl shadow p-4 min-w-[200px]"
  >
    <div class="flex items-center gap-2">
      <span class="font-bold text-lg">0.00 ETH</span>
      <span class="text-zinc-300">Portfolio</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-bold">$0.00</span>
      <span class="text-zinc-300">USD</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-bold">0%</span>
      <span class="text-zinc-300">NFTs Owned</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-bold">0%</span>
      <span class="text-zinc-300">Tokens</span>
    </div>
    <button
      class="ml-auto mt-2 p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 hover:bg-primary-200"
    >
      <UIcon name="i-heroicons-plus-20-solid" class="text-lg" />
    </button>
  </div>
</template>
<script setup lang="ts"></script>
