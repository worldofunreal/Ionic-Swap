export default defineEventHandler(async event => {
  try {
    const query = getQuery(event)
    const symbol = query.symbol as string
    const interval = query.interval as string
    const limit = query.limit as string
    const endTime = query.endTime as string

    if (!symbol || !interval || !limit) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Symbol, interval, and limit parameters are required',
      })
    }

    // Determine if we're in production (using SSH tunnel) or local development
    const isProduction = process.env.NODE_ENV === 'production'
    let binanceUrl = isProduction 
      ? `https://127.0.0.1:9443/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`

    // Add endTime parameter if provided (for fetching historical data)
    if (endTime) {
      binanceUrl += `&endTime=${endTime}`
    }

    const response = await fetch(binanceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(isProduction && { 'Host': 'api.binance.com' })
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Binance API error: ${response.statusText}`,
      })
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Binance klines API error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch klines data',
    })
  }
})
