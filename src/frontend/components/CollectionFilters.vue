<template>
  <div class="flex flex-col gap-6">
    <div>
      <div class="font-bold mb-2">Status</div>
      <div class="flex flex-col gap-1">
        <label><input type="checkbox" checked > All</label>
        <label><input type="checkbox" > Listed</label>
      </div>
    </div>
    <div>
      <div class="font-bold mb-2">Rarity</div>
      <div class="flex flex-col gap-1">
        <label><input type="checkbox" > Common</label>
        <label><input type="checkbox" > Rare</label>
        <label><input type="checkbox" > Legendary</label>
      </div>
    </div>
    <div>
      <div class="font-bold mb-2">Price</div>
      <div class="flex gap-2 items-center">
        <input
          type="number"
          placeholder="Min"
          class="w-16 px-2 py-1 rounded border"
        >
        <span>-</span>
        <input
          type="number"
          placeholder="Max"
          class="w-16 px-2 py-1 rounded border"
        >
      </div>
    </div>
    <div>
      <div class="font-bold mb-2">Marketplaces</div>
      <div class="flex flex-col gap-1">
        <label><input type="checkbox" checked > Nftropoly</label>
        <label><input type="checkbox" > OpenSea</label>
        <label><input type="checkbox" > LooksRare</label>
      </div>
    </div>
    <div>
      <div class="font-bold mb-2">Traits</div>
      <div class="flex flex-col gap-1">
        <label><input type="checkbox" > Edition Size</label>
        <label><input type="checkbox" > Edition Type</label>
        <label><input type="checkbox" > Platform</label>
        <label><input type="checkbox" > Rank</label>
        <label><input type="checkbox" > Release Year</label>
        <label><input type="checkbox" > Series</label>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
