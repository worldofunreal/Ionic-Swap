import { useNuxtApp } from '#imports'

export const useTracking = () => {
  const {
    $trackInteraction,
    $trackButtonClick,
    $trackFormSubmit,
    $trackWalletConnect,
    $trackNavigation,
    $trackError,
  } = useNuxtApp()

  // Hackathon-specific tracking functions
  const trackHackathonEvent = (eventName: string, data?: Record<string, unknown>) => {
    $trackInteraction(`Hackathon: ${eventName}`, {
      ...data,
      hackathonPhase: 'development',
      timestamp: Date.now(),
    })
  }

  const trackUserJourney = (step: string, data?: Record<string, unknown>) => {
    $trackInteraction('User Journey', {
      step,
      ...data,
      timestamp: Date.now(),
    })
  }

  const trackFeatureUsage = (feature: string, action: string, data?: Record<string, unknown>) => {
    $trackInteraction('Feature Usage', {
      feature,
      action,
      ...data,
      timestamp: Date.now(),
    })
  }

  const trackPerformance = (metric: string, value: number, data?: Record<string, unknown>) => {
    $trackInteraction('Performance', {
      metric,
      value,
      ...data,
      timestamp: Date.now(),
    })
  }

  const trackError = (error: string, context?: Record<string, unknown>) => {
    $trackError(error, {
      context,
      timestamp: Date.now(),
    })
  }

  const trackWalletAction = (
    action: string,
    walletType: string,
    data?: Record<string, unknown>
  ) => {
    $trackWalletConnect(walletType, {
      action,
      ...data,
      timestamp: Date.now(),
    })
  }

  const trackNavigation = (
    from: string,
    to: string,
    method: string = 'click'
  ) => {
    $trackNavigation(from, to, {
      method,
      timestamp: Date.now(),
    })
  }

  const trackButtonClick = (
    buttonName: string,
    location: string,
    data?: Record<string, unknown>
  ) => {
    $trackButtonClick(buttonName, {
      location,
      ...data,
      timestamp: Date.now(),
    })
  }

  const trackFormAction = (
    formName: string,
    action: 'submit' | 'start' | 'abandon',
    data?: Record<string, unknown>
  ) => {
    $trackFormSubmit(formName, {
      action,
      ...data,
      timestamp: Date.now(),
    })
  }

  // Session tracking
  const trackSessionStart = () => {
    $trackInteraction('Session Start', {
      sessionId: Date.now().toString(),
      timestamp: Date.now(),
    })
  }

  const trackSessionEnd = (duration: number) => {
    $trackInteraction('Session End', {
      duration,
      timestamp: Date.now(),
    })
  }

  // User engagement tracking
  const trackEngagement = (
    type: 'scroll' | 'click' | 'hover' | 'focus',
    data?: Record<string, unknown>
  ) => {
    $trackInteraction('User Engagement', {
      type,
      ...data,
      timestamp: Date.now(),
    })
  }

  // Conversion tracking
  const trackConversion = (goal: string, value?: number, data?: Record<string, unknown>) => {
    $trackInteraction('Conversion', {
      goal,
      value,
      ...data,
      timestamp: Date.now(),
    })
  }

  return {
    // Core tracking
    trackInteraction: $trackInteraction,
    trackButtonClick,
    trackFormAction,
    trackWalletAction,
    trackNavigation,
    trackError,

    // Hackathon-specific
    trackHackathonEvent,
    trackUserJourney,
    trackFeatureUsage,
    trackPerformance,

    // Session tracking
    trackSessionStart,
    trackSessionEnd,

    // Engagement tracking
    trackEngagement,

    // Conversion tracking
    trackConversion,
  }
}
