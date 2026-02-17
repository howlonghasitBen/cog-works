/**
 * WavesCard — The actual card component matching our Puppeteer renders.
 *
 * NOT the marketplace "Live Preview" — this is the canonical WavesTCG card
 * with HP/Mana/Crit orbs in one row (gold crit), themed sections, and art.
 */
import { useRef, useState, useEffect, type CSSProperties } from 'react'

export interface WavesCardData {
  name: string
  subtitle?: string       // Card subtitle shown in header under name (e.g. "Ocean Guardian")
  moveName?: string       // Move/attack name shown above flavor text (e.g. "Tidal Crash")
  level?: string | number
  image?: string
  type?: string
  stats?: { hp?: number; attack?: number; defense?: number; mana?: number; crit?: number } | null
  flavorText?: string
  artist?: string
  rarity?: string
  hp?: { value: string; color: string; textColor?: string }
  manaCost?: { value: string; color: string; textColor?: string } | { value: string; color: string; textColor?: string }[]
  crit?: { value: string; color: string; textColor?: string }
  theme?: any
}

interface Props {
  card: WavesCardData
  /** Width in px — height auto at 3:4 aspect */
  width?: number
  /** Override art image src */
  artSrc?: string
  className?: string
  style?: CSSProperties
}

/* ── inline styles (no external CSS dependency) ─────────────────── */

const fonts = "'Cinzel', serif"
const monoFont = "'DM Mono', monospace"
const flavorFont = "'Crimson Text', serif"

function esc(s?: string) { return (s || '').replace(/\n/g, ' ') }

