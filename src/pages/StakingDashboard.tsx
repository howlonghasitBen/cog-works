/**
 * StakingDashboard — Whirlpool card staking overview
 * Wired to useWhirlpool hook for live Anvil data.
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWhirlpool, type CardState } from '../hooks/useWhirlpool'

const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']

type SortKey = 'name' | 'total'
type FilterKey = 'all' | 'myStakes' | 'topHolders' | 'risk'

function getRiskPct(myStake: number, totalReserve: number) {
  if (totalReserve <= 0 || myStake <= 0) return 0
  const margin = myStake / totalReserve
  return Math.max(0, Math.min(1, 1 - margin))
}

export default function StakingDashboard({ onNavigateSwap }: { onNavigateSwap?: () => void }) {
  const whirlpool = useWhirlpool()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [rewardsOpen, setRewardsOpen] = useState(false)

  const totalCards = whirlpool.cards.length
  const totalStaked = useMemo(() =>
    whirlpool.cards.reduce((s, c) => s + parseFloat(c.wavesReserve || '0'), 0),
    [whirlpool.cards]
  )
  const yourStakes = useMemo(() =>
    whirlpool.cards.reduce((s, c) => s + parseFloat(c.myStake || '0'), 0),
    [whirlpool.cards]
  )
  const pendingRewardsTotal = parseFloat(whirlpool.pendingGlobal || '0')

  const myStakedCards = useMemo(() =>
    whirlpool.cards.filter(c => parseFloat(c.myStake) > 0),
    [whirlpool.cards]
  )

  const cards = useMemo(() => {
    let result = whirlpool.cards.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'myStakes') result = result.filter(c => parseFloat(c.myStake) > 0)
    if (filter === 'risk') result = result.filter(c => {
      const stake = parseFloat(c.myStake)
      const reserve = parseFloat(c.wavesReserve)
      return stake > 0 && getRiskPct(stake, reserve) > 0.6
    })
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else result.sort((a, b) => parseFloat(b.wavesReserve) - parseFloat(a.wavesReserve))
    return result
  }, [whirlpool.cards, search, sort, filter])

  const handleClaimAll = async () => {
    // Claim WETH rewards + per-card rewards for staked cards
    await whirlpool.claimWETHRewards()
    for (const card of myStakedCards) {
      await whirlpool.claimRewards(card.id)
    }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '60px auto 32px', padding: '0 24px', position: 'relative' }}>

      {/* ── Header ── */}
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

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Cards', value: totalCards.toString(), accent: false },
          { label: 'Total Staked', value: totalStaked.toFixed(2), accent: false },
          { label: 'Your Stakes', value: yourStakes.toFixed(4), accent: true },
          { label: 'Pending Rewards', value: pendingRewardsTotal.toFixed(4), accent: true },
          { label: 'WETH Staked', value: parseFloat(whirlpool.myWethStake || '0').toFixed(4), accent: true },
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
            disabled={whirlpool.loading}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              fontWeight: 700,
              color: '#1a1d2e',
              background: 'linear-gradient(135deg, #c8a55a, #e8c56a)',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 2,
              cursor: whirlpool.loading ? 'wait' : 'pointer',
              boxShadow: '0 2px 10px rgba(200,165,90,0.25)',
              opacity: whirlpool.loading ? 0.6 : 1,
            }}
          >
            ⚡ Claim All
          </button>
        </div>
      </div>

      {/* ── Rewards Breakdown Panel ── */}
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
                  { label: 'Card Pool Fees (est.)', value: (pendingRewardsTotal * 0.7).toFixed(4), pct: 70, color: '#0ea5e9' },
                  { label: 'WETH Staking Pool', value: parseFloat(whirlpool.myWethStake || '0').toFixed(4), pct: 20, color: '#8b5cf6' },
                  { label: 'Ownership Bonuses', value: (pendingRewardsTotal * 0.1).toFixed(4), pct: 10, color: '#f97316' },
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
                          {src.value}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: '#4a4d5a' }}>
                          {src.pct}%
                        </span>
                      </div>
                    </div>
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
                  Your Staked Cards
                </h3>
                {myStakedCards.length === 0 ? (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4a4d5a' }}>No staked cards yet.</p>
                ) : myStakedCards.map(cr => (
                  <div key={cr.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: '#2a2d3a' }}>
                      {cr.name}
                    </span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#4a4d5a' }}>
                        {parseFloat(cr.myStake).toFixed(4)} staked
                      </span>
                      <button
                        onClick={() => whirlpool.claimRewards(cr.id)}
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          padding: '2px 8px',
                          border: '1px solid rgba(200,165,90,0.3)',
                          background: 'transparent',
                          color: '#8a6d2b',
                          cursor: 'pointer',
                          borderRadius: 2,
                        }}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0 0',
                  marginTop: 4,
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#4a4d5a', textTransform: 'uppercase' }}>
                    WETH Pool Stake
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>
                    {parseFloat(whirlpool.myWethStake || '0').toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ── */}
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

      {/* ── Card grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 32,
        justifyItems: 'center',
      }}>
        {cards.map((card, i) => {
          const myStake = parseFloat(card.myStake)
          const reserve = parseFloat(card.wavesReserve)
          const risk = getRiskPct(myStake, reserve)
          const ownerLabel = card.owner.slice(0, 6) + '…' + card.owner.slice(-4)
          const hasYou = myStake > 0
          const isSelected = selectedCard === card.id
          const isOwner = whirlpool.address ? card.owner.toLowerCase() === whirlpool.address.toLowerCase() : false
          const CARD_W = 220
          const CARD_H = CARD_W * (4 / 3)
          const imgSrc = card.uri || `/images/card-images/placeholder.png`

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
              onClick={() => setSelectedCard(isSelected ? null : card.id)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                width: CARD_W,
              }}
              whileHover={{ scale: 1.03 }}
            >
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
                      {/* Show owner with their stake info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#e8d5a0',
                          width: 16,
                          textAlign: 'right',
                        }}>
                          1.
                        </span>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: COLORS[0],
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          fontWeight: 700,
                          color: isOwner ? '#e8d5a0' : 'rgba(255,255,255,0.85)',
                          flex: 1,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}>
                          {ownerLabel}{isOwner ? ' (You)' : ''} ★
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.6)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}>
                          Owner
                        </span>
                      </div>
                      {hasYou && !isOwner && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 0',
                        }}>
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'rgba(255,255,255,0.7)',
                            width: 16,
                            textAlign: 'right',
                          }}>
                            ?.
                          </span>
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: COLORS[1],
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#e8d5a0',
                            flex: 1,
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                          }}>
                            You · {myStake.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {/* Price info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 0 3px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        marginTop: 4,
                      }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.5)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}>
                          Price: {parseFloat(card.price).toFixed(4)} WAVES
                        </span>
                      </div>
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

                {/* Risk bar */}
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
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); whirlpool.stake(card.id, '1') }}
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
                        onClick={e => { e.stopPropagation(); whirlpool.unstake(card.id, card.myStake) }}
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
          {whirlpool.cards.length === 0 ? 'No cards deployed yet. Run mint-all-cards.sh first!' : 'No cards match your search.'}
        </p>
      )}
    </div>
  )
}
