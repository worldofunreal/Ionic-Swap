<template>
  <div
    class="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800"
  >
    <div class="h-64 relative">
      <!-- Chart Container -->
      <div class="w-full h-full flex items-end justify-between px-4 pb-8">
        <!-- Chart Bars -->
        <div
          v-for="(dataPoint, index) in chartData"
          :key="index"
          class="flex-1 mx-1 relative group"
        >
          <!-- Price Bar -->
          <div
            class="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t shadow-sm hover:shadow-md transition-shadow"
            :style="{ height: `${dataPoint.height}%` }"
          />

          <!-- Price Label (hidden by default, shown on hover) -->
          <div
            class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 dark:bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-gray-700 dark:border-gray-600"
          >
            ${{ dataPoint.price }}
          </div>

          <!-- Time Label -->
          <div
            class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium"
          >
            {{ dataPoint.time }}
          </div>
        </div>
      </div>

      <!-- Y-Axis Labels -->
      <div
        class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 px-2 font-medium"
      >
        <span>$0.06</span>
        <span>$0.05</span>
        <span>$0.04</span>
        <span>$0.03</span>
        <span>$0.02</span>
        <span>$0.01</span>
      </div>

      <!-- Grid Lines -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="h-full flex flex-col justify-between">
          <div
            v-for="i in 5"
            :key="i"
            class="border-t border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Mock data representing 24-hour price fluctuations
  // Based on specification: peak around 2 PM, dip around 10 PM, recovery from 5 AM onwards
  const chartData = ref([
    { time: '1 PM', price: '0.045', height: 75 }, // Starting point
    { time: '3 PM', price: '0.052', height: 87 }, // Peak around 2 PM
    { time: '5 PM', price: '0.048', height: 80 }, // Slight decline
    { time: '7 PM', price: '0.042', height: 70 }, // Continued decline
    { time: '9 PM', price: '0.038', height: 63 }, // Further decline
    { time: '11 PM', price: '0.032', height: 53 }, // Dip around 10 PM
    { time: '1 AM', price: '0.029', height: 48 }, // Low point
    { time: '3 AM', price: '0.031', height: 52 }, // Slight recovery
    { time: '5 AM', price: '0.035', height: 58 }, // Recovery from 5 AM onwards
    { time: '7 AM', price: '0.040', height: 67 }, // Continued recovery
    { time: '9 AM', price: '0.044', height: 73 }, // Strong recovery
    { time: '11 AM', price: '0.048', height: 80 }, // Current price
  ])
</script>
