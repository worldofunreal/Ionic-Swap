<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-heroicons-document-text-20-solid"
          class="text-primary-500"
        />
        <span class="font-bold">About</span>
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
      <div class="space-y-4">
        <!-- Collection Title -->
        <h3 class="text-lg font-bold">About CryptoPunks</h3>

        <!-- Origin -->
        <div class="flex items-center gap-3 p-3 bg-neutral-900 rounded-lg">
          <div
            class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
          >
            <div class="w-4 h-4 bg-white rounded-sm"/>
          </div>
          <div>
            <div class="text-sm text-gray-400">A collection by</div>
            <div class="font-semibold">Larva Labs</div>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-3 text-gray-300 leading-relaxed">
          <p>
            CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and
            became one of the inspirations for the ERC-721 standard. They have
            been featured in places like The New York Times, Christie's of
            London, Art|Basel Miami, and The PBS NewsHour.
          </p>
          <p>
            Each punk has their own profile page that shows their attributes as
            well as their ownership/for-sale status. The project was inspired by
            the London punk scene, the cyberpunk movement, and electronic music
            artists Daft Punk.
          </p>
        </div>

        <!-- Additional Info -->
        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <div class="text-sm text-gray-400">Created</div>
            <div class="font-semibold">June 2017</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Total Supply</div>
            <div class="font-semibold">10,000</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Creator Fee</div>
            <div class="font-semibold">0%</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Blockchain</div>
            <div class="font-semibold">Ethereum</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const isExpanded = ref(false)
</script>
