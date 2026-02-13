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
 * Wired to useWhirlpool hook for live Anvil data.
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWhirlpool } from '../hooks/useWhirlpool'

/** Segment colors for donut charts and holder indicators */
const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']

const BASE = '/images/card-images'

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

type SortKey = 'name' | 'total'
type FilterKey = 'all' | 'myStakes' | 'topHolders' | 'risk'

function getRiskPct(ownerStake: number, total: number) {
  if (total <= 0 || ownerStake <= 0) return 0
  const margin = ownerStake / total
  return Math.max(0, Math.min(1, 1 - margin))
}

export default function StakingDashboard({ onNavigateSwap }: { onNavigateSwap?: () => void }) {
  const whirlpool = useWhirlpool()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [rewardsOpen, setRewardsOpen] = useState(false)

  // Derived data
  const cardData = useMemo(() => whirlpool.cards.map(c => {
    const total = parseFloat(c.cardReserve) || 0
    const myStake = parseFloat(c.myStake) || 0
    const isYou = myStake > 0
    const stakers = [
      { label: shortAddr(c.owner), value: total, color: COLORS[0], isYou: c.owner.toLowerCase() === whirlpool.address?.toLowerCase() },
    ]
    if (isYou && c.owner.toLowerCase() !== whirlpool.address?.toLowerCase()) {
      stakers.push({ label: shortAddr(whirlpool.address || ''), value: myStake, color: COLORS[1], isYou: true })
    }
    return {
      name: c.name,
      id: c.id,
      uri: c.uri,
      stakers,
      total,
      myStake,
      hasYou: isYou,
      owner: c.owner,
    }
  }), [whirlpool.cards, whirlpool.address])

  const totalStaked = useMemo(() => cardData.reduce((s, c) => s + c.total, 0), [cardData])
  const yourStakes = useMemo(() => cardData.reduce((s, c) => s + c.myStake, 0), [cardData])
  const pendingRewards = whirlpool.pendingGlobal

  const cards = useMemo(() => {
    let result = cardData.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'myStakes') result = result.filter(c => c.hasYou)
    if (filter === 'risk') result = result.filter(c => getRiskPct(c.stakers[0]?.value || 0, c.total) > 0.6)
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else result.sort((a, b) => b.total - a.total)
    return result
  }, [search, sort, filter, cardData])

  // Reward breakdown (estimated from pending)
  const pendingNum = parseFloat(pendingRewards) || 0
  const rewardBreakdown = {
    total: pendingNum,
    cardPools: pendingNum * 0.7,
    ethPool: pendingNum * 0.2,
    bonuses: pendingNum * 0.1,
    cards: cardData.filter(c => c.hasYou).map(c => ({
      name: c.name,
      reward: c.total > 0 ? (c.myStake / c.total) * pendingNum * 0.7 : 0,
    })),
  }

  const handleClaimAll = async () => {
    for (const c of whirlpool.cards) {
      if (parseFloat(c.myStake) > 0) {
        await whirlpool.claimRewards(c.id)
      }
    }
  }

  const handleStake = async (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const amount = prompt('Amount to stake:')
    if (amount && parseFloat(amount) > 0) {
      await whirlpool.stake(cardId, amount)
    }
  }

  const handleUnstake = async (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const amount = prompt('Amount to unstake:')
    if (amount && parseFloat(amount) > 0) {
      await whirlpool.unstake(cardId, amount)
    }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '60px auto 32px', padding: '0 24px', position: 'relative', minHeight: '100vh' }}>

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
          { label: 'Cards', value: whirlpool.cards.length.toString(), accent: false },
          { label: 'Total Staked', value: totalStaked.toFixed(2), accent: false },
          { label: 'Your Stakes', value: yourStakes.toFixed(2), accent: true },
          { label: 'Pending Rewards', value: parseFloat(pendingRewards).toFixed(4), accent: true },
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
            onClick={handleClaimAll}
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
                  { label: 'Card Pool Fees', value: rewardBreakdown.cardPools, pct: 70, color: '#0ea5e9' },
                  { label: 'ETH Staking Pool', value: rewardBreakdown.ethPool, pct: 20, color: '#8b5cf6' },
                  { label: 'Ownership Bonuses', value: rewardBreakdown.bonuses, pct: 10, color: '#f97316' },
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
                          {src.value.toFixed(4)}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: '#4a4d5a' }}>
                          {src.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
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
                {rewardBreakdown.cards.length === 0 ? (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4a4d5a' }}>
                    No staked positions yet
                  </p>
                ) : rewardBreakdown.cards.map(cr => (
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
                      +{cr.reward.toFixed(4)}
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
                    +{rewardBreakdown.ethPool.toFixed(4)}
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
          const risk = getRiskPct(card.stakers[0]?.value || 0, card.total)
          const sorted = [...card.stakers].sort((a, b) => b.value - a.value)
          const ownerLabel = shortAddr(card.owner)
          const hasYou = card.hasYou
          const isSelected = selectedCard === card.name
          const CARD_W = 220
          const CARD_H = CARD_W * (4 / 3)
          const imgSrc = cardImage(card.uri, card.name, card.id)

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
              {/* Card container */}
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
                  src={imgSrc}
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
                        onClick={e => handleStake(card.id, e)}
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
                        onClick={e => handleUnstake(card.id, e)}
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
          {whirlpool.cards.length === 0 ? 'No cards created yet. Mint some on the Mint page!' : 'No cards match your search.'}
        </p>
      )}
    </div>
  )
}
