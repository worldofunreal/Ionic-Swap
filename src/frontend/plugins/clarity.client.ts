import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import Clarity from '@microsoft/clarity'

/**
 * Microsoft Clarity integration (client-only)
 * - Initializes when user has granted analytics consent
 * - Provides `$clarity` for manual tagging/events
 * - Identifies authenticated users using ICP Principal and username
 */
export default defineNuxtPlugin(nuxtApp => {
  if (import.meta.server) return

  const config = useRuntimeConfig()
  const projectId = (config.public.CLARITY_PROJECT_ID as string) || 'stqeko2g9v'

  const consentKey = 'nftropoly_analytics_consent'
  const hasConsent = () => localStorage.getItem(consentKey) === 'true'

  // Initialize when consent present
  const tryInit = () => {
    if (hasConsent()) {
      try {
        Clarity.init(projectId)
      } catch {
        // ignore init error to avoid crashing app in hackathon phase
      }
    }
  }

  tryInit()

  // Listen for consent changes from UI (Dislaimer modal dispatches this)
  window.addEventListener('analytics-consent-changed', (e: Event) => {
    const detail = (e as CustomEvent<boolean>).detail
    try {
      Clarity.consent(Boolean(detail))
    } catch {
      // noop
    }
    if (detail) tryInit()
  })

  // Attempt to identify user once app is mounted and auth store is available
  nuxtApp.hook('app:mounted', async () => {
    try {
      // Use static import for auth store
      const { useAuthStore } = await import('@/stores/auth')
      const auth = useAuthStore()

      const identifyIfReady = () => {
        if (!hasConsent()) return
        const principal =
          auth.icpPrincipal || auth.getIdentity()?.getPrincipal()?.toText()
        const friendlyName =
          auth.userProfile?.username ||
          auth.userProfile?.displayName ||
          undefined
        if (principal) {
          try {
            Clarity.identify(principal, undefined, undefined, friendlyName)
          } catch {
            // noop
          }
        }
      }

      // Identify immediately if state already loaded
      identifyIfReady()

      // Watch for auth changes and identify again
      const { watch } = await import('vue')
      watch(
        () => [auth.authenticated, auth.userProfile, auth.icpPrincipal],
        () => identifyIfReady(),
        { deep: true }
      )
    } catch {
      // store not ready; ignore
    }
  })

  // Track page views and route changes
  nuxtApp.hook('page:finish', () => {
    if (!hasConsent()) return
    try {
      Clarity.setTag('page', window.location.pathname)
      Clarity.setTag('page_title', document.title)
    } catch {
      // noop
    }
  })

  // Track user interactions globally
  const trackInteraction = (event: string, data?: any) => {
    if (!hasConsent()) return
    try {
      // Use setTag for custom events since Clarity doesn't have a direct event method
      Clarity.setTag(
        event,
        JSON.stringify({
          ...data,
          timestamp: Date.now(),
          url: window.location.href,
        })
      )
    } catch {
      // noop
    }
  }

  // Provide clarity instance and tracking helpers for manual usage in components
  return {
    provide: {
      clarity: Clarity,
      trackInteraction,
      trackPageView: (pageName: string, data?: any) => {
        trackInteraction('Page View', { pageName, ...data })
      },
      trackButtonClick: (buttonName: string, data?: any) => {
        trackInteraction('Button Click', { buttonName, ...data })
      },
      trackFormSubmit: (formName: string, data?: any) => {
        trackInteraction('Form Submit', { formName, ...data })
      },
      trackWalletConnect: (walletType: string, data?: any) => {
        trackInteraction('Wallet Connect', { walletType, ...data })
      },
      trackNavigation: (from: string, to: string, data?: any) => {
        trackInteraction('Navigation', { from, to, ...data })
      },
      trackError: (error: string, data?: any) => {
        trackInteraction('Error', { error, ...data })
      },
    },
  }
})
