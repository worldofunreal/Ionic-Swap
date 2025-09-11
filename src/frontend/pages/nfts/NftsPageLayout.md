## NFTs Page UI Layout and Description

### 1. **Sidebar (Left Panel)**

The sidebar is a vertical filter panel that allows users to refine NFT collections by various criteria. It is visually separated from the main content and uses a dark background.

#### **Sections:**

- **Category**
  - Title: "Category"
  - Multiple pill-shaped filter buttons (e.g., All, Art, Gaming, Memberships, Music, PFPs, Photography, Domain Names, Sports Collectibles, Virtual Worlds)
  - "All" is selected by default.

- **Chains**
  - Title: "Chains"
  - Search input for chains (placeholder: "Search for chains")
  - Multiple pill-shaped filter buttons for each chain (e.g., All, Ethereum, Abstract, ApeChain, Arbitrum, Avalanche, B3, Base, Berachain, Blast, Flow, Optimism, Polygon, Ronin, Sei, Shape, Sonelum, Unichain, Zora)
  - Each chain button has a small icon and label.
  - "All" is selected by default.

- **Floor Price**
  - Title: "Floor Price"
  - Dropdown to select currency (e.g., ETH)
  - Two input fields for min and max values, separated by "to"
  - "Apply" button to filter

- **Top Offer**
  - Title: "Top Offer"
  - Dropdown to select currency (e.g., WETH)
  - Two input fields for min and max values, separated by "to"
  - "Apply" button to filter

- **Is Verified**
  - Toggle switch labeled "Is Verified" at the bottom

---

### 2. **Main Table (Right Panel)**

The main area displays a sortable, filterable table of NFT collections. It uses a dark theme and clear, readable typography.

#### **Header Controls:**

- Tabs for "Top", "Trending", "Watchlist"
- Time range filters: All, 30d, 7d, 1d, 1h, 15m, 5m, 1m
- Toggle between grid and list view (icon buttons)

#### **Table Columns:**

- **Collection**
  - Star icon for favoriting
  - Collection image/avatar
  - Collection name (with verification badge if applicable)
  - "NEW" badge for new collections

- **Floor Price**
  - Value in ETH (e.g., 16.07 ETH)

- **1D Change**
  - Percentage change in floor price over 1 day (e.g., +4.8%, 0%, -1.2%)
  - Green for positive, red for negative, gray for neutral

- **Top Offer**
  - Value in WETH (e.g., 15.16 WETH)

- **1D Vol**
  - 1-day trading volume in ETH (e.g., 962.41 ETH)

- **1D Sales**
  - Number of sales in the last day (e.g., 61)

- **Owners**
  - Number of unique owners (e.g., 4,948)

#### **Table Rows:**

- Each row represents a collection, displaying the above columns.
- Rows are visually separated with subtle lines or background shading on hover.

---
