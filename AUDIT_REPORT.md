# Cog Works Frontend Audit Report (Research Purposes)

**Date**: 2026-07-02  
**Auditor**: Grok (via filesystem + code review)  
**Scope**: Full review of `Projects/cog-works` (frontend) in context of patched `erc-1142` contracts.  
**Context**: After familiarization of erc-1142 (src, docs, REVIEW.md) + applying solidity patches from REVIEW.md (primarily zero-staked-cards re-bootstrap in CardStaking.sol). All 51 forge tests passing post-patch.  
**Purpose**: Research / security / correctness audit of integration, logic, UX, risks. Not a paid professional audit.

## Project Overview
- React 18 + TS + Vite frontend for Whirlpool (ERC-1142 AMM + dynamic NFT ownership via staking).
- Deep contract integration via wagmi/viem.
- Primary data: on-chain (CardStaking/Card views + SurfSwap + WethPool + Router) + enrichment from large `cardData.json` (292 cards).
- Key pages: StakingDashboard, SwapPage (incl. batch/swapStake/cash-out), MintPage, Mumu (separate NFT).
- Core logic centralized in `useWhirlpool()` hook (module-level shared cache + event watchers).

**Contracts used** (local Anvil defaults in `src/contracts/erc1142.ts`):
- CardStaking (aliased as WHIRLPOOL)
- SurfSwap
- WethPool
- GlobalRewards
- Router
- Tokens (WAVES, per-card ERC20s, mock WETH)

**Patch impact**: Our re-bootstrap fix in CardStaking.sol (stake/swapStake/batch/unstake/effective + clamps) has **no ABI changes**. Frontend calls (stake/unstake/swapStake/etc + views) remain fully compatible. The fix prevents "stuck ownership / cannot restake after full drain" scenarios that UI could previously hit.

## High-Severity / Notable Risks

1. **No slippage / minAmountOut protection on all AMM swaps**
   - In `useWhirlpool.ts:swap()`: every `swapExact(..., BigInt(0))` — minOut always 0.
   - SwapPage cash-out, handleSwap, buyWaves etc. all flow through this.
   - Client-side `quoteAmmSwap` / `quoteCardToEth` computes impacts but **never enforces** a minOut.
   - On any real network (or high-contention anvil): sandwich / front-running / large swaps can cause major loss.
   - **Recommendation**: 
     - Add user-configurable slippage tolerance (e.g. 0.5-3%).
     - Compute `minOut = quote * (1 - tol)` (in wei) and pass to swapExact + expose in UI.
     - For swapStake (internal accounting) less critical but still surface estimated value loss.

2. **Stale state + reload races in multi-step flows (cash-out, swap)**
   - Cash-out (card mode): `unstake` + `loadCards` + read new balance + `swap`. Relies on sequential awaits but UI state can lag.
   - handleSwap loops individual txs + final load.
   - `_pendingReload` + module cache mitigates somewhat, but no atomic "optimistic + revert on fail" or tx simulation.
   - **Risk**: User sees incorrect "myBalance" or double-spends intent in UI.
   - **Recommendation**: After critical multi-tx, force full reload + show pending tx list. Consider viem simulateContract before txs for preflight.

3. **Hardcoded local-only contract addresses + limited chain handling**
   - All addresses in `erc1142.ts` are Anvil 31337 values (injected by launch-dev.sh presumably).
   - `wagmi-config.ts` declares mainnet but no prod addresses or address book switching.
   - `ensureAnvilChain` + chainId checks assume local dev.
   - **Recommendation**: Add env / config for mainnet/testnet addresses. Detect chain and warn/disable risky actions on wrong net. Support for multiple deployments.

## Medium-Severity / Correctness

- **Client quote math vs on-chain divergence**: Quotes use simplified constant product + fee, but ignore some internal stakedCards / rounding in SurfSwap + the fact staked positions use effectiveBalance. For large stakes this may mislead "wouldSteal" or output estimates. After trades, shares vs tokens diverge (UI correctly prefers effective in places).
- **Batch swap path**: UI `handleSwap` does per-card loops calling `swapStake`/`swap` instead of `batchSwapStake`. batchSwapStake exists in hook/ABI and is more gas efficient + atomic for multi. Missed optimization + potential partial failure exposure.
- **Event watching + getCardEvents**:
  - Watches only trigger full `loadCardsShared` (no delta updates).
  - `getCardEvents` (for modal Activity tab) re-fetches logs `fromBlock: 0n` every open — scales poorly if history grows.
  - Manual event definitions (instead of pulling from ABI) — risk of drift.
- **Error handling**: Many broad `catch (e: any)`, silent `/* ignore */` on reads (WETH reserves etc.), `console.error` only. User may not see transient RPC issues.
- **Approval always maxUint256**: OK for this app, but no per-tx amount approval (gas waste on first use only).
- **Ownership / re-bootstrap UI**: Now safe due to patch. Previously a full unstake + later stake could have failed in certain drain paths. Good that patch landed before prod.
- **WETH bootstrap risk**: Frontend does not specially warn on first WETH staker (per REVIEW.md item 7). Cash-out / stakeWETH paths don't surface the 500 WAVES virtual bootstrap arb risk.

