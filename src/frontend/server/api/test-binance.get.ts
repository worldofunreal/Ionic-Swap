export default defineEventHandler(async (event) => {
  try {
    // Test with a simple single symbol first
    const testUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT"]'
    console.log('Testing Binance API with URL:', testUrl)
    
    const response = await fetch(testUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Binance API test error:', response.status, errorText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    console.log('Binance API test success:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Binance API test error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
