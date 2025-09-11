<template>
  <div>
    <div class="mb-2">
      <h2 class="text-lg font-bold">Featured Collections</h2>
      <div class="text-xs text-gray-500">This Week's curated collections</div>
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
          v-for="col in collections"
          :key="col.id"
          class="min-w-[220px] max-w-xs bg-white dark:bg-neutral-950 rounded-xl shadow p-3 flex flex-col gap-2 cursor-pointer hover:scale-105 transition-transform"
          style="scroll-snap-align: start"
        >
          <div class="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mb-1">
            <img
              :src="col.image"
              :alt="col.name"
              class="object-cover w-full h-full"
            >
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
            <span :class="col.change >= 0 ? 'text-green-600' : 'text-red-600'"
              >{{ col.change >= 0 ? '+' : '' }}{{ col.change }}%</span
            >
          </div>
          <UButton
            size="sm"
            color="primary"
            class="buy-nft-btn mt-2"
            @click.stop
          >
            Buy Now
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  const collections = [
    {
      id: 1,
      name: 'Pixel Punks',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      floorPrice: '1.2 ICP',
      change: 12.5,
    },
    {
      id: 2,
      name: 'Art Blocks',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
      floorPrice: '3.5 ICP',
      change: -4.2,
    },
    {
      id: 3,
      name: 'Music Legends',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      floorPrice: '0.7 ICP',
      change: 8.1,
    },
    {
      id: 4,
      name: 'Photo Masters',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      floorPrice: '2.1 ICP',
      change: 2.3,
    },
    {
      id: 5,
      name: 'Crypto Creatures',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80',
      floorPrice: '0.9 ICP',
      change: 5.7,
    },
    {
      id: 6,
      name: 'Generative Art',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
      floorPrice: '4.2 ICP',
      change: 10.2,
    },
    {
      id: 7,
      name: 'Rare Faces',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      floorPrice: '1.8 ICP',
      change: -1.3,
    },
    {
      id: 8,
      name: 'SoundWaves',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
      floorPrice: '2.7 ICP',
      change: 7.9,
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
