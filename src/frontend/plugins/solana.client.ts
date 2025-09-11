export default defineNuxtPlugin(async () => {
  // Only load on client side
  if (import.meta.server) {
    return {
      provide: {
        solana: {
          connection: null,
          async getConnection() {
            // Return null for SSR
            return null
          },
        },
      },
    }
  }

  // Client-side: use static import
  const { Connection, clusterApiUrl } = await import('@solana/web3.js')
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

  return {
    provide: {
      solana: {
        connection,
        async getConnection() {
          return connection
        },
      },
    },
  }
})
