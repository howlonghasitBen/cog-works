/** SwapPage — Whirlpool swapStake Interface
 *
 * Visual style from NFT Swapper mockup + ERC-1142 Whirlpool mechanics.
 * 3-column: My Inventory | Swap Stage | Market Search
 */

import { useState, useMemo } from 'react'
import { useWhirlpool } from '../hooks/useWhirlpool'

// ─── Types ──────────────────────────────────────────────────────
interface CardPool {
  id: number
  name: string
  number: number
  image: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  type: string
  owner: string
  ownerShares: number
  totalStaked: number
  priceWaves: number
  topStakers: { address: string; shares: number; percentage: number }[]
  stealAmount: number
  userShares?: number
  userPercentage?: number
  isOwner?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────
const BASE = '/images/card-images'
const TAGS = ['Creature', 'Consumable', 'Eagle', 'Beast', 'OG', 'Legendary', 'Forest', 'Memer']

function cardImage(uri: string, name: string, id: number): string {
  if (uri && uri.startsWith('data:application/json;base64,')) {
    try {
      const json = JSON.parse(atob(uri.split(',')[1]))
      if (json.image) return json.image
    } catch { /* fall through */ }
  }
  if (uri && uri.startsWith('/images/')) return uri
  if (uri && uri.startsWith('ipfs://')) return uri
  const slug = name.replace(/\s+/g, '_')
  return `${BASE}/${String(id + 1).padStart(3, '0')}_${slug}.png`
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || '???'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// ─── Colors ─────────────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  Common: '#9ca3af', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
}

function priceToRarity(price: number): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  if (price >= 1) return 'Legendary'
  if (price >= 0.3) return 'Epic'
  if (price >= 0.1) return 'Rare'
  return 'Common'
}

