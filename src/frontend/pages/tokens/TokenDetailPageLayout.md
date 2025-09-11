# Token Detail and Swap Page UI Specification

## Overview

The token detail and swap page provides comprehensive information about a specific cryptocurrency token, featuring price performance charts, key market metrics, an integrated swap/buy interface, and trending tokens section. The design uses a dark theme with black/dark grey backgrounds, white text, and blue/green accent colors.

## Layout Structure

### **1. Top Navigation Bar**

Horizontal bar containing token identity and chart controls.

#### **Left Section - Token Identity**

- **Token Logo**: Circular icon with stylized token symbol (e.g., 'N' for NYM)
- **Token Name**: Large, bold text (e.g., "NYM")
- **Token Context**: Smaller text with icons showing:
  - Token symbol (e.g., "NYM")
  - Blockchain network (e.g., "ETHEREUM") with chain link icon
  - Token type (e.g., "TOKEN") with token icon

#### **Right Section - Chart Controls & Settings**

- **Timeframe Selection**: Row of pill-shaped buttons:
  - Options: "All", "1y", "30d", "7d", "1d"
  - "1d" currently selected (highlighted)
- **Chart Type Toggle**: Icon buttons for:
  - Line chart (currently selected)
  - Candlestick chart
- **Notification Icon**: Speaker-like icon for alerts
- **Settings Icon**: Gear icon for chart settings
- **User Profile Icon**: Generic user icon on far right

### **2. Main Content Area**

Two-column layout with token information/chart on left and swap widget on right.

#### **2.1. Left Column - Token Information & Chart**

##### **Price Header Section**

- **Current Price**: Large, bold white text (e.g., "$0.04752")
- **Daily Change**: Green text with arrow indicator (e.g., "↑ 8%")
- **Visual Indicator**: Up arrow in green for positive change

##### **Price Chart**

- **Chart Type**: Large area chart with blue gradient fill
- **Background**: Dark theme with grid lines
- **X-Axis**: Time labels showing 24-hour intervals:
  - "1 PM", "3 PM", "5 PM", "7 PM", "9 PM", "11 PM"
  - "1 AM", "3 AM", "5 AM", "7 AM", "9 AM", "11 AM"
- **Chart Data**: Shows price fluctuations over 24-hour period
- **Visual Features**:
  - Peak around 2 PM
  - Dip around 10 PM
  - Recovery from 5 AM onwards
  - Blue gradient fill below line

##### **Key Metrics Bar**

Horizontal row with four key metrics:

- **CHAIN**: "ETHEREUM"
- **MARKET CAP**: "$6.5M"
- **1D VOLUME**: "$19.1K"
- **1D PRICE**: "+9.3%" (green text)
- **1D MARKET CAP**: "+9.3%" (green text)

##### **Attribution**

Small text at bottom left: "Powered by CoinGecko API and Trading View."

#### **2.2. Right Column - Swap/Buy Widget**

##### **Header Tabs**

- **Swap Tab**: Currently selected (highlighted)
- **Buy Tab**: Unselected
- **Settings Icon**: Small gear icon in top right corner

##### **Sell Section**

- **Label**: "Sell" text
- **Input Field**: Numerical input with "0" placeholder
- **Value Display**: "$0.00" below input field
- **Token Selector**: Dropdown button showing:
  - "ETH" with Ethereum logo
  - "0.00 ETH" balance
  - "Max" button for maximum amount

##### **Swap Direction Icon**

- **Position**: Centered between Sell and Buy sections
- **Design**: Vertical double-arrow icon
- **Purpose**: Indicates swap direction

##### **Buy Section**

- **Label**: "Buy" text
- **Input Field**: Numerical input with "0" placeholder
- **Value Display**: "$0.00" below input field
- **Token Selector**: Dropdown button showing:
  - "NYM" with NYM logo
  - "0.00 NYM" balance

##### **Action Button**

- **Label**: "Connect Wallet"
- **Style**: Large, prominent blue button
- **Position**: Bottom of widget

### **3. Bottom Section - Trending Tokens**

