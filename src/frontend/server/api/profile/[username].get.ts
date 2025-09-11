// Simple server-side profile fetching without DFX dependencies
export default defineEventHandler(async event => {
  try {
    const username = getRouterParam(event, 'username')

    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required',
      })
    }

    // Remove @ symbol if present
    const cleanUsername = username.startsWith('@')
      ? username.slice(1)
      : username

    // Return a proper response structure to avoid useFetch warnings
    // This indicates that client-side fetching should be used
    console.log(
      'SSR API: Returning empty response, will use client-side fetching for:',
      cleanUsername
    )
    return {
      success: false,
      message: 'Client-side fetching required',
      data: null,
    }
  } catch (error: unknown) {
    console.error('Error in SSR API:', error)
    return null
  }
})
