<template>
  <div
    class="flex flex-col md:flex-row items-center md:items-start justify-between bg-white dark:bg-neutral-950 rounded-2xl shadow p-6 gap-6"
  >
    <!-- Left: Avatar & Info -->
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <img
        src="https://placehold.co/80x80"
        alt="Collection Avatar"
        class="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-800"
      >
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-2xl font-bold truncate">
          X FIGURES
          <UIcon
            name="material-symbols:verified"
            class="text-sky-500 text-2xl"
          />
        </div>
        <div class="text-sm text-gray-500 truncate">
          By <a href="#" class="text-primary-600 hover:underline">0xCreator</a>
        </div>
        <div class="flex flex-wrap gap-2 text-xs mt-2">
          <span class="bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1"
            >Ethereum</span
          >
          <span class="bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1"
            >404 items</span
          >
          <span class="bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1"
            >Launched Jun 2025</span
          >
          <span class="bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1"
            >Art</span
          >
          <span
            class="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded px-2 py-1"
            >Minting</span
          >
        </div>
      </div>
    </div>
    <!-- Right: Stats -->
    <div class="flex flex-wrap gap-4 justify-end text-sm">
      <div class="flex flex-col items-end">
        <span class="font-bold">0.0792 ETH</span>
        <span class="text-gray-400">Floor</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-bold">0.0365 WETH</span>
        <span class="text-gray-400">Top Offer</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-bold">231.69 ETH</span>
        <span class="text-gray-400">Total Volume</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-bold text-green-600">+4.2%</span>
        <span class="text-gray-400">1D Floor</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-bold">12.3 ETH</span>
        <span class="text-gray-400">24H Volume</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-bold">123 (30%)</span>
        <span class="text-gray-400">Owners</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
