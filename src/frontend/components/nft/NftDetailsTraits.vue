<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-sparkles-20-solid" class="text-primary-500" />
        <span class="font-bold">Traits</span>
        <span class="text-gray-400 text-sm">TRAITS 4</span>
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
      <div class="flex gap-1">
        <button
          :class="viewMode === 'grid' ? 'text-primary-500' : 'text-gray-400'"
          class="p-1"
          @click="viewMode = 'grid'"
        >
          <UIcon name="i-heroicons-squares-2x2-20-solid" />
        </button>
        <button
          :class="viewMode === 'list' ? 'text-primary-500' : 'text-gray-400'"
          class="p-1"
          @click="viewMode = 'list'"
        >
          <UIcon name="i-heroicons-bars-3-20-solid" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="p-4">
      <div
        :class="
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
            : 'space-y-2'
        "
      >
        <div
          v-for="trait in traits"
          :key="`${trait.category}-${trait.value}`"
          :class="[
            'p-3 rounded border cursor-pointer transition-colors',
            viewMode === 'grid'
              ? 'text-center'
              : 'flex justify-between items-center',
            trait.isRare
              ? 'border-purple-500 bg-purple-900/20'
              : 'border-gray-700 hover:border-gray-600',
          ]"
        >
          <div
            :class="
              viewMode === 'grid' ? 'space-y-1' : 'flex items-center gap-3'
            "
          >
            <div class="text-xs text-gray-400 uppercase">
              {{ trait.category }}
            </div>
            <div class="font-semibold">{{ trait.value }}</div>
          </div>
          <div
            :class="
              viewMode === 'grid' ? 'text-xs text-gray-400' : 'text-right'
            "
          >
            <div class="text-xs text-gray-400">{{ trait.rarity }}</div>
            <div class="font-mono text-sm">{{ trait.marketValue }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const isExpanded = ref(false)
  const viewMode = ref<'grid' | 'list'>('grid')

  const traits = [
    {
      category: 'TYPE',
      value: 'Female',
      rarity: '3,840 (38.4%)',
      marketValue: '0.05 ETH',
      isRare: false,
    },
    {
      category: 'ACCESSORY',
      value: 'Stringy Hair',
      rarity: '1,200 (12%)',
      marketValue: '0.12 ETH',
      isRare: true,
    },
    {
      category: 'ACCESSORY',
      value: 'Green Eye Shadow',
      rarity: '800 (8%)',
      marketValue: '0.18 ETH',
      isRare: true,
    },
    {
      category: 'ACCESSORY',
      value: '2 attributes',
      rarity: '2,400 (24%)',
      marketValue: '0.08 ETH',
      isRare: false,
    },
  ]
</script>
