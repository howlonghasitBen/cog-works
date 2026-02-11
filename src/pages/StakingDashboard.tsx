/**
 * StakingDashboard — Whirlpool card staking overview
 *
 * Displays a grid of card NFTs with ownership/staking data.
 * Each card shows its image, owner badge, risk meter, and top-4 holders on click.
 * Features:
 *   - Stats row: total cards, total staked, your stakes, pending rewards
 *   - Rewards breakdown panel (card pool fees, ETH pool, ownership bonuses)
 *   - Filter/sort: All | Mine | Top | At Risk + A→Z | ↓Staked
 *   - Per-card: click to reveal ranked holder list + stake/unstake actions
 *   - SurfSwap icon navigates to swap page via onNavigateSwap callback
 *
 * Theme: "open air" layout on 4chan blue board bg (#D6DAF0)
 *   - Dark text for legibility on light background
 *   - Gold accents (#8a6d2b), DM Mono + Cinzel fonts
 *   - No containing boxes — floating stats, pill filters, clean cards
 *
 * Currently uses mock data; wire to WhirlpoolStaking contract reads for production.
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** Segment colors for donut charts and holder indicators */
const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']
const YOUR_ADDRESS = '0x9370...50Ea'

function mockAddr() {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  s += '...'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  return s
}

function mockStakers(count: number, includeYou: boolean) {
  const stakers = Array.from({ length: count }, (_, i) => ({
    label: mockAddr(),
    value: Math.floor(Math.random() * 50000) + 5000,
    color: COLORS[i % COLORS.length],
    isYou: false,
  }))
  if (includeYou && stakers.length > 0) {
    const idx = Math.floor(Math.random() * stakers.length)
    stakers[idx].label = YOUR_ADDRESS
    stakers[idx].isYou = true
  }
  return stakers
}

const YOUR_CARD_INDICES = new Set<number>()
while (YOUR_CARD_INDICES.size < 4) YOUR_CARD_INDICES.add(Math.floor(Math.random() * 12))

const MOCK_CARDS = [
  'Cosmic Surfer', 'Deep Reef', 'Tide Walker', 'Barrel Rider',
  'Moon Jelly', 'Coral King', 'Wave Phantom', 'Drift Lord',
  'Storm Chaser', 'Kelp Sage', 'Sand Serpent', 'Foam Spirit',
].map((name, idx) => {
  const stakers = mockStakers(Math.floor(Math.random() * 5) + 3, YOUR_CARD_INDICES.has(idx))
  return { name, stakers, total: stakers.reduce((s, x) => s + x.value, 0), idx }
})

type SortKey = 'name' | 'total'
type FilterKey = 'all' | 'myStakes' | 'topHolders' | 'risk'

function getRiskPct(stakers: { value: number }[]) {
  if (stakers.length < 2) return 0
  const sorted = [...stakers].sort((a, b) => b.value - a.value)
  const margin = (sorted[0].value - sorted[1].value) / sorted[0].value
  return Math.max(0, Math.min(1, 1 - margin))
}

const totalStaked = MOCK_CARDS.reduce((s, c) => s + c.total, 0)
const yourStakes = MOCK_CARDS.reduce((s, c) => {
  const you = c.stakers.find(st => st.isYou)
  return s + (you ? you.value : 0)
}, 0)

// Mock reward breakdown
const MOCK_REWARDS = {
  total: 12450,
  cardPools: 8715, // 70%
  ethPool: 2490, // 20%
  bonuses: 1245, // 10%
  cards: MOCK_CARDS.filter((_, i) => YOUR_CARD_INDICES.has(i)).map(c => ({
    name: c.name,
    reward: Math.floor(Math.random() * 3000) + 500,
  })),
}

