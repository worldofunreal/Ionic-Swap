import { computed, ref } from 'vue'
import introJs from 'intro.js'
import 'intro.js/introjs.css'
import type { Tour } from 'intro.js/src/packages/tour'
import type { TourStep } from 'intro.js/src/packages/tour/steps'

export const useOnboarding = () => {
  const introInstance = ref<Tour | null>(null)
  // Check if user has completed onboarding
  const hasCompletedOnboarding = ref(false)

  // Check if onboarding should be shown (first-time visitor)
  const shouldShowOnboarding = computed(() => {
    if (import.meta.client) {
      return !localStorage.getItem('nftropoly-onboarding-completed')
    }
    return false
  })

  // Mark onboarding as completed
  const completeOnboarding = () => {
    if (import.meta.client) {
      localStorage.setItem('nftropoly-onboarding-completed', 'true')
      hasCompletedOnboarding.value = true
    }
  }



  // Initialize onboarding state
  const initOnboarding = () => {
    if (import.meta.client) {
      hasCompletedOnboarding.value = !!localStorage.getItem(
        'nftropoly-onboarding-completed'
      )
    }
  }

  // Initialize intro.js
  const initTour = (tourName: string) => {
    switch (tourName) {
      case 'login':
        break
      case 'registration': {
        const loginPanelElement = document.getElementById('login-panel')

        if (!loginPanelElement) return
        const tourSteps: Partial<
          TourStep & {
            onBeforeChange?: (
              targetElement?: HTMLElement,
              direction?: 'forward' | 'backward'
            ) => boolean | Promise<boolean>
          }
        >[] = [
          {
            // element: 'body',
            intro:
              "Welcome to NFTropoly! Your gateway to the world of NFTs on the Internet Computer. Let's explore the key features together.",
            // position: 'center',
          },
          {
            element: '.connect-wallet-btn',
            intro:
              'Start by connecting your wallet to browse, buy, and sell NFTs securely using Internet Identity, MetaMask, Phantom, Plug, or Google.',
            position: 'bottom',
            onBeforeChange: async (_targetElement, direction) => {
              if (direction !== 'forward') loginPanelElement.classList.add('hidden')
              return true
            },
          },
          {
            element: '#internet-identity-btn',
            intro:
              'Connect with Internet Identity for secure, passwordless authentication on the Internet Computer.',
            // position: 'bottom',
            disableInteraction: true,
            onBeforeChange: async (_targetElement, direction) => {
              if (direction === 'forward') loginPanelElement.classList.remove('hidden')
              return true
            },
          },
          {
            element: '#metamask-btn',
            intro:
              "Click here to connect with MetaMask. You'll need to sign a message to verify your wallet.",
            position: 'bottom',
            disableInteraction: true,
          },
          {
            element: '#phantom-btn',
            intro: 'Connect with Phantom wallet for Solana-based transactions.',
            // position: 'bottom',
            disableInteraction: true,
          },
          {
            element: '#plug-btn',
            intro: 'Use Plug wallet for Internet Computer (ICP) transactions.',
            // position: 'bottom',
            disableInteraction: true,
          },
          {
            element: '.login-panel-buttons',
            intro:
              "Let's start by connecting your wallet. We support multiple options for your convenience.",
            position: 'left',
            disableInteraction: false,
            onBeforeChange: async (_targetElement, direction) => {
              if (direction !== 'forward') return false
              return true
            },
          },
          {
            element: '.registration-modal',
            intro:
              'Complete your profile setup! Choose a username, customize your avatar, and set your privacy preferences to get started.',
            position: 'bottom',
          },
          {
            element: '#icp-principal',
            intro:
              'This is your Internet Computer (ICP) principal address. It is used to send and receive ICP tokens.',
            position: 'bottom',
          },
          {
            element: '#evm-address',
            intro:
              'This is your Ethereum (EVM) address. It is used to send and receive Ethereum tokens.',
            position: 'bottom',
          },
          {
            element: '#sol-address',
            intro:
              'This is your Solana address. It is used to send and receive Solana tokens.',
            position: 'bottom',
          },
          {
            element: '#btc-address',
            intro:
              'This is your Bitcoin address. It is used to send and receive Bitcoin tokens.',
            position: 'bottom',
          },
          {
            element: '#username-input',
            intro: 'Enter your username to complete your registration.',
            position: 'bottom',
            disableInteraction: false,
          },
          {
            element: '.create-profile-btn',
            intro:
              'Click "Create Profile" to complete your registration and start exploring NFTropoly!',
            position: 'top',
            onBeforeChange: async (_targetElement, direction) => {
              if (direction !== 'forward') return false
              const usernameStatus = document.getElementById('username-status')
              if (usernameStatus?.textContent?.includes('available'))
                return true
              return false
            },
          },
          {
            element: 'body',
            intro:
              'Congratulations! You have successfully created your profile. You can now start exploring NFTropoly!',
            position: 'bottom',
          },
        ]

        // Only run on client side
        if (import.meta.server) return

        try {
          introInstance.value = introJs.tour()
          const intro = introInstance.value

          // Configure the tour
          intro.setOptions({
            steps: tourSteps,
            disableInteraction: false,
            exitOnOverlayClick: false,
            nextLabel: 'Next',
            hidePrev: true,
            dontShowAgain: false,
            doneLabel: 'Done',
            tooltipClass: 'custom-tooltip',
            highlightClass: 'custom-highlight',
            scrollToElement: true,
            scrollPadding: 50,
            overlayOpacity: 0.5,
            helperElementPadding: 10,
          })

          intro.onBeforeChange(
            async (targetElement, currentStep, direction) => {
              return (
                (await tourSteps[currentStep]?.onBeforeChange?.(
                  targetElement,
                  direction
                )) ?? true
              )
            }
          )

          intro.onAfterChange(() => {
            // Update styles after each step change to ensure new elements are styled
            setTimeout(() => {
              updateTourStyles()
            }, 50)
          })

          intro.onStart(() => {
            setTimeout(() => {
              const helperLayer = document.querySelector('.introjs-helperLayer')
              if (!helperLayer) return
              helperLayer.addEventListener('click', forwardEventListeners)
              helperLayer.addEventListener('mouseenter', forwardEventListeners)
              helperLayer.addEventListener('mouseleave', forwardEventListeners)
              helperLayer.addEventListener('mousedown', forwardEventListeners)
              helperLayer.addEventListener('mouseup', forwardEventListeners)
              
              // Update tour styles to match current theme
              updateTourStyles()
            }, 100)
          })
        } catch (error) {
          console.error('Failed to initialize tour:', error)
        }
        break
      }
    }
  }

  const forwardEventListeners = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!(event instanceof MouseEvent)) return
    const helperLayer = event.target as HTMLElement
    const currentStep = introInstance.value?.getCurrentStep()
    const tourSteps = introInstance.value?.getSteps()
    if (!helperLayer || !tourSteps) return
    const forwardListener = !(
      tourSteps[currentStep || 0]?.disableInteraction ?? false
    )
    if (!forwardListener) return
    const highlightedElement = document.elementsFromPoint(
      event.clientX,
      event.clientY
    )[2]

    highlightedElement?.dispatchEvent(
      new Event(event.type, {
        bubbles: true,
        cancelable: true,
      })
    )

    if (event.type === 'click') {
      if (!(highlightedElement instanceof HTMLInputElement))
        introInstance.value?.nextStep()
      else {
        highlightedElement.focus()
      }
    }

    // Make helper layer look clickable
    ;(helperLayer as HTMLElement).style.cursor = 'pointer'
    ;(helperLayer as HTMLElement).style.pointerEvents = 'auto'
  }

  // Start the tour
  const startTour = async (tourName: string) => {
    initTour(tourName)
    if (introInstance.value) {
      introInstance.value.start()
    }
  }

  // Stop the tour
  const stopTour = () => {
    if (introInstance.value) {
      introInstance.value.exit()
    }
  }

  // Update tour styles when theme changes
  const updateTourStyles = () => {
    if (!introInstance.value || !import.meta.client) return

    // Get primary color from current theme
    const savedTheme = localStorage.getItem('ionic-swap-color-theme')
    let primaryColor = '#84cc16' // default fallback

    if (savedTheme) {
      const themeColors = {
        emerald: '#10b981',
        pink: '#ec4899', 
        red: '#ef4444',
        orange: '#f97316',
        sky: '#0ea5e9',
        fuchsia: '#a855f7',
        purple: '#8b5cf6',
        teal: '#14b8a6'
      }
      if (themeColors[savedTheme as keyof typeof themeColors]) {
        primaryColor = themeColors[savedTheme as keyof typeof themeColors]
      }
    }

    // Update Intro.js button styles
    const buttons = document.querySelectorAll('.introjs-button')
    buttons.forEach(button => {
      if (button instanceof HTMLElement) {
        button.style.setProperty('background', primaryColor, 'important')
        button.style.setProperty('color', 'white', 'important')
        button.style.setProperty('border', 'none', 'important')
        button.style.setProperty('border-radius', '6px', 'important')
        button.style.setProperty('padding', '8px 16px', 'important')
        button.style.setProperty('font-size', '14px', 'important')
        button.style.setProperty('font-weight', '500', 'important')
        button.style.setProperty('cursor', 'pointer', 'important')
        button.style.setProperty('transition', 'all 0.2s ease-in-out', 'important')
      }
    })

    // Update close button (skip button) - smaller and rounded with theme color
    const closeButtons = document.querySelectorAll('.introjs-skipbutton')
    closeButtons.forEach(button => {
      if (button instanceof HTMLElement) {
        button.style.setProperty('background', primaryColor, 'important')
        button.style.setProperty('color', 'white', 'important')
        button.style.setProperty('border', 'none', 'important')
        button.style.setProperty('border-radius', '20px', 'important')
        button.style.setProperty('padding', '6px 12px', 'important')
        button.style.setProperty('font-size', '12px', 'important')
        button.style.setProperty('font-weight', '500', 'important')
        button.style.setProperty('cursor', 'pointer', 'important')
        button.style.setProperty('transition', 'all 0.2s ease-in-out', 'important')
        button.style.setProperty('display', 'flex', 'important')
        button.style.setProperty('align-items', 'center', 'important')
        button.style.setProperty('justify-content', 'center', 'important')
        button.style.setProperty('min-width', '24px', 'important')
        button.style.setProperty('min-height', '24px', 'important')
      }
    })

    // Update step indicators - restore original styling, only change active color
    const stepIndicators = document.querySelectorAll('.introjs-bullets li a')
    stepIndicators.forEach((indicator, index) => {
      if (indicator instanceof HTMLElement) {
        const currentStep = introInstance.value?.getCurrentStep() || 0
        const isActive = index === currentStep
        
        // Restore original styling
        indicator.style.setProperty('border-radius', '50%', 'important')
        indicator.style.setProperty('width', '12px', 'important')
        indicator.style.setProperty('height', '12px', 'important')
        indicator.style.setProperty('display', 'inline-block', 'important')
        indicator.style.setProperty('margin', '0 4px', 'important')
        indicator.style.setProperty('cursor', 'pointer', 'important')
        indicator.style.setProperty('transition', 'all 0.2s ease-in-out', 'important')
        indicator.style.setProperty('border', `2px solid ${primaryColor}`, 'important')
        
        if (isActive) {
          indicator.style.setProperty('background', primaryColor, 'important')
          indicator.style.setProperty('opacity', '1', 'important')
        } else {
          indicator.style.setProperty('background', 'transparent', 'important')
          indicator.style.setProperty('opacity', '0.5', 'important')
        }
      }
    })

    // Update highlight styles
    const highlights = document.querySelectorAll('.introjs-helperLayer')
    highlights.forEach(highlight => {
      if (highlight instanceof HTMLElement) {
        highlight.style.setProperty('box-shadow', `0 0 0 4px ${primaryColor}`, 'important')
        highlight.style.setProperty('border-radius', '8px', 'important')
        highlight.style.setProperty('opacity', '0.5', 'important')
      }
    })

    // Update tooltip styles for gradient tooltips
    const tooltips = document.querySelectorAll('.introjs-tooltip')
    tooltips.forEach(tooltip => {
      if (tooltip instanceof HTMLElement) {
        const tooltipClass = tooltip.className
        if (tooltipClass.includes('welcome-tooltip') || tooltipClass.includes('registration-tooltip')) {
          tooltip.style.setProperty('background', `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 100%)`, 'important')
          tooltip.style.setProperty('color', 'white', 'important')
        }
      }
    })
  }

  return {
    hasCompletedOnboarding,
    shouldShowOnboarding,
    completeOnboarding,
    initOnboarding,
    startTour,
    stopTour,
    initTour,
    updateTourStyles,
  }
}
