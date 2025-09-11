Here is the **UI layout breakdown for the Activity Page** of an NFT marketplace (like OpenSea), based on the image you provided.

---

### 🖥️ **Desktop Layout - Activity Page**

#### **Left Sidebar (Filters Panel)**

- **Status Filters** (filter by event type):
  - All
  - Sale (selected)
  - Mint
  - Transfer
  - Listing
  - Item Offer
  - Collection Offer
  - Trait Offer

- **Price Filter**
- **Marketplaces Filter**
- **Chains Filter**
- **Collections Filter**
  - Search bar
  - Popular collections list with checkboxes:
    - Pudgy Penguins
    - CryptoPunks
    - Fidenza by Tyler Hobbs
    - Doodles

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
    - Event type (whether it's sale or something else, for now, let's keep it sale)
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
