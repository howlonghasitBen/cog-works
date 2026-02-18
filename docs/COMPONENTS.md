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
Standalone card render component. Displays card art, stats (HP/Mana/Crit orbs in one row, ATK/DEF badges), type/subtype bar, rarity gradient border, move name, and flavor text. **All inline styles, no external CSS.**

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | | Card name (header) |
| `type` | `string` | | Card type (e.g. "Creature") |
| `subtype` | `string` | | Subtype (e.g. "Dragon") |
| `rarity` | `string` | | Rarity tier (drives gradient) |
| `hp` | `number` | | Hit points (red orb) |
| `mana` | `number` | | Mana cost (blue orb) |
| `crit` | `number` | | Crit chance (gold orb) |
| `atk` | `number` | | Attack stat |
| `def` | `number` | | Defense stat |
| `image` | `string` | | Path to card art image |
| `flavor` | `string` | | Flavor text (lore) |
| `subtitle` | `string` | | Card subtitle (beside name, inline) |
| `moveName` | `string` | | Move name (bold white, above flavor text) |
| `width` | `number` | `300` | Card width in px. **`0` = fill parent** (uses ResizeObserver) |
| `maxWidth` | `string` | `'100%'` | CSS max-width |

**Rarity gradients:**
- Common: gray → slate
- Uncommon: green → emerald
- Rare: blue → indigo
- Epic: purple → violet
- Legendary: gold → amber
- Mythic: cyan → teal → purple

**Stat orbs:** HP (red), Mana (blue), Crit (gold — same gradient as rarity badge). All in one row.

### `<CardFromData />`
Wrapper that loads a card from `cardData.json` by name and renders `<WavesCard />`. Default `width={0}` (fill parent).

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Card name to look up in cardData.json |
| `width` | `number` | Card width (default 0 = fill parent) |
| `fallbackData` | `WavesCardData` | Optional fallback for cards not yet in cardData.json |

**Exports:**
- `buildFallbackCard(name, symbol, editorData?)` — generates gold-themed WavesCardData for newly minted cards

### `<CardDetailModal />`
Full-screen overlay showing detailed card information. Animates from the clicked card's grid position to center screen. **Derives card data from live `whirlpool.cards`** by ID (not stale snapshot), so it updates in real-time on events.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `card` | `CardState` | On-chain card data |
| `cardData` | `WavesCardData?` | Visual enrichment from cardData.json |
| `sourceRect` | `DOMRect?` | Bounding rect of clicked card (fly-in origin) |
| `onClose` | `() => void` | Close handler (resets URL to `#whirlpool-stake`) |
| `onStake` | `(id, amount) => void` | Stake action |
| `onUnstake` | `(id, amount) => void` | Unstake action |
| `getCardEvents` | `(id) => Promise<Event[]>` | Fetches real on-chain events |

**Tabs:**
- **Stats** — WAVES/card reserves, price, owner, your effective balance + raw shares, contract address
- **Activity** — Real on-chain Staked/Unstaked/OwnerChanged events (fetched via `getCardEvents`)
- **Chart** — SVG sparkline price chart with gold gradient fill, memoized on `card.id`

