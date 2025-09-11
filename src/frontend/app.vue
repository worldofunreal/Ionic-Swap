<template>
  <UApp>
    <!-- Google Tag Manager (noscript) -->
    <ClientOnly>
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-MGJCRHQ3"
          height="0"
          width="0"
          style="display: none; visibility: hidden"
        />
      </noscript>
    </ClientOnly>
    <!-- End Google Tag Manager (noscript) -->

    <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <!-- Desktop Sidebar (hidden on mobile) -->
      <SidebarNav />

      <!-- Mobile Sidebar (hidden on desktop) -->
      <MobileSidebar
        :is-open="mobileSidebarOpen"
        @close="mobileSidebarOpen = false"
      />

      <!-- Main Content Wrapper -->
      <div class="flex-1 flex flex-col min-h-screen md:ml-16">
        <Header
          @toggle-mobile-sidebar="mobileSidebarOpen = !mobileSidebarOpen"
        />
        <main class="flex-1 mb-16">
          <NuxtPage />
        </main>
        <AppFooter />
      </div>
    </div>
    <LoginPanel ref="loginPanelRef" />
    <!-- Temporarily disabled for performance optimization -->
    <!-- <ClientOnly>
      <DisclaimerModal ref="disclaimerModalRef" @close="onDisclaimerClose" />
    </ClientOnly> -->
    <!-- Temporarily disabled onboarding tour until issues are resolved -->
    <!-- <ClientOnly>
      <OnboardingTour ref="onboardingTourRef" />
    </ClientOnly> -->
    <!-- <ClientOnly>
      <OnboardingTrigger />
    </ClientOnly> -->
  </UApp>
</template>

<script setup lang="ts">
  import { ref, provide, onMounted, nextTick } from 'vue'
  import { useNuxtApp } from '#imports'
  import { useAuthStore } from '@/stores/auth'
  import { useTheme } from '@/composables/useTheme'
  import SidebarNav from './components/SidebarNav.vue'
  import MobileSidebar from './components/MobileSidebar.vue'
  import Header from './components/Header.vue'
  import AppFooter from './components/AppFooter.vue'
  import LoginPanel from './components/LoginPanel.vue'
  // Temporarily disabled for performance optimization
  // import DisclaimerModal from './components/DisclaimerModal.vue'
  import OnboardingTour from './components/onBoardingTour/OnboardingTour.vue'
  import OnboardingTrigger from './components/onBoardingTour/OnboardingTrigger.vue'

  const loginPanelRef = ref<{
    open: () => void
    showRegistrationModal: () => void
  } | null>(null)
  // Temporarily disabled for performance optimization
  // const disclaimerModalRef = ref<{
  //   open: () => void
  //   close: () => void
  // } | null>(null)
  const mobileSidebarOpen = ref(false)
  const { $trackInteraction } = useNuxtApp()
  // Temporarily disabled onboarding tour until issues are resolved
  // const onboardingTourRef = ref<{
  //   startTour: () => void
  //   stopTour: () => void
  //   updateTourForRegistration: () => void
  // } | null>(null)

  // Temporarily disabled for performance optimization
  // // Handle disclaimer close event
  // const onDisclaimerClose = () => {
  //   // Start the onboarding tour after disclaimer is closed
  //   setTimeout(() => {
  //     if (onboardingTourRef?.value?.startTour) {
  //       onboardingTourRef.value.startTour()
  //     }
  //   }, 500) // Small delay to ensure smooth transition
  // }

  // Provide the login panel ref so other components can access it
  provide('loginPanelRef', loginPanelRef)
  // Temporarily disabled onboarding tour until issues are resolved
  // // Provide the onboarding tour ref for manual triggering
  // provide('onboardingTourRef', onboardingTourRef)

  // Track app initialization and key metrics
  onMounted(async () => {
    // Theme is now handled automatically by Nuxt color mode
    // No need to manually initialize

    // Temporarily disabled onboarding tour until issues are resolved
    // // Initialize onboarding
    // const { shouldShowOnboarding, startTour } = useOnboarding()

    // Restore session if available
    const auth = useAuthStore()
    const toast = useToast()

    if (auth.hasValidSession) {
      console.log('Valid session found, attempting to restore...')
      const restored = await auth.restoreSession()
      if (restored) {
        if (auth.registered) {
          console.log('Session restored successfully')
          const username = auth.userProfile?.username || 'there'
          toast.add({
            title: `Welcome back, ${username}!`,
            description: 'Great to see you again.',
            color: 'success',
          })
        } else {
          console.log('User authenticated but needs to complete registration')
          toast.add({
            title: 'Complete Registration',
            description: 'Please complete your profile registration.',
            color: 'warning',
          })
          // Show registration modal
          await nextTick()
          if (loginPanelRef.value) {
            loginPanelRef.value.showRegistrationModal()
          }
        }
      } else {
        console.log('Session restoration failed, user needs to login again')
        // Show connect wallet option when session restoration fails
        await nextTick()
        if (loginPanelRef.value) {
          loginPanelRef.value.open()
        }
      }
    }

    $trackInteraction('App Mounted', {
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now(),
    })

    // Temporarily disabled onboarding tour until issues are resolved
    // // Auto-start onboarding tour for new users
    // if (shouldShowOnboarding.value) {
    //   setTimeout(() => {
    //     startTour('registration')
    //   }, 100) // Small delay to ensure everything is loaded
    // }
  })
</script>

<style>
  /* Add any global styles or layout styles here if needed */
  /* Temporarily disabled for performance optimization */
  @import 'intro.js/minified/introjs.min.css';
</style>
