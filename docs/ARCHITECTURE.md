# Architecture

## Overview

Cog Works is a single-page React app with a scroll-driven navigation paradigm. The hero section (full viewport) displays a central gear with orbiting satellite cogs. Clicking a satellite and its sub-cog scrolls down to a content page. URL hashes drive routing.

## Navigation Model

```
Hero (viewport 1)
  ├── GearHero — parallax background, central cog, satellite orbits
  ├── CogMenu — radial sub-cog selector (appears on satellite click)
  └── LightningBolt — decorative lightning between cogs
      │
      ▼ scroll-snap
Content (viewport 2)
  └── ActivePage — rendered based on activePage state
      ├── StakingDashboard (whirlpool-stake)
      ├── SwapPage (whirlpool-swap)
      ├── MintPage (whirlpool-mint)
      ├── MumuGallery (mumu-v2)
      └── External links (open in new tab)
```

### Scroll Snap Zones

The app uses a scroll container with snap behavior:

- **0-10% scroll**: Dead zone → snaps back to hero
- **10-50%**: Upper dead zone → snaps to hero
- **50-90%**: Lower dead zone → snaps to content
- **90-100%**: Content fully visible

An `isAnimating` ref prevents the snap logic from fighting programmatic scrolls (navigation, back button).

### URL Hash Routing

| Hash | Page |
|------|------|
| `#hero` | Hero (top) |
| `#whirlpool-stake` | Staking Dashboard |
| `#whirlpool-swap` | Swap Page |
| `#whirlpool-mint` | Mint/Create Page |
| `#mumu-v2` | Mumu Frens v2 Gallery |
| `#whirlpool-stake?card=name` | Staking + card detail modal |

Hashes are pushed via `window.history.pushState`. The `popstate` listener restores pages on back/forward with animation lock to prevent snap interference.

## Data Architecture

### Card Data (Source of Truth)

`public/data/cardData.json` contains all 292 cards with:

```typescript
interface CardData {
  name: string
  type: string        // "Creature", "Spell", "Enchantment"
  subtype: string     // "Dragon", "Memer", "Elemental"
  rarity: string      // "common", "uncommon", "rare", "epic", "legendary", "mythic"
  hp: number
  mana: number
  crit: number
  atk: number
  def: number
  image: string       // path to art PNG
  flavor: string      // flavor text
  subtitle: string    // move name
  token_id?: number   // on-chain token ID (if minted)
}
```

### On-Chain Overlay

`useWhirlpool()` hook reads live data from Anvil:

```typescript
interface CardState {
  id: number
  name: string
  symbol: string
  uri: string
  address: `0x${string}`  // card token contract
  owner: string
  price: string           // WAVES price from AMM curve
  wavesReserve: string
  cardReserve: string
  myStake: string
  myBalance: string
}
```

The StakingDashboard merges these: `cardData.json` provides the full card list, `useWhirlpool()` overlays reserves, prices, and ownership for cards that exist on-chain.

## Contract Integration

### ERC-1142 (Whirlpool)

Three contracts deployed to Anvil:

1. **WhirlpoolStaking** — Card token creation, staking, ownership, fee distribution
2. **SurfSwap** — AMM for WAVES↔card token swaps (bonding curve pricing)
3. **WhirlpoolRouter** — Card creation helper (creates token + initial liquidity)

Key functions used:
- `stake(cardId, amount)` — Stake WAVES into a card
- `unstake(cardId, amount)` — Withdraw stake
- `swapStake(fromCard, toCard, amount)` — Atomic position swap
- `batchSwapStake(fromCards[], toCard, amounts[])` — Consolidate positions
- `claimRewards()` — Claim pending staking rewards

### Mumu Frens v2

ERC-721A on ETH mainnet via Scatter/Archetype:
- Public mint with `auth = {key: 0x0, proof: []}`, `affiliate = address(0)`, `signature = 0x`
- Random token assignment (parsed from Transfer events in tx receipt)
- 0.025 ETH per mint, 100 max supply

## Component Hierarchy

```
App
├── GearHero
│   ├── Background (parallax layers)
│   ├── CenterCog (nav_cog.svg, click to toggle menu)
│   ├── SatelliteCogs[] (orbiting items with innard images)
│   ├── CogMenu (radial sub-cog picker)
│   └── LightningBolt (decorative)
├── ContentPage
│   ├── StakingDashboard
│   │   ├── SearchBar + Filters + Sort
│   │   ├── StatsBar (total staked, your stakes, pending rewards)
│   │   ├── CardGrid → CardFromData[] → WavesCard
│   │   ├── CardDetailModal (on card click)
│   │   └── RewardsBreakdown
│   ├── SwapPage
│   │   ├── InventoryPanel
│   │   ├── SwapStage
│   │   └── MarketSearch
│   ├── MumuGallery
│   │   ├── ImageGrid (80%)
│   │   ├── MintSidebar (20%)
│   │   └── MintSuccessModal
│   └── MintPage
│       ├── CogPartSelector
│       ├── CogPartEditor
│       └── CogCardPreview
└── ToastProvider → Toast[]
```

## State Management

No external state library. All state is local (`useState`) or derived (`useMemo`):

- **`useWhirlpool()`** — Singleton hook for all on-chain reads/writes. Polls every 5s.
- **`useCardData()`** — Fetches and caches `cardData.json`. Returns all 292 cards.
- **`useToast()`** — Context-based toast notifications.
- **`activePage`** — Current page state in App.tsx, drives content rendering.

## Build & Deploy

- **Dev**: `npm run dev` → Vite HMR on port 5174
- **Build**: `npm run build` → Static output in `dist/`
- **Deploy**: Static hosting (Vercel, Netlify, IPFS). No server required.
- **Chain**: Anvil for dev (localhost:8545), ETH mainnet for Mumu Frens v2
