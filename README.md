# ⚙️ Cog Works

A steampunk-themed React frontend for the **Whirlpool AMM** (ERC-1142) and **Mumu Frens v2** NFT collection. Features a radial gear navigation system, card staking dashboard, token swap interface, and NFT mint gallery — all wrapped in a dark metallic aesthetic with gold accents.

> **Stack:** React 18 · Vite · TypeScript · wagmi v2 · viem · Framer Motion · Tailwind CSS

---

## ✨ Features

### 🌀 Whirlpool Staking
- **292-card grid** sourced from `cardData.json` with on-chain data overlay
- **Card Detail Modal** — click any card to open a full detail view with:
  - Full WavesCard render (stats, flavor text, move names)
  - Stats tab (reserves, owner, your stake/balance)
  - Activity feed (stake/unstake/swap/ownership events)
  - Price chart (SVG sparkline, 24h view)
  - Stake / Unstake / Share actions
  - Fly-in animation from grid position
- **Deep links** — every card has a shareable URL: `/#whirlpool-stake?card=aboleth`
- **Search, filter, sort** — by name, ownership, stake amount, risk level
- **Rewards breakdown** — pending rewards, claim all

### 🔄 Whirlpool Swap
- **3-column layout** — your inventory / swap stage / market search
- **swapStake** — atomic position swaps between cards
- **batchSwapStake** — consolidate multiple cards into one (contract-level)
- **Pool explorer** with card info tooltips

### 🐄 Mumu Frens v2
- **Gallery + Mint sidebar** (80/20 layout) with hero GIF
- **On-chain minting** — ETH mainnet, 0.025 ETH per mint, Scatter/Archetype pattern
- **Mint success modal** — confetti animation, shows actual minted NFT images parsed from Transfer events (handles Scatter's random reveal)
- **Live supply bar** with gold glow pulse on change
- **Multi-quantity** minting support

### 🎯 Navigation
- **GearHero** — full-screen parallax hero with central gear and orbiting satellite cogs
- **Scroll-snap** zones for hero ↔ content transitions
- **URL hash routing** — `#hero`, `#whirlpool-stake`, `#mumu-v2`, etc.
- **Browser back/forward** support with smooth scroll transitions
- **Page titles** update dynamically (e.g. "Cog Works — Staking")

### 🔔 Polish
- **Toast notifications** — success/error/info, bottom-right, auto-dismiss
- **Framer Motion** animations throughout (card entrances, modals, panels)
- **Responsive card grid** — min 360px columns, 330px card width

---

## 🏗 Architecture

```
src/
├── components/
│   ├── GearHero.tsx          # Parallax hero + satellite cog navigation
│   ├── CogMenu.tsx           # Radial gear menu with spring animations
│   ├── CogSidebar.tsx        # Collapsible sidebar with spinning cog icons
│   ├── CogDonut.tsx          # Donut chart for staker distribution
│   ├── CogPartSelector.tsx   # Steampunk part picker (card editor)
│   ├── CogPartEditor.tsx     # Field editor for card attributes
│   ├── WavesCard.tsx         # Standalone card render (stats, art, flavor)
│   ├── CardFromData.tsx      # Loads card from cardData.json by name
│   ├── CardDetailModal.tsx   # Full card detail overlay (stats/activity/chart)
│   ├── Toast.tsx             # ToastProvider context + useToast hook
│   └── WhirlpoolTerminal.tsx # Terminal-style event log
├── pages/
│   ├── StakingDashboard.tsx  # Card grid, staking, rewards, card modals
│   ├── SwapPage.tsx          # 3-column swap interface
│   ├── MumuGallery.tsx       # NFT gallery + mint sidebar + success modal
│   ├── MumuMint.tsx          # Standalone mint page (legacy)
│   └── MintPage.tsx          # Card creation editor
├── hooks/
│   ├── useWhirlpool.ts       # On-chain state (cards, stakes, balances)
│   ├── useCardData.ts        # Loads cardData.json (292 cards)
│   └── usePaletteExtractor.ts # Vibrant color extraction for card theming
├── contracts/
│   ├── erc1142.ts            # ABIs + addresses (Whirlpool, SurfSwap, Router)
│   └── wagmi-config.ts       # Chain config (Anvil + ETH mainnet)
├── App.tsx                   # Root: GearHero, routing, scroll-snap, hash nav
└── main.tsx                  # Entry point with wagmi + QueryClient providers
```

### Data Flow

```
cardData.json (292 cards, source of truth)
    ↓
useCardData() hook
    ↓
StakingDashboard / SwapPage
    ↓ overlay
useWhirlpool() — on-chain reserves, stakes, balances, prices
```

- **Card art**: `public/images/card-images/arts/` (336 PNGs, max 1024px wide)
- **Mumu images**: `public/images/mumuFrensv2Images/` (100 PNGs + metadata JSON)
- **Card data**: `public/data/cardData.json` — name, type, subtype, rarity, stats, flavor text, move names, image paths

---

## 🎨 Theme

| Token | Value |
|-------|-------|
| Background | `#D6DAF0` (4chan blue board) |
| Panels | `#2a2d3a → #1a1d2e → #22252f` (dark metallic gradient) |
| Gold accent | `#c8a55a` |
| Bronze accent | `#8a6d2b` |
| Header font | Cinzel (serif, gold) |
| Body font | DM Mono (monospace) |
| Borders | 2px solid `#3a3d4a` |
| Corners | Sharp (2-4px radius) |

---

## 🔗 Contracts

| Contract | Address | Chain |
|----------|---------|-------|
| WhirlpoolStaking | Anvil local deploy | Anvil (31337) |
| SurfSwap (AMM) | Anvil local deploy | Anvil (31337) |
| WhirlpoolRouter | Anvil local deploy | Anvil (31337) |
| Mumu Frens v2 | `0x0B202E6232F976D5a78A731cD621b82199F3D1be` | ETH Mainnet |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### With Whirlpool (local Anvil)

```bash
# In erc-1142 repo:
cd ~/Projects/erc-1142
bash launch-dev.sh    # Starts Anvil + deploys contracts + seeds data

# In cog-works:
npm run dev           # Connects to Anvil at localhost:8545
```

---

## 📁 Key Files

| File | Description |
|------|-------------|
| `public/data/cardData.json` | 292 cards — the single source of truth |
| `public/images/card-images/arts/` | Raw card art (336 PNGs, ≤1024px) |
| `public/images/mumuFrensv2Images/` | Mumu Frens v2 (100 PNGs + JSON metadata) |
| `src/contracts/erc1142.ts` | All contract ABIs and addresses |
| `src/contracts/wagmi-config.ts` | Anvil chain + ETH mainnet config |

---

## 📜 License

MIT
