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

- **0–10% scroll**: Dead zone → snaps back to hero
- **10–50%**: Upper dead zone → snaps to hero
- **50–90%**: Lower dead zone → snaps to content
- **90–100%**: Content fully visible

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

Hashes are pushed via `window.history.pushState`. The `popstate` listener restores pages on back/forward with animation lock to prevent snap interference. Closing the card modal uses `replaceState` (doesn't pollute back button history).

## Data Architecture

### On-Chain Primary, cardData.json for Enrichment

The StakingDashboard and SwapPage iterate `whirlpool.cards` (on-chain) as the primary card list. `cardData.json` provides visual enrichment (art, flavor text, stats, themes). This means newly minted cards appear immediately without needing a cardData.json update.

### Shared Module-Level Cache

`useWhirlpool()` uses a module-level `_shared` object (not React state) as a singleton cache:

```typescript
// Module-level (survives component unmount/remount)
const _shared = {
  cards: [], wavesBalance: '0', wethBalance: '0',
  wethPoolWaves: '0', wethPoolWeth: '0',
  myWethShares: '0', claimableWeth: '0', claimableWaves: '0',
  loading: false, lastLoad: 0, // ... etc
}
const _listeners = new Set<() => void>()
let _currentAddress: string | undefined
let _pendingReload = false
```

- **2-min TTL** (`CACHE_TTL_MS`): Skips reload if cache is fresh and same address
- **Consumer count**: Tracks active hook instances; clears when all unmount
- **`_currentAddress`**: Stored at module level so event watcher closures always use current wallet (not stale)
- **`_pendingReload`**: If an event fires during `loadCards()`, queues a reload for after completion

### Event-Driven Updates

Watches four contract events for instant UI updates:

```typescript
watchContractEvent({ eventName: 'Staked' })
watchContractEvent({ eventName: 'Unstaked' })
watchContractEvent({ eventName: 'OwnerChanged' })
watchContractEvent({ eventName: 'Swap' })
```

30-second polling kept as fallback for missed events.

### Card Data Migration

`useCardData()` handles backward compatibility:
- Old cards stored move name in `subtitle` field
- Hook auto-migrates: `subtitle` → `moveName`, `subtitle` cleared
- New cards have both fields: `subtitle` (header beside name) and `moveName` (bold above flavor text)

## Contract Architecture (Option B)

Three-contract split for extensibility:

```
GlobalRewards (hub)
  ├── Weight registry (addWeight/removeWeight per card)
  ├── ETH mint fee accumulator (distributeMintFee)
  ├── Reward calculation (pendingGlobalRewards)
  └── Operator pattern (CardStaking + WethPool are operators)

CardStaking (card-specific)
  ├── Card token staking (LP shares)
  ├── effectiveBalance() — real token value (shares ≠ tokens after trading)
  ├── Ownership tracking (cardStakers[] + isCardStaker[] per card)
  ├── _findNewOwner() — scans staker list for largest shareholder
  ├── swapStake / batchSwapStake — atomic position swaps
  └── Calls GlobalRewards for weight changes

WethPool (WETH LP)
  ├── Share-based staking (first depositor 1:1, subsequent proportional)
  ├── 1.5x reward boost
  ├── Dual-token withdrawal (unstakeWETH returns WETH + WAVES)
  ├── claimableWethPool(user) → (wethAmount, wavesAmount)
  └── Calls SurfSwap for reserve management

SurfSwap (AMM)
  ├── Bonding curve pricing per card
  ├── 0.3% swap fee (applied on both sides)
  ├── WAVES↔Card and WAVES↔WETH pools
  ├── cardStaking + wethPool immutables (replaces old whirlpool ref)
  └── addToWethReserve / removeFromWethReserve / removeFromWavesWethReserve

WhirlpoolRouter (entry point)
  ├── createCard(name, symbol, tokenURI) — deploy token + pool
  ├── cardNameTaken mapping (case-insensitive, _toLower helper)
  └── distributeMintFee{value: 0.05 ETH}() to GlobalRewards
```

### Why Option B (3-way) Over Option A (2-way)

Chosen because Ben plans **standard edition 1155 mints** per card (each card becomes a collection, mint fees to 1-of-1 stakers). GlobalRewards as a standalone hub enables:
- Future staking types (1155 editions, governance) as new contracts
- Each new staking contract registers as an operator on GlobalRewards
- Weight distribution stays centralized while staking logic is modular

### Frontend Contract Mapping

```typescript
// erc1142.ts
WHIRLPOOL_ADDRESS → CardStaking (backward compat)
CARD_STAKING_ADDRESS → CardStaking
WETH_POOL_ADDRESS → WethPool
GLOBAL_REWARDS_ADDRESS → GlobalRewards
SURFSWAP_ADDRESS → SurfSwap
ROUTER_ADDRESS → WhirlpoolRouter
```

WETH reads/writes → `WETH_POOL_ADDRESS` + `WETH_POOL_ABI`
Card staking reads/writes → `WHIRLPOOL_ADDRESS` + `WHIRLPOOL_ABI`
Global rewards → `GLOBAL_REWARDS_ADDRESS` + `GLOBAL_REWARDS_ABI`

## Slippage Estimation

Client-side constant product AMM math (no on-chain quote function):

```typescript
// Constant product: (x + Δx)(y - Δy) = xy, with 0.3% fee on both sides
function quoteAmmSwap(amountIn, reserveIn, reserveOut) {
  const fee = amountIn * 30 / 10000
  const amtAfterFee = amountIn - fee
  const newReserveIn = reserveIn + amtAfterFee
  const grossOut = reserveOut - (reserveIn * reserveOut) / newReserveIn
  return grossOut - grossOut * 30 / 10000
}

// Card→ETH: two hops
quoteCardToEth(tokens, cardWavesR, cardCardsR, wethWavesR, wethWethR)
// WAVES→ETH: one hop
quoteWavesToEth(wavesAmount, wethWavesR, wethWethR)
```

Price impact = `1 - (effectivePrice / midMarketPrice) × 100`

## Component Hierarchy

```
App
├── GearHero
│   ├── Background (parallax layers)
│   ├── CenterCog (nav_cog.svg)
│   ├── SatelliteCogs[] (orbiting items)
│   ├── CogMenu (radial sub-cog picker)
│   └── LightningBolt (decorative)
├── ContentPage
│   ├── StakingDashboard
│   │   ├── WethPoolCard (stake ETH, shares, claimable WETH+WAVES)
│   │   ├── SearchBar + Filters + Sort
│   │   ├── StatsBar (totals, pending rewards)
│   │   ├── CardGrid → CardFromData[] → WavesCard
│   │   ├── CardDetailModal (Stats/Activity/Chart tabs)
│   │   └── RewardsBreakdown
│   ├── SwapPage
│   │   ├── StatsHeader (portfolio value, card count)
│   │   ├── CashOutDropdown (WAVES→ETH, Card→ETH, slippage estimates)
│   │   ├── InventoryPanel (your cards, WAVES toggle, amount input)
│   │   ├── SwapStage (selected → target, estimate with price impact)
│   │   └── MarketBrowse (all cards grid, hover activity, click to select)
│   ├── MumuGallery
│   │   ├── ImageGrid (80%)
│   │   ├── MintSidebar (20%, vertically centered)
│   │   └── MintSuccessModal (confetti, NFT images, links)
│   └── MintPage
│       ├── CogPartSelector + CogPartEditor
│       ├── CogCardPreview
│       └── MintSuccessModal (card preview, tx hash)
└── ToastProvider → Toast[]
```

## Build & Deploy

- **Dev**: `npm run dev` → Vite HMR on port 5174
- **Full stack**: `bash launch-dev.sh` in erc-1142 repo (Anvil + deploy + mint + both frontends)
- **Build**: `npm run build` → Static output in `dist/`
- **Deploy**: Static hosting (Vercel, Netlify, IPFS). No server required.
- **Chains**: Anvil (31337) for dev, ETH mainnet (1) for Mumu Frens v2
