export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const symbol = query.symbol as string
    const interval = query.interval as string
    const limit = query.limit as string
    const endTime = query.endTime as string

    if (!symbol || !interval || !limit) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Symbol, interval, and limit parameters are required'
      })
    }

    // Build Binance API URL with optional endTime parameter
    let binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    
    // Add endTime parameter if provided (for fetching historical data)
    if (endTime) {
      binanceUrl += `&endTime=${endTime}`
    }


    // Make request to Binance API
    const response = await fetch(binanceUrl)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Binance API error: ${response.statusText}`
      })
    }

    const data = await response.json()

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Binance klines API error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch klines data'
    })
  }
})
