<template>
  <div class="p-4">
    <h3 class="text-lg font-semibold mb-4">Toast Test Component</h3>
    <div class="space-y-2">
      <UButton color="success" @click="showSuccessToast">
        Show Success Toast
      </UButton>
      <UButton color="error" @click="showErrorToast">
        Show Error Toast
      </UButton>
      <UButton color="info" @click="showInfoToast"> Show Info Toast </UButton>
      <UButton color="neutral" @click="clearAllToasts">
        Clear All Toasts
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  const toast = useToast()

  const showSuccessToast = () => {
    toast.add({
      title: 'Success!',
      description: 'This is a success toast notification',
      color: 'success',
    })
  }

  const showErrorToast = () => {
    toast.add({
      title: 'Error!',
      description: 'This is an error toast notification',
      color: 'error',
    })
  }

  const showInfoToast = () => {
    toast.add({
      title: 'Info',
      description: 'This is an info toast notification',
      color: 'info',
    })
  }

  const clearAllToasts = () => {
    toast.clear()
  }
</script>
