// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
import wasm from 'vite-plugin-wasm'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@vueuse/motion/nuxt',
    '@pinia/nuxt',
  ],

  // Configure color mode to work with our localStorage approach
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    storageKey: 'ionic-swap-theme',
  },

  fonts: {
    families: [
      {
        name: 'Helvetica Neue',
        provider: 'none', // System font, no need to load from external provider
        fallbacks: ['Helvetica', 'Arial', 'sans-serif'],
      },
      {
        name: 'IBM Plex Sans',
        provider: 'google',
        fallbacks: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    ],
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Ionic Swap',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0a0c1b' },
        {
          name: 'description',
          content:
            'Ionic Swap - Cross-Chain Token Swapping with Gasless Transactions',
        },
        {
          name: 'keywords',
          content:
            'Ionic Swap, Cross-Chain, Gasless, Token Swap, DeFi, EVM, Solana, ICP, Trading, Cryptocurrency',
        },
        { name: 'robots', content: 'index, follow' },
        {
          property: 'og:title',
          content:
            'Ionic Swap - Cross-Chain Token Swapping with Gasless Transactions',
        },
        {
          property: 'og:description',
          content:
            'Ionic Swap - Cross-Chain Token Swapping with Gasless Transactions',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://ionicswap.com/' },
        { property: 'og:image', content: '/logo.svg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:title',
          content:
            'Ionic Swap - Cross-Chain Token Swapping with Gasless Transactions',
        },
        {
          name: 'twitter:description',
          content:
            'Ionic Swap - Cross-Chain Token Swapping with Gasless Transactions',
        },
        { name: 'twitter:image', content: '/logo.svg' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/logo.svg' }],
      script: [
        {
          type: 'application/ld+json',
        },
      ],
    },
  },
  vite: {
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        buffer: 'buffer',
        process: 'process/browser',
        util: 'util',
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        // Backend declarations (currently using client-side only)
        'declarations/backend': resolve(
          __dirname,
          '../../declarations/backend'
        ),
      },
    },
    optimizeDeps: {
      include: [
        'buffer',
        'process',
        'util',
        'bitcoinjs-lib',
        'ecpair',
        'tiny-secp256k1',
        'crypto-browserify',
        'stream-browserify',
        '@dfinity/principal',
        '@dfinity/agent',
        '@dfinity/candid',
        '@solana/web3.js',
        'qrcode',
      ],
      exclude: ['@microsoft/clarity'],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            bitcoin: ['bitcoinjs-lib', 'ecpair', 'tiny-secp256k1'],
            crypto: [
              'crypto-browserify',
              'stream-browserify',
              'buffer',
              'process',
              'util',
            ],
            chart: ['chart.js', 'vue-chartjs'],
            ethers: ['ethers'],
          },
        },
      },
    },
    plugins: [wasm()],
    // Ensure WASM files are properly handled
    assetsInclude: ['**/*.wasm'],
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    rollupConfig: {
      external: [
        '@dfinity/agent',
        '@dfinity/principal',
        '@dfinity/candid',
        '@dfinity/identity',
        '@dfinity/auth-client',
        '@solana/web3.js',
        '@microsoft/clarity',
      ],
    },
    nodeModulesDirs: ['../../node_modules'],
    alias: {
      buffer: 'buffer',
      process: 'process',
      util: 'util',
      // Backend declarations (currently using client-side only)
      'declarations/backend': resolve(__dirname, '../../declarations/backend'),
    },
    // Add @dfinity packages to server dependencies
    externals: {
      inline: ['@dfinity/agent', '@dfinity/principal', '@dfinity/candid'],
    },
  },
  runtimeConfig: {
    public: {
      HF_TOKEN: process.env.NUXT_PUBLIC_HF_TOKEN,
      GA_MEASUREMENT_ID:
        process.env.NUXT_PUBLIC_GA_MEASUREMENT_ID || 'G-9M4CYZTMME',
      GTM_ID: process.env.NUXT_PUBLIC_GTM_ID || 'GTM-MGJCRHQ3',
      CLARITY_PROJECT_ID:
        process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID || 'taqnz3t16k',
      network: 'local',
    },
  },
  // Optimize build for SSR
  build: {
    transpile: [
      '@dfinity/agent',
      '@dfinity/principal',
      '@dfinity/candid',
      '@dfinity/identity',
      '@dfinity/auth-client',
      'qrcode',
    ],
  },
  // Disable source maps in production for better performance
  sourcemap: process.env.NODE_ENV === 'development',
})
