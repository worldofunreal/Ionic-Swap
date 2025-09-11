# NFT Detail Page UI Specification

## Overview

The NFT detail page displays comprehensive information about a specific NFT item. The layout consists of two main components: a left panel for the NFT artwork display and a right panel containing detailed information and interactive elements.

## Layout Structure

### 1. **Left Component - NFT Artwork Display**

- **Purpose**: Primary visual representation of the NFT
- **Content**:
  - Main NFT artwork (pixel art portrait in this case)
  - Framed display with inner black border and outer dark grey frame
  - Artwork background: solid light blue-grey
  - Character features: pixelated portrait with dark brown skin, curly hair, green eyes, black nose, dark brown mouth
  - Sharp black pixel border outlining the character

### 2. **Right Component - Information Panel**

The right component is divided into two main sections:

#### **Top Section - NFT Identity & Metrics**

- **NFT Title**: Large, bold white text (e.g., "CryptoPunk #8150")
- **Collection Info**: Collection name with profile picture and verification badge
- **Ownership**: "Owned by [username]" display
- **Navigation Tags**: Pill-shaped tags (e.g., "CRYPTOPUNKS", "ETHEREUM", "TOKEN #8150")
- **Action Icons** (top right): Globe, Discord, X (Twitter), Copy, Heart (favorite), Three-dot menu

#### **Key Metrics Bar**

Horizontal display of crucial financial data:

- **Top Offer**: Value in ETH (shows "-" if no offer)
- **Collection Floor**: Floor price in ETH (e.g., "48.74 ETH")
- **Rarity**: Rank within collection (e.g., "#2,028")
- **Last Sale**: Most recent sale price (e.g., "47.50 ETH")

#### **Bottom Section - Tabbed Content**

Three tabs for different views:

##### **Tab 1: Details**

Contains multiple expandable sections:

###### **Traits Section**

- **Header**: Diamond icon + "Traits" + expand/collapse arrow
- **Subtitle**: "TRAITS 4" (indicating 4 traits)
- **View Options**: Grid and list view icons (top right)
- **Trait Cards** (grid layout):
  - Each card shows: Trait category, trait value, rarity count/percentage, market value in ETH
  - Example traits: TYPE (Female), ACCESSORY (Stringy Hair, Green Eye Shadow, 2 attributes)
  - Purple highlighting for rare traits

###### **Price History Section**

- **Header**: Dollar sign icon + "Price history" + expand/collapse arrow
- **Chart**: Line chart with blue gradient fill
- **Data**: Shows price trend from Jan 2021 to Jul 2025
- **Range**: 0-25 ETH on Y-axis
- **Features**: Data points with highlighted current price

###### **About Section**

- **Header**: Document icon + "About" + expand/collapse arrow
- **Content**: "About CryptoPunks" with collection description
- **Origin**: "A collection by" with pixelated icon
- **Description**: Two paragraphs about collection history and recognition

###### **Blockchain Details Section**

- **Header**: Stacked rectangles icon + "Blockchain details" + expand/collapse arrow
- **Content**: Key-value pairs
  - Contract Address: Truncated hex with external link icon
  - Token ID: Numerical identifier
  - Token Standard: Collection name
  - Chain: Blockchain network name

###### **More from Collection Section**

- **Header**: Grid icon + "More from this collection" + expand/collapse arrow
- **Content**: Horizontal scrollable list of NFT cards
- **Each Card**: NFT image, name/ID, current price, last sale price
- **Example**: CryptoPunk #6588, #2486, #7711 with respective prices

##### **Tab 2: Orders**

- **Content**: Collection offers table
- **Columns**: TYPE, PRICE, QTY, FROM, EXPIRY
- **Data**: List of offers with prices in WETH, quantities, offeror names, and expiration times
- **Styling**: Dark theme with light grey text, horizontal row separators

##### **Tab 3: Activity**

- **Event Filter Bar**: Pill-shaped buttons for filtering events (All, Sale, Listing, Item Offer, Transfer, Mint)
- **Table Columns**: EVENT, PRICE, FROM, TO, TIME
- **Event Types**: Sales, listings, transfers, mints with appropriate icons
- **Data**: Transaction history with prices, participants, and timestamps
- **Features**: External link icons for transaction details

## Visual Design Specifications

### **Color Scheme**

- **Primary Background**: Dark grey/black (#1A1A1A or similar)
- **Secondary Background**: Slightly lighter dark grey for cards/sections
- **Text**: White for primary information, light grey for labels
- **Accents**: Blue for links, purple for rare traits, green/red for price changes

### **Typography**

- **Font Family**: Clean, modern sans-serif
- **Hierarchy**: Bold for titles, regular for body text, smaller for labels
- **Sizes**: Large for main title, medium for section headers, small for metadata

### **Interactive Elements**

- **Buttons**: Pill-shaped with hover states
- **Icons**: Consistent icon set for actions and categories
- **Expandable Sections**: Chevron arrows indicating state
- **Tabs**: Underlined active state
- **Links**: Blue color with external link indicators

### **Layout Responsiveness**

- **Desktop**: Two-column layout with left artwork, right information
- **Tablet**: Stacked layout with artwork on top
- **Mobile**: Single column with collapsible sections

## Component Interactions

### **Expandable Sections**

- Click header to expand/collapse content
- Visual indicator (arrow) changes direction
- Smooth animation for content reveal

### **Tab Navigation**

- Click tabs to switch between Details, Orders, Activity
- Active tab highlighted with underline
- Content area updates accordingly

### **Filtering**

- Event type filters in Activity tab
- Trait view options in Traits section
- Time range filters for price history

### **External Links**

- Contract address links to block explorer
- Transaction links to blockchain explorer
- Social media links to respective platforms

## Data Requirements

### **NFT Information**

- Token ID, name, collection
- Owner information
- Current price, floor price, rarity rank
- Last sale information

### **Traits Data**

- Trait categories and values
- Rarity percentages and counts
- Market values for traits

### **Transaction History**

- Event types and timestamps
- Price data in various currencies
- Participant addresses/names
- Transaction hashes for verification

### **Collection Offers**

- Offer prices and quantities
- Offeror information
- Expiration times
- Offer types and status

This specification provides a complete blueprint for implementing a comprehensive NFT detail page with all the features and interactions described in the reference images.
