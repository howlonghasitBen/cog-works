# ⚙️ Cog Works

A steampunk-themed React frontend for the **Whirlpool AMM** ([ERC-1142](https://github.com/howlonghasitBen/erc-1142)) and **Mumu Frens v2** NFT collection. Built around a radial gear navigation system with card staking, token swapping, and NFT minting — all wrapped in a dark metallic aesthetic with gold accents.

> **Stack:** React 18 · Vite · TypeScript · wagmi v2 · viem · Framer Motion  
> **Repo:** [github.com/howlonghasitBen/cog-works](https://github.com/howlonghasitBen/cog-works)  
> **Contracts:** [github.com/howlonghasitBen/erc-1142](https://github.com/howlonghasitBen/erc-1142)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Contract Integration](#contract-integration)
- [Quick Start](#quick-start)
- [Card Data Pipeline](#card-data-pipeline)
- [Theme & Design System](#theme--design-system)
- [Key Files](#key-files)
- [Development Notes](#development-notes)
- [License](#license)

---

## Overview

Cog Works is the frontend for **SURF Waves Cards** — a 292-card trading card game where every card is backed by its own ERC-20 token, paired in an AMM pool with $WAVES. Players can:

- **Stake** WAVES into cards to earn LP shares + staking rewards
- **Swap** positions between cards atomically (swapStake)
- **Trade** card tokens through the SurfSwap AMM (bonding curve pricing)
- **Cash out** to ETH through multi-hop routing (card → WAVES → WETH)
- **Mint** new cards that auto-deploy a token + AMM pool
- **Claim** rewards from global fee distribution + per-card staking

The contract system (ERC-1142) uses a 3-contract split architecture:
- **GlobalRewards** — Weight registry + ETH mint fee hub
- **CardStaking** — Card token staking, ownership tracking, LP shares
- **WethPool** — WETH/WAVES LP with share-based staking + proportional withdrawal

---

## Features

### 🌀 Whirlpool Staking Dashboard

The main view — a grid of all 292 cards sourced from on-chain data (primary) enriched with `cardData.json` (visual metadata).

- **292-card grid** with WavesCard render (stats, art, flavor text, move names)
- **WETH Pool card** — stake ETH into the WETH/WAVES pool, view shares + claimable dual-token withdrawal (WETH + WAVES), live reserve display
- **Card Detail Modal** — click any card:
  - Full WavesCard render with stats orbs (HP/Mana/Crit) and ATK/DEF badges
  - **Stats tab**: reserves, owner, your effective balance + raw shares, contract address
  - **Activity tab**: real on-chain Staked/Unstaked/OwnerChanged events (via event logs, not mock data)
  - **Chart tab**: SVG sparkline price chart with gold gradient
  - **Actions**: Stake / Unstake / Share link
  - Fly-in animation from clicked card's grid position
- **Deep links** — every card is shareable: `/#whirlpool-stake?card=aboleth`
- **Search, filter, sort** — by name, ownership, stake amount, risk level
- **Rewards** — pending global rewards, claim all, per-card breakdown
- **Live updates** — event-driven (watches Staked/Unstaked/OwnerChanged/Swap events) with 30s poll fallback
- **Shared cache** — module-level card state with 2-min TTL, no reload when switching pages

### 🔄 Whirlpool Swap

Three-column gold steampunk interface for trading card positions.

- **Your Inventory** — cards you own (staked + wallet), checkboxes to select
- **Swap Stage** — selected source cards, target selector, execute swap
  - **swapStake** for staked positions (atomic, no intermediary)
  - **AMM swap** for wallet balances (card → WAVES → card)
  - **batchSwapStake** for consolidating multiple cards into one
- **Market Browse** — all available cards in a grid
  - Click to select as swap target
  - Hover for real on-chain activity feed overlay
- **WAVES token input** — add $WAVES alongside card tokens in a swap
- **Slippage estimates** — client-side constant product AMM math:
  - Price impact display with color coding (🟢 <2%, 🟡 2-5%, 🔴 >5% ⚠️)
  - Two-hop estimates for card→ETH (card → WAVES → WETH)
  - Updates live as you adjust amounts
- **Cash Out to ETH** — dropdown with two modes:
  - **$WAVES → ETH**: Direct WAVES→WETH swap
  - **Card Token → ETH**: Auto-unstakes all shares → swaps wallet balance → ETH
  - Shows estimated ETH output, intermediate WAVES, price impact
  - MAX button, balance breakdown (wallet + staked + total ≈ WAVES value)
- **Effective balance display** — shows actual token value (`effectiveBalance()`) not raw LP shares (shares diverge from tokens after trading; Card 0 showed 36.7% divergence after just 3 trades)

### 🐄 Mumu Frens v2

Combined NFT gallery (80%) and mint sidebar (20%).

- **Gallery** — grid of all 100 Mumu Frens v2 images with metadata
- **Mint sidebar** — vertically centered:
  - Connect wallet (ETH mainnet required)
  - Quantity selector (1–10)
  - Price display (0.025 ETH each)
  - Animated supply bar with gold glow pulse
  - Mint button → on-chain transaction
- **Mint success modal** — confetti animation, actual minted NFT images + token IDs (parsed from Transfer events to handle Scatter's random reveal), Etherscan + OpenSea links
- **Contract**: `0x0B202E6232F976D5a78A731cD621b82199F3D1be` on ETH mainnet

### 🎯 Card Creation (Mint Page)

Editor for creating new SURF Waves Cards.

- **CogPartSelector** + **CogPartEditor** — steampunk card editor
- **Live preview** via WavesCard component
- **Vite plugin API** — POST `/api/mint-card` saves card to `cardData.json` + generates ERC-721 metadata before on-chain tx
- **Duplicate name prevention** — 409 error if name exists (case-insensitive, also enforced on-chain)
- **Mint success modal** — confetti, card preview via CardFromData, tx hash link

### 🧭 Navigation

- **GearHero** — full-screen parallax hero with central gear and orbiting satellite cogs
- **Scroll-snap** zones for hero ↔ content transitions
- **URL hash routing** — `#hero`, `#whirlpool-stake`, `#whirlpool-swap`, `#mumu-v2`, etc.
- **Browser back/forward** support with animation locking (prevents snap interference)
- **Dynamic page titles** — `document.title` updates on navigation

### 🔔 System-wide Polish

- **Toast notifications** — success/error/info, tied to actual tx state (not optimistic), correct token symbols (e.g. "500 $CARD5 Staked")
- **Framer Motion** animations throughout
- **Responsive card grid** — CSS Grid with min 360px columns

---

## Architecture

```
src/
├── components/
│   ├── GearHero.tsx          # Parallax hero + satellite cog navigation
│   ├── CogMenu.tsx           # Radial gear menu with spring animations
│   ├── CogSidebar.tsx        # Collapsible sidebar with spinning cog icons
│   ├── CogDonut.tsx          # Donut chart for staker distribution
│   ├── CogPartSelector.tsx   # Steampunk part picker (card editor)
│   ├── CogPartEditor.tsx     # Field editor for card attributes
│   ├── WavesCard.tsx         # Standalone card render — all inline styles
│   ├── CardFromData.tsx      # Loads card from cardData.json by name
│   ├── CardDetailModal.tsx   # Full card detail overlay (stats/activity/chart)
│   ├── Toast.tsx             # ToastProvider context + useToast hook
│   └── WhirlpoolTerminal.tsx # Terminal-style event log
├── pages/
│   ├── StakingDashboard.tsx  # Card grid, staking, rewards, WETH pool, modals
│   ├── SwapPage.tsx          # 3-col swap + cash out + slippage estimates
│   ├── MumuGallery.tsx       # NFT gallery + mint sidebar + success modal
│   ├── MumuMint.tsx          # Standalone mint page (legacy)
│   └── MintPage.tsx          # Card creation editor + mint pipeline
├── hooks/
│   ├── useWhirlpool.ts       # On-chain state — shared cache, event watchers
│   ├── useCardData.ts        # Loads + caches cardData.json (292 cards)
│   └── usePaletteExtractor.ts # Color extraction for card theming
├── contracts/
│   ├── erc1142.ts            # ABIs + addresses for all contracts
│   └── wagmi-config.ts       # Chain config (Anvil + ETH mainnet)
├── App.tsx                   # Root: hero, routing, scroll-snap, hash nav
└── main.tsx                  # Entry with wagmi + QueryClient providers
```

### Data Flow

```
On-chain (primary)                     cardData.json (enrichment)
┌─────────────────────┐               ┌──────────────────────────┐
│ CardStaking.cards[]  │               │ 292 cards:               │
│ · id, name, symbol   │               │ · art paths, flavor text │
│ · reserves, price    │──── merge ───▶│ · stats, rarity, type    │
│ · owner, stakes      │               │ · move names, subtypes   │
│ · effectiveBalance   │               │ · theme/gradient data    │
└─────────────────────┘               └──────────────────────────┘
         │                                       │
         ▼                                       ▼
   useWhirlpool()                         useCardData()
   (shared module-level cache,            (fetch + cache,
    event watchers, 2-min TTL)            backward compat migration)
         │                                       │
         └────────────┬──────────────────────────┘
                      ▼
              StakingDashboard / SwapPage / MintPage
                      │
                      ▼
              WavesCard → CardFromData → CardDetailModal
```

### State Management

No external state library. All state is local (`useState`) or derived (`useMemo`):

| Hook | Scope | Description |
|------|-------|-------------|
| `useWhirlpool()` | Module-level singleton | On-chain reads/writes. Shared `_shared` cache across all consumers. Event watchers (Staked/Unstaked/OwnerChanged/Swap). `_pendingReload` queue for concurrent events. `_currentAddress` module var prevents stale closures. |
| `useCardData()` | Cached fetch | Fetches `cardData.json`, auto-migrates old `subtitle` → `moveName` field. `invalidateCardData()` flushes cache after mints. |
| `useToast()` | Context | Toast notification dispatch (success/error/info). |

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| On-chain data as primary source | New mints appear immediately without cardData.json update |
| `effectiveBalance()` over raw shares | Shares diverge from token value after trading (36.7% observed) |
| Module-level shared cache | Eliminates reload when switching pages; 2-min TTL |
| Event-driven with poll fallback | Instant updates from contract events; 30s poll catches missed events |
| Client-side slippage math | No on-chain quote function needed; uses constant product formula |
| Cash out auto-unstakes all | Partial unstake is complex; full unstake → swap is cleaner |
| All inline styles on SwapPage | Matches steampunk design without Tailwind dependency |
| Vite plugin for mint pipeline | Writes cardData.json + metadata before on-chain tx; no IPFS needed for dev |

---

## Contract Integration

### Option B: 3-Way Contract Split

```
┌─────────────────┐     ┌───────────────┐     ┌────────────┐
│  GlobalRewards   │     │  CardStaking   │     │  WethPool   │
│  (~112 lines)    │     │  (~452 lines)  │     │ (~197 lines)│
│                  │     │                │     │             │
│  Weight registry │◀────│  Card staking  │     │  WETH/WAVES │
│  Mint fee hub    │     │  LP shares     │     │  Share-based │
│  Reward distrib  │     │  Ownership     │     │  Dual-token  │
│                  │     │  Staker list   │     │  withdrawal  │
└─────────────────┘     └───────┬────────┘     └──────┬──────┘
                                │                      │
                        ┌───────▼──────────────────────▼──────┐
                        │            SurfSwap (AMM)            │
                        │  WAVES↔Card swaps, WAVES↔WETH swaps │
                        │  Bonding curve pricing, 0.3% fee     │
                        └──────────────────┬───────────────────┘
                                           │
                        ┌──────────────────▼───────────────────┐
                        │         WhirlpoolRouter               │
                        │  createCard() — deploys token + pool  │
                        │  Duplicate name prevention (on-chain) │
                        │  Distributes mint fee to GlobalRewards│
                        └───────────────────────────────────────┘
```

### Contract Addresses (Anvil Local Deploy)

| Contract | Address | Role |
|----------|---------|------|
| MockWETH | `0x5FbDB...0aa3` | Wrapped ETH (test) |
| WAVES | `0xe7f17...0512` | Platform token |
| GlobalRewards | `0x9fE46...a6e0` | Weight + fee hub |
| SurfSwap | `0xCf7Ed...0Fc9` | AMM router |
| CardStaking | `0xDc64a...cF6C9` | Card staking |
| WethPool | `0x5FC8d...5707` | WETH LP |
| BidNFT | `0x01658...2Eb8F` | Bid NFTs |
| Router | `0xa513E...C853` | Card creation |

### Key Functions Used

**CardStaking:**
- `stake(cardId, amount)` — Stake WAVES, receive LP shares
- `unstake(cardId, shares)` — Burn shares, receive card tokens
- `swapStake(fromCard, toCard, shares)` — Atomic position swap
- `batchSwapStake(fromCards[], toCard, shares[])` — Consolidate multiple positions
- `effectiveBalance(cardId, user)` — Real token value (not raw shares)
- `userCardShares(cardId, user)` — Raw LP shares (for tx calls)
- `claimRewards(cardId)` / `claimRewards()` — Per-card or claim-all

**WethPool:**
- `stakeWETH(amount)` — Share-based WETH staking (1.5x boost)
- `unstakeWETH(shares)` — Returns proportional WETH + WAVES (dual-token LP)
- `claimableWethPool(user)` → `(wethAmount, wavesAmount)` — View claimable amounts
- `userWethShares(user)` — Raw WETH pool shares

**SurfSwap:**
- `swapExact(tokenIn, tokenOut, amountIn, minOut)` — AMM swap with 0.3% fee
- `getPrice(cardId)` — Current WAVES/token price from reserves
- `getWethReserves()` — WETH pool reserve balances

**WhirlpoolRouter:**
- `createCard(name, symbol, tokenURI)` — Deploy token + pool + pay mint fee (0.05 ETH)

### Mumu Frens v2

| | |
|---|---|
| **Contract** | `0x0B202E6232F976D5a78A731cD621b82199F3D1be` |
| **Chain** | ETH Mainnet |
| **Standard** | ERC-721A (Scatter/Archetype) |
| **Price** | 0.025 ETH |
| **Supply** | 100 max |
| **Mint Auth** | Public (`key: 0x0, proof: []`) |

---

## Quick Start

### Frontend Only

```bash
git clone https://github.com/howlonghasitBen/cog-works.git
cd cog-works
npm install
npm run dev        # → http://localhost:5174
```

### Full Stack (Frontend + Contracts)

```bash
# 1. Clone both repos
git clone https://github.com/howlonghasitBen/erc-1142.git
git clone https://github.com/howlonghasitBen/cog-works.git

# 2. Start local blockchain + deploy all contracts + mint 292 cards
cd erc-1142
bash launch-dev.sh
# This starts Anvil, deploys Option B contracts, generates metadata,
# mints all 292 cards from cardData.json, and starts both frontends.
# Addresses are auto-injected into cog-works/src/contracts/erc1142.ts.

# 3. Connect MetaMask to localhost:8545 (chain ID 31337)
# Import Anvil's default private key:
# 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Build for Production

```bash
npm run build      # → dist/
npm run preview    # Preview production build
```

---

## Card Data Pipeline

### How Card Data Flows

1. **`cardData.json`** (292 cards) — single source of truth for visual metadata: art paths, flavor text, stats, rarity, themes, gradients, move names, subtypes
2. **ERC-721 Metadata** — `public/data/metadata/<index>.json` per card, generated by `generate-metadata.py` with gradient attributes and theme in properties
3. **On-chain** — `CardStaking.cards[]` is the primary source for the card list; `cardData.json` enriches with visual data

### Live Minting Pipeline

When a new card is minted via MintPage:

```
User fills card editor
        ↓
POST /api/mint-card (Vite plugin)
  · Checks for duplicate names (409 if exists)
  · Appends card to cardData.json
  · Generates metadata file in public/data/metadata/
        ↓
whirlpool.createCard(name, symbol, tokenURI)
  · On-chain tx deploys card token + AMM pool
  · Router distributes 0.05 ETH mint fee to GlobalRewards
        ↓
invalidateCardData() flushes cache
  · All components re-fetch, new card appears immediately
```

### Card Data Schema

```typescript
interface WavesCardData {
  name: string          // "Aboleth"
  type: string          // "Creature"
  subtype: string       // "Aberration"
  rarity: string        // "rare" | "epic" | "legendary" | "mythic" | etc.
  hp: number            // Hit points (red orb)
  mana: number          // Mana cost (blue orb)
  crit: number          // Crit chance (gold orb)
  atk: number           // Attack stat
  def: number           // Defense stat
  image: string         // Path to art PNG
  flavor: string        // Flavor text (lore)
  subtitle: string      // Card subtitle (beside name in header)
  moveName: string      // Move/attack name (bold, above flavor text)
  token_id?: number     // On-chain token ID (if minted)
  gradient?: object     // Theme gradient data for card border
  theme?: object        // Theme data (CSS properties)
}
```

> **Note:** Old cards in `cardData.json` stored the move name in `subtitle`. The `useCardData` hook auto-migrates: `subtitle` → `moveName`, `subtitle` cleared.

---

## Theme & Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Page background | `#D6DAF0` | Light blue (4chan board style) |
| Panel dark | `#1a1d2e` → `#22252f` | Dark metallic gradient panels |
| Panel mid | `#2a2d3a` | Secondary panels, borders |
| Gold accent | `#c8a55a` / `#b8860b` | Headers, highlights, important values |
| Bronze accent | `#8a6d2b` | Secondary gold elements |
| Purple accent | `#6366f1` / `#818cf8` | Cash out button, WETH pool actions |
| Green | `#4ade80` / `#10b981` | Success, low slippage, positive values |
| Yellow | `#f59e0b` | Warnings, medium slippage, ownership steal |
| Red | `#ef4444` | Errors, high slippage (>5%) |
| Border | `#3a3d4a` | Standard panel borders |

### Typography

| Font | Usage |
|------|-------|
| **Cinzel** (serif) | Headers, titles, section labels |
| **DM Mono** (monospace) | Values, stats, addresses, data |
| **Inter Tight** | Body text (where used) |

### Design Rules

- **All text must be DARK on light backgrounds** (`#D6DAF0`) — no white/light gray text on board bg
- **Sharp corners** — 2-4px border radius (steampunk aesthetic)
- **Inline styles** on SwapPage (no Tailwind) for full design control
- **Gold steampunk palette** with metallic gradients throughout
- **No `overflow: hidden`** on card grid wrappers (causes height collapse to 2px)

### Card Rarity Gradients

| Rarity | Colors |
|--------|--------|
| Common | Gray → Slate |
| Uncommon | Green → Emerald |
| Rare | Blue → Indigo |
| Epic | Purple → Violet |
| Legendary | Gold → Amber |
| Mythic | Cyan → Teal → Purple |

### Stat Orbs

- **HP**: Red orb with glow
- **Mana**: Blue orb with glow
- **Crit**: Gold orb (same gradient as rarity badge) with glow
- All three in one row, centered

---

## Key Files

### Frontend

| File | Description |
|------|-------------|
| `public/data/cardData.json` | **292 cards** — single source of truth for card visuals (~55MB) |
| `public/data/metadata/` | 292 ERC-721 metadata JSON files (0–291) + `index.json` |
| `public/images/card-images/arts/` | Raw card art (336 PNGs, all ≤1024px wide, ~289MB) |
| `public/images/mumuFrensv2Images/` | Mumu Frens v2 (100 PNGs + metadata JSON) |
| `src/contracts/erc1142.ts` | All ABIs + addresses (CardStaking, WethPool, GlobalRewards, SurfSwap, Router, WAVES, WETH) |
| `src/contracts/wagmi-config.ts` | Anvil chain (8545) + ETH mainnet, RPC config |
| `src/hooks/useWhirlpool.ts` | Core hook — shared cache, event watchers, all contract calls |
| `src/hooks/useCardData.ts` | Fetches + caches cardData.json with backward compat migration |
| `src/components/WavesCard.tsx` | Standalone card component — `width` prop (0 = fill parent via ResizeObserver) |
| `src/pages/SwapPage.tsx` | Swap interface with slippage estimates + cash out |
| `vite.config.ts` | Includes `cardMintApi()` plugin for live mint pipeline |

### Contracts (in erc-1142 repo)

| File | Size | Description |
|------|------|-------------|
| `src/GlobalRewards.sol` | ~112 lines | Weight registry + ETH mint fee distribution |
| `src/CardStaking.sol` | ~452 lines | Card staking, ownership, LP shares, staker tracking |
| `src/WethPool.sol` | ~197 lines | WETH LP, share-based, dual-token withdrawal |
| `src/SurfSwap.sol` | | AMM with 0.3% fee, bonding curves |
| `src/WhirlpoolRouter.sol` | | Card creation, duplicate prevention |
| `script/LocalDeploy.s.sol` | | Option B deploy script |
| `scripts/mint-all-cards.sh` | | Mints all 292 cards from cardData.json |
| `scripts/generate-metadata.py` | | Generates ERC-721 metadata with incremental updates |
| `launch-dev.sh` | | Full dev environment: Anvil + deploy + mint + frontend |

---

## Development Notes

### Common Issues

**MetaMask + Anvil nonce desync:**  
"Transaction already imported" errors. Fix: restart Anvil, then clear MetaMask activity tab data (order matters). Code workaround in `ensureApproval`: catches "already imported", waits 1s, rechecks allowance.

**Vite + Puppeteer OOM:**  
On machines with ≤16GB RAM, running Vite dev server alongside Puppeteer's Chromium causes OOM kills. Use `vite build` + static server for screenshots.

**Card grid height collapse:**  
Never use `overflow: hidden` on card grid wrapper divs — causes collapse to 2px. Use `overflow: visible` or remove overflow entirely.

**Shares ≠ Tokens:**  
After trading occurs in a card's pool, `userCardShares(cardId, user)` diverges from actual token value. Always display `effectiveBalance()` to users. Use raw shares only for contract calls (unstake, swapStake).

**Event watcher stale closures:**  
`_currentAddress` is stored at module level (not in closure) so event watcher callbacks always reference the current wallet address.

**queued reloads:**  
If a contract event fires while `loadCards()` is running, `_pendingReload` flag ensures the event isn't dropped — queues and runs after current load finishes.

### Testing

```bash
# Contract tests (51/51 passing)
cd ~/Projects/erc-1142
forge test

# E2E test suite (all swap paths, staking, pool mechanics)
bash /tmp/whirlpool-e2e-test.sh     # 26/28 passed
bash /tmp/frontend-value-test.sh     # Value accuracy verification
```

### Git Notes

- `cardData.json` is 55MB — approaching GitHub's file size warning. Consider Git LFS if it grows further.
- Run `git prune` periodically (repo accumulates unreachable objects from large file updates).

---

## License

MIT