export default function StakingDashboard({ onNavigateSwap }: { onNavigateSwap?: () => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [rewardsOpen, setRewardsOpen] = useState(false)

  const cards = useMemo(() => {
    let result = MOCK_CARDS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'myStakes') result = result.filter(c => c.stakers.some(s => s.isYou))
    if (filter === 'risk') result = result.filter(c => getRiskPct(c.stakers) > 0.6)
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else result.sort((a, b) => b.total - a.total)
    return result
  }, [search, sort, filter])

  return (
    <div style={{ maxWidth: 1280, margin: '60px auto 32px', padding: '0 24px', position: 'relative' }}>

      {/* ── Header: open, no box ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 32,
            fontWeight: 900,
            color: '#8a6d2b',
            margin: 0,
            letterSpacing: 1,
          }}>
            Whirlpool Staking
          </h2>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            color: '#4a4d5a',
            margin: '2px 0 0',
          }}>
            Stake tokens · Own cards · Earn rewards
          </p>
        </div>
      </div>

      {/* ── Thin gold separator ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, #c8a55a, transparent 80%)', marginBottom: 24 }} />

      {/* ── Stats: floating chips, not boxes ── */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Cards', value: MOCK_CARDS.length.toString(), accent: false },
          { label: 'Total Staked', value: totalStaked.toLocaleString(), accent: false },
          { label: 'Your Stakes', value: yourStakes.toLocaleString(), accent: true },
          { label: 'Pending Rewards', value: MOCK_REWARDS.total.toLocaleString(), accent: true },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#4a4d5a',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {stat.label}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 20,
              color: stat.accent ? '#8a6d2b' : '#2a2d3a',
              fontWeight: 700,
            }}>
              {stat.value}
            </span>
          </div>
        ))}

        {/* Claim + breakdown toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setRewardsOpen(!rewardsOpen)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              padding: '6px 14px',
              border: '1px solid rgba(200,165,90,0.3)',
              background: 'transparent',
              color: '#8a6d2b',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {rewardsOpen ? '✕ Close' : '📊 Breakdown'}
          </button>
          <button
            onClick={() => console.log('Claim all rewards')}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              fontWeight: 700,
              color: '#1a1d2e',
              background: 'linear-gradient(135deg, #c8a55a, #e8c56a)',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 2,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(200,165,90,0.25)',
            }}
          >
            ⚡ Claim All
          </button>
        </div>
      </div>

      {/* ── Rewards Breakdown Panel (slides open) ── */}
      <AnimatePresence>
        {rewardsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              padding: '20px 0',
              borderTop: '1px solid rgba(200,165,90,0.15)',
              borderBottom: '1px solid rgba(200,165,90,0.15)',
            }}>
              {/* Left: source breakdown */}
              <div>
                <h3 style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14,
                  color: '#8a6d2b',
                  margin: '0 0 16px',
                }}>
                  Reward Sources
                </h3>
                {[
                  { label: 'Card Pool Fees', value: MOCK_REWARDS.cardPools, pct: 70, color: '#0ea5e9' },
                  { label: 'ETH Staking Pool', value: MOCK_REWARDS.ethPool, pct: 20, color: '#8b5cf6' },
                  { label: 'Ownership Bonuses', value: MOCK_REWARDS.bonuses, pct: 10, color: '#f97316' },
                ].map(src => (
                  <div key={src.label} style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: src.color }} />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: '#2a2d3a' }}>
                          {src.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#2a2d3a', fontWeight: 600 }}>
                          {src.value.toLocaleString()}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: '#4a4d5a' }}>
                          {src.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar — open, no box around it */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${src.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        style={{ height: '100%', background: src.color, borderRadius: 2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: per-card rewards */}
              <div>
                <h3 style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14,
                  color: '#8a6d2b',
                  margin: '0 0 16px',
                }}>
                  Your Card Rewards
                </h3>
                {MOCK_REWARDS.cards.map(cr => (
                  <div key={cr.name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: '#2a2d3a' }}>
                      {cr.name}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#8a6d2b', fontWeight: 800 }}>
                      +{cr.reward.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0 0',
                  marginTop: 4,
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#4a4d5a', textTransform: 'uppercase' }}>
                    ETH Pool (1.5x boost)
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>
                    +{MOCK_REWARDS.ethPool.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters: inline pills ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #3a3d4a',
            color: '#1a1d2e',
            padding: '4px 0',
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            outline: 'none',
            width: 160,
          }}
          onFocus={e => { e.target.style.borderBottomColor = '#c8a55a' }}
          onBlur={e => { e.target.style.borderBottomColor = '#3a3d4a' }}
        />
        <div style={{ width: 1, height: 20, background: '#3a3d4a', margin: '0 8px' }} />
        {([
          { key: 'all' as FilterKey, label: 'All' },
          { key: 'myStakes' as FilterKey, label: 'Mine' },
          { key: 'topHolders' as FilterKey, label: 'Top' },
          { key: 'risk' as FilterKey, label: 'At Risk' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              padding: '3px 12px',
              border: 'none',
              borderRadius: 12,
              background: filter === opt.key ? 'rgba(200,165,90,0.15)' : 'transparent',
              color: filter === opt.key ? '#c8a55a' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: '#3a3d4a', margin: '0 8px' }} />
        {([
          { key: 'name' as SortKey, label: 'A→Z' },
          { key: 'total' as SortKey, label: '↓ Staked' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              padding: '3px 12px',
              border: 'none',
              borderRadius: 12,
              background: sort === opt.key ? 'rgba(200,165,90,0.15)' : 'transparent',
              color: sort === opt.key ? '#c8a55a' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Card grid: open layout, cards breathe ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 32,
        justifyItems: 'center',
      }}>
        {cards.map((card, i) => {
          const risk = getRiskPct(card.stakers)
          const sorted = [...card.stakers].sort((a, b) => b.value - a.value)
          const ownerLabel = sorted[0]?.label || ''
          const hasYou = card.stakers.some(s => s.isYou)
          const isSelected = selectedCard === card.name
          const CARD_W = 220
          const CARD_H = CARD_W * (4 / 3)

          // Map mock card index to real card image filenames
          const cardImages = [
            '003_Shadow_Dragon.png', '005_Crystal_Golem.png', '006_Void_Reaper.png',
            '007_Shrimp_baby.png', '009_Khazix.png', '010_Void_Reaper.png',
            '011_Sandshrew.png', '012_Sol_Eater.png', '013_Time_Wizard.png',
            '014_Flame_Dancer.png', '015_Ice_Wraith.png', '016_Storm_Herald.png',
          ]
          const imgFile = cardImages[card.idx % cardImages.length]

          return (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
              onClick={() => setSelectedCard(isSelected ? null : card.name)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                width: CARD_W,
              }}
              whileHover={{ scale: 1.03 }}
            >
              {/* Card container — holds image + cog inside */}
              <div style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 4,
                overflow: 'visible',
                border: hasYou ? '2px solid #8a6d2b' : '1px solid #3a3d4a',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                position: 'relative',
              }}>
                <img
                  src={`/images/card-images/${imgFile}`}
                  alt={card.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 4,
                    filter: isSelected ? 'brightness(0.3)' : 'none',
                    transition: 'filter 0.3s',
                  }}
                />

                {/* Top 4 holders overlay on selected card */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        right: 10,
                        zIndex: 10,
                      }}
                    >
                      {sorted.slice(0, 4).map((staker, si) => {
                        const pct = card.total > 0 ? ((staker.value / card.total) * 100).toFixed(1) : '0'
                        return (
                          <div key={si} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 0',
                            borderBottom: si < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          }}>
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11,
                              fontWeight: 800,
                              color: si === 0 ? '#e8d5a0' : 'rgba(255,255,255,0.7)',
                              width: 16,
                              textAlign: 'right',
                            }}>
                              {si + 1}.
                            </span>
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: staker.color,
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10,
                              fontWeight: 700,
                              color: staker.isYou ? '#e8d5a0' : 'rgba(255,255,255,0.85)',
                              flex: 1,
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}>
                              {staker.label}{staker.isYou ? ' (You)' : ''}{si === 0 ? ' ★' : ''}
                            </span>
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'rgba(255,255,255,0.6)',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}>
                              {pct}%
                            </span>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card name overlay at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 10px 10px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  borderRadius: '0 0 4px 4px',
                }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#f0e6d0',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {card.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 2,
                  }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#d1c4a0',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}>
                      ★ {ownerLabel.slice(0, 10)}
                    </span>
                    {hasYou && (
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 8,
                        fontWeight: 800,
                        color: '#e8d5a0',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '1px 6px',
                        borderRadius: 2,
                        letterSpacing: 1,
                      }}>
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk bar at very bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  borderRadius: '0 0 4px 4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${risk * 100}%`,
                    height: '100%',
                    background: risk > 0.6 ? '#ef4444' : risk > 0.3 ? '#f59e0b' : '#10b981',
                  }} />
                </div>
              </div>

              {/* Details panel below card on select */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: 8, width: '100%' }}
                  >
                    {/* Stake / Unstake buttons */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); console.log(`Stake on ${card.name}`) }}
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '5px 20px',
                          border: '1px solid rgba(138,109,43,0.4)',
                          background: 'rgba(138,109,43,0.1)',
                          color: '#8a6d2b',
                          cursor: 'pointer',
                          borderRadius: 2,
                        }}
                      >
                        Stake
                      </button>
                      <img
                        src="/images/surfSwapNoBG.png"
                        alt="SurfSwap"
                        onClick={e => { e.stopPropagation(); onNavigateSwap?.() }}
                        style={{ width: 28, height: 28, objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.2)' }}
                        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); console.log(`Unstake from ${card.name}`) }}
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '5px 20px',
                          border: '1px solid #3a3d4a',
                          background: 'transparent',
                          color: '#4a4d5a',
                          cursor: 'pointer',
                          borderRadius: 2,
                        }}
                      >
                        Unstake
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {cards.length === 0 && (
        <p style={{
          fontFamily: "'DM Mono', monospace",
          color: '#4a4d5a',
          textAlign: 'center',
          padding: '80px 0',
        }}>
          No cards match your search.
        </p>
      )}

      {/* Swap navigation handled by parent via onNavigateSwap */}
    </div>
  )
}
