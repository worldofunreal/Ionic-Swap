<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-heroicons-squares-2x2-20-solid"
          class="text-primary-500"
        />
        <span class="font-bold">Blockchain details</span>
        <button class="ml-2" @click="isExpanded = !isExpanded">
          <UIcon
            :name="
              isExpanded
                ? 'i-heroicons-chevron-up-20-solid'
                : 'i-heroicons-chevron-down-20-solid'
            "
            class="text-gray-400"
          />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="p-4">
      <div class="space-y-3">
        <!-- Contract Address -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Contract Address</span>
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-white">0xbc4ca0...a6c</span>
            <button class="text-primary-500 hover:text-primary-400">
              <UIcon
                name="i-heroicons-arrow-top-right-on-square-20-solid"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <!-- Token ID -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Token ID</span>
          <span class="font-mono text-sm text-white">8150</span>
        </div>

        <!-- Token Standard -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Token Standard</span>
          <span class="text-white">ERC-721</span>
        </div>

        <!-- Chain -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Chain</span>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-500 rounded-full"/>
            <span class="text-white">Ethereum</span>
          </div>
        </div>

        <!-- Block Number -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Block Number</span>
          <span class="font-mono text-sm text-white">3,947,333</span>
        </div>

        <!-- Transaction Hash -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Transaction Hash</span>
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-white">0x7ddfe8...f2a</span>
            <button class="text-primary-500 hover:text-primary-400">
              <UIcon
                name="i-heroicons-arrow-top-right-on-square-20-solid"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <!-- Gas Used -->
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-400">Gas Used</span>
          <span class="font-mono text-sm text-white">21,000</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const isExpanded = ref(false)
</script>
