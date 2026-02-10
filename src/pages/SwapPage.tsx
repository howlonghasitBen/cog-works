/** SwapPage — NFT Swap interface
 *
 * 3-column layout:
 *  Left:   My Inventory (owned cards grid + search)
 *  Center: Swap Stage (offer card → receive card, arrows, initiate button)
 *  Right:  Market Search (browse available cards, request swaps)
 */

import { useState, useMemo } from 'react'

// ─── Mock Data ──────────────────────────────────────────────────
interface CardData {
  id: number
  name: string
  number: number
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  type: string
  image: string
  tags: string[]
}

const CARD_IMAGES = [
  'https://picsum.photos/seed/card1/200/280',
  'https://picsum.photos/seed/card2/200/280',
  'https://picsum.photos/seed/card3/200/280',
  'https://picsum.photos/seed/card4/200/280',
  'https://picsum.photos/seed/card5/200/280',
  'https://picsum.photos/seed/card6/200/280',
  'https://picsum.photos/seed/card7/200/280',
  'https://picsum.photos/seed/card8/200/280',
  'https://picsum.photos/seed/card9/200/280',
  'https://picsum.photos/seed/card10/200/280',
  'https://picsum.photos/seed/card11/200/280',
  'https://picsum.photos/seed/card12/200/280',
]

const NAMES = [
  'Fire Dragon', 'Ether Knight', 'Cyber Samurai', 'Swamp Thing',
  'Ice Wizard', 'Stone Golem', 'Forest Elf', 'Shadow Rogue',
  'Thunder Giant', 'Aqua Serpent', 'Void Walker', 'Crystal Mage',
]

const TYPES = ['Fire Nature', 'Epic Magic', 'Rare Nature', 'Dark Shadow', 'Ice Frost', 'Earth Stone']
const RARITIES: CardData['rarity'][] = ['Common', 'Rare', 'Epic', 'Legendary']
const TAGS = ['Blue Eyes', 'Mage', 'Nature', 'Fire', 'Ice', 'Dragon', 'Warrior', 'Epic']

function generateCards(count: number, startId: number): CardData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    name: NAMES[i % NAMES.length],
    number: Math.floor(Math.random() * 99) + 1,
    rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)],
    type: TYPES[Math.floor(Math.random() * TYPES.length)],
    image: CARD_IMAGES[i % CARD_IMAGES.length],
    tags: [TAGS[Math.floor(Math.random() * TAGS.length)], TAGS[Math.floor(Math.random() * TAGS.length)]],
  }))
}

const MY_CARDS = generateCards(8, 1)
const MARKET_CARDS = generateCards(6, 100)

// ─── Rarity colors ─────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  Common: '#9ca3af',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
}

