/** SwapPage — Whirlpool swapStake Interface
 *
 * Visual style from NFT Swapper mockup + ERC-1142 Whirlpool mechanics.
 * 3-column: My Inventory | Swap Stage | Market Search
 */

import { useState, useMemo } from 'react'

// ─── Types ──────────────────────────────────────────────────────
interface Staker {
  address: string
  shares: number
  percentage: number
}

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
  topStakers: Staker[]
  stealAmount: number
  userShares?: number
  userPercentage?: number
  isOwner?: boolean
}

// ─── Mock Data ──────────────────────────────────────────────────
const CARD_IMAGES = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/wcard${i}/200/280`)

function mockAddr(seed: number): string {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 4; i++) s += hex[(seed * (i + 3) * 7) % 16]
  s += '…'
  for (let i = 0; i < 4; i++) s += hex[(seed * (i + 1) * 13) % 16]
  return s
}

const NAMES = ['Fire Dragon', 'Ether Knight', 'Cyber Samurai', 'Swamp Thing', 'Ice Wizard', 'Stone Golem', 'Forest Elf', 'Shadow Rogue', 'Thunder Giant', 'Aqua Serpent', 'Void Walker', 'Crystal Mage']
const TYPES = ['Fire Nature', 'Epic Magic', 'Rare Nature', 'Dark Shadow', 'Ice Frost', 'Earth Stone']
const RARITIES: CardPool['rarity'][] = ['Common', 'Rare', 'Epic', 'Legendary']
const TAGS = ['Blue Eyes', 'Mage', 'Nature', 'Fire', 'Ice', 'Dragon', 'Warrior', 'Epic', 'Legendary']

function generatePools(): CardPool[] {
  return NAMES.map((name, i) => {
    const ownerShares = Math.floor(Math.random() * 800000) + 200000
    const stakers: Staker[] = [
      { address: mockAddr(i * 10), shares: ownerShares, percentage: 0 },
      { address: mockAddr(i * 10 + 1), shares: Math.floor(ownerShares * (0.3 + Math.random() * 0.5)), percentage: 0 },
      { address: mockAddr(i * 10 + 2), shares: Math.floor(ownerShares * (0.1 + Math.random() * 0.3)), percentage: 0 },
    ]
    const totalStaked = stakers.reduce((s, x) => s + x.shares, 0)
    stakers.forEach(s => s.percentage = Math.round((s.shares / totalStaked) * 100))

    return {
      id: i,
      name,
      number: Math.floor(Math.random() * 99) + 1,
      image: CARD_IMAGES[i],
      rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)],
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      owner: stakers[0].address,
      ownerShares,
      totalStaked,
      priceWaves: parseFloat((Math.random() * 0.5 + 0.05).toFixed(4)),
      topStakers: stakers,
      stealAmount: ownerShares - stakers[1].shares + 1,
    }
  })
}

const ALL_POOLS = generatePools()

// User's staked positions
const MY_CARDS: CardPool[] = ALL_POOLS.slice(0, 6).map(pool => ({
  ...pool,
  userShares: Math.floor(pool.ownerShares * (0.2 + Math.random() * 0.6)),
  userPercentage: Math.floor(Math.random() * 40) + 5,
  isOwner: Math.random() > 0.5,
}))

// ─── Colors ─────────────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  Common: '#9ca3af', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
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
      <div className={`relative rounded-sm overflow-hidden border-2 transition-all duration-200 aspect-[5/7] ${
        selected
          ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
          : 'border-gray-700/60 hover:border-[#4a4d60] hover:shadow-lg'
      }`}>
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        {/* Card info overlay */}
        <div className="absolute bottom-0 inset-x-0 p-2">
          <p className="text-white text-xs font-bold leading-tight">{card.name} #{card.number}</p>
          <p className="text-[10px] leading-tight" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
        </div>
        {/* Owner badge */}
        {card.isOwner && (
          <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-[8px] font-black text-black px-1.5 py-0.5 rounded">
            OWNER
          </div>
        )}
        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-cyan-500/15 flex items-center justify-center">
            <span className="bg-gray-900/90 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded border border-cyan-500/50">
              SELECTED
            </span>
          </div>
        )}
        {/* Stake info bar */}
        {card.userShares && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 text-[8px] font-mono text-cyan-400 px-1.5 py-0.5 rounded">
            {(card.userShares / 1000).toFixed(0)}k staked
          </div>
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
    }`} style={{ width: 220, height: 300 }}>
      {card ? (
        <>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-3">
            <p className="text-white text-sm font-bold">{card.name} #{card.number}</p>
            <p className="text-[10px]" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
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
          // Convert vertical scroll to horizontal, stop page scroll
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
            style={{ width: 220, height: 300 }}
          >
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-3">
              <p className="text-white text-sm font-bold">{card.name} #{card.number}</p>
              <p className="text-[10px]" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
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
        <div className="w-24 h-32 rounded-md overflow-hidden border-2 border-[#2a2d40] flex-shrink-0">
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-base font-bold">{card.name} #{card.number}</p>
            {isTarget && (
              <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">TARGETED</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
          {/* Compact staker row */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-gray-500">👑</span>
            <span className="text-xs text-amber-400 font-mono">{card.owner}</span>
            <span className="text-xs text-gray-600">({card.ownerShares.toLocaleString()})</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              Steal: <span className="text-emerald-400 font-mono font-bold">{card.stealAmount.toLocaleString()}</span> tokens
            </span>
            <button
              onClick={onSelect}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                isTarget
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isTarget ? 'Selected' : 'Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main SwapPage ──────────────────────────────────────────────
export default function SwapPage() {
  const [inventorySearch, setInventorySearch] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [targetId, setTargetId] = useState<number | null>(null)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const selectedCards = MY_CARDS.filter(c => selectedIds.has(c.id))
  const targetPool = ALL_POOLS.find(p => p.id === targetId)

  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return MY_CARDS
    const q = inventorySearch.toLowerCase()
    return MY_CARDS.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
  }, [inventorySearch])

  const filteredMarket = useMemo(() => {
    let cards = ALL_POOLS
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
  }, [marketSearch, activeTags])

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
    const totalWavesOut = selectedCards.reduce((sum, p) => sum + Math.floor((p.userShares || 0) * p.priceWaves), 0)
    const tokensOut = Math.floor(totalWavesOut / targetPool.priceWaves)
    const wouldSteal = tokensOut > targetPool.ownerShares
    return { wavesOut: totalWavesOut, tokensOut, wouldSteal, sourceCount: selectedCards.length }
  }, [selectedCards, targetPool])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    TAGS.forEach(t => s.add(t))
    return Array.from(s)
  }, [])

  return (
    <div className="w-full px-4 flex items-stretch justify-between gap-3" style={{ marginTop: 60, minHeight: '100dvh', paddingTop: 24, paddingBottom: 40 }}>

      {/* ─── LEFT: My Inventory ─── */}
      <div className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded p-4 flex flex-col w-full max-w-[440px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ maxHeight: 'calc(100dvh - 100px)' }}>
        <h2 className="text-white text-lg font-black tracking-wide mb-3 pb-2 border-b border-[#2a2d40]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          MY INVENTORY
        </h2>
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search"
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            className="w-full bg-[#121420] border-2 border-[#2a2d40] rounded-sm px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {/* Card Grid — 2 columns, scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
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
        </div>
      </div>

      {/* ─── CENTER: Swap Stage ─── */}
      <div className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded p-5 flex flex-col items-center w-full max-w-[460px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <h2 className="text-white text-lg font-black tracking-wide mb-5 pb-2 border-b border-[#2a2d40] w-full text-center" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          SWAP STAGE
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
            card={targetPool || null}
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
                <span className="text-cyan-400">{swapEstimate.wavesOut.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tokens acquired</span>
                <span className="text-emerald-400">{swapEstimate.tokensOut.toLocaleString()}</span>
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

          <style>{`
            @keyframes shimmer {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      </div>

      {/* ─── RIGHT: Market Search ─── */}
      <div className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded p-4 flex flex-col w-full max-w-[440px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ maxHeight: 'calc(100dvh - 100px)' }}>
        <h2 className="text-white text-lg font-black tracking-wide mb-3 pb-2 border-b border-[#2a2d40]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          MARKET SEARCH
        </h2>
        {/* Search + history button */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search"
              value={marketSearch}
              onChange={e => setMarketSearch(e.target.value)}
              className="w-full bg-[#121420] border-2 border-[#2a2d40] rounded-sm px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <button className="w-10 h-10 bg-[#121420] border-2 border-[#2a2d40] rounded-sm flex items-center justify-center text-gray-400 hover:text-white hover:border-[#4a4d60] transition-colors cursor-pointer">
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
          {filteredMarket.map(card => (
            <MarketRow
              key={card.id}
              card={card}
              onSelect={() => setTargetId(targetId === card.id ? null : card.id)}
              isTarget={targetId === card.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
