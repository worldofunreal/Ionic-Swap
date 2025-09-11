<template>
  <div class="overflow-x-auto flex-1">
    <table class="min-w-5xl w-full text-sm">
      <thead>
        <tr class="bg-neutral-100 dark:bg-neutral-800">
          <th
            v-for="col in columns"
            :key="col.key"
            class="p-4 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-200 dark:border-gray-700 h-px" />
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-b border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <!-- Event -->
          <td class="p-4">
            <div class="flex items-center gap-2">
              <UIcon :name="row.eventIcon" class="text-lg" />
              <span class="text-gray-900 dark:text-white">{{
                row.eventType
              }}</span>
            </div>
          </td>
          <!-- Item -->
          <td class="p-4 min-w-[180px]">
            <div class="flex items-center gap-2">
              <img
                :src="row.itemAvatar"
                alt="avatar"
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-700 flex-shrink-0"
              >
              <div class="min-w-0">
                <div
                  class="font-semibold text-gray-900 dark:text-white truncate"
                >
                  {{ row.itemName }}
                </div>
                <div
                  class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  {{ row.collectionName }}
                  <UIcon
                    v-if="row.verified"
                    name="material-symbols:verified"
                    class="text-primary-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </td>
          <!-- Price -->
          <td class="p-4 font-mono text-gray-900 dark:text-white">
            {{ row.price }}
          </td>
          <!-- Rarity -->
          <td class="p-4 text-gray-600 dark:text-gray-300">{{ row.rarity }}</td>
          <!-- Qty -->
          <td class="p-4 text-gray-600 dark:text-gray-300">{{ row.qty }}</td>
          <!-- From -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.from }}
          </td>
          <!-- To -->
          <td class="p-4 font-mono text-gray-600 dark:text-gray-300">
            {{ row.to }}
          </td>
          <!-- Time -->
          <td class="p-4">
            <div class="flex items-center gap-1">
              <span class="text-gray-600 dark:text-gray-300">{{
                row.time
              }}</span>
              <a href="#" target="_blank">
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square-20-solid"
                  class="text-xs text-gray-500 dark:text-gray-400"
                />
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
  const columns = [
    { key: 'event', label: 'Event' },
    { key: 'item', label: 'Item' },
    { key: 'price', label: 'Price' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'qty', label: 'Qty' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'time', label: 'Time' },
  ]
  const rows = [
    {
      id: 1,
      eventIcon: 'i-heroicons-currency-dollar-solid',
      eventType: 'Sale',
      itemAvatar: 'https://placehold.co/40x40',
      itemName: 'Penguin #1234',
      collectionName: 'Pudgy Penguins',
      verified: true,
      price: '4.20 ETH',
      rarity: '#1,234',
      qty: 1,
      from: '0xA1...B2',
      to: '0xC3...D4',
      time: '13s ago',
    },
    {
      id: 2,
      eventIcon: 'i-heroicons-currency-dollar-solid',
      eventType: 'Sale',
      itemAvatar: 'https://placehold.co/40x40',
      itemName: 'Punk #5678',
      collectionName: 'CryptoPunks',
      verified: true,
      price: '55.00 ETH',
      rarity: '#5,678',
      qty: 1,
      from: '0xE5...F6',
      to: '0xG7...H8',
      time: '2m ago',
    },
    {
      id: 3,
      eventIcon: 'i-heroicons-currency-dollar-solid',
      eventType: 'Sale',
      itemAvatar: 'https://placehold.co/40x40',
      itemName: 'Fidenza #42',
      collectionName: 'Fidenza by Tyler Hobbs',
      verified: false,
      price: '120.00 ETH',
      rarity: '#42',
      qty: 1,
      from: '0xI9...J0',
      to: '0xK1...L2',
      time: '5m ago',
    },
    {
      id: 4,
      eventIcon: 'i-heroicons-currency-dollar-solid',
      eventType: 'Sale',
      itemAvatar: 'https://placehold.co/40x40',
      itemName: 'Doodle #99',
      collectionName: 'Doodles',
      verified: false,
      price: '2.50 ETH',
      rarity: '#99',
      qty: 1,
      from: '0xM3...N4',
      to: '0xO5...P6',
      time: '10m ago',
    },
  ]
</script>