// ─── Mini Card Component ────────────────────────────────────────
function MiniCard({
  card,
  onClick,
  selected,
  size = 'normal',
}: {
  card: CardData
  onClick?: () => void
  selected?: boolean
  size?: 'normal' | 'large'
}) {
  const w = size === 'large' ? 'w-40' : 'w-[130px]'
  const h = size === 'large' ? 'h-52' : 'h-[175px]'

  return (
    <div
      className={`relative ${w} cursor-pointer group flex-shrink-0`}
      onClick={onClick}
    >
      <div
        className={`relative ${h} rounded-lg overflow-hidden border-2 transition-all duration-200 ${
          selected
            ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
            : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        {selected && (
          <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
            <span className="bg-gray-900/80 text-cyan-400 text-xs font-bold px-3 py-1 rounded">SELECTED</span>
          </div>
        )}
      </div>
      <p className="text-white text-xs font-semibold mt-1.5 truncate">{card.name} #{card.number}</p>
      <p className="text-xs truncate" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
    </div>
  )
}

// ─── Stage Card (larger, with X button) ─────────────────────────
function StageCard({
  card,
  onRemove,
  label: _label,
}: {
  card: CardData | null
  onRemove?: () => void
  label: string
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative w-44 h-56 rounded-xl overflow-hidden border-2 ${
          card ? 'border-cyan-500/60' : 'border-dashed border-gray-600'
        } bg-gray-800/50 flex items-center justify-center`}
      >
        {card ? (
          <>
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            {onRemove && (
              <button
                onClick={onRemove}
                className="absolute top-2 right-2 w-6 h-6 bg-gray-900/80 hover:bg-red-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </>
        ) : (
          <span className="text-gray-600 text-sm">Drop card here</span>
        )}
      </div>
      {card && (
        <div className="text-center mt-2">
          <p className="text-white text-sm font-semibold">{card.name} #{card.number}</p>
          <p className="text-xs" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
        </div>
      )}
    </div>
  )
}

// ─── Arrow Down SVG ─────────────────────────────────────────────
function ArrowsDown() {
  return (
    <div className="flex items-center justify-center gap-6 my-3">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
        <path d="M12 0v24M4 18l8 8 8-8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
        <path d="M12 0v24M4 18l8 8 8-8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ─── Market Card Row ────────────────────────────────────────────
function MarketRow({
  card,
  onRequest,
  requested,
}: {
  card: CardData
  onRequest: () => void
  requested: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
      <div className="w-16 h-20 rounded-md overflow-hidden border border-gray-700 flex-shrink-0">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{card.name} #{card.number}</p>
        <p className="text-xs" style={{ color: rarityColor[card.rarity] }}>{card.rarity} {card.type}</p>
      </div>
      <button
        onClick={onRequest}
        className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
          requested
            ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
        }`}
      >
        {requested ? 'REQUESTED' : 'Request'}
      </button>
    </div>
  )
}

// ─── Main SwapPage ──────────────────────────────────────────────
export default function SwapPage() {
  const [inventorySearch, setInventorySearch] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [offerCard, setOfferCard] = useState<CardData | null>(null)
  const [receiveCard, setReceiveCard] = useState<CardData | null>(null)
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set())
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return MY_CARDS
    const q = inventorySearch.toLowerCase()
    return MY_CARDS.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
  }, [inventorySearch])

  const filteredMarket = useMemo(() => {
    let cards = MARKET_CARDS
    if (marketSearch) {
      const q = marketSearch.toLowerCase()
      cards = cards.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
    }
    if (activeTags.size > 0) {
      cards = cards.filter(c => c.tags.some(t => activeTags.has(t)))
    }
    return cards
  }, [marketSearch, activeTags])

  const handleInventoryClick = (card: CardData) => {
    if (offerCard?.id === card.id) {
      setOfferCard(null)
    } else {
      setOfferCard(card)
    }
  }

  const handleRequest = (card: CardData) => {
    setRequestedIds(prev => {
      const next = new Set(prev)
      if (next.has(card.id)) next.delete(card.id)
      else next.add(card.id)
      return next
    })
    // Also set as receive card
    setReceiveCard(card)
  }

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const canSwap = offerCard && receiveCard

  // Collect all unique tags from market cards
  const allTags = useMemo(() => {
    const s = new Set<string>()
    MARKET_CARDS.forEach(c => c.tags.forEach(t => s.add(t)))
    return Array.from(s)
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8" style={{ marginTop: 60 }}>
      {/* 3-column grid */}
      <div className="grid grid-cols-[1fr_minmax(360px,1.2fr)_1fr] gap-5 min-h-[80vh]">

        {/* ─── LEFT: My Inventory ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-white text-xl font-black tracking-wide mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            MY INVENTORY
          </h2>
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search"
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Card Grid */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <div className="grid grid-cols-2 gap-3">
              {filteredInventory.map(card => (
                <MiniCard
                  key={card.id}
                  card={card}
                  onClick={() => handleInventoryClick(card)}
                  selected={offerCard?.id === card.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── CENTER: Swap Stage ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col items-center">
          <h2 className="text-white text-xl font-black tracking-wide mb-6 self-start" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            SWAP STAGE
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
            {/* YOU OFFER */}
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-black text-lg tracking-wide" style={{ fontFamily: "'Inter Tight', sans-serif", writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                YOU OFFER
              </span>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <StageCard card={offerCard} onRemove={() => setOfferCard(null)} label="YOU OFFER" />
              </div>
            </div>

            <ArrowsDown />

            {/* YOU RECEIVE */}
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-black text-lg tracking-wide" style={{ fontFamily: "'Inter Tight', sans-serif", writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                YOU RECEIVE
              </span>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <StageCard card={receiveCard} onRemove={() => setReceiveCard(null)} label="YOU RECEIVE" />
              </div>
            </div>

            {/* Gas + Swap Button */}
            <div className="mt-6 w-full text-center">
              <p className="text-gray-400 text-sm mb-3">
                Est. Gas: <span className="text-cyan-400 font-mono">0.002 ETH</span>
              </p>
              <button
                disabled={!canSwap}
                className={`w-full py-3.5 rounded-xl text-base font-black tracking-wider transition-all ${
                  canSwap
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                INITIATE SWAP
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Market Search ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-white text-xl font-black tracking-wide mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            MARKET SEARCH
          </h2>
          {/* Search + History */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search"
                value={marketSearch}
                onChange={e => setMarketSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTags.has(tag)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {/* Card List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1" style={{ maxHeight: 'calc(80vh - 180px)' }}>
            {filteredMarket.map(card => (
              <MarketRow
                key={card.id}
                card={card}
                onRequest={() => handleRequest(card)}
                requested={requestedIds.has(card.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
