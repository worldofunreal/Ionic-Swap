<template>
  <div>
    <div class="mb-2 text-sm font-bold">Collections</div>
    <div class="flex flex-col gap-2">
      <div
        v-for="col in collections"
        :key="col.id"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500 transition cursor-pointer"
      >
        <img
          :src="col.image"
          :alt="col.name"
          class="w-8 h-8 rounded-md object-cover"
        >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 font-semibold truncate">
            <span class="truncate">{{ col.name }}</span>
            <UIcon
              v-if="col.verified"
              name="material-symbols:verified"
              class="text-sky-500 text-xl"
            />
          </div>
        </div>
        <div class="flex flex-col items-end min-w-[70px]">
          <span class="text-xs font-bold">{{ col.floorPrice }}</span>
          <span
            :class="col.change >= 0 ? 'text-green-600' : 'text-red-600'"
            class="text-xs"
            >{{ col.change >= 0 ? '+' : '' }}{{ col.change }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const collections = [
    {
      id: 1,
      name: 'Pixel Punks',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80',
      floorPrice: '1.2 ICP',
      change: 12.5,
    },
    {
      id: 2,
      name: 'Art Blocks',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
      floorPrice: '3.5 ICP',
      change: -4.2,
    },
    {
      id: 3,
      name: 'Music Legends',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      floorPrice: '0.7 ICP',
      change: 8.1,
    },
    {
      id: 4,
      name: 'Photo Masters',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      floorPrice: '2.1 ICP',
      change: 2.3,
    },
    {
      id: 5,
      name: 'Crypto Creatures',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      floorPrice: '0.9 ICP',
      change: 5.7,
    },
    {
      id: 6,
      name: 'Rare Faces',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      floorPrice: '1.8 ICP',
      change: -1.3,
    },
    {
      id: 7,
      name: 'SoundWaves',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80',
      floorPrice: '2.7 ICP',
      change: 7.9,
    },
    {
      id: 8,
      name: 'Generative Art',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
      floorPrice: '4.2 ICP',
      change: 10.2,
    },
    {
      id: 9,
      name: 'Metaverse Land',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      floorPrice: '3.0 ICP',
      change: 3.3,
    },
    {
      id: 10,
      name: 'AI Portraits',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      floorPrice: '2.2 ICP',
      change: 6.6,
    },
    {
      id: 11,
      name: 'Chain Fusion',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
      floorPrice: '1.1 ICP',
      change: 4.4,
    },
    {
      id: 12,
      name: 'Pixel Pets',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80',
      floorPrice: '0.6 ICP',
      change: 9.9,
    },
    {
      id: 13,
      name: 'Artistic Minds',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
      floorPrice: '2.8 ICP',
      change: -2.2,
    },
    {
      id: 14,
      name: 'Photo Drops',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=80&q=80',
      floorPrice: '1.5 ICP',
      change: 1.1,
    },
    {
      id: 15,
      name: 'Music Boom',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      floorPrice: '0.8 ICP',
      change: 12.0,
    },
  ]
</script>
