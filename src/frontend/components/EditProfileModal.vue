<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/50 flex items-center justify-center z-50"
    @click="close"
  >
    <div
      class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800"
      >
        <button
          class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          @click="close"
        >
          <UIcon name="i-heroicons-x-mark-20-solid" class="w-6 h-6" />
        </button>
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Edit profile
        </h2>
        <UButton
          size="sm"
          :loading="loading"
          :disabled="!hasChanges || hasValidationErrors"
          class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveProfile"
        >
          Save
        </UButton>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- Banner and Avatar Section -->
        <div class="relative">
          <!-- Banner -->
          <div
            class="relative h-32 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden"
          >
            <button
              class="w-full h-full flex items-center justify-center group cursor-pointer"
              @click="triggerBannerUpload"
            >
              <img
                v-if="bannerUrl"
                :src="bannerUrl"
                alt="Banner"
                class="w-full h-full object-cover"
                crossorigin="anonymous"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
              </div>
              <!-- Hover overlay -->
              <div
                class="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200"
              />
            </button>
            <button
              class="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition"
              @click="triggerBannerUpload"
            >
              <UIcon
                name="i-heroicons-camera-20-solid"
                class="w-4 h-4 text-white"
              />
            </button>
          </div>

          <!-- Avatar -->
          <div class="absolute -bottom-8 left-4">
            <div class="relative">
              <button
                class="w-16 h-16 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden group cursor-pointer"
                @click="triggerAvatarUpload"
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="w-full h-full object-cover"
                  crossorigin="anonymous"
                >
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <span class="text-white font-bold text-xl">{{
                    avatarInitial
                  }}</span>
                </div>
                <!-- Hover overlay -->
                <div
                  class="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-full"
                />
              </button>
              <button
                class="absolute -bottom-1 -right-1 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition"
                @click="triggerAvatarUpload"
              >
                <UIcon
                  name="i-heroicons-camera-20-solid"
                  class="w-3 h-3 text-white"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Hidden File Inputs -->
        <input
          ref="avatarFileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleAvatarFileSelect"
        >
        <input
          ref="bannerFileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleBannerFileSelect"
        >

        <!-- Profile Fields -->
        <div class="space-y-4 mt-8">
          <!-- Display Name -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Name
            </label>
            <input
              v-model="form.displayName"
              type="text"
              placeholder="Enter your display name"
              maxlength="50"
              class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              @input="validateDisplayName"
            >
            <div class="flex justify-between items-center mt-1">
              <div v-if="displayNameError" class="text-red-500 text-xs">
                {{ displayNameError }}
              </div>
              <div class="text-xs ml-auto" :class="form.displayName.length > 45 ? 'text-orange-500' : 'text-zinc-500'">
                {{ form.displayName.length }} / 50
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Bio
            </label>
            <div class="relative">
              <textarea
                v-model="form.bio"
                placeholder="Tell us about yourself"
                maxlength="160"
                rows="3"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
              />
              <div class="absolute bottom-2 right-2 text-xs" :class="form.bio.length > 150 ? 'text-orange-500' : 'text-zinc-500'">
                {{ form.bio.length }} / 160
              </div>
            </div>
          </div>

          <!-- Location -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Location
            </label>
            <input
              v-model="form.location"
              type="text"
              placeholder="Where are you based?"
              maxlength="30"
              class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              @input="validateLocation"
            >
            <div class="flex justify-between items-center mt-1">
              <div v-if="locationError" class="text-red-500 text-xs">
                {{ locationError }}
              </div>
              <div class="text-xs ml-auto" :class="form.location.length > 25 ? 'text-orange-500' : 'text-zinc-500'">
                {{ form.location.length }} / 30
              </div>
            </div>
          </div>

          <!-- Website -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Website
            </label>
            <input
              v-model="form.website"
              type="url"
              placeholder="https://yourwebsite.com"
              maxlength="100"
              class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              @blur="formatWebsiteUrl"
            >
            <div class="flex justify-between items-center mt-1">
              <div v-if="websiteError" class="text-red-500 text-xs">
                {{ websiteError }}
              </div>
              <div class="text-xs ml-auto" :class="form.website.length > 90 ? 'text-orange-500' : 'text-zinc-500'">
                {{ form.website.length }} / 100
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <LoadingOverlay
    :show="uploadLoading"
    :title="uploadTitle"
    :message="uploadMessage"
    :show-progress="true"
    :progress="uploadProgress"
    :show-cancel="false"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { canisterService } from '@/services/CanisterService'
  import { appCacheService } from '@/services/AppCacheService'
  import LoadingOverlay from './LoadingOverlay.vue'

  const auth = useAuthStore()
  const show = ref(false)
  const loading = ref(false)
  const error = ref('')
  const websiteError = ref('')
  const displayNameError = ref('')
  const locationError = ref('')

  // Upload loading states
  const uploadLoading = ref(false)
  const uploadTitle = ref('')
  const uploadMessage = ref('')
  const uploadProgress = ref(0)

  // Upload modal states
  const showAvatarUploader = ref(false)
  const showBannerUploader = ref(false)

  // Force recomputation of avatar/banner URLs when profile updates
  const profileUpdateTrigger = ref(0)

  // Form data
  const form = ref({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatarUrl: '',
    bannerUrl: '',
  })

  // User profile data
  const userProfile = computed(() => auth.userProfile)

  // Avatar initial (first letter of username)
  const avatarInitial = computed(() => {
    if (!userProfile.value?.username) return 'U'
    return userProfile.value.username.charAt(0).toUpperCase()
  })

  // Avatar and banner URLs - convert file paths to full URLs with cache busting
  const avatarUrl = computed(() => {
    // Force recomputation when profile updates
    void profileUpdateTrigger.value

    const avatarPath = userProfile.value?.avatar_url?.[0]
    if (!avatarPath) return null

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      return avatarPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(avatarPath)
    const timestamp = Date.now()
    return `${baseUrl}?t=${timestamp}&v=${profileUpdateTrigger.value}&trigger=${Date.now()}`
  })

  const bannerUrl = computed(() => {
    // Force recomputation when profile updates
    void profileUpdateTrigger.value

    const bannerPath = userProfile.value?.banner_url?.[0]
    if (!bannerPath) return null

    // If it's already a full URL, return as is
    if (bannerPath.startsWith('http')) {
      return bannerPath
    }

    // Convert file path to full URL with cache busting
    const baseUrl = canisterService.getAssetUrl(bannerPath)
    const timestamp = Date.now()
    return `${baseUrl}?t=${timestamp}&v=${profileUpdateTrigger.value}&trigger=${Date.now()}`
  })

  // Check if form has validation errors
  const hasValidationErrors = computed(() => {
    return !!(displayNameError.value || locationError.value || websiteError.value)
  })

  // Check if form has changes
  const hasChanges = computed(() => {
    if (!userProfile.value) return false

    return (
      form.value.displayName !== (userProfile.value.display_name?.[0] || '') ||
      form.value.bio !== (userProfile.value.bio?.[0] || '') ||
      form.value.location !== (userProfile.value.location?.[0] || '') ||
      form.value.website !== (userProfile.value.website?.[0] || '') ||
      form.value.avatarUrl !== (userProfile.value.avatar_url?.[0] || '') ||
      form.value.bannerUrl !== (userProfile.value.banner_url?.[0] || '')
    )
  })

  // Validate display name
  const validateDisplayName = () => {
    displayNameError.value = ''
    
    if (form.value.displayName.length > 50) {
      displayNameError.value = 'Display name must be 50 characters or less'
    }
  }

  // Validate location
  const validateLocation = () => {
    locationError.value = ''
    
    if (form.value.location.length > 30) {
      locationError.value = 'Location must be 30 characters or less'
    }
  }

  // Format website URL to ensure it starts with https://
  const formatWebsiteUrl = () => {
    websiteError.value = ''
    
    if (!form.value.website.trim()) {
      return
    }

    const website = form.value.website.trim()
    
    // Check length first
    if (website.length > 100) {
      websiteError.value = 'Website must be 100 characters or less'
      return
    }
    
    // If it already starts with http:// or https://, validate it
    if (website.startsWith('http://') || website.startsWith('https://')) {
      // If it starts with http://, suggest using https://
      if (website.startsWith('http://')) {
        websiteError.value = 'Consider using https:// for better security'
      }
      return
    }
    
    // If it doesn't start with a protocol, add https://
    if (website && !website.startsWith('http')) {
      const newUrl = `https://${website}`
      if (newUrl.length <= 100) {
        form.value.website = newUrl
      } else {
        websiteError.value = 'Website URL is too long'
      }
    }
  }

  // Initialize form with current profile data
  const initializeForm = () => {
    if (!userProfile.value) return

    form.value = {
      displayName: userProfile.value.display_name?.[0] || '',
      bio: userProfile.value.bio?.[0] || '',
      location: userProfile.value.location?.[0] || '',
      website: userProfile.value.website?.[0] || '',
      avatarUrl: userProfile.value.avatar_url?.[0] || '', // Store file path, not full URL
      bannerUrl: userProfile.value.banner_url?.[0] || '', // Store file path, not full URL
    }
  }

  // Public API
  const open = () => {
    show.value = true
    initializeForm()
    error.value = ''
    websiteError.value = ''
    displayNameError.value = ''
    locationError.value = ''
  }

  const close = () => {
    show.value = false
    error.value = ''
    websiteError.value = ''
    displayNameError.value = ''
    locationError.value = ''
  }

  // File input refs
  const avatarFileInput = ref<HTMLInputElement>()
  const bannerFileInput = ref<HTMLInputElement>()

  // Trigger file selection
  const triggerAvatarUpload = () => {
    avatarFileInput.value?.click()
  }

  const triggerBannerUpload = () => {
    bannerFileInput.value?.click()
  }

  // Handle file selection
  const handleAvatarFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // Check if canister service is initialized
    if (!auth.canisterInitialized) {
      handleUploadError(
        'Canister service not initialized. Please try logging in again.'
      )
      return
    }

    // Show loading overlay
    uploadLoading.value = true
    uploadTitle.value = 'Uploading Avatar'
    uploadMessage.value = 'Processing and uploading your avatar...'
    uploadProgress.value = 0

    try {
      // Process image
      uploadProgress.value = 10
      uploadMessage.value = 'Processing image...'
      const imageService = await import(
        '@/services/ImageProcessingService'
      ).then(m => m.getImageProcessingService())
      const processedImage = await imageService.processAvatar(file)

      // Convert to bytes
      uploadProgress.value = 20
      uploadMessage.value = 'Preparing upload...'
      const arrayBuffer = await processedImage.blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)

      // Calculate hash
      uploadProgress.value = 30
      uploadMessage.value = 'Calculating file hash...'
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fileHash = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Generate file path
      const filePath = `/assets/avatar/${auth.principal}.webp`

      // Initialize upload
      uploadProgress.value = 40
      uploadMessage.value = 'Initializing upload...'
      await canisterService.initUpload(
        filePath,
        BigInt(bytes.length),
        BigInt(1024 * 1024),
        fileHash
      )

      // Upload chunks
      const chunkSize = 1024 * 1024
      const totalChunks = Math.ceil(bytes.length / chunkSize)

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, bytes.length)
        const chunk = bytes.slice(start, end)

        await canisterService.storeChunk(BigInt(i), Array.from(chunk), filePath)
      }

      // Finalize upload
      uploadProgress.value = 80
      uploadMessage.value = 'Finalizing upload...'
      const url = await canisterService.finalizeUpload(filePath)

      uploadProgress.value = 90
      uploadMessage.value = 'Updating profile...'
      await handleAvatarUploadSuccess(url)

      uploadProgress.value = 100
      uploadMessage.value = 'Upload complete!'

      // Hide loading overlay after a brief delay
      setTimeout(() => {
        uploadLoading.value = false
      }, 500)
    } catch (error) {
      uploadLoading.value = false
      handleUploadError(
        error instanceof Error ? error.message : 'Upload failed'
      )
    }

    // Reset file input
    if (avatarFileInput.value) {
      avatarFileInput.value.value = ''
    }
  }

  const handleBannerFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // Check if canister service is initialized
    if (!auth.canisterInitialized) {
      handleUploadError(
        'Canister service not initialized. Please try logging in again.'
      )
      return
    }

    // Show loading overlay
    uploadLoading.value = true
    uploadTitle.value = 'Uploading Banner'
    uploadMessage.value = 'Processing and uploading your banner...'
    uploadProgress.value = 0

    try {
      // Process image
      uploadProgress.value = 10
      uploadMessage.value = 'Processing image...'
      const imageService = await import(
        '@/services/ImageProcessingService'
      ).then(m => m.getImageProcessingService())
      const processedImage = await imageService.processBanner(file)

      // Convert to bytes
      uploadProgress.value = 20
      uploadMessage.value = 'Preparing upload...'
      const arrayBuffer = await processedImage.blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)

      // Calculate hash
      uploadProgress.value = 30
      uploadMessage.value = 'Calculating file hash...'
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fileHash = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Generate file path
      const filePath = `/assets/banner/${auth.principal}.webp`

      // Initialize upload
      uploadProgress.value = 40
      uploadMessage.value = 'Initializing upload...'
      await canisterService.initUpload(
        filePath,
        BigInt(bytes.length),
        BigInt(1024 * 1024),
        fileHash
      )

      // Upload chunks
      uploadProgress.value = 50
      uploadMessage.value = 'Uploading chunks...'
      const chunkSize = 1024 * 1024
      const totalChunks = Math.ceil(bytes.length / chunkSize)

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, bytes.length)
        const chunk = bytes.slice(start, end)

        await canisterService.storeChunk(BigInt(i), Array.from(chunk), filePath)

        // Update progress for each chunk
        const chunkProgress = 50 + ((i + 1) / totalChunks) * 30
        uploadProgress.value = Math.round(chunkProgress)
      }

      // Finalize upload
      uploadProgress.value = 80
      uploadMessage.value = 'Finalizing upload...'
      const url = await canisterService.finalizeUpload(filePath)

      uploadProgress.value = 90
      uploadMessage.value = 'Updating profile...'
      await handleBannerUploadSuccess(url)

      uploadProgress.value = 100
      uploadMessage.value = 'Upload complete!'

      // Hide loading overlay after a brief delay
      setTimeout(() => {
        uploadLoading.value = false
      }, 500)
    } catch (error) {
      uploadLoading.value = false
      handleUploadError(
        error instanceof Error ? error.message : 'Upload failed'
      )
    }

    // Reset file input
    if (bannerFileInput.value) {
      bannerFileInput.value.value = ''
    }
  }

  // Handle avatar upload success
  const handleAvatarUploadSuccess = async (filePath: string) => {
    try {
      console.log('Avatar upload success, file path:', filePath)
      // Get the assets canister URL for the asset
      const assetUrl = canisterService.getAssetUrl(filePath)
      console.log('Generated asset URL:', assetUrl)

      // Update backend with new avatar URL (store the file path, not the full URL)
      const updatedProfile = await canisterService.updateAvatar(filePath)

      showAvatarUploader.value = false

      // Update auth store with latest profile
      if (updatedProfile) {
        auth.userProfile = updatedProfile

        // Invalidate cache for this user to ensure real-time updates
        appCacheService.invalidateUserCache(updatedProfile)

        // Force recomputation of avatar/banner URLs
        profileUpdateTrigger.value++

        // Re-initialize form with updated profile data
        initializeForm()
      }

      // Show success message
      const toast = useToast()
      toast.add({
        title: 'Avatar Updated',
        description: 'Your avatar has been uploaded successfully.',
        color: 'success',
      })
    } catch (error) {
      console.error('Failed to update avatar:', error)
      const toast = useToast()
      toast.add({
        title: 'Update Failed',
        description: 'Failed to update your profile with the new avatar.',
        color: 'error',
      })
    }
  }

  // Handle banner upload success
  const handleBannerUploadSuccess = async (filePath: string) => {
    try {
      console.log('Banner upload success, file path:', filePath)
      // Get the assets canister URL for the asset
      const assetUrl = canisterService.getAssetUrl(filePath)
      console.log('Generated asset URL:', assetUrl)

      // Update backend with new banner URL (store the file path, not the full URL)
      const updatedProfile = await canisterService.updateBanner(filePath)

      showBannerUploader.value = false

      // Update auth store with latest profile
      if (updatedProfile) {
        auth.userProfile = updatedProfile

        // Invalidate cache for this user to ensure real-time updates
        appCacheService.invalidateUserCache(updatedProfile)

        // Force recomputation of avatar/banner URLs
        profileUpdateTrigger.value++

        // Re-initialize form with updated profile data
        initializeForm()
      }

      // Show success message
      const toast = useToast()
      toast.add({
        title: 'Banner Updated',
        description: 'Your banner has been uploaded successfully.',
        color: 'success',
      })
    } catch (error) {
      console.error('Failed to update banner:', error)
      const toast = useToast()
      toast.add({
        title: 'Update Failed',
        description: 'Failed to update your profile with the new banner.',
        color: 'error',
      })
    }
  }

  // Handle upload error
  const handleUploadError = (errorMessage: string) => {
    const toast = useToast()
    toast.add({
      title: 'Upload Failed',
      description: errorMessage,
      color: 'error',
    })
  }

  // Save profile
  const saveProfile = async () => {
    if (!hasChanges.value) return

    // Clear all errors first
    error.value = ''
    websiteError.value = ''
    displayNameError.value = ''
    locationError.value = ''

    // Validate all fields before saving
    validateDisplayName()
    validateLocation()
    
    if (form.value.website.trim()) {
      formatWebsiteUrl()
      // Additional validation to ensure the URL is properly formatted
      if (!form.value.website.startsWith('https://') && !form.value.website.startsWith('http://')) {
        websiteError.value = 'Website URL must start with https://'
      }
    }

    // Check for any validation errors
    if (hasValidationErrors.value) {
      error.value = 'Please fix the validation errors before saving'
      return
    }

    // Final backend validation checks to prevent submission errors
    if (form.value.displayName.length > 50) {
      displayNameError.value = 'Display name must be 50 characters or less'
      return
    }
    
    if (form.value.bio.length > 160) {
      error.value = 'Bio must be 160 characters or less'
      return
    }
    
    if (form.value.location.length > 30) {
      locationError.value = 'Location must be 30 characters or less'
      return
    }
    
    if (form.value.website.length > 100) {
      websiteError.value = 'Website must be 100 characters or less'
      return
    }

    loading.value = true

    try {
      // Create update object with all required fields
      const update = {
        display_name: form.value.displayName
          ? ([form.value.displayName] as [string])
          : ([] as []),
        bio: form.value.bio ? ([form.value.bio] as [string]) : ([] as []),
        location: form.value.location
          ? ([form.value.location] as [string])
          : ([] as []),
        website: form.value.website
          ? ([form.value.website] as [string])
          : ([] as []),
        avatar_url: form.value.avatarUrl
          ? ([form.value.avatarUrl] as [string])
          : ([] as []),
        banner_url: form.value.bannerUrl
          ? ([form.value.bannerUrl] as [string])
          : ([] as []),
        // Keep existing wallet addresses (don't allow editing them)
        evm_address: userProfile.value?.evm_address || ([] as []),
        bitcoin_address: userProfile.value?.bitcoin_address || ([] as []),
        solana_address: userProfile.value?.solana_address || ([] as []),
      }

      // Update profile
      const updatedProfile = await canisterService.updateProfile(update)

      // Update auth store
      auth.userProfile = updatedProfile

      // Invalidate cache for this user to ensure real-time updates
      appCacheService.invalidateUserCache(updatedProfile)

      // Force recomputation of avatar/banner URLs
      profileUpdateTrigger.value++

      // Re-initialize form with updated profile data
      initializeForm()

      // Close modal
      close()

      // Show success message
      const toast = useToast()
      toast.add({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        color: 'success',
      })
    } catch (err: unknown) {
      console.error('Failed to update profile:', err)
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to update profile. Please try again.'
    } finally {
      loading.value = false
    }
  }

  defineExpose({ open, close })
</script>
