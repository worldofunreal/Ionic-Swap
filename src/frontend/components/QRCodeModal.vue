<template>
  <!-- QR Code Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] flex items-center justify-center"
    @click="close"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-zinc-50/20 dark:bg-black/20 backdrop-blur-md"
    />
    <!-- Modal Content -->
    <div
      class="relative bg-zinc-100 dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-w-sm mx-4 w-full"
      @click.stop
    >
      <div class="text-center">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
            {{ walletType }} Address
          </h3>
          <button
            @click="close"
            class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark-20-solid" class="w-5 h-5" />
          </button>
        </div>

        <!-- QR Code -->
        <div class="bg-white p-4 rounded-lg mb-4 inline-block">
          <canvas ref="qrCanvas" class="max-w-full"></canvas>
        </div>

        <!-- Address -->
        <div class="mb-4">
          <div class="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Address</div>
          <div class="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
            <div class="text-sm font-mono text-zinc-900 dark:text-white break-all">
              {{ address }}
            </div>
          </div>
        </div>

        <!-- Copy Button -->
        <button
          @click="copyToClipboard"
          class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <UIcon name="i-heroicons-document-duplicate-20-solid" class="w-4 h-4" />
          Copy Address
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useToast } from '#imports'
// Dynamic import for QRCode to avoid browser compatibility issues

// Props
interface Props {
  isOpen?: boolean
  address?: string
  walletType?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  address: '',
  walletType: 'Wallet'
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Refs
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const toast = useToast()

// Methods
const close = () => {
  emit('close')
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.address)
    toast.add({
      title: `${props.walletType} Address Copied`,
      description: props.address,
      color: 'success',
    })
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    toast.add({
      title: `${props.walletType} Copy Failed`,
      description: 'Failed to copy address to clipboard.',
      color: 'error',
    })
  }
}

const generateQRCode = async () => {
  if (!props.address || !qrCanvas.value) return
  
  try {
    // Dynamic import to avoid browser compatibility issues
    const QRCode = await import('qrcode')
    await QRCode.toCanvas(qrCanvas.value, props.address, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

// Watch for modal open and address changes to generate QR code
watch(
  () => [props.isOpen, props.address],
  async ([isOpen, address]) => {
    if (isOpen && address) {
      await nextTick()
      await generateQRCode()
    }
  },
  { immediate: true }
)

// Expose methods for parent components
defineExpose({
  generateQRCode
})
</script>
