<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="w-full">
      <div class="flex gap-8">
        <!-- Left Panel - NFT Artwork -->
        <div
          class="sticky flex flex-col top-24 w-full h-[calc(100vh-6rem-4rem)] flex-1"
        >
          <!-- Breadcrumb -->
          <div class="mb-6 text-sm text-gray-400">
            <span class="hover:text-white cursor-pointer">NFTs</span>
            <span class="mx-2">/</span>
            <span class="hover:text-white cursor-pointer">CryptoPunks</span>
            <span class="mx-2">/</span>
            <span class="text-white">#8150</span>
          </div>

          <!-- Outer Frame -->
          <div
            class="p-4 bg-neutral-800 rounded-lg flex flex-1 flex-col min-h-0"
          >
            <!-- Inner Frame -->
            <img
              src="https://placehold.co/600x600/3B82F6/FFFFFF?text=CryptoPunk+%238150"
              alt="CryptoPunk #8150"
              class="w-full h-full object-contain rounded-sm"
            >
          </div>
        </div>

        <!-- Right Panel - Information -->
        <div class="space-y-6 flex-1 max-w-2xl">
          <!-- Top Section - NFT Identity & Metrics -->
          <div>
            <!-- Title and Action Icons -->
            <div class="flex justify-between items-start mb-4">
              <div>
                <h1 class="text-3xl font-bold mb-2">CryptoPunk #8150</h1>
                <div class="flex items-center gap-2 mb-3">
                  <img
                    src="https://placehold.co/32x32"
                    alt="Collection"
                    class="w-8 h-8 rounded-full"
                  >
                  <span class="font-semibold">CryptoPunks</span>
                  <UIcon
                    name="material-symbols:verified"
                    class="text-primary-500"
                  />
                </div>
                <div class="text-gray-400 mb-3">
                  Owned by
                  <span class="text-white hover:text-primary-400 cursor-pointer"
                    >0x1234...5678</span
                  >
                </div>
              </div>
              <div class="flex gap-2">
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-heroicons-globe-alt-20-solid" />
                </button>
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-simple-icons-discord" />
                </button>
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-simple-icons-x" />
                </button>
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-heroicons-clipboard-document-20-solid" />
                </button>
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-heroicons-heart-20-solid" />
                </button>
                <button class="p-2 rounded hover:bg-neutral-800">
                  <UIcon name="i-heroicons-ellipsis-vertical-20-solid" />
                </button>
              </div>
            </div>

            <!-- Navigation Tags -->
            <div class="flex flex-wrap gap-2 mb-6">
              <span class="px-3 py-1 bg-neutral-800 rounded-full text-sm"
                >CRYPTOPUNKS</span
              >
              <span class="px-3 py-1 bg-neutral-800 rounded-full text-sm"
                >ETHEREUM</span
              >
              <span class="px-3 py-1 bg-neutral-800 rounded-full text-sm"
                >TOKEN #8150</span
              >
            </div>

            <!-- Key Metrics Bar -->
            <div class="grid grid-cols-4 gap-4 p-4 bg-neutral-800 rounded-lg">
              <div>
                <div class="text-gray-400 text-sm">Top Offer</div>
                <div class="font-bold">-</div>
              </div>
              <div>
                <div class="text-gray-400 text-sm">Collection Floor</div>
                <div class="font-bold">48.74 ETH</div>
              </div>
              <div>
                <div class="text-gray-400 text-sm">Rarity</div>
                <div class="font-bold">#2,028</div>
              </div>
              <div>
                <div class="text-gray-400 text-sm">Last Sale</div>
                <div class="font-bold">47.50 ETH</div>
              </div>
            </div>
          </div>

          <!-- Bottom Section - Tabbed Content -->
          <div>
            <!-- Tab Navigation -->
            <div class="flex border-b border-gray-700 mb-6">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                :class="
                  activeTab === tab.key
                    ? 'border-b-2 border-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                "
                class="px-4 py-2 font-semibold"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab Content -->
            <div>
              <!-- Details Tab -->
              <div v-if="activeTab === 'details'" class="space-y-4">
                <NftDetailsTraits />
                <NftDetailsPriceHistory />
                <NftDetailsAbout />
                <NftDetailsBlockchain />
                <NftDetailsMoreFromCollection />
              </div>

              <!-- Orders Tab -->
              <div v-if="activeTab === 'orders'">
                <NftOrdersTable />
              </div>

              <!-- Activity Tab -->
              <div v-if="activeTab === 'activity'">
                <NftActivityTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import NftDetailsTraits from '~/components/nft/NftDetailsTraits.vue'
  import NftDetailsPriceHistory from '~/components/nft/NftDetailsPriceHistory.vue'
  import NftDetailsAbout from '~/components/nft/NftDetailsAbout.vue'
  import NftDetailsBlockchain from '~/components/nft/NftDetailsBlockchain.vue'
  import NftDetailsMoreFromCollection from '~/components/nft/NftDetailsMoreFromCollection.vue'
  import NftOrdersTable from '~/components/nft/NftOrdersTable.vue'
  import NftActivityTable from '~/components/nft/NftActivityTable.vue'

  const activeTab = ref('details')

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'orders', label: 'Orders' },
    { key: 'activity', label: 'Activity' },
  ]
</script>