// ─── Inventory Card (visual, grid-style like mockup) ────────────
function InventoryCard({
  card,
  selected,
  onClick,
}: {
  card: CardPool
  selected: boolean
  onClick: () => void
}) {
  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className={`relative rounded-sm overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
          : 'border-gray-700/60 hover:border-[#4a4d60] hover:shadow-lg'
      }`} style={{ aspectRatio: '3/4' }}>
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        {selected && (
          <div className="absolute inset-0 bg-cyan-500/15 flex items-center justify-center">
            <span className="bg-gray-900/90 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded border border-cyan-500/50">
              SELECTED
            </span>
          </div>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <div className="flex items-center justify-between">
          <p className="text-white text-xs font-bold leading-tight">{card.name} #{card.number}</p>
          {card.isOwner && (
            <span className="bg-amber-500/90 text-[8px] font-black text-black px-1.5 py-0.5 rounded">OWNER</span>
          )}
        </div>
        <p className="text-[10px] leading-tight" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
        {card.userShares !== undefined && card.userShares > 0 && (
          <p className="text-[9px] font-mono text-cyan-400 mt-0.5">{card.userShares.toFixed(2)} staked</p>
        )}
      </div>
    </div>
  )
}

// ─── Stage Card (large, framed, with ✕ button) ──────────────────
function StageCard({
  card,
  onRemove,
  placeholder,
}: {
  card: CardPool | null
  onRemove?: () => void
  placeholder: string
}) {
  return (
    <div className={`relative rounded-sm overflow-hidden border-2 transition-all ${
      card ? 'border-cyan-500/50 bg-[#121420]' : 'border-dashed border-[#3a3d50] bg-[#121420]'
    }`} style={{ width: 220, aspectRatio: '3/4' }}>
      {card ? (
        <>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-3">
            <p className="text-white text-sm font-bold">{card.name} #{card.number}</p>
            <p className="text-[10px]" style={{ color: rarityColor[card.rarity] }}>{card.rarity}</p>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors text-xs cursor-pointer"
            >✕</button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-600 text-xs">{placeholder}</span>
        </div>
      )}
    </div>
  )
}

// ─── Multi Stage Cards (for multi-select) ───────────────────────
function MultiStageCards({
  cards,
  onRemove,
  placeholder,
}: {
  cards: CardPool[]
  onRemove: (id: number) => void
  placeholder: string
}) {
  if (cards.length === 0) {
    return <StageCard card={null} placeholder={placeholder} />
  }
  if (cards.length === 1) {
    return <StageCard card={cards[0]} onRemove={() => onRemove(cards[0].id)} placeholder="" />
  }
  // Scroll carousel for multi-select
  return (
    <div style={{ width: 240 }}>
      <div
        className="flex gap-3 overflow-x-scroll snap-x snap-mandatory pb-2 overscroll-x-contain"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#22d3ee44 transparent', WebkitOverflowScrolling: 'touch' }}
        onWheel={e => {
          e.stopPropagation()
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY
          }
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            className="relative rounded-sm overflow-hidden border-2 border-cyan-500/40 bg-gray-800 flex-shrink-0 snap-center"
            style={{ width: 220, aspectRatio: '3/4' }}
          >
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-3">
              <p className="text-white text-sm font-bold">{card.name} #{card.number}</p>
              <p className="text-[10px]" style={{ color: rarityColor[card.rarity] }}>{card.rarity}</p>
            </div>
            <button
              onClick={() => onRemove(card.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white text-xs cursor-pointer"
            >✕</button>
          </div>
        ))}
      </div>
      <p className="text-cyan-400 text-[9px] font-mono text-center mt-1">{cards.length} selected</p>
    </div>
  )
}

// ─── Cyan Arrows ────────────────────────────────────────────────
function SwapArrows() {
  return (
    <div className="flex items-center justify-center gap-8 my-3">
      <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
        <path d="M10 2v30M3 25l7 7 7-7" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
        <path d="M10 2v30M3 25l7 7 7-7" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ─── Market Card Row (with thumbnail, staker info, request) ─────
function MarketRow({
  card,
  onSelect,
  isTarget,
}: {
  card: CardPool
  onSelect: () => void
  isTarget: boolean
}) {
  return (
    <div className={`p-3 rounded-sm transition-all ${
      isTarget
        ? 'bg-emerald-900/20 border border-emerald-500/40'
        : 'bg-[#121420] border border-[#2a2d40] hover:border-[#3a3d50]'
    }`}>
      <div className="flex gap-3">
        <div className="w-24 rounded-md overflow-hidden border-2 border-[#2a2d40] flex-shrink-0" style={{ aspectRatio: '3/4' }}>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-base font-bold">{card.name} #{card.number}</p>
            {isTarget && (
              <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">TARGETED</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: rarityColor[card.rarity] }}>{card.rarity}</p>
          {/* Compact staker row */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-gray-500">👑</span>
            <span className="text-xs text-amber-400 font-mono">{card.owner}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-gray-500 font-mono">
              Pool: {parseFloat(card.totalStaked.toString()).toFixed(2)}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {card.priceWaves.toFixed(4)} $WAVES
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              Steal: <span className="text-emerald-400 font-mono font-bold">{card.stealAmount.toFixed(2)}</span> tokens
            </span>
            {isTarget ? (
              <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-600/30 text-emerald-400 border border-emerald-500/50">Selected</span>
            ) : (
              <img
                src="/images/surfSwapNoBG.png"
                alt="Request swap"
                onClick={onSelect}
                style={{ width: 28, height: 28, objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.3)' }}
                onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main SwapPage ──────────────────────────────────────────────
export default function SwapPage() {
  const whirlpool = useWhirlpool()
  const [inventorySearch, setInventorySearch] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [targetId, setTargetId] = useState<number | null>(null)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  // Map CardState → CardPool
  const allPools: CardPool[] = useMemo(() => whirlpool.cards.map(c => {
    const price = parseFloat(c.price) || 0
    const totalStaked = parseFloat(c.cardReserve) || 0
    const ownerShares = totalStaked // owner is top staker
    return {
      id: c.id,
      name: c.name,
      number: c.id + 1,
      image: cardImage(c.uri, c.name, c.id),
      rarity: priceToRarity(price),
      type: c.symbol,
      owner: shortAddr(c.owner),
      ownerShares,
      totalStaked,
      priceWaves: price,
      topStakers: [{ address: shortAddr(c.owner), shares: ownerShares, percentage: 100 }],
      stealAmount: Math.max(0, ownerShares * 0.51),
    }
  }), [whirlpool.cards])

  const myCards: CardPool[] = useMemo(() => allPools.filter((_, i) => {
    const c = whirlpool.cards[i]
    return c && (parseFloat(c.myBalance) > 0 || parseFloat(c.myStake) > 0)
  }).map((pool, _i) => {
    const c = whirlpool.cards.find(cc => cc.id === pool.id)!
    const myStake = parseFloat(c.myStake) || 0
    const myBalance = parseFloat(c.myBalance) || 0
    return {
      ...pool,
      userShares: myStake + myBalance,
      userPercentage: pool.totalStaked > 0 ? Math.round((myStake / pool.totalStaked) * 100) : 0,
      isOwner: c.owner.toLowerCase() === whirlpool.address?.toLowerCase(),
    }
  }), [allPools, whirlpool.cards, whirlpool.address])

  const selectedCards = myCards.filter(c => selectedIds.has(c.id))
  const targetPool = allPools.find(p => p.id === targetId) || null

  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return myCards
    const q = inventorySearch.toLowerCase()
    return myCards.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
  }, [inventorySearch, myCards])

  const filteredMarket = useMemo(() => {
    let cards = allPools
    if (marketSearch) {
      const q = marketSearch.toLowerCase()
      cards = cards.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
    }
    if (activeTags.size > 0) {
      cards = cards.filter(c => {
        const cardTags = [c.rarity, c.type.split(' ')[0], c.name.split(' ')[0]]
        return cardTags.some(t => activeTags.has(t))
      })
    }
    return cards
  }, [marketSearch, activeTags, allPools])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const removeSelected = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const canSwap = selectedIds.size > 0 && targetId !== null && !selectedIds.has(targetId)

  const swapEstimate = useMemo(() => {
    if (selectedCards.length === 0 || !targetPool) return null
    const totalWavesOut = selectedCards.reduce((sum, p) => sum + (p.userShares || 0) * p.priceWaves, 0)
    const tokensOut = targetPool.priceWaves > 0 ? totalWavesOut / targetPool.priceWaves : 0
    const wouldSteal = tokensOut > targetPool.ownerShares
    return { wavesOut: totalWavesOut, tokensOut, wouldSteal, sourceCount: selectedCards.length }
  }, [selectedCards, targetPool])

  const handleSwap = async () => {
    if (!canSwap || targetId === null) return
    // For now: swap first selected card's stake to target
    for (const card of selectedCards) {
      const c = whirlpool.cards.find(cc => cc.id === card.id)
      if (c && parseFloat(c.myStake) > 0) {
        await whirlpool.swapStake(card.id, targetId, c.myStake)
      }
    }
  }

  const handleBuyWaves = () => {
    alert('Wrap ETH first (Mint page), then swap WETH → WAVES on SurfSwap')
  }

  const allTags = useMemo(() => {
    const s = new Set<string>()
    TAGS.forEach(t => s.add(t))
    return Array.from(s)
  }, [])

  // No loading gate — show UI immediately, cards fill in progressively

  return (
    <div className="w-full flex items-stretch justify-between gap-3" style={{ marginTop: 60, minHeight: '100dvh', paddingTop: 24, paddingBottom: 40, paddingLeft: 42, paddingRight: 42 }}>

      {/* ─── LEFT: My Inventory ─── */}
      <div className="border-2 border-[#3a3d4a] rounded p-4 flex flex-col w-full max-w-[440px]" style={{ maxHeight: 'calc(100dvh - 100px)', background: 'linear-gradient(180deg, #2a2d3a 0%, #1a1d2e 40%, #22252f 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <h2 className="text-lg font-black tracking-wider mb-3 pb-2 border-b-2 border-[#3a3d4a] uppercase" style={{ fontFamily: "'Cinzel', serif", color: '#c8a55a', textShadow: '0 1px 3px rgba(0,0,0,0.6)', letterSpacing: '0.12em' }}>
          My Inventory
        </h2>
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search"
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            className="w-full rounded-sm px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none transition-colors"
            style={{ background: '#1a1d2e', border: '1px solid #4a4d5a', color: '#d0d0d0', fontFamily: "'DM Mono', monospace" }}
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {/* Card Grid — 2 columns, scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          {filteredInventory.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-12 font-mono">
              {whirlpool.isConnected ? 'No cards in your inventory yet' : 'Connect wallet to see your cards'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredInventory.map(card => (
                <InventoryCard
                  key={card.id}
                  card={card}
                  selected={selectedIds.has(card.id)}
                  onClick={() => toggleSelect(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── CENTER: Swap Stage ─── */}
      <div className="border-2 border-[#3a3d4a] rounded p-5 flex flex-col items-center w-full max-w-[460px]" style={{ background: 'linear-gradient(180deg, #2a2d3a 0%, #1a1d2e 40%, #22252f 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <h2 className="text-lg font-black tracking-wider mb-5 pb-2 border-b-2 border-[#3a3d4a] w-full text-center uppercase" style={{ fontFamily: "'Cinzel', serif", color: '#c8a55a', textShadow: '0 1px 3px rgba(0,0,0,0.6)', letterSpacing: '0.12em' }}>
          Swap Stage
        </h2>

        <div className="bg-[#121420] border border-[#2a2d40] rounded-sm p-3">
          <MultiStageCards
            cards={selectedCards}
            onRemove={removeSelected}
            placeholder="← Select from inventory"
          />
        </div>

        <SwapArrows />

        <div className="bg-[#121420] border border-[#2a2d40] rounded-sm p-3">
          <StageCard
            card={targetPool}
            onRemove={targetPool ? () => setTargetId(null) : undefined}
            placeholder="Browse market →"
          />
        </div>

        {/* Swap estimate + button */}
        <div className="w-full mt-6 space-y-3">
          {swapEstimate && (
            <div className="bg-[#121420] rounded-sm p-3 space-y-1 text-[11px] font-mono">
              {swapEstimate.sourceCount > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Positions merged</span>
                  <span className="text-cyan-400">{swapEstimate.sourceCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">WAVES out</span>
                <span className="text-cyan-400">{swapEstimate.wavesOut.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tokens acquired</span>
                <span className="text-emerald-400">{swapEstimate.tokensOut.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Takes ownership?</span>
                <span className={swapEstimate.wouldSteal ? 'text-amber-400 font-bold' : 'text-gray-400'}>
                  {swapEstimate.wouldSteal ? '⚡ YES' : 'No'}
                </span>
              </div>
            </div>
          )}

          <p className="text-gray-400 text-xs text-center">
            Est. Gas: <span className="text-cyan-400 font-mono">~181k gas (~0.002 ETH)</span>
          </p>

          <button
            disabled={!canSwap}
            onClick={handleSwap}
            className={`group relative w-full py-4 rounded-sm text-base font-black tracking-widest uppercase transition-all duration-300 overflow-hidden ${
              canSwap
                ? 'cursor-pointer border'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed border-2 border-[#2a2d40]'
            } ${
              canSwap && swapEstimate?.wouldSteal
                ? 'border-amber-500/60 text-black hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]'
                : canSwap
                  ? 'border-emerald-500/60 text-white hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                  : ''
            }`}
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {/* Animated gradient background */}
            {canSwap && (
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: swapEstimate?.wouldSteal
                    ? 'linear-gradient(135deg, #f59e0b, #d97706, #f59e0b)'
                    : 'linear-gradient(135deg, #059669, #10b981, #059669)',
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            )}
            {/* Glow pulse on hover */}
            {canSwap && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                background: swapEstimate?.wouldSteal
                  ? 'radial-gradient(circle at center, rgba(245,158,11,0.3), transparent 70%)'
                  : 'radial-gradient(circle at center, rgba(16,185,129,0.3), transparent 70%)',
              }} />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {canSwap && swapEstimate?.wouldSteal && (
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 0L0 14h9v10l13-14h-9V0z" />
                </svg>
              )}
              {canSwap
                ? swapEstimate?.wouldSteal ? 'SWAP TO STEAL' : 'INITIATE SWAP'
                : 'SELECT CARDS TO SWAP'}
            </span>
          </button>

          {/* Buy $WAVES */}
          <button
            onClick={handleBuyWaves}
            className="w-full mt-3 py-3 rounded-sm border-2 border-cyan-500/40 bg-[#121420] text-cyan-400 font-bold text-sm tracking-wider uppercase cursor-pointer transition-all duration-200 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_2px_12px_rgba(34,211,238,0.2)]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Buy $WAVES
          </button>

          <style>{`
            @keyframes shimmer {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      </div>

      {/* ─── RIGHT: Market Search ─── */}
      <div className="border-2 border-[#3a3d4a] rounded p-4 flex flex-col w-full max-w-[440px]" style={{ maxHeight: 'calc(100dvh - 100px)', background: 'linear-gradient(180deg, #2a2d3a 0%, #1a1d2e 40%, #22252f 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <h2 className="text-lg font-black tracking-wider mb-3 pb-2 border-b-2 border-[#3a3d4a] uppercase" style={{ fontFamily: "'Cinzel', serif", color: '#c8a55a', textShadow: '0 1px 3px rgba(0,0,0,0.6)', letterSpacing: '0.12em' }}>
          Market Search <span style={{ fontSize: 11, fontWeight: 400, color: '#4a4d5a', fontFamily: "'DM Mono', monospace" }}>({allPools.length})</span>
        </h2>
        {/* Search + history button */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search"
              value={marketSearch}
              onChange={e => setMarketSearch(e.target.value)}
              className="w-full rounded-sm px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none transition-colors"
              style={{ background: '#1a1d2e', border: '1px solid #4a4d5a', color: '#d0d0d0', fontFamily: "'DM Mono', monospace" }}
            />
          </div>
          <button className="w-10 h-10 rounded-sm flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer" style={{ background: '#1a1d2e', border: '1px solid #4a4d5a' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        {/* Tag filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setActiveTags(prev => {
                  const n = new Set(prev)
                  if (n.has(tag)) n.delete(tag); else n.add(tag)
                  return n
                })
              }}
              className={`px-2.5 py-1 rounded-sm text-[10px] font-medium transition-colors cursor-pointer ${
                activeTags.has(tag)
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-[#2a2d40]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {/* Card list with staker info + request */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
          {filteredMarket.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-12 font-mono">
              {whirlpool.cards.length === 0 ? 'No cards created yet' : 'No cards match your search'}
            </p>
          ) : (
            filteredMarket.map(card => (
              <MarketRow
                key={card.id}
                card={card}
                onSelect={() => setTargetId(targetId === card.id ? null : card.id)}
                isTarget={targetId === card.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