#### **Header**

- **Title**: "Trending Tokens" with fire icon
- **Action Button**: "View All" button on far right

#### **Token Cards Grid**

Two rows of three token cards each:

##### **Card 1**: Definitive EDGE

- Logo/Icon: Unique token icon
- Name: "Definitive EDGE"
- Price: "$0.1794"
- Change: "↑ 110.5%" (green)

##### **Card 2**: Zircuit ZRC

- Logo/Icon: Unique token icon
- Name: "Zircuit ZRC"
- Price: "$0.1794"
- Change: "↑ 63.4%" (green)

##### **Card 3**: Stader SD

- Logo/Icon: Unique token icon
- Name: "Stader SD"
- Price: "$0.1794"
- Change: "↑ 48.5%" (green)

##### **Card 4**: LETSTOP STOP

- Logo/Icon: Unique token icon
- Name: "LETSTOP STOP"
- Price: "$0.1794"
- Change: "↑ 45.9%" (green)

##### **Card 5**: Talos T

- Logo/Icon: Unique token icon
- Name: "Talos T"
- Price: "$0.1794"
- Change: "↑ 45.1%" (green)

##### **Card 6**: HOPR HOPR

- Logo/Icon: Unique token icon
- Name: "HOPR HOPR"
- Price: "$0.1794"
- Change: "↑ 39.8%" (green)

## Visual Design Specifications

### **Color Scheme**

- **Primary Background**: Black/dark grey (#0A0A0A or similar)
- **Secondary Background**: Slightly lighter dark grey for cards/widgets
- **Text**: White for primary information, light grey for labels
- **Accents**:
  - Blue (#3B82F6) for primary actions and links
  - Green (#10B981) for positive changes
  - Red (#EF4444) for negative changes (not shown in this example)

### **Typography**

- **Font Family**: Clean, modern sans-serif
- **Hierarchy**:
  - Large, bold for token name and price
  - Medium for section headers
  - Regular for body text
  - Small for labels and metadata

### **Interactive Elements**

- **Buttons**: Pill-shaped with hover states
- **Tabs**: Underlined active state
- **Input Fields**: Dark background with light borders
- **Dropdowns**: Expandable with hover states
- **Icons**: Consistent icon set throughout

### **Layout Responsiveness**

- **Desktop**: Two-column layout with chart and swap widget
- **Tablet**: Stacked layout with chart on top
- **Mobile**: Single column with collapsible sections

## Component Interactions

### **Chart Controls**

- Click timeframe buttons to update chart data
- Toggle between line and candlestick chart views
- Settings icon opens chart configuration panel

### **Swap Widget**

- Input fields update in real-time
- Token selectors open dropdown with available tokens
- "Max" button fills input with maximum available balance
- "Connect Wallet" button initiates wallet connection

### **Trending Tokens**

- Click "View All" to see complete trending list
- Click individual token cards to navigate to token detail page
- Cards show hover effects on interaction

## Data Requirements

### **Token Information**

- Token symbol, name, and logo
- Current price and 24-hour change
- Market cap and volume data
- Blockchain network information

### **Chart Data**

- Historical price data for selected timeframe
- Time series data with timestamps
- Price points for chart rendering

### **Market Metrics**

- Market capitalization
- 24-hour trading volume
- Price change percentages
- Market cap change percentages

### **Swap Interface**

- Available token balances
- Exchange rates
- Transaction fees
- Supported token pairs

### **Trending Tokens**

- Token symbols and names
- Current prices
- 24-hour percentage changes
- Token logos/icons

## Technical Considerations

### **Real-time Updates**

- Price data updates every few seconds
- Chart refreshes with new data points
- Balance updates after transactions

### **API Integration**

- CoinGecko API for market data
- TradingView for chart rendering
- Blockchain APIs for wallet integration

### **Performance**

- Lazy loading for trending tokens
- Optimized chart rendering
- Efficient data caching

This specification provides a complete blueprint for implementing a comprehensive token detail and swap page with all the features and interactions described in the reference image.
