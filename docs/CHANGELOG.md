# Changelog

## 2026-02-14

### Card Detail Modal
- **Card click opens modal directly** — no more Details button / expand panel
- **Fly-in animation** — modal scales from clicked card's grid position to center screen
- **75vw width** — larger modal (320px card + 520px info panel)
- **Tabs:** Stats, Activity, Chart
- **Price chart** — SVG sparkline with gold gradient, 24h simulated data
- **Stake/Unstake buttons** in modal action bar
- **Share links** — `/#whirlpool-stake?card=card-name` deep links per card
- **Fix:** Correct card now opens (was showing wrong card due to name mismatch)

### Mumu Frens v2
- **Mint success modal** — confetti animation, shows actual minted NFT images
- **Transfer event parsing** — reads token IDs from tx receipt logs (handles Scatter randomizer)
- **Token ID display** — shows minted #IDs below NFT images
- **Etherscan + OpenSea links** in success modal

### Navigation
- **`#hero` hash** — URL updates to `#hero` when returning to hero view
- **Back button fix** — pressing back from hero now correctly scrolls to content page
- **Modal close** resets URL to `#whirlpool-stake` (strips `?card=` param)
- **Hash query params** — parser correctly strips `?card=` when routing to page

### Polish
- **Toast notifications** — success/error/info for all mint/stake/swap actions
- **Animated supply bar** — gold glow pulse on supply change, 15s poll
- **Page titles** — dynamic `document.title` on navigation
- **URL hash navigation** — full browser back/forward support

## 2026-02-13

### Card Data
- Extracted 69 move names from flavor text into subtitle field
- Generated flavor text + moves for 163 auto-generated cards via Gemini
- Filled 118 blank move names + 145 blank subtypes
- Deduplicated: 345 → 292 cards
- Resized all card art to max 1024px wide (394MB → 289MB)
- Merged Phoenix → Feelsix (duplicate art)
- Fixed bracket-contaminated subtypes

### WavesCard Component
- Built standalone `WavesCard.tsx` with inline styles
- `CardFromData.tsx` wrapper for loading by name
- `useCardData.ts` hook for cardData.json
- Replaced `<img>` tags in StakingDashboard + SwapPage with WavesCard renders
- Increased card sizes to 330px, grid min 360px

### Mumu Frens v2 Integration
- Built mint sidebar into MumuGallery (80/20 layout)
- Added ETH mainnet chain + transport to wagmi config
- Investigated contract: Scatter/Archetype pattern, 0.025 ETH, 100 max

## 2026-02-12

### batchSwapStake
- Confirmed `batchSwapStake` already exists in WhirlpoolStaking.sol
- 6 dedicated tests, all 51 contract tests passing

### ERC-1142 v0.1.0
- Published to GitHub (tag: v0.1.0-review)
- 3-contract split: SurfSwap (8.9KB) + WhirlpoolStaking (15.1KB) + WhirlpoolRouter (12.2KB)
- 45/45 tests passing
