<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold">Top Movers Today</h2>
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
          v-for="col in movers"
          :key="col.id"
          class="min-w-[220px] max-w-xs bg-white dark:bg-neutral-950 rounded-xl shadow p-3 flex flex-col gap-2 cursor-pointer hover:scale-105 transition-transform relative"
          style="scroll-snap-align: start"
        >
          <div
            class="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mb-1 relative"
          >
            <img
              :src="col.image"
              :alt="col.name"
              class="object-cover w-full h-full"
            />
          </div>
          <div class="flex items-center gap-1 font-semibold">
            <span>{{ col.name }}</span>
            <UIcon
              v-if="col.verified"
              name="material-symbols:verified"
              class="text-sky-500 text-xl"
            />
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-500">Floor:</span>
            <span class="font-bold">{{ col.floorPrice }}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span
              :class="col.change >= 0 ? 'text-green-600' : 'text-red-600'"
              class="text-lg font-extrabold"
              >{{ col.change >= 0 ? '+' : '' }}{{ col.change }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  const movers = [
    {
      id: 1,
      name: 'Rocket Apes',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      floorPrice: '2.5 ICP',
      change: 400,
    },
    {
      id: 2,
      name: 'Art Surge',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
      floorPrice: '1.8 ICP',
      change: 220,
    },
    {
      id: 3,
      name: 'Music Boom',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      floorPrice: '0.9 ICP',
      change: 150,
    },
    {
      id: 4,
      name: 'Photo Movers',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      floorPrice: '3.0 ICP',
      change: -80,
    },
  ]
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
</script>

<style scoped>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .aspect-w-16 {
    aspect-ratio: 16/9;
  }
</style>
