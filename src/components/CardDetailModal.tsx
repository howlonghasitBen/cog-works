/**
 * CardDetailModal — Full card detail overlay with stats, activity feed, and share link.
 * Dark steampunk theme matching Whirlpool pages.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CardFromData from './CardFromData'
import type { CardState } from '../hooks/useWhirlpool'

interface Props {
  card: CardState
  onClose: () => void
}

type Tab = 'stats' | 'activity' | 'chart'

interface ActivityEntry {
  type: 'stake' | 'unstake' | 'swap' | 'ownership'
  actor: string
  amount: string
  time: string
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  { type: 'stake', actor: '0x93709D…250Ea', amount: '120.00', time: '2m ago' },
  { type: 'swap', actor: '0xd8dA6B…045d', amount: '45.50', time: '8m ago' },
  { type: 'unstake', actor: '0xAb5801…8aB6', amount: '30.00', time: '22m ago' },
  { type: 'ownership', actor: '0x93709D…250Ea', amount: '—', time: '1h ago' },
  { type: 'stake', actor: '0x1234AB…9def', amount: '200.00', time: '3h ago' },
  { type: 'swap', actor: '0xBEEF00…cafe', amount: '88.88', time: '5h ago' },
  { type: 'unstake', actor: '0xdead00…beef', amount: '15.25', time: '1d ago' },
]

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  stake:     { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'STAKE' },
  unstake:   { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'UNSTAKE' },
  swap:      { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'SWAP' },
  ownership: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'OWNER' },
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || '???'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function CardDetailModal({ card, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stats')
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/#whirlpool-stake?card=${card.id}`

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            background: '#1a1d2e',
            border: '1px solid #3a3d4a',
            borderRadius: 8,
            display: 'flex',
            gap: 0,
            maxWidth: 820,
            width: '95vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 80px rgba(200,165,90,0.08)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
              zIndex: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid #3a3d4a',
              color: '#9ca3af',
              width: 28,
              height: 28,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#c8a55a' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#3a3d4a' }}
          >
            ✕
          </button>

          {/* Left: Card render */}
          <div style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #3a3d4a',
            flexShrink: 0,
          }}>
            <CardFromData name={card.name} width={280} />
          </div>

          {/* Right: Info panel */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0' }}>
              <h2 style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 22,
                fontWeight: 900,
                color: '#f0e6d0',
                margin: 0,
              }}>
                {card.name}
              </h2>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#6b7280',
                marginTop: 2,
              }}>
                {card.symbol} · #{card.id}
              </div>

              {/* Price */}
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(200,165,90,0.08)',
                border: '1px solid rgba(200,165,90,0.2)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  Price
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#c8a55a',
                }}>
                  {parseFloat(card.price).toFixed(4)}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: '#6b7280',
                }}>
                  $WAVES
                </span>
              </div>

              {/* Share button */}
              <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={handleShare}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    padding: '6px 16px',
                    border: '1px solid #3a3d4a',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a55a'; e.currentTarget.style.color = '#c8a55a' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a3d4a'; e.currentTarget.style.color = '#9ca3af' }}
                >
                  🔗 Share
                </button>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: 8,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: '#10b981',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Copied!
                  </motion.span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: 0,
              margin: '16px 24px 0',
              borderBottom: '1px solid #3a3d4a',
            }}>
              {(['stats', 'activity', 'chart'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t ? '2px solid #c8a55a' : '2px solid transparent',
                    color: tab === t ? '#c8a55a' : '#6b7280',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px 20px',
            }}>
              {tab === 'stats' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'WAVES Reserve', value: parseFloat(card.wavesReserve).toFixed(4) },
                    { label: 'Card Reserve', value: parseFloat(card.cardReserve).toFixed(4) },
                    { label: 'Owner', value: shortAddr(card.owner), mono: true },
                    { label: 'Your Stake', value: parseFloat(card.myStake).toFixed(4), highlight: parseFloat(card.myStake) > 0 },
                    { label: 'Your Balance', value: parseFloat(card.myBalance).toFixed(4) },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(58,61,74,0.5)',
                    }}>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        {row.label}
                      </span>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: row.highlight ? '#c8a55a' : '#d0d0d0',
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  {/* Contract address */}
                  <div style={{
                    marginTop: 8,
                    padding: '8px 0',
                  }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: '#4a4d5a',
                    }}>
                      Token: {card.address}
                    </span>
                  </div>
                </div>
              ) : tab === 'activity' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MOCK_ACTIVITY.map((entry, i) => {
                    const badge = BADGE[entry.type]
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 4,
                        border: '1px solid rgba(58,61,74,0.3)',
                      }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 3,
                          background: badge.bg,
                          color: badge.color,
                          letterSpacing: 0.5,
                          flexShrink: 0,
                        }}>
                          {badge.label}
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          color: '#d0d0d0',
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.actor}
                        </span>
                        {entry.amount !== '—' && (
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color: entry.type === 'unstake' ? '#ef4444' : '#10b981',
                            flexShrink: 0,
                          }}>
                            {entry.type === 'unstake' ? '-' : '+'}{entry.amount}
                          </span>
                        )}
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: '#4a4d5a',
                          flexShrink: 0,
                        }}>
                          {entry.time}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Price Chart Tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Current price callout */}
                  <div style={{
                    textAlign: 'center', padding: '12px 0',
                    borderBottom: '1px solid rgba(58,61,74,0.5)',
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      Current Price
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: '#c8a55a' }}>
                      {parseFloat(card.price).toFixed(4)} WAVES
                    </div>
                  </div>

                  {/* SVG Price Chart — mock historical data based on current price */}
                  {(() => {
                    const currentPrice = parseFloat(card.price)
                    // Generate 24 mock data points (24h) with random walk around current price
                    const points: number[] = []
                    let p = currentPrice * 0.85
                    for (let i = 0; i < 24; i++) {
                      p += (currentPrice - p) * 0.15 + (Math.random() - 0.45) * currentPrice * 0.08
                      points.push(Math.max(p, 0.0001))
                    }
                    points.push(currentPrice) // end at current

                    const W = 420
                    const H = 180
                    const pad = { top: 10, right: 10, bottom: 30, left: 50 }
                    const plotW = W - pad.left - pad.right
                    const plotH = H - pad.top - pad.bottom

                    const minP = Math.min(...points) * 0.95
                    const maxP = Math.max(...points) * 1.05
                    const rangeP = maxP - minP || 1

                    const xScale = (i: number) => pad.left + (i / (points.length - 1)) * plotW
                    const yScale = (v: number) => pad.top + plotH - ((v - minP) / rangeP) * plotH

                    const linePath = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')
                    const areaPath = linePath + ` L${xScale(points.length - 1).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${xScale(0).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`

                    // Y-axis labels (3 ticks)
                    const yTicks = [minP, (minP + maxP) / 2, maxP]

                    return (
                      <svg width={W} height={H} style={{ width: '100%', height: 'auto' }} viewBox={`0 0 ${W} ${H}`}>
                        {/* Grid lines */}
                        {yTicks.map((v, i) => (
                          <g key={i}>
                            <line x1={pad.left} x2={W - pad.right} y1={yScale(v)} y2={yScale(v)} stroke="#2a2d3a" strokeWidth={1} />
                            <text x={pad.left - 6} y={yScale(v) + 3} textAnchor="end" fill="#6b7280" fontSize={9} fontFamily="DM Mono, monospace">
                              {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2)}
                            </text>
                          </g>
                        ))}
                        {/* X-axis labels */}
                        <text x={xScale(0)} y={H - 6} textAnchor="start" fill="#6b7280" fontSize={9} fontFamily="DM Mono, monospace">24h ago</text>
                        <text x={xScale(12)} y={H - 6} textAnchor="middle" fill="#6b7280" fontSize={9} fontFamily="DM Mono, monospace">12h ago</text>
                        <text x={xScale(points.length - 1)} y={H - 6} textAnchor="end" fill="#6b7280" fontSize={9} fontFamily="DM Mono, monospace">Now</text>
                        {/* Area fill */}
                        <path d={areaPath} fill="url(#chartGrad)" opacity={0.3} />
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#c8a55a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        {/* Current price dot */}
                        <circle cx={xScale(points.length - 1)} cy={yScale(currentPrice)} r={4} fill="#c8a55a" stroke="#1a1d2e" strokeWidth={2} />
                        {/* Gradient def */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c8a55a" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#c8a55a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </svg>
                    )
                  })()}

                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4a4d5a',
                    textAlign: 'center', fontStyle: 'italic',
                  }}>
                    Price history — simulated (live indexing coming soon)
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
