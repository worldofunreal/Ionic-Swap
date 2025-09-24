export default defineEventHandler(async event => {
  try {
    const query = getQuery(event)
    const symbols = query.symbols as string

    // console.log('Received symbols:', symbols)

    if (!symbols) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Symbols parameter is required',
      })
    }

    // Determine if we're in production (using SSH tunnel) or local development
    const isProduction = process.env.NODE_ENV === 'production'
    const binanceUrl = isProduction 
      ? `https://127.0.0.1:9443/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`
      : `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`
    
    // console.log('Binance URL:', binanceUrl)

    const response = await fetch(binanceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(isProduction && { 'Host': 'api.binance.com' })
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Binance API error:', response.status, errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Binance API error: ${response.statusText} - ${errorText}`,
      })
    }

    const data = await response.json()
    // console.log('Binance response:', data)

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Binance ticker API error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch ticker data: ${error.message}`,
    })
  }
})
