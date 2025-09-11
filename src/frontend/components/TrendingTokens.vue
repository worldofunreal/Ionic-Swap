<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold">Trending Tokens</h2>
    </div>
    <div class="relative">
      <button
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 p-0 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
        style="transform: translateY(-50%)"
        @click="scrollLeft"
      >
        <UIcon name="i-heroicons-chevron-left-20-solid" class="text-base" />
      </button>
      <button
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 p-0 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-950 hover:bg-primary-50 dark:hover:bg-primary-500 transition"
        style="transform: translateY(-50%)"
        @click="scrollRight"
      >
        <UIcon name="i-heroicons-chevron-right-20-solid" class="text-base" />
      </button>
      <div
        ref="scrollRef"
        class="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style="scroll-snap-type: x mandatory"
      >
        <div
          v-for="token in tokens"
          :key="token.symbol"
          class="min-w-[180px] max-w-xs bg-white dark:bg-neutral-950 rounded-xl shadow p-3 flex flex-col gap-2 cursor-pointer hover:scale-105 transition-transform"
          style="scroll-snap-align: start"
        >
          <div class="flex items-center gap-2 mb-1">
            <UIcon :name="token.icon" class="text-2xl" />
            <span class="font-bold">{{ token.name }}</span>
            <span class="text-xs text-gray-400">({{ token.symbol }})</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="font-bold">{{ token.price }}</span>
            <span :class="token.change >= 0 ? 'text-green-600' : 'text-red-600'"
              >{{ token.change >= 0 ? '+' : '' }}{{ token.change }}%</span
            >
          </div>
          <!-- Line Chart -->
          <div
            class="relative w-full"
            style="height: 32px; min-height: 32px; max-height: 32px"
          >
            <Line
              :data="token.chartData"
              :options="chartOptions"
              style="height: 32px; min-height: 32px; max-height: 32px"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // If not installed, run: npm install vue-chartjs chart.js
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js'

  import { ref } from 'vue'

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale
  )

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    elements: { point: { radius: 0 } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    layout: { padding: 0 },
  }

  const scrollRef = ref(null)
  function scrollLeft() {
    if (scrollRef.value)
      (scrollRef.value as HTMLElement).scrollBy({
        left: -250,
        behavior: 'smooth',
      })
  }
  function scrollRight() {
    if (scrollRef.value)
      (scrollRef.value as HTMLElement).scrollBy({
        left: 250,
        behavior: 'smooth',
      })
  }

  const tokens = [
    {
      name: 'Internet Computer',
      symbol: 'ICP',
      icon: 'logos:internet-computer-icon',
      price: '$12.34',
      change: 4.2,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [12, 12.2, 12.1, 12.5, 12.3, 12.6, 12.34],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'logos:ethereum',
      price: '$3,200',
      change: -1.1,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [3200, 3220, 3190, 3180, 3195, 3205, 3200],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      icon: 'token-branded:solana',
      price: '$145',
      change: 2.7,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [140, 142, 143, 144, 146, 147, 145],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: 'logos:bitcoin',
      price: '$67,000',
      change: 0.5,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [67000, 67200, 66800, 66900, 67050, 67100, 67000],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
    {
      name: 'Chainlink',
      symbol: 'LINK',
      icon: 'simple-icons:chainlink',
      price: '$18.20',
      change: 6.3,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [17, 17.5, 18, 18.5, 18.2, 18.4, 18.2],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      icon: 'token-branded:polygon',
      price: '$0.95',
      change: -3.8,
      chartData: {
        labels: [1, 2, 3, 4, 5, 6, 7],
        datasets: [
          {
            data: [1, 0.98, 0.97, 0.96, 0.95, 0.94, 0.95],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
          },
        ],
      },
    },
  ]
</script>

<style scoped>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
