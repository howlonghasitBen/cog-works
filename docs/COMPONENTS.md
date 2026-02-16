# Component Reference

## Navigation

### `<GearHero />`
Full-screen parallax hero with central gear and orbiting satellite cogs. Manages scroll-snap transitions between hero and content views.

**Props:** None (configured via `heroItems` array in App.tsx)

**Key behaviors:**
- Central cog click toggles satellite menu
- Satellite click opens sub-cog radial menu
- Sub-cog click navigates to content page with smooth scroll
- Parallax background layers move at different rates
- Lightning bolts connect cogs when menu is open

### `<CogMenu />`
Radial sub-cog selector. Appears when a satellite is clicked, showing its sub-items in an arc.

### `<CogSidebar />`
Collapsible sidebar navigation with spinning cog icons per section.

### `<CogDropdown />`
Inline gear-themed dropdown with dividers and disabled states.

---

## Cards

### `<WavesCard />`
Standalone card render component. Displays card art, stats (HP/Mana/Crit orbs, ATK/DEF badges), type/subtype bar, rarity gradient, move name, and flavor text. All inline styles, no external CSS.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Card name (displayed in header) |
| `type` | `string` | Card type (e.g. "Creature") |
| `subtype` | `string` | Subtype (e.g. "Dragon") |
| `rarity` | `string` | Rarity tier (drives gradient colors) |
| `hp` | `number` | Hit points (red orb) |
| `mana` | `number` | Mana cost (blue orb) |
| `crit` | `number` | Crit chance (gold orb) |
| `atk` | `number` | Attack stat |
| `def` | `number` | Defense stat |
| `image` | `string` | Path to card art image |
| `flavor` | `string` | Flavor text |
| `subtitle` | `string` | Move name (bold, above flavor) |
| `width` | `number` | Card width in pixels (default 300) |

**Rarity gradients:**
- Common: gray → slate
- Uncommon: green → emerald
- Rare: blue → indigo
- Epic: purple → violet
- Legendary: gold → amber
- Mythic: cyan → teal → purple

### `<CardFromData />`
Wrapper that loads a card from `cardData.json` by name and renders `<WavesCard />`.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Card name to look up |
| `width` | `number` | Card width |

### `<CardDetailModal />`
Full-screen overlay showing detailed card information. Animates from the clicked card's grid position to center screen.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `card` | `CardState` | On-chain card data (or stub) |
| `sourceRect` | `DOMRect?` | Bounding rect of clicked card (for fly-in animation) |
| `onClose` | `() => void` | Close handler |
| `onStake` | `(id: number) => void?` | Stake action |
| `onUnstake` | `(id: number) => void?` | Unstake action |

**Tabs:**
- **Stats** — WAVES reserve, card reserve, owner, your stake, your balance, contract address
- **Activity** — Recent stake/unstake/swap/ownership events (currently mock data)
- **Chart** — SVG sparkline price chart (currently simulated, live indexing planned)

---

## Pages

### `<StakingDashboard />`
Card grid with staking controls. Sources all 292 cards from `cardData.json`, overlays on-chain data from `useWhirlpool()`.

**Features:**
- Search by name
- Filter: All / Mine / Top / At Risk
- Sort: A→Z / ↓ Staked
- Card click → CardDetailModal with fly-in animation
- Ownership risk bars (bottom of each card)
- Stats bar: total cards, total staked, your stakes, pending rewards
- Claim All + Rewards Breakdown

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onNavigateSwap` | `() => void?` | Navigate to swap page |

### `<SwapPage />`
Three-column swap interface for atomic position swaps between card tokens.

**Columns:**
1. **Your Inventory** — Cards you hold, click to add to swap stage
2. **Swap Stage** — Selected cards to swap from/to, execute swapStake
3. **Market Search** — Browse all cards, click for info

### `<MumuGallery />`
Combined NFT gallery (80% width) and mint sidebar (20% width).

**Gallery:** Grid of all 100 Mumu Frens v2 images
**Mint sidebar:**
- Connect wallet (ETH mainnet)
- Quantity selector (1-10)
- Price display
- Live supply bar with glow animation
- Mint button → on-chain transaction
- Mint success modal with confetti + actual minted NFT images

### `<MintPage />`
Card creation editor using CogPartSelector + CogPartEditor with live preview.

---

## UI Components

### `<CogDonut />`
Donut chart framed by `nav_cog.svg`. Visualizes staker distribution per card token.

### `<CogPartSelector />`
Dark metallic panel with gold Cinzel headers and nav_cog.svg icons per button. Used in card editor.

### `<CogPartEditor />`
Matching theme field editor. Supports text, number, select, color, and slider field types.

### `<Toast />` + `<ToastProvider />`
Context-based notification system.

**`useToast()` returns:**
- `success(message)` — Green left border
- `error(message)` — Red left border
- `info(message)` — Blue left border

Toasts appear bottom-right, auto-dismiss after 4 seconds, slide-in animation.

### `<WhirlpoolTerminal />`
Terminal-style scrolling event log for on-chain activity.

---

## Hooks

### `useWhirlpool()`
Main hook for all Whirlpool on-chain interactions.

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `cards` | `CardState[]` | All on-chain cards with reserves, prices, stakes |
| `address` | `string` | Connected wallet address |
| `isConnected` | `boolean` | Wallet connection status |
| `pendingGlobal` | `string` | Pending staking rewards |
| `stake(id, amount)` | `function` | Stake WAVES into card |
| `unstake(id, amount)` | `function` | Withdraw stake |
| `swapStake(from, to, amount)` | `function` | Atomic swap |
| `claimRewards()` | `function` | Claim all pending rewards |

### `useCardData()`
Fetches and caches `cardData.json`.

**Returns:** `{ cards: CardData[], loading: boolean }`

### `useToast()`
Access toast notification context.

**Returns:** `{ success(msg), error(msg), info(msg) }`
