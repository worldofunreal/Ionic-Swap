<template>
  <div class="relative w-full">
    <!-- Navigation Buttons -->
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

    <!-- Carousel -->
    <div
      ref="scrollRef"
      class="relative w-full overflow-x-auto scrollbar-hide"
      style="scroll-snap-type: x mandatory; scroll-behavior: smooth"
    >
      <div class="flex mt-1 gap-6 min-w-full">
        <div
          v-for="col in collections"
          :key="col.id"
          class="w-full flex-shrink-0 bg-white dark:bg-neutral-950 rounded-2xl shadow flex flex-col"
          style="scroll-snap-align: start; min-width: 100%; max-width: 100%"
        >
          <!-- Media with overlay and info inside -->
          <div
            class="w-full rounded-xl overflow-hidden relative"
            style="height: 360px"
          >
            <img
              :src="col.image"
              :alt="col.name"
              class="object-cover w-full h-full"
            >
            <!-- Gradient overlay -->
            <div
              class="absolute inset-0"
              style="
                background: linear-gradient(
                  to top,
                  rgba(0, 0, 0, 0.7) 60%,
                  rgba(0, 0, 0, 0.2) 90%,
                  transparent 100%
                );
              "
            />
            <!-- Info content inside image -->
            <div
              class="absolute bottom-0 left-0 z-10 p-4 bg-neutral/40 rounded-xl inline-flex flex-col gap-2 w-full md:w-md"
            >
              <div
                class="flex items-center gap-2 text-2xl font-black text-white"
              >
                <span>{{ col.name }}</span>
                <UIcon
                  v-if="col.verified"
                  name="material-symbols:verified"
                  class="text-sky-500 text-2xl"
                />
              </div>
              <div class="text-xs font-normal text-gray-500 mb-2">
                By {{ col.creator }}
              </div>
              <!-- Established Collection Stats (Floor, Items, Volume, Listed) -->
              <div
                v-if="col.mintStatus === 'Closed'"
                class="grid grid-cols-4 gap-2 text-xs"
              >
                <div
                  class="bg-black/60 rounded-md p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white">{{
                    col.floorPrice
                  }}</span>
                  <span class="text-gray-500 text-xs">Floor</span>
                </div>
                <div
                  class="bg-black/60 rounded-md p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white">{{
                    col.items
                  }}</span>
                  <span class="text-gray-500 text-xs">Items</span>
                </div>
                <div
                  class="bg-black/60 rounded-md p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white">{{
                    col.volume
                  }}</span>
                  <span class="text-gray-500 text-xs">Volume</span>
                </div>
                <div
                  class="bg-black/60 rounded-md p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white"
                    >{{ col.listedPct }}%</span
                  >
                  <span class="text-gray-500 text-xs">Listed</span>
                </div>
              </div>
              <!-- Minting Stats (Status, Mint, Total) -->
              <div v-else class="grid grid-cols-3 gap-2 text-xs">
                <div class="bg-primary rounded p-2 flex flex-col items-center">
                  <span class="font-bold text-lg text-white">{{
                    col.mintStatus
                  }}</span>
                  <span class="text-white text-xs">Status</span>
                </div>
                <div
                  class="bg-primary bg-opacity-60 rounded p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white">{{
                    col.mintPrice
                  }}</span>
                  <span class="text-white text-xs">Mint</span>
                </div>
                <div
                  class="bg-primary bg-opacity-60 rounded p-2 flex flex-col items-center"
                >
                  <span class="font-bold text-lg text-white">{{
                    col.mintTotal
                  }}</span>
                  <span class="text-white text-xs">Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Pills -->
    <div class="flex justify-center gap-2 mt-4">
      <button
        v-for="(col, index) in collections"
        :key="col.id"
        :class="
          currentSlide === index
            ? 'bg-primary-600'
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
        "
        class="w-3 h-3 rounded-full transition-all duration-300"
        @click="scrollToSlide(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'

  const collections = [
    {
      id: 1,
      name: 'Pixel Punks',
      verified: true,
      creator: 'Team Alpha',
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
      floorPrice: '1.2 ICP',
      items: 1000,
      volume: '12K ICP',
      listedPct: 15,
      mintStatus: 'Open',
      mintPrice: '0.8 ICP',
      mintTotal: 2000,
    },
    {
      id: 2,
      name: 'Art Blocks',
      verified: true,
      creator: 'Art Collective',
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
      floorPrice: '3.5 ICP',
      items: 500,
      volume: '8K ICP',
      listedPct: 22,
      mintStatus: 'Closed',
      mintPrice: '3 ICP',
      mintTotal: 500,
    },
    {
      id: 3,
      name: 'Music Legends',
      verified: false,
      creator: 'SoundWave',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      floorPrice: '0.7 ICP',
      items: 200,
      volume: '1.2K ICP',
      listedPct: 10,
      mintStatus: 'Open',
      mintPrice: '0.5 ICP',
      mintTotal: 300,
    },
    {
      id: 4,
      name: 'Crypto Creatures',
      verified: true,
      creator: 'Digital Zoo',
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=800&q=80',
      floorPrice: '2.1 ICP',
      items: 750,
      volume: '15K ICP',
      listedPct: 18,
      mintStatus: 'Open',
      mintPrice: '1.5 ICP',
      mintTotal: 1000,
    },
    {
      id: 5,
      name: 'Generative Dreams',
      verified: true,
      creator: 'AI Studio',
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
      floorPrice: '4.2 ICP',
      items: 300,
      volume: '25K ICP',
      listedPct: 8,
      mintStatus: 'Closed',
      mintPrice: '3.8 ICP',
      mintTotal: 300,
    },
  ]

  const scrollRef = ref(null)
  const currentSlide = ref(0)

  function scrollLeft() {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      const cardWidth = container.offsetWidth
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }

  function scrollRight() {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      const cardWidth = container.offsetWidth
      container.scrollBy({ left: cardWidth, behavior: 'smooth' })
    }
  }

  function scrollToSlide(index: number) {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      const cardWidth = container.offsetWidth
      container.scrollTo({ left: cardWidth * index, behavior: 'smooth' })
    }
  }

  function updateCurrentSlide() {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      const cardWidth = container.offsetWidth
      const scrollPosition = container.scrollLeft
      currentSlide.value = Math.round(scrollPosition / cardWidth)
    }
  }

  onMounted(() => {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      container.addEventListener('scroll', updateCurrentSlide)
    }
  })

  onUnmounted(() => {
    if (scrollRef.value) {
      const container = scrollRef.value as HTMLElement
      container.removeEventListener('scroll', updateCurrentSlide)
    }
  })
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