## Low-Severity / Polish / DevEx

- **prompt() / alert-style UX** in StakingDashboard (stake/unstake amounts). Replace with modals / forms.
- **Large static assets**: `cardData.json` ~55MB, hundreds of PNGs. Impacts load times, git, hosting. Consider lazy/image CDN / IPFS for arts.
- **npm audit**: Moderate vulns in dev/build deps (`@babel/core`, `esbuild` dev-server, `file-type` via vibrant/jimp for palette extraction). Runtime deps (react19, wagmi3, viem2, TS5) look clean. Run `npm audit fix` selectively.
- **TypeScript looseness**: `as any` (chain, logs), many `as bigint` casts after readContract. Good for speed but brittle.
- **No on-chain simulation / gas estimation visible** to user before big actions (createCard 0.05ETH, multi-swaps).
- **Mint pipeline (Vite plugin)**: Relies on local `/api/mint-card` POST that mutates json on disk. Works only in dev server; prod minting would need backend.
- **Duplicate name check**: Done both client (Vite plugin) + on-chain in Router. Good defense in depth.
- **Mumu Frens integration**: Separate (mainnet contract) from Whirlpool. No cross-contamination observed.

## Positive / Well-Designed

- Excellent separation: on-chain truth + json enrichment. New mints appear instantly.
- Shared module cache + TTL + event-driven reloads: avoids thrash when navigating.
- Correct distinction `myStake` (effectiveBalance) vs `myShares` (for calls).
- Slippage *display* + color coding (green/yellow/red) present in SwapPage.
- Reentrancy handled in contracts; frontend awaits receipts.
- Comprehensive test coverage on contract side (51/51).
- Inline styles + custom theme consistent for the steampunk aesthetic.
- Handles "shares diverge from tokens" explicitly in docs + UI.

## Integration Notes (post erc-1142 patch)

- Patched functions (`_stakeInternal`, `swapStake`, `batchSwapStake`, unstake calcs, effectiveBalance) now gracefully re-bootstrap when `currentStaked==0`.
- No changes required in cog-works.
- Recommend adding a test scenario or UI note for "restake after full exit" in research builds.
- Update `cog-works/docs/CHANGELOG.md` or README if desired to reference the erc-1142 REVIEW fix.

## Recommendations (Prioritized)

1. **Implement minOut + slippage tolerance** everywhere swapExact is called. Pass computed min from quotes.
2. Adopt `batchSwapStake` in multi-card swap flows.
3. Add chain/address config + mainnet support (or explicit "devnet only" banners).
4. Improve error surfacing + add tx simulation preflight.
5. Add first-WETH-staker warning banner (cross-ref erc-1142 REVIEW).
6. Clean up logs / fromBlock 0 queries for Activity (use indexed filters + recent blocks).
7. Replace prompt() inputs with proper forms.
8. `npm audit fix` (dev only) + consider pinning image processing deps.
9. Consider adding a "dry-run" / quote-only mode + gas estimates.
10. For research: fuzz frontend math against on-chain (e.g. the e2e scripts mentioned in README).

## Files Reviewed (key)
- `src/hooks/useWhirlpool.ts` (core)
- `src/contracts/erc1142.ts` (ABIs/addresses)
- `src/pages/SwapPage.tsx` (swap/cashout math)
- `src/pages/StakingDashboard.tsx`
- `src/hooks/useCardData.ts`
- `src/App.tsx`, `main.tsx`
- package.json, README, docs/*.md
- Cross-checked against erc-1142/src/CardStaking.sol, SurfSwap.sol, etc. + REVIEW.md

## Iteration 2 (Follow-up Pass)
In response to further iteration request:
- Implemented **real slippage tolerance controls** (0.1%–2% presets + live "Guaranteed min receive" calculation).
- All AMM `swapExact` calls (swaps, cash-out, buy WAVES) now pass a protected `minAmountOut`.
- Hooked up the new on-chain `isWethPoolSeeded()` view (surfaced via `useWhirlpool`).
- Extended SurfSwap ABI in frontend.
- Updated swapEstimate and UI to surface the post-slippage guarantee.
- Custom errors, locked min liquidity, and protocol WETH seed landed in contracts (see erc-1142/SECURITY.md).

This directly closes the top "High" finding from the previous audit.

## Conclusion
Both paired repos have been significantly iterated:
- erc-1142: All critical/high issues from the detailed report fixed + modernized with custom errors + proper bootstrapping + locked liquidity.
- cog-works: Slippage protection implemented + contract view integration.

The system is now materially safer and more user-protective while remaining true to the original steampunk/research vision.

**51/51 contract tests green.** 

Still research software — professional audit recommended before any real value.

---
*This report was generated as part of the user request to familiarize, patch, then audit. Further manual review or tool-assisted (Slither, Echidna on contracts; Playwright on frontend) recommended for deeper coverage.*