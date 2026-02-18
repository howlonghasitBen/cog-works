# Changelog

## 2026-02-18

### Slippage Estimates
- **Client-side constant product AMM math** — `quoteAmmSwap()` with 0.3% double fee matching SurfSwap
- **Card→ETH two-hop estimate** — `quoteCardToEth()` chains card→WAVES→WETH with per-hop impact
- **WAVES→ETH estimate** — `quoteWavesToEth()` single-hop estimate
- **Price impact on all flows** — color coded: green <2%, yellow 2-5%, red >5% ⚠️
- **Cash out UI improvements** — card selector shows total tokens + WAVES value, balance breakdown (wallet/staked/total), MAX button, auto-unstake indicator, estimated ETH output box

### Maintenance
- Reset to 292 original cards (removed test mints 292-299)
- JSX ternary syntax fix in cash out panel

## 2026-02-17

### Contract Split (Option B) — 3-Way Architecture
- **GlobalRewards.sol** (~112 lines) — weight registry + ETH mint fee hub
- **CardStaking.sol** (~452 lines) — card staking, LP shares, ownership, staker tracking
- **WethPool.sol** (~197 lines) — WETH LP, share-based, dual-token withdrawal
- SurfSwap updated: `whirlpool` → `cardStaking` + `wethPool` immutables
- WhirlpoolRouter updated: uses ICardStaking + IGlobalRewards
- All interfaces created (ICardStaking, IWethPool, IGlobalRewards, ISurfSwap)
- LocalDeploy.s.sol updated for Option B deploy order
- **51/51 tests pass on split contracts**
- Frontend routed to correct contract addresses (WETH→WethPool, rewards→GlobalRewards)

### Effective Balance
- **`effectiveBalance()` over raw shares** — shares diverge from tokens after trading
- Card 0 showed 36.7% divergence, Card 5 showed 10.6% after 3 trades
- Frontend displays effective balance for users, raw shares for contract calls only
- `CardState.myShares` (raw) + `CardState.myStake` (effective) separation

### Cash Out to ETH
- **"Ξ Cash Out" button** on Market Browse — purple/indigo accent
- **Two modes**: $WAVES→ETH (direct) and Card Token→ETH (multi-hop)
- **Auto-unstakes all shares first** — unstake, reload balance, swap actual wallet tokens
- Debug logging for cash out diagnosis

### WETH Pool (Share-Based)
- **Share-based staking** replaces raw WETH amounts — proportional IL distribution
- **Dual-token withdrawal** — `unstakeWETH` returns both WETH + WAVES (Uniswap-style)
- **`claimableWethPool(user)`** returns (wethAmount, wavesAmount)
- Frontend shows Your Shares, Claimable WETH, Claimable WAVES on pool card
- Overflow scroll on WETH pool card

### Duplicate Prevention
- **On-chain**: `cardNameTaken` mapping with case-insensitive hash + `_toLower` helper
- **Frontend**: Vite plugin returns 409 before tx submission
- Saves gas on duplicate attempts

### Ownership Transfer
- **`cardStakers[]` list + `isCardStaker[]` mapping** per card
- **`_findNewOwner()`** scans staker list for largest shareholder
- Runs on unstake/swapStake/batchSwapStake when owner's shares change

### E2E Testing
- 26/28 tests passed (all swap paths, staking, pool mechanics)
- Frontend value accuracy verified (effective vs shares comparison)

## 2026-02-16

### Shared State & Event-Driven Updates
- **Module-level shared cache** — `_shared` object with 2-min TTL, consumer count, `notifyListeners()` pattern
- **Event watchers** for Staked/Unstaked/OwnerChanged/Swap — instant UI updates
- **Queued reloads** — `_pendingReload` flag prevents dropped updates during concurrent loads
- **`_currentAddress` at module level** — fixes stale closure in event watcher callbacks
- 30s poll kept as fallback

### Swap Improvements
- **Handles both staked shares AND wallet balance** — staked→swapStake, wallet→AMM swap
- **WAVES token selector + amount input** on SwapPage inventory panel
- **Real on-chain events in all activity feeds** — CardDetailModal + SwapPage hover
- **Fixed `claimRewards`** — supports per-card and claim-all

### Toast & Data Fixes
- **Toast reflects actual token** — "500 $CARD5 Staked/Unstaked"
- **Toast tied to tx state** — only fires on success, not optimistic
- **All hook functions re-throw errors** for caller catch/toast
- **Card lookup by ID** not array index — prevents mismatches when cards fail to load

## 2026-02-15

### Live Card Data Pipeline
- **Vite plugin** (`cardMintApi()`) handles POST `/api/mint-card`
- Writes card to `cardData.json` + creates metadata file in `public/data/metadata/`
- Returns 409 for duplicate card names
- `invalidateCardData()` flushes cache after mint

### On-Chain as Primary Source
- **StakingDashboard flipped** — iterates `whirlpool.cards`, cardData.json for enrichment only
- **SwapPage flipped** — same pattern
- New mints appear immediately without cardData.json update

### Subtitle/MoveName Separation
- `WavesCardData.subtitle` = card subtitle (header, beside name, inline with baseline alignment)
- `WavesCardData.moveName` = move/attack name (bold white, above flavor text in flavor box)
- `useCardData` backward compat: old `subtitle` → `moveName`, `subtitle` cleared

### Card Mint Success Modal
- On MintPage only (removed from StakingDashboard — 233 lines deleted)
- Confetti, card preview via CardFromData, tx hash, gold steampunk style
- Fallback card visuals via `buildFallbackCard()` for cards not yet in cardData.json
- Fixed mint button stuck on "Forging" — `setLoading(false)` before `loadCards()`

### Metadata Generation
- `generate-metadata.py` — generates per-card ERC-721 metadata with incremental updates
- `mint-all-cards.sh` — sources all 292 cards from cardData.json (not hardcoded)
- `launch-dev.sh` rewritten for Option B deploy order

### Real On-Chain Data
- **Removed all mock activity data** — CardDetailModal + SwapPage use `getCardEvents`
- **Fixed WAVES→card swap** — was passing same address twice, now uses string keys
- **Fixed card address lookup** — `cards.find(c => c.id === id)` instead of `cards[idx]`
- **CardDetailModal updates live** — derives from `whirlpool.cards.find()` not stale snapshot

### SwapPage Redesign
- **All inline styles** (no Tailwind) — gold steampunk palette
- **Card grids instead of tiny thumbnails** — min-width 250px
- **No modal on market card click** — click selects swap target, activity on hover
- **WavesCard fill-parent mode** (`width={0}`) with ResizeObserver
- **Fixed overflow collapse** — removed `overflow: hidden` on grid wrappers
- **Fixed duplicate React keys** — use `card.name` not `card.id`

### WETH Pool Card
- First card on StakingDashboard
- Stake ETH (auto-wraps to WETH), show balance, reserves
- Buy WAVES button loads WETH→WAVES pool into swap stage
- "Already imported" approval error handling

## 2026-02-14

### Card Detail Modal
- **Card click opens modal directly** — no Details button / expand panel
- **Fly-in animation** from clicked card's grid position to center screen
- **75vw width**, single card instance (no duplicate flying card)
- **Tabs:** Stats, Activity (real events), Chart (SVG sparkline)
- **Stake/Unstake buttons** in modal action bar
- **Share links** — `/#whirlpool-stake?card=card-name` deep links

### Mumu Frens v2
- **Mint success modal** — confetti, actual minted NFT images
- **Transfer event parsing** — token IDs from tx receipt (handles Scatter randomizer)
- **Etherscan + OpenSea links** in success modal

### Navigation
- **`#hero` hash** — URL updates to `#hero` when returning to hero
- **Back button fix** — from hero scrolls to content page correctly
- **Modal close** uses `replaceState` (strips `?card=` without polluting history)
- **Hash query params** — parser strips `?card=` for page routing

### Polish
- **Toast notifications** — context-based, no external library
- **Animated supply bar** — gold glow pulse, 15s poll
- **Dynamic page titles** on navigation
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
