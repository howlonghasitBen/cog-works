/** SwapPage — Whirlpool swapStake Interface
 *
 * 3-column layout:
 *  Left:   Your Staked Positions (cards you hold stake in)
 *  Center: Swap Stage (swapStake: move position from one card to another)
 *  Right:  Pool Explorer (all cards, top stakers, steal amounts)
 */

import { useState, useMemo } from 'react'

// ─── Mock Data ──────────────────────────────────────────────────
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
  owner: string       // current NFT owner (top staker)
  ownerShares: number
  totalStaked: number  // total card tokens staked
  baseReserve: number  // AMM base reserve (WAVES side)
  cardReserve: number  // AMM card token reserve
  priceWaves: number   // price in WAVES per card token
  topStakers: Staker[]
  stealAmount: number  // tokens needed to overtake current owner
}

const CARD_IMAGES = [
  'https://picsum.photos/seed/pool1/200/280',
  'https://picsum.photos/seed/pool2/200/280',
  'https://picsum.photos/seed/pool3/200/280',
  'https://picsum.photos/seed/pool4/200/280',
  'https://picsum.photos/seed/pool5/200/280',
  'https://picsum.photos/seed/pool6/200/280',
  'https://picsum.photos/seed/pool7/200/280',
  'https://picsum.photos/seed/pool8/200/280',
  'https://picsum.photos/seed/pool9/200/280',
  'https://picsum.photos/seed/pool10/200/280',
]

function mockAddr(seed: number): string {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 4; i++) s += hex[(seed * (i + 3) * 7) % 16]
  s += '…'
  for (let i = 0; i < 4; i++) s += hex[(seed * (i + 1) * 13) % 16]
  return s
}

const NAMES = ['Fire Dragon', 'Ether Knight', 'Cyber Samurai', 'Swamp Thing', 'Ice Wizard', 'Stone Golem', 'Forest Elf', 'Shadow Rogue', 'Thunder Giant', 'Aqua Serpent']
const TYPES = ['Fire Nature', 'Epic Magic', 'Rare Nature', 'Dark Shadow', 'Ice Frost']
const RARITIES: CardPool['rarity'][] = ['Common', 'Rare', 'Epic', 'Legendary']

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
    const stealAmount = ownerShares - stakers[1].shares + 1

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
      baseReserve: Math.floor(Math.random() * 500000) + 100000,
      cardReserve: Math.floor(Math.random() * 3000000) + 1000000,
      priceWaves: parseFloat((Math.random() * 0.5 + 0.05).toFixed(4)),
      topStakers: stakers,
      stealAmount,
    }
  })
}

const ALL_POOLS = generatePools()

// User's staked positions (subset of pools where user has stake)
const USER_ADDR = '0x9370…250Ea'
const USER_POSITIONS = ALL_POOLS.slice(0, 4).map(pool => ({
  ...pool,
  userShares: Math.floor(pool.ownerShares * (0.2 + Math.random() * 0.6)),
  userPercentage: Math.floor(Math.random() * 40) + 5,
  isOwner: Math.random() > 0.5,
}))

// ─── Colors ─────────────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  Common: '#9ca3af', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
}