export default function WavesCard({ card, width: widthProp = 400, artSrc, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(widthProp || 400)
  const fillParent = widthProp === 0

  useEffect(() => {
    if (!fillParent || !containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setMeasuredWidth(e.contentRect.width || 400)
    })
    ro.observe(containerRef.current)
    setMeasuredWidth(containerRef.current.offsetWidth || 400)
    return () => ro.disconnect()
  }, [fillParent])

  const width = fillParent ? measuredWidth : widthProp
  const t = card.theme || {}
  const hp = card.hp || { value: '0', color: 'radial-gradient(circle, #dc143c, #8b0000)', textColor: '#fff' }
  const crit = card.crit || { value: '0', color: 'radial-gradient(circle, #32cd32, #228b22)', textColor: '#fff' }
  const manaArr = Array.isArray(card.manaCost) ? card.manaCost : card.manaCost ? [card.manaCost] : []

  // Resolve art — always prefer /images/card-images/arts/
  let imgUrl = artSrc || ''
  if (!imgUrl && card.image) {
    // For surf-works cards with relative paths, remap to arts/
    if (card.image.startsWith('/images/card-images/')) {
      const fname = card.image.split('/').pop()
      imgUrl = `/images/card-images/arts/${fname}`
    } else if (card.image.startsWith('/images/')) {
      const fname = card.image.split('/').pop()
      imgUrl = `/images/card-images/arts/${fname}`
    } else {
      // IPFS or other external — use as-is (fallback)
      imgUrl = card.image
    }
  }

  // Scale factor for responsive sizing
  const s = width / 400

  const orbSize = 28 * s
  const orbGap = 4 * s

  const orbStyle = (bg: string, txtColor: string): CSSProperties => ({
    width: orbSize, height: orbSize, borderRadius: '50%',
    background: bg,
    border: `${2 * s}px solid #1a1a1a`,
    boxShadow: `0 ${2*s}px ${4*s}px rgba(0,0,0,0.4), inset 0 -${1*s}px ${2*s}px rgba(0,0,0,0.3)`,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    color: txtColor,
  })

  const orbLabel: CSSProperties = {
    fontSize: 6 * s, fontWeight: 800, color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts, letterSpacing: '0.05em', lineHeight: 1,
  }
  const orbVal: CSSProperties = {
    fontSize: 12 * s, fontWeight: 900, fontFamily: monoFont,
    lineHeight: 1, textShadow: `0 ${1*s}px ${2*s}px rgba(0,0,0,0.6)`,
  }

  return (
    <div ref={containerRef} className={className} style={{
      width: fillParent ? '100%' : width, maxWidth: '100%', aspectRatio: '3/4',
      border: `${5*s}px solid #1a1a1a`,
      borderRadius: 14 * s,
      overflow: 'hidden',
      background: esc(t.background) || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
      display: 'flex', flexDirection: 'column',
      fontFamily: fonts,
      boxShadow: `0 ${10*s}px ${40*s}px rgba(0,0,0,0.15)`,
      ...style,
    }}>
      {/* ── Header ─────────────────────────────── */}
      <div style={{
        padding: `${10*s}px ${14*s}px`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: esc(t.header?.background) || 'rgba(0,0,0,0.3)',
        color: t.header?.color || '#fff',
        textShadow: t.header?.textShadow || 'none',
        boxShadow: esc(t.header?.boxShadow || 'none'),
        borderBottom: `${3*s}px solid #1a1a2e`,
      }}>
        <div>
          {/* HP / Mana / Crit orbs — one row */}
          <div style={{ display: 'flex', gap: orbGap, marginBottom: 4 * s }}>
            {/* HP */}
            <div style={orbStyle(hp.color, hp.textColor || '#fff')}>
              <span style={orbLabel}>HP</span>
              <span style={orbVal}>{hp.value}</span>
            </div>
            {/* Mana orbs */}
            {manaArr.map((m, i) => (
              <div key={i} style={orbStyle(m.color, m.textColor || '#fff')}>
                <span style={orbLabel}>MANA</span>
                <span style={orbVal}>{m.value}</span>
              </div>
            ))}
            {/* Crit — gold */}
            <div style={{
              ...orbStyle('linear-gradient(135deg, gold, orange)', '#000'),
              boxShadow: `0 ${2*s}px ${4*s}px rgba(0,0,0,0.4), inset 0 -${1*s}px ${2*s}px rgba(0,0,0,0.3), 0 0 ${10*s}px rgba(255,215,0,0.5)`,
            }}>
              <span style={{ ...orbLabel, color: 'rgba(0,0,0,0.6)' }}>CRIT</span>
              <span style={{ ...orbVal, color: '#000', textShadow: `0 ${1*s}px ${2*s}px rgba(255,215,0,0.6)` }}>{crit.value}</span>
            </div>
          </div>
          <div style={{
            fontSize: 14 * s, fontWeight: 700, lineHeight: 1.2,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          }}>
            {card.name || 'Untitled'}
          </div>
          {card.subtitle && (
            <div style={{
              fontSize: 9 * s, fontWeight: 500, opacity: 0.7,
              letterSpacing: '0.05em', marginTop: 1 * s,
              color: t.header?.color || '#fff',
            }}>
              {card.subtitle}
            </div>
          )}
        </div>
        {/* Level badge */}
        <div style={{
          padding: `${4*s}px ${8*s}px`, borderRadius: 12 * s,
          fontSize: 11 * s, fontWeight: 700,
          background: t.stat?.background || 'rgba(255,255,255,0.2)',
          color: t.stat?.color || '#fff',
          border: t.stat?.border || 'none',
        }}>
          LVL {card.level || '★'}
        </div>
      </div>

      {/* ── Image ──────────────────────────────── */}
      <div style={{
        height: '40%', width: `calc(100% - ${20*s}px)`,
        margin: `${8*s}px ${10*s}px`, borderRadius: 8 * s,
        overflow: 'hidden',
        background: esc(t.imageArea?.background) || 'rgba(0,0,0,0.2)',
        border: t.imageArea?.border || 'none',
        boxShadow: esc(t.imageArea?.boxShadow || 'none'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {imgUrl ? (
          <img src={imgUrl} alt={card.name} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: 'scale(1.1)',
          }} />
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 * s, textAlign: 'center' }}>
            <span style={{ fontSize: 40 * s, opacity: 0.5, display: 'block' }}>🖼️</span>
            No Image
          </div>
        )}
      </div>

      {/* ── Type + ATK/DEF ─────────────────────── */}
      <div style={{
        padding: `${10*s}px ${14*s}px`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: esc(t.typeSection?.background) || 'rgba(0,0,0,0.3)',
        color: t.typeSection?.color || '#fff',
        fontSize: 11 * s, fontWeight: 600,
        textShadow: t.typeSection?.textShadow || 'none',
        borderTop: `${2*s}px solid #1a1a2e`,
        borderBottom: `${2*s}px solid #1a1a2e`,
      }}>
        <div style={{ textTransform: 'uppercase' as const }}>{card.type || 'Creature'}</div>
        <div style={{ display: 'flex', gap: 8 * s }}>
          {['ATK', 'DEF'].map(stat => (
            <div key={stat} style={{
              padding: `${4*s}px ${8*s}px`, borderRadius: 4 * s,
              fontSize: 10 * s, fontWeight: 'bold',
              background: t.stat?.background || 'rgba(255,255,255,0.2)',
              border: t.stat?.border || 'none',
              color: t.stat?.color || '#fff',
              textShadow: `${1*s}px ${1*s}px ${2*s}px rgba(0,0,0,0.8)`,
            }}>
              {stat}: {stat === 'ATK' ? (card.stats?.attack ?? 0) : (card.stats?.defense ?? 0)}
            </div>
          ))}
        </div>
      </div>

      {/* ── Flavor Text ────────────────────────── */}
      <div style={{
        padding: `${12*s}px ${16*s}px`,
        background: esc(t.flavorText?.background) || 'rgba(0,0,0,0.2)',
        color: t.flavorText?.color || '#ccc',
        fontSize: 12 * s, fontStyle: 'italic', lineHeight: 1.3,
        fontFamily: flavorFont, textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexGrow: 1, position: 'relative',
        borderBottom: t.flavorText?.border || 'none',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 8 * s,
          fontSize: 28 * s, opacity: 0.4,
        }}>"</div>
        <div style={{
          display: '-webkit-box', WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          whiteSpace: 'pre-line',
        }}>
          {card.moveName && (
            <div style={{ fontWeight: 700, fontStyle: 'normal', marginBottom: 4 * s, color: '#fff' }}>
              {card.moveName}
            </div>
          )}
          {card.flavorText || 'No flavor text yet...'}
        </div>
        <div style={{
          position: 'absolute', bottom: -8 * s, right: 8 * s,
          fontSize: 28 * s, opacity: 0.4,
        }}>"</div>
      </div>

      {/* ── Bottom ─────────────────────────────── */}
      <div style={{
        padding: `${10*s}px ${14*s}px`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: esc(t.bottomSection?.background) || 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          fontSize: 10 * s, color: t.flavorText?.color || '#888',
          fontFamily: fonts, opacity: 0.8,
        }}>
          {card.artist || '◆Waves TCG◆'}
        </div>
        <div style={{
          padding: `${4*s}px ${10*s}px`, borderRadius: 8 * s,
          fontSize: 10 * s, fontWeight: 700,
          background: esc(t.rarity?.background) || 'linear-gradient(135deg, gold, orange)',
          color: t.rarity?.color || '#000',
          border: t.rarity?.border || `${2*s}px solid #1a1a1a`,
          boxShadow: esc(t.rarity?.boxShadow || 'none'),
          fontFamily: fonts, letterSpacing: '0.1em',
        }}>
          {card.rarity || '★1/1★'}
        </div>
      </div>
    </div>
  )
}
