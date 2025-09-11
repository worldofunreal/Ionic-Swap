<template>
  <div class="bg-neutral-800 rounded-lg">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <h3 class="text-lg font-bold mb-4">Activity</h3>

      <!-- Event Filter Bar -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in eventFilters"
          :key="filter.key"
          :class="
            activeFilter === filter.key
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
          "
          class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full min-w-max">
        <!-- Table Header -->
        <thead class="bg-neutral-800">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              EVENT
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              PRICE
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              FROM
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              TO
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              TIME
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
            />
          </tr>
        </thead>
        <!-- Header Separator -->
        <tr class="border-b border-gray-700">
          <td colspan="6" class="h-px"/>
        </tr>

        <!-- Table Body -->
        <tbody class="divide-y divide-gray-700">
          <tr
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="hover:bg-neutral-700 transition-colors"
          >
            <!-- Event -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div
                  :class="getEventIcon(activity.event)"
                  class="w-5 h-5 flex-shrink-0"
                />
                <span class="text-sm font-medium">{{ activity.event }}</span>
              </div>
            </td>

            <!-- Price -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div v-if="activity.price" class="flex items-center gap-2">
                <img
                  src="https://placehold.co/16x16"
                  alt="ETH"
                  class="w-4 h-4 rounded-full flex-shrink-0"
                >
                <span class="font-mono text-sm">{{ activity.price }}</span>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </td>

            <!-- From -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <img
                  :src="activity.from.avatar"
                  :alt="activity.from.name"
                  class="w-6 h-6 rounded-full flex-shrink-0"
                >
                <span class="text-sm font-medium">{{
                  activity.from.name
                }}</span>
                <UIcon
                  v-if="activity.from.verified"
                  name="material-symbols:verified"
                  class="w-4 h-4 text-primary-500 flex-shrink-0"
                />
              </div>
            </td>

            <!-- To -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div v-if="activity.to" class="flex items-center gap-2">
                <img
                  :src="activity.to.avatar"
                  :alt="activity.to.name"
                  class="w-6 h-6 rounded-full flex-shrink-0"
                >
                <span class="text-sm font-medium">{{ activity.to.name }}</span>
                <UIcon
                  v-if="activity.to.verified"
                  name="material-symbols:verified"
                  class="w-4 h-4 text-primary-500 flex-shrink-0"
                />
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </td>

            <!-- Time -->
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="text-sm text-gray-400">{{ activity.time }}</span>
            </td>

            <!-- External Link -->
            <td class="px-4 py-3 whitespace-nowrap">
              <button class="text-primary-500 hover:text-primary-400">
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square-20-solid"
                  class="w-4 h-4"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="filteredActivities.length === 0" class="p-8 text-center">
      <UIcon
        name="i-heroicons-clock-20-solid"
        class="w-12 h-12 text-gray-500 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-300 mb-2">No activity yet</h3>
      <p class="text-gray-400">
        Activity will appear here once transactions occur
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  const activeFilter = ref('all')

  const eventFilters = [
    { key: 'all', label: 'All' },
    { key: 'sale', label: 'Sale' },
    { key: 'listing', label: 'Listing' },
    { key: 'offer', label: 'Item Offer' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'mint', label: 'Mint' },
  ]

  const activities = ref([
    {
      id: 1,
      event: 'Sale',
      price: '47.50 ETH',
      from: {
        name: 'CryptoWhale',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      to: {
        name: 'NFTCollector',
        avatar: 'https://placehold.co/24x24',
        verified: false,
      },
      time: '2 hours ago',
      type: 'sale',
    },
    {
      id: 2,
      event: 'Listing',
      price: '50.00 ETH',
      from: {
        name: 'CryptoWhale',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      to: null,
      time: '1 day ago',
      type: 'listing',
    },
    {
      id: 3,
      event: 'Transfer',
      price: null,
      from: {
        name: 'ArtLover',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      to: {
        name: 'CryptoWhale',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      time: '3 days ago',
      type: 'transfer',
    },
    {
      id: 4,
      event: 'Item Offer',
      price: '45.00 ETH',
      from: {
        name: 'PunkHunter',
        avatar: 'https://placehold.co/24x24',
        verified: false,
      },
      to: {
        name: 'CryptoWhale',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      time: '1 week ago',
      type: 'offer',
    },
    {
      id: 5,
      event: 'Sale',
      price: '42.00 ETH',
      from: {
        name: 'DigitalArtist',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      to: {
        name: 'ArtLover',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      time: '2 weeks ago',
      type: 'sale',
    },
    {
      id: 6,
      event: 'Mint',
      price: null,
      from: {
        name: 'Larva Labs',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      to: {
        name: 'DigitalArtist',
        avatar: 'https://placehold.co/24x24',
        verified: true,
      },
      time: '3 years ago',
      type: 'mint',
    },
  ])

  const filteredActivities = computed(() => {
    if (activeFilter.value === 'all') {
      return activities.value
    }
    return activities.value.filter(
      activity => activity.type === activeFilter.value
    )
  })

  const getEventIcon = (event: string) => {
    switch (event.toLowerCase()) {
      case 'sale':
        return 'i-heroicons-currency-dollar-20-solid text-green-500'
      case 'listing':
        return 'i-heroicons-tag-20-solid text-blue-500'
      case 'transfer':
        return 'i-heroicons-arrow-right-20-solid text-gray-500'
      case 'item offer':
        return 'i-heroicons-hand-thumb-up-20-solid text-yellow-500'
      case 'mint':
        return 'i-heroicons-sparkles-20-solid text-purple-500'
      default:
        return 'i-heroicons-question-mark-circle-20-solid text-gray-500'
    }
  }
</script>