// ─── Position Card (left panel) ─────────────────────────────────
function PositionCard({
  pool,
  userShares,
  userPercentage,
  isOwner,
  selected,
  onClick,
}: {
  pool: CardPool
  userShares: number
  userPercentage: number
  isOwner: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        selected
          ? 'bg-cyan-900/30 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
          : 'bg-gray-800/40 border border-gray-700/50 hover:border-gray-600'
      }`}
    >
      <div className="w-14 h-18 rounded-md overflow-hidden border border-gray-700 flex-shrink-0">
        <img src={pool.image} alt={pool.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-semibold truncate">{pool.name} #{pool.number}</p>
          {isOwner && (
            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">OWNER</span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: rarityColor[pool.rarity] }}>{pool.rarity} {pool.type}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-gray-400 text-[10px] font-mono">{userShares.toLocaleString()} staked</span>
          <span className="text-cyan-400 text-[10px] font-mono">{userPercentage}% of pool</span>
        </div>
        {/* Mini share bar */}
        <div className="w-full h-1 bg-gray-700 rounded-full mt-1">
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${userPercentage}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Pool Row (right panel) ─────────────────────────────────────
function PoolRow({
  pool,
  onSelect,
  isTarget,
}: {
  pool: CardPool
  onSelect: () => void
  isTarget: boolean
}) {
  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        isTarget
          ? 'bg-emerald-900/20 border border-emerald-500/40'
          : 'bg-gray-800/40 border border-transparent hover:border-gray-700'
      }`}
    >
      <div className="flex gap-3">
        <div className="w-14 h-18 rounded-md overflow-hidden border border-gray-700 flex-shrink-0">
          <img src={pool.image} alt={pool.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">{pool.name} #{pool.number}</p>
          <p className="text-[10px] mt-0.5" style={{ color: rarityColor[pool.rarity] }}>{pool.rarity} {pool.type}</p>
          {/* Stats row */}
          <div className="flex gap-3 mt-1.5 text-[10px] font-mono">
            <span className="text-gray-500">TVL <span className="text-gray-300">{pool.totalStaked.toLocaleString()}</span></span>
            <span className="text-gray-500">Price <span className="text-cyan-400">{pool.priceWaves} W</span></span>
          </div>
        </div>
      </div>

      {/* Top stakers */}
      <div className="mt-2 space-y-1">
        {pool.topStakers.map((s, i) => (
          <div key={i} className="flex items-center text-[10px] font-mono">
            <span className={`w-4 text-center ${i === 0 ? 'text-amber-400' : 'text-gray-600'}`}>{i + 1}</span>
            <span className={`flex-1 ${i === 0 ? 'text-amber-400' : 'text-gray-400'}`}>{s.address}</span>
            <span className="text-gray-500">{s.shares.toLocaleString()}</span>
            <span className="text-gray-600 w-10 text-right">{s.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Steal amount + button */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
        <div>
          <span className="text-[10px] text-gray-500">Steal for </span>
          <span className="text-xs text-emerald-400 font-mono font-bold">{pool.stealAmount.toLocaleString()}</span>
          <span className="text-[10px] text-gray-500"> tokens</span>
        </div>
        <button
          onClick={onSelect}
          className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
            isTarget
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {isTarget ? 'TARGETED' : 'Swap Into'}
        </button>
      </div>
    </div>
  )
}

// ─── Arrow SVG ──────────────────────────────────────────────────
function SwapArrows() {
  return (
    <div className="flex flex-col items-center gap-1 my-2">
      <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
        <path d="M14 4v32M6 28l8 8 8-8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 44V12M18 20l8-8 8 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[9px] text-gray-500 font-mono tracking-wider">swapStake</span>
    </div>
  )
}

// ─── Main SwapPage ──────────────────────────────────────────────
export default function SwapPage() {
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [poolSearch, setPoolSearch] = useState('')

  const sourcePosition = USER_POSITIONS.find(p => p.id === sourceId)
  const targetPool = ALL_POOLS.find(p => p.id === targetId)

  const filteredPools = useMemo(() => {
    if (!poolSearch) return ALL_POOLS
    const q = poolSearch.toLowerCase()
    return ALL_POOLS.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
  }, [poolSearch])

  const canSwap = sourceId !== null && targetId !== null && sourceId !== targetId

  // Calculate swap output estimate
  const swapEstimate = useMemo(() => {
    if (!sourcePosition || !targetPool) return null
    // Simplified: your shares from source → WAVES → target card tokens
    const wavesOut = Math.floor(sourcePosition.userShares * sourcePosition.priceWaves)
    const tokensOut = Math.floor(wavesOut / targetPool.priceWaves)
    const wouldSteal = tokensOut > targetPool.ownerShares
    return { wavesOut, tokensOut, wouldSteal }
  }, [sourcePosition, targetPool])

  return (
    <div className="w-full px-4 flex items-center justify-center" style={{ marginTop: 60, minHeight: '100dvh' }}>
      <div className="flex justify-evenly w-full gap-5">

        {/* ─── LEFT: Your Staked Positions ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col max-w-[380px] w-full">
          <h2 className="text-white text-lg font-black tracking-wide mb-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            YOUR POSITIONS
          </h2>
          <p className="text-gray-500 text-[10px] font-mono mb-4">{USER_ADDR}</p>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
              <p className="text-gray-500 text-[9px] uppercase tracking-wider">Cards Staked</p>
              <p className="text-white font-bold text-lg">{USER_POSITIONS.length}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
              <p className="text-gray-500 text-[9px] uppercase tracking-wider">Owned</p>
              <p className="text-amber-400 font-bold text-lg">{USER_POSITIONS.filter(p => p.isOwner).length}</p>
            </div>
          </div>

          <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-2">Select source position</p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1" style={{ maxHeight: 'calc(80vh - 220px)' }}>
            {USER_POSITIONS.map(pos => (
              <PositionCard
                key={pos.id}
                pool={pos}
                userShares={pos.userShares}
                userPercentage={pos.userPercentage}
                isOwner={pos.isOwner}
                selected={sourceId === pos.id}
                onClick={() => setSourceId(sourceId === pos.id ? null : pos.id)}
              />
            ))}
          </div>
        </div>

        {/* ─── CENTER: Swap Stage ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col max-w-[360px] w-full">
          <h2 className="text-white text-lg font-black tracking-wide mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            SWAP STAGE
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Source card */}
            <div className="w-full max-w-[260px]">
              <p className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-2">Unstake From</p>
              <div className={`rounded-xl border-2 p-4 transition-all ${
                sourcePosition ? 'border-cyan-500/40 bg-gray-800/40' : 'border-dashed border-gray-700 bg-gray-800/20'
              }`}>
                {sourcePosition ? (
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-20 rounded-md overflow-hidden border border-gray-600">
                      <img src={sourcePosition.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{sourcePosition.name} #{sourcePosition.number}</p>
                      <p className="text-[10px]" style={{ color: rarityColor[sourcePosition.rarity] }}>{sourcePosition.rarity}</p>
                      <p className="text-cyan-400 text-xs font-mono mt-1">{sourcePosition.userShares.toLocaleString()} shares</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm text-center py-4">← Select a position</p>
                )}
              </div>
            </div>

            <SwapArrows />

            {/* Target card */}
            <div className="w-full max-w-[260px]">
              <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-2">Stake Into</p>
              <div className={`rounded-xl border-2 p-4 transition-all ${
                targetPool ? 'border-emerald-500/40 bg-gray-800/40' : 'border-dashed border-gray-700 bg-gray-800/20'
              }`}>
                {targetPool ? (
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-20 rounded-md overflow-hidden border border-gray-600">
                      <img src={targetPool.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{targetPool.name} #{targetPool.number}</p>
                      <p className="text-[10px]" style={{ color: rarityColor[targetPool.rarity] }}>{targetPool.rarity}</p>
                      <p className="text-gray-400 text-[10px] mt-1">Owner: <span className="text-amber-400">{targetPool.owner}</span></p>
                      <p className="text-gray-400 text-[10px]">Steal for: <span className="text-emerald-400 font-bold">{targetPool.stealAmount.toLocaleString()}</span></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm text-center py-4">Browse pools →</p>
                )}
              </div>
            </div>

            {/* Swap estimate */}
            {swapEstimate && (
              <div className="w-full max-w-[260px] mt-4 bg-gray-800/60 rounded-lg p-3 space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">WAVES received</span>
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
                <div className="flex justify-between pt-1 border-t border-gray-700">
                  <span className="text-gray-500">Est. gas</span>
                  <span className="text-gray-300">~181k gas</span>
                </div>
              </div>
            )}

            {/* Swap button */}
            <button
              disabled={!canSwap}
              className={`w-full max-w-[260px] mt-4 py-3.5 rounded-xl text-sm font-black tracking-wider transition-all ${
                canSwap
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              {canSwap
                ? swapEstimate?.wouldSteal
                  ? '⚡ SWAP TO STEAL'
                  : 'INITIATE SWAPSTAKE'
                : 'SELECT BOTH CARDS'}
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Pool Explorer ─── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col max-w-[420px] w-full">
          <h2 className="text-white text-lg font-black tracking-wide mb-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            POOL EXPLORER
          </h2>
          <p className="text-gray-500 text-[10px] font-mono mb-3">{ALL_POOLS.length} active cards</p>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search cards..."
              value={poolSearch}
              onChange={e => setPoolSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Pool list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1" style={{ maxHeight: 'calc(80vh - 160px)' }}>
            {filteredPools.map(pool => (
              <PoolRow
                key={pool.id}
                pool={pool}
                onSelect={() => setTargetId(targetId === pool.id ? null : pool.id)}
                isTarget={targetId === pool.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
