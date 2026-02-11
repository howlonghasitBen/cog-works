# ⚙️ Cog Works

Drop-in React components for cog-themed navigation menus, interactive pages, and steampunk UI.

## Components

### Navigation
- **`<CogMenu />`** — Radial gear menu with nested submenus and spring animations
- **`<CogSidebar />`** — Collapsible sidebar with spinning cog icons per section
- **`<CogDropdown />`** — Inline gear dropdown with dividers and disabled states
- **`<GearHero />`** — Full-screen parallax hero with central gear + satellite cogs, scroll-driven content transitions

### UI Components
- **`<CogDonut />`** — Donut chart framed by nav_cog.svg, visualizes staker distribution per card token. Hover glow, staggered entrance, gold ripple pulses.
- **`<CogPartSelector />`** — Steampunk-themed part selector with decorative spinning cogs and gold Cinzel headers
- **`<CogPartEditor />`** — Steampunk field editor for card attributes (text, number, select, color, slider fields)

### Pages
- **`<StakingDashboard />`** — Whirlpool card staking overview with card grid, ownership risk meters, rewards breakdown, top-4 holder lists, stake/unstake actions, and SurfSwap navigation
- **`<SwapPage />`** — 3-column Whirlpool swapStake interface with multi-select, pool explorer, and steal mechanics
- **`<MintPage />`** — Card creation page with CogPartSelector + CogPartEditor + live CardPreview
- **`<MumuGallery />`** — Mumu Frens v2 NFT gallery

## Satellites (GearHero Config)

| Satellite | Sub-cogs | Content |
|-----------|----------|---------|
| mumuFrens 🐄 | v1 (scatter.art), v2 (gallery), discord | Animated GIF hero (99 busts) |
| Whirlpool 🌀 | mint, stake, swap | Spinning innard, 15°/s |
| Generic 1-4 ⚙️ | 3 placeholder subs each | — |
| xLinks ✖ | howlonghasitben, surfgod69, wavesTCG | External Twitter links |

## Theme

4chan blue board aesthetic:
- Background: `#D6DAF0` gradient
- Panels: Dark metallic (`#2a2d3a → #1a1d2e → #22252f`)
- Text: Dark on light bg (`#1a1d2e`, `#2a2d3a`, `#4a4d5a`)
- Accents: Gold/bronze (`#8a6d2b`, `#c8a55a`)
- Headers: Cinzel serif, gold
- Body: DM Mono monospace
- Sharp corners (`rounded-sm`), 2px borders, drop shadows

## Quick Start

```bash
npm install
npm run dev
```

## Stack

- React 19 + TypeScript
- Framer Motion (animations)
- Tailwind CSS v4
- Vite

## Assets

- `public/images/nav_cog.svg` — Gear frame for all cog components
- `public/images/mumu-hero.gif` — Animated 99-bust collection GIF
- `public/images/card-images/` — 228 card art images for SwapPage
- `public/images/mumuFrensv2Images/` — 99 full-resolution mumu bust PNGs
- `public/images/surfSwapNoBG.png` — SurfSwap logo (transparent)

## License

MIT
