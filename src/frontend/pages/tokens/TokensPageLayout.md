Here is the **UI layout breakdown for the Activity Page** of an NFT marketplace (like OpenSea), based on the image you provided.

---

### 🖥️ **Desktop Layout - Activity Page**

#### **Left Sidebar (Filters Panel)**

This sidebar is **vertically stacked** and scrollable, with collapsible sections for each filter type.

---

- **Status (Event Type)**

  Multi-select tag buttons:
  - `All`
  - `Sale`
  - `Mint`
  - `Transfer`
  - `Listing`
  - `Item Offer`
  - `Collection Offer`
  - `Trait Offer`

  Each button is toggleable (active/inactive).

---

- **Price Filter**
  - **Currency Dropdown**: Default `USD`
  - **Range Input**:
    - `Min` (number input)
    - `Max` (number input or placeholder “Max”)

  - **Apply Button**

---

- **Marketplaces**

  Checkbox list:
  - OpenSea
  - Blur
  - MagicEden
  - CryptoPunks

---

- **Chains**
  - **Search Input** for chain names
  - **Chain Pills** (toggleable buttons with icons):

  - Examples:
    - Ethereum
    - Abstract
    - ApeChain
    - Arbitrum
    - Avalanche
    - Base
    - Blast
    - Flow
    - Optimism
    - Polygon
    - Zora
    - Ronin, Sui, etc.

  - Grouping:
    - `All` button to reset chain filters

  Each chain uses colored labels (can map to Tailwind badge classes or custom CSS for network branding).

---

- **Collections**

- **Search bar** (`Search for collections`)
  - List of known collections (checklist with name + verified badge if any)

---

#### **Main Content Area (Activity Table)**

- **Top Filter Bar**
  - Pills/tags: `Sale (x)` and `Clear`

- **Table Headers**
  - Event (icon + type, e.g., Sale)
  - Item (name + collection name + avatar + verified icon)
  - Price (in ETH/WETH)
  - Rarity (rank, e.g., #13,306)
  - Qty (typically 1)
  - From (seller)
  - To (buyer)
  - Time (e.g., 13s ago) with external link icon

- **Table Rows (Activity Log)**
  - Repeating sale entries with:
    - Avatar of the NFT
    - Name of item and collection
    - Price
    - Rarity
    - Quantity
    - Sender and receiver wallet short hash
    - Timestamp + external link icon

---

### ✅ Mobile Version Adaptation (to build later)

On mobile:

- Sidebar becomes a collapsible drawer (`<MobileFilterDrawer />`)
- Table switches to cards or a horizontal scroll list (`<ActivityCard />`)
- Footer adapts to a compact mode

---

Would you like a Nuxt 3 + Tailwind starter code snippet for one of these components?

This section is the core of the page, displaying the token data.

##### **3.1. Top Controls (`TokenListHeaderControls.vue`)**

- **Description:** Controls above the main token table for display options.
- **Elements:**
  - **Token Type Toggle:** "NFTs" / "Tokens" switch (likely `NuxtLink`s to switch between different pages).
  - **Trending/Top/New Filters:** Buttons to sort/filter by trends, top performers, or new listings.
  - **Time Period Selectors:** Buttons for 1D, 7D, Last 7D, etc., possibly for chart display on the far right of the table header.

##### **3.2. Token Data Table (`TokenDataTable.vue`)**

- **Description:** The main table displaying token information. This will be a large component managing potentially many rows and columns.
- **Elements (Table Header - `<thead>`):**
  - Columns: "TOKEN", "PRICE", "1H CHANGE", "24H CHANGE", "7D CHANGE", "1D VOL", "MARKET CAP", "SUPPLY", "FDV", "LAST 7D".
  - **Sortable Columns:** Most headers should be clickable to sort the table data (ascending/descending). This would involve managing `sortColumn` and `sortOrder` in the component's state.
- **Elements (Table Rows - `<tbody>`):**
  - Each row represents a single token, likely rendered using a `v-for` loop over an array of token data.
  - **TOKEN Column:**
    - Token Logo (circular image).
    - Token Symbol (e.g., "MOMO", "TET").
    - Token Name (e.g., "Momo: MOMO", "Tectum TET").
    - Link (`NuxtLink`) on the token name/symbol to a hypothetical `/tokens/:symbol` or `/tokens/:contractAddress` detail page.
  - **PRICE Column:** Current price in ETH/USD.
  - **CHANGE Columns (1H, 24H, 7D):** Percentage change.
    - **Conditional Styling:** Text color (green for positive, red for negative).
    - **Arrow Icons:** Up/down arrows indicating change direction.
  - **1D VOL, MARKET CAP, SUPPLY, FDV Columns:** Numeric values.
  - **LAST 7D Column:** A mini sparkline chart (`<SparklineChart />` component) showing price trend over the last 7 days. This would require a charting library (e.g., ApexCharts, Chart.js, or a lightweight custom SVG component).
- **Data Fetching & State:**
  - The `TokenDataTable` component or its parent (`pages/tokens/index.vue`) would handle fetching the token data from an API.
  - Pagination (if applicable, though not visible in screenshot).
  - Loading states, empty states.
- **Responsiveness:** For smaller screens, this table would likely need to adapt significantly:
  - Horizontal scrolling.
  - Collapsible rows to show more details on tap.
  - Prioritizing key columns and hiding less crucial ones.

---
