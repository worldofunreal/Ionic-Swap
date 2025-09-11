import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export default defineNuxtPlugin(nuxtApp => {
  if (import.meta.server) return

  const config = useRuntimeConfig()
  const gtmId = config.public.GTM_ID || 'GTM-MGJCRHQ3'

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []

  // Load Google Tag Manager script
  const script = document.createElement('script')
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `
  document.head.appendChild(script)

  // Send page view on initial load
  nuxtApp.hook('app:mounted', () => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  })

  // Send page view on route changes
  nuxtApp.hook('page:finish', () => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  })
})