**Behavior:**
- Click opens modal directly (no "Details" button)
- Single card instance in modal (no duplicate flying card)
- Max 75vw wide
- Closing uses `replaceState` (doesn't pollute back button history)
- Deep link: `#whirlpool-stake?card=card-name-slug`

---

## Pages

### `<StakingDashboard />`
Main card grid with staking controls. **On-chain primary** — iterates `whirlpool.cards`, uses `cardData.json` for enrichment.

**Features:**
- WETH Pool card (first position):
  - Stake ETH (auto-wraps to WETH)
  - Your Shares display
  - Claimable WETH + Claimable WAVES (dual-token LP)
  - Live reserve display
  - Overflow scroll for long content
- 292-card grid with WavesCard renders
- Search by name, filter (All/Mine/Top/At Risk), sort (A→Z/↓Staked)
- Card click → CardDetailModal with fly-in animation
- Stats bar: total cards, total staked, your stakes, pending rewards
- Claim All + Rewards Breakdown
- Unstake prompt shows shares with token equivalent (`myShares` for tx, `myStake` for display)

### `<SwapPage />`
Three-column gold steampunk swap interface. **All inline styles** (no Tailwind). **On-chain primary** source.

**Layout:**
1. **Stats Header** — total portfolio value in WAVES, card count
2. **Cash Out Dropdown** (purple/indigo accent):
   - $WAVES → ETH mode: balance display, slippage estimate
   - Card Token → ETH mode: card selector (total tokens ≈ WAVES value), balance breakdown (wallet/staked/total), MAX button, auto-unstake indicator, slippage estimate with est. ETH output
   - Color-coded price impact (green/yellow/red)
3. **Your Inventory** — owned cards with checkboxes, WAVES toggle + amount input
4. **Swap Stage** — selected sources → target, swap estimate panel:
   - Source cards count, WAVES added, total WAVES value
   - Tokens acquired (with slippage-adjusted estimate)
   - **Price impact row** (new) with color coding
   - Takes ownership indicator
5. **Market Browse** — 2-col grid (min 250px), click selects as swap target, hover shows real on-chain activity overlay

**Swap routing:**
- Staked positions → `swapStake` (atomic, no intermediary)
- Wallet balance → AMM swap via SurfSwap (card → WAVES → card)
- Multiple sources → `batchSwapStake` (consolidate)
- Cash out → auto-unstake all shares, reload balance, swap actual wallet tokens

### `<MumuGallery />`
Combined NFT gallery (80% width) and mint sidebar (20% width).

**Gallery:** CSS grid of all 100 Mumu Frens v2 images  
**Mint sidebar:** Vertically centered, includes:
- Connect wallet button (ETH mainnet)
- Quantity selector (1–10)
- Price display
- Animated supply bar with gold glow pulse (15s poll)
- Mint button → on-chain tx
- Mint success modal: confetti, actual minted NFT images + token IDs (parsed from Transfer events), Etherscan + OpenSea links

### `<MintPage />`
Card creation editor with live preview.

- CogPartSelector + CogPartEditor for card attributes
- Live WavesCard preview
- Calls `/api/mint-card` (Vite plugin) to save data before on-chain tx
- Duplicate name check (409 error)
- `lastCreatedCard` + `clearLastCreated` on useWhirlpool for post-mint state
- Mint success modal: confetti, CardFromData preview, tx hash

---

## UI Components

### `<CogDonut />`
Donut chart framed by `nav_cog.svg`. Visualizes staker distribution per card token.

### `<CogPartSelector />`
Dark metallic panel with gold Cinzel headers and nav_cog.svg icons per button. Used in card editor.

### `<CogPartEditor />`
Matching theme field editor. Supports text, number, select, color, and slider field types.

### `<Toast />` + `<ToastProvider />`
Context-based notification system. **Tied to actual tx state** — only fires on success, not optimistically. Reflects correct token symbol (e.g. "500 $CARD5 Staked").

**`useToast()` returns:**
- `success(message)` — Green left border
- `error(message)` — Red left border
- `info(message)` — Blue left border

Toasts appear bottom-right, auto-dismiss after 4s, slide-in animation.

### `<WhirlpoolTerminal />`
Terminal-style scrolling event log for on-chain activity.

---

## Hooks

### `useWhirlpool()`
Core hook for all Whirlpool on-chain interactions. **Module-level shared cache** — all instances share `_shared` state.

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `cards` | `CardState[]` | All on-chain cards (id, name, symbol, address, reserves, price, myStake, myBalance, myShares, owner) |
| `address` | `string` | Connected wallet |
| `isConnected` | `boolean` | Wallet connected |
| `wavesBalance` | `string` | WAVES balance |
| `wethBalance` | `string` | WETH balance |
| `wethPoolWaves` | `string` | WETH pool WAVES reserve |
| `wethPoolWeth` | `string` | WETH pool WETH reserve |
| `myWethShares` | `string` | User's WETH pool shares |
| `claimableWeth` | `string` | Claimable WETH from pool |
| `claimableWaves` | `string` | Claimable WAVES from pool |
| `pendingGlobal` | `string` | Pending staking rewards |
| `stake(id, amount)` | `fn` | Stake WAVES into card |
| `unstake(id, shares)` | `fn` | Burn shares, receive tokens |
| `swap(from, to, amt, min)` | `fn` | AMM swap |
| `swapStake(from, to, shares)` | `fn` | Atomic position swap |
| `batchSwapStake(ids[], to, shares[])` | `fn` | Consolidate positions |
| `claimRewards(id?)` | `fn` | Per-card or claim-all |
| `stakeWETH(amount)` | `fn` | Stake WETH into pool |
| `unstakeWETH(shares)` | `fn` | Dual-token withdrawal |
| `createCard(name, sym, uri, data?)` | `fn` | Create new card |
| `loadCards()` | `fn` | Force cache refresh |

**All mutation functions re-throw errors** so callers can catch and show appropriate toasts.

**CardState fields:**
- `myStake` — populated from `effectiveBalance()` (real token value for display)
- `myShares` — raw LP shares (for contract calls: unstake, swapStake)

### `useCardData()`
Fetches and caches `cardData.json` (292 cards).

**Returns:** `{ cards: WavesCardData[], loading: boolean }`

**Exports:** `invalidateCardData()` — flushes cache, triggers re-fetch by all consumers

**Backward compat:** Auto-migrates old cards where `subtitle` contained the move name → moves to `moveName`, clears `subtitle`.

### `useToast()`
Access toast notification context.

**Returns:** `{ success(msg), error(msg), info(msg) }`

### `usePaletteExtractor(imageUrl)`
Extracts dominant colors from card art for dynamic theming.
