<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-heroicons-currency-dollar-20-solid"
          class="text-primary-500"
        />
        <span class="font-bold">Price history</span>
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
      <!-- Chart Container -->
      <div class="relative h-64 bg-neutral-900 rounded-lg p-4">
        <!-- Y-axis labels -->
        <div
          class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400"
        >
          <span>25 ETH</span>
          <span>20 ETH</span>
          <span>15 ETH</span>
          <span>10 ETH</span>
          <span>5 ETH</span>
          <span>0 ETH</span>
        </div>

        <!-- Chart Area -->
        <div class="ml-12 h-full relative">
          <!-- Grid lines -->
          <div class="absolute inset-0 grid grid-rows-5">
            <div v-for="i in 5" :key="i" class="border-b border-gray-700"/>
          </div>

          <!-- Price line with gradient fill -->
          <svg
            class="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <!-- Gradient definition -->
            <defs>
              <linearGradient
                id="priceGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #3b82f6; stop-opacity: 0.3"
                />
                <stop
                  offset="100%"
                  style="stop-color: #3b82f6; stop-opacity: 0.05"
                />
              </linearGradient>
            </defs>

            <!-- Area fill -->
            <path :d="areaPath" fill="url(#priceGradient)" />

            <!-- Line -->
            <path :d="linePath" stroke="#3B82F6" stroke-width="2" fill="none" />

            <!-- Data points -->
            <circle
              v-for="(point, index) in priceData"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              fill="#3B82F6"
              class="hover:r-4 transition-all"
            />
          </svg>

          <!-- Current price indicator -->
          <div
            class="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded text-sm font-bold"
          >
            Current: 47.50 ETH
          </div>
        </div>

        <!-- X-axis labels -->
        <div class="ml-12 mt-2 flex justify-between text-xs text-gray-400">
          <span>Jan 2021</span>
          <span>Jul 2022</span>
          <span>Jan 2024</span>
          <span>Jul 2025</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  const isExpanded = ref(false)

  // Mock price data (x: 0-100, y: 0-100 representing 0-25 ETH)
  const priceData = [
    { x: 0, y: 80, price: 20 }, // Jan 2021: 20 ETH
    { x: 15, y: 60, price: 15 }, // Apr 2022: 15 ETH
    { x: 30, y: 40, price: 10 }, // Jul 2022: 10 ETH
    { x: 45, y: 20, price: 5 }, // Oct 2023: 5 ETH
    { x: 60, y: 30, price: 7.5 }, // Jan 2024: 7.5 ETH
    { x: 75, y: 50, price: 12.5 }, // Apr 2025: 12.5 ETH
    { x: 100, y: 90, price: 22.5 }, // Jul 2025: 22.5 ETH
  ]

  const linePath = computed(() => {
    return priceData
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
  })

  const areaPath = computed(() => {
    const points = priceData.map(point => `${point.x},${point.y}`).join(' ')
    return `M ${points} L 100 100 L 0 100 Z`
  })
</script>
