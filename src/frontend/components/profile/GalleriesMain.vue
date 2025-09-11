<template>
  <div
    class="h-full mb-11 w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
  >
    <div
      v-if="galleries.length === 0"
      class="flex flex-col items-center justify-center h-full w-full"
    >
      <div class="mb-4">
        <img
          src="https://undraw.co/api/illustrations/undraw_add_to_cart_re_wrdo.svg"
          alt="Create Gallery"
          class="w-32 h-32"
        >
      </div>
      <div class="text-2xl font-bold mb-2">No Galleries Yet</div>
      <div class="text-gray-400 mb-4 text-center max-w-md">
        Showcase your favorite NFTs with our new galleries section. Create
        custom collections to share and organize your NFTs. This tab is publicly
        hidden until you add sections.
      </div>
      <button
        class="px-6 py-2 rounded bg-primary-600 hover:bg-primary-700 transition text-white font-semibold mb-2"
      >
        Create a gallery
      </button>
      <a href="#" class="text-primary-600 hover:underline text-sm"
        >Learn more about galleries</a
      >
    </div>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full p-6"
    >
      <div
        v-for="gallery in galleries"
        :key="gallery.id"
        class="bg-white dark:bg-neutral-950 rounded-xl shadow-lg p-5 flex flex-col transition-transform transform hover:scale-105 hover:shadow-2xl border border-gray-100 dark:border-gray-800 relative group"
      >
        <div class="relative mb-3">
          <img
            :src="gallery.cover"
            alt="Gallery Cover"
            class="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
          >
          <span
            class="absolute top-2 right-2 bg-white/80 dark:bg-neutral-900/80 text-xs px-2 py-1 rounded shadow group-hover:bg-primary-600 group-hover:text-white transition"
          >
            {{ gallery.nfts.length }} NFT{{
              gallery.nfts.length !== 1 ? 's' : ''
            }}
          </span>
        </div>
        <div class="font-bold text-lg mb-1 flex items-center gap-2">
          {{ gallery.name }}
          <span
            v-if="gallery.featured"
            class="ml-1 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded"
            >Featured</span
          >
        </div>
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
          {{ gallery.description }}
        </div>
        <div class="text-xs text-gray-400 mb-3">
          Created: {{ gallery.createdAt }}
        </div>
        <div class="flex gap-2 mt-auto">
          <button
            class="px-3 py-1 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs transition"
          >
            View
          </button>
          <button
            class="px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs transition"
          >
            Edit
          </button>
          <button
            class="px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-900 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs transition"
            @click="shareGallery(gallery)"
          >
            Share
          </button>
          <button
            class="px-3 py-1 rounded bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300 text-xs transition"
            @click="deleteGallery(gallery)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'

  interface Gallery {
    id: number
    name: string
    description: string
    cover: string
    nfts: string[]
    createdAt: string
    featured: boolean
  }

  const galleries = ref<Gallery[]>([
    {
      id: 1,
      name: 'CryptoPunks Collection',
      description:
        'A curated set of my favorite CryptoPunks NFTs. Showcasing rare traits and unique styles.',
      cover: 'https://placehold.co/400x160?text=CryptoPunks',
      nfts: [
        'https://placehold.co/48x48?text=NFT',
        'https://placehold.co/48x48?text=NFT',
        'https://placehold.co/48x48?text=NFT',
      ],
      createdAt: '2024-06-01',
      featured: true,
    },
    {
      id: 2,
      name: 'Art Blocks',
      description:
        'Generative art masterpieces from the Art Blocks platform. Vibrant, algorithmic, and inspiring.',
      cover: 'https://placehold.co/400x160?text=Art+Blocks',
      nfts: [
        'https://placehold.co/48x48?text=NFT',
        'https://placehold.co/48x48?text=NFT',
      ],
      createdAt: '2024-05-20',
      featured: false,
    },
  ])

  function shareGallery(gallery: Gallery) {
    // Dummy handler: In real app, copy link or open share dialog
    alert(`Share link for gallery: ${gallery.name}`)
  }
  function deleteGallery(gallery: Gallery) {
    // Dummy handler: In real app, show confirmation and remove
    alert(`Delete gallery: ${gallery.name}`)
  }
</script>
<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
