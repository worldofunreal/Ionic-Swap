<template>
  <div class="portfolio-sparkline">
    <svg 
      :width="width" 
      :height="height" 
      viewBox="0 0 100 40" 
      class="sparkline-svg"
    >
      <polyline
        :points="pathData"
        fill="none"
        :stroke="lineColor"
        stroke-width="2"
        class="sparkline-path"
      />
      <!-- Gradient fill under the line -->
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="gradientColor" stop-opacity="0.3"/>
          <stop offset="100%" :stop-color="gradientColor" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        :points="areaData"
        fill="url(#sparklineGradient)"
        class="sparkline-area"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PortfolioPoint } from '~/services/CanisterService'

interface Props {
  portfolioHistory: PortfolioPoint[]
  width?: number
  height?: number
  isPositive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 100,
  height: 40,
  isPositive: true
})

// Color based on performance
const lineColor = computed(() => {
  return props.isPositive ? '#10b981' : '#ef4444' // green or red
})

const gradientColor = computed(() => {
  return props.isPositive ? '#10b981' : '#ef4444'
})

// Generate SVG path data from portfolio history
const pathData = computed(() => {
  if (props.portfolioHistory.length < 2) {
    return '0,20 100,20' // Flat line if no data
  }

  const points = props.portfolioHistory
  const minValue = Math.min(...points.map(p => p.value_usdt))
  const maxValue = Math.max(...points.map(p => p.value_usdt))
  const range = maxValue - minValue || 1 // Avoid division by zero

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 40 - ((point.value_usdt - minValue) / range) * 35 - 2.5 // 2.5px margin
      return `${x},${y}`
    })
    .join(' ')
})

// Generate area fill data (same as path but closed at bottom)
const areaData = computed(() => {
  if (props.portfolioHistory.length < 2) {
    return '0,20 100,20 100,40 0,40'
  }

  const pathPoints = pathData.value.split(' ')
  const bottomY = 40
  const firstX = pathPoints[0]?.split(',')[0] || '0'
  const lastX = pathPoints[pathPoints.length - 1]?.split(',')[0] || '100'
  
  return `${pathData.value} ${lastX},${bottomY} ${firstX},${bottomY}`
})
</script>

<style scoped>
.portfolio-sparkline {
  display: inline-block;
}

.sparkline-svg {
  display: block;
}

.sparkline-path {
  transition: stroke 0.3s ease;
}

.sparkline-area {
  transition: fill 0.3s ease;
}

/* Smooth animation for the sparkline */
.sparkline-path {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
