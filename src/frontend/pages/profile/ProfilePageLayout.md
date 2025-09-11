# Profile Page UI Specification

## Overview

The profile page displays a user's information and all their digital assets in a modern, dark-themed layout. The page is divided into two main components: a top section for user info and a bottom section for asset lists, navigable via 10 tabs. All tabs except "Galleries" include a sidebar with expandable filter sections.

---

## 1. Top Component – User Info Header

- **Background**: Large, blurred banner image (user's cover photo or default gradient)
- **Avatar**: Circular profile image (pixel art or user-uploaded)
- **Username**: Large, bold text (e.g., `0x5737...b4e4`)
- **Copy Address Icon**: Next to username
- **Edit Icon**: (if viewing own profile)
- **XP Badge**: Small badge with XP value
- **Portfolio Metrics** (top right):
  - Portfolio Value (ETH)
  - USD Value
  - NFTs (count, %)
  - Tokens (count, %)
  - Add Asset button (+)
- **Navigation Tabs** (horizontal, below user info):
  - Galleries, NFTs, Tokens, Listings, Offers, Portfolio, Created, Watchlist, Favorites, Activity
  - Active tab underlined

---

## 2. Bottom Component – Asset List Section

### **Tab Navigation**

- 10 tabs, each showing a different asset view
- Tabs: Galleries, NFTs, Tokens, Listings, Offers, Portfolio, Created, Watchlist, Favorites, Activity

---

### **A. Galleries Tab**

- **No Sidebar**
- **Main Area**:
  - If no galleries: Centered card with NFT image and message ("Feature your favorites")
  - Button: "Create a gallery"
  - If galleries exist: Grid of gallery cards, each with gallery name, preview images, and edit/view buttons

---

### **B. NFTs Tab**

- **Sidebar** (left):
  - **Status** (expandable): All, Listed, Not Listed, Hidden
  - **Chains** (expandable): Search + chain filter pills
  - **Collections** (expandable): Search for collections
- **Main Area**:
  - Search bar for items
  - Sort dropdown (e.g., Recently received)
  - View toggles: grid, list, compact
  - **Table**:
    - Columns: Checkbox, Item, Listing Price, Rarity, Floor Price, Top Offer, Cost, Received
    - Each row: NFT image, name, price, rarity, etc.
  - **Empty State**: Centered card with NFT image and "No items found" message, button to "Go to Discover"

---

### **C. Tokens Tab**

- **Sidebar** (left):
  - **Chains** (expandable): Search + chain filter pills
  - **Market Cap** (expandable): Range filter pills
  - **Category** (expandable): Has NFT, Branded Token Page (toggle switches)
- **Main Area**:
  - Search bar for tokens
  - View toggles: grid, list
  - **Table**:
    - Columns: Token, Symbol, Price, Market Cap, 24h Change, Volume, etc.
    - Each row: Token logo, name, price, etc.
  - **Empty State**: Centered card with search icon and "No results found" message

---

### **D. Listings Tab**

- **Sidebar** (left):
  - **Status** (expandable): All, Active, Inactive
  - **Chains** (expandable): Search for collections
- **Main Area**:
  - Sort dropdown (e.g., Most recent)
  - **Table**:
    - Columns: Checkbox, Listing, Status, Price, Top Offer, Floor, Qty, Total, Exp, Time
    - Each row: NFT image, listing info, price, etc.
  - **Empty State**: Centered card with NFT image and "No listings found" message, button to "View your items"
  - **Footer**: Cancel all listings and offers, Cancel listings (buttons)

---

### **E. Offers Tab**

- **Sidebar** (left):
  - **View** (expandable): Offers Made, Item Offers Received
  - **Status** (expandable): All, Active, Unfunded, Completed, Expired, Cancelled
  - **Offer Type** (expandable): All, Item Offers, Collection Offers, Trait Offers
  - **Chains** (expandable): Search for chains
  - **Collections** (expandable): Search for collections
- **Main Area**:
  - Sort dropdown (e.g., Most recent)
  - **Table**:
    - Columns: Checkbox, Offer, Status, Price, Top Offer, Floor, Qty, Total, Exp, Time
    - Each row: Offer info, price, etc.
  - **Empty State**: Centered card with NFT image and "No offers found" message, button to "View Trending Collections"
  - **Footer**: Make new offer, Cancel all listings and offers, Cancel offers (buttons)

---

### **F. Portfolio Tab**

- **Sidebar** (left):
  - **Category** (expandable): All, Art, Gaming, Memberships, etc. (pills)
  - **Chains** (expandable): Search + chain filter pills
  - **Floor Price** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Top Offer** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Is Verified** (toggle)
- **Main Area**:
  - **Table**:
    - Columns: Star (favorite), Collection, Held, Value, Top Offer, Floor Price, Vol, Sales, Owners, Supply, Last 7D
    - Each row: Collection logo, name, stats, sparkline

---

### **G. Created Tab**

- **Sidebar** (left):
  - **Category** (expandable): All, Art, Gaming, etc. (pills)
  - **Chains** (expandable): Search + chain filter pills
  - **Floor Price** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Top Offer** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Is Verified** (toggle)
- **Main Area**:
  - **Table**:
    - Columns: Collection, Floor Price, Top Offer, Vol, Sales, Owners, Supply, Last 7D
    - Each row: Collection logo, name, stats, sparkline

---

### **H. Watchlist Tab**

- **Sidebar** (left):
  - **Category** (expandable): All, Art, Gaming, etc. (pills)
  - **Chains** (expandable): Search + chain filter pills
  - **Floor Price** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Top Offer** (expandable): Currency dropdown, min/max inputs, Apply button
  - **Is Verified** (toggle)
- **Main Area**:
  - **Table**:
    - Columns: Collection, Floor Price, Top Offer, Vol, Sales, Owners, Supply, Last 7D
    - Each row: Collection logo, name, stats, sparkline
  - **Empty State**: Centered card with search icon and "No results found" message, button to "Clear filters"

---

### **I. Favorites Tab**

- **Sidebar** (left):
  - **Category** (expandable): All, Art, Gaming, etc. (pills)
  - **Chains** (expandable): Search + chain filter pills
  - **Is Verified** (toggle)
- **Main Area**:
  - **Table**:
    - Columns: Heart (favorite), Item, Rarity, Price, Top Offer, Last Sale, Owner, Listed
    - Each row: NFT image, name, stats
  - **Empty State**: Centered card with NFT image and "No favorites found" message, button to "Go to Discover"

---

### **J. Activity Tab**

- **Sidebar** (left):
  - **Status** (expandable): All, Sale, Mint, Transfer, Listing, Item Offer, Collection Offer, Trait Offer
  - **Marketplaces** (expandable): OpenSea, Blur, MagicEden, CryptoPunks (checkboxes)
  - **Chains** (expandable): Search + chain filter pills
  - **Collections** (expandable): Search for collections
- **Main Area**:
  - **Table**:
    - Columns: Event, Item, Price, Rarity, Qty, From, To, Time
    - Each row: Event type, NFT image, price, rarity, participants, timestamp
  - **Empty State**: Centered card with search icon and "No results found" message, button to "Clear filters"

---

## Sidebar Expandable Component

- Each sidebar section is an expandable/collapsible panel
- Chevron icon indicates open/closed state
- Smooth animation for expand/collapse
- Only one section open at a time (optional, for compactness)

---

## Visual Design Specifications

- **Theme**: Dark mode, high contrast
- **Typography**: Modern sans-serif, bold for headers, regular for body
- **Buttons**: Pill-shaped, clear active/hover states
- **Tables**: Zebra striping, hover highlight, sticky headers
- **Empty States**: Centered, with icon/image, bold message, and action button
- **Sidebar**: Left-aligned, fixed width, scrollable if content overflows
- **Responsiveness**: Stacks sidebar above main content on mobile

---

## Data Requirements

- **User Info**: Address, avatar, XP, portfolio stats
- **NFTs**: Image, name, price, rarity, etc.
- **Tokens**: Logo, name, price, market cap, etc.
- **Collections**: Logo, name, stats, sparkline
- **Offers/Listings**: Status, price, expiry, etc.
- **Activity**: Event type, participants, price, time

---

This specification provides a complete blueprint for implementing a comprehensive, user-friendly profile page with all the features and interactions described in the reference images.
