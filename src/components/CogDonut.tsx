/**
 * CogDonut — Donut chart framed by nav_cog.svg
 *
 * Visualizes staker distribution for a card token.
 * Features:
 *   - SVG donut with per-segment hover glow + staggered entrance animation
 *   - nav_cog.svg frame with slow continuous rotation (speeds up on hover)
 *   - Metallic gradient background + gold border ring
 *   - Optional card image in center (imageSrc prop)
 *   - Tooltip with holder address, percentage, owner ★, "You" indicator
 *   - Gold ripple pulses on entrance
 *   - Callback props: onStake, onUnstake, onSegmentClick
 *
 * Steampunk theme: Cinzel titles, DM Mono values, gold accents
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CogDonutSegment {
  label: string
  value: number
  color: string
  isYou?: boolean
}

export interface CogDonutProps {
  title: string
  total: number
  segments: CogDonutSegment[]
  size?: number
  delay?: number
  imageSrc?: string
  onSegmentClick?: (segment: CogDonutSegment) => void
  onStake?: () => void
  onUnstake?: () => void
}

export default function CogDonut({
  title, total, segments, size = 250, delay = 0, imageSrc,
  onSegmentClick, onStake: _onStake, onUnstake: _onUnstake
}: CogDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [ripple, setRipple] = useState(false)
  const [entered, setEntered] = useState(false)
  const [isHoveringCard, setIsHoveringCard] = useState(false)
  const cogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => { setRipple(true); setEntered(true) }, delay)
    return () => clearTimeout(t)
  }, [delay])

  const cogSize = size
  const svgSize = size * 0.75
  const radius = svgSize * 0.32
  const strokeWidth = svgSize * 0.12
  const circumference = 2 * Math.PI * radius
  const center = svgSize / 2

  // Find largest segment index (owner)
  let largestIdx = 0
  segments.forEach((s, i) => { if (s.value > segments[largestIdx].value) largestIdx = i })

  // Build segments
  let accumulated = 0
  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? seg.value / total : 0
    const dashLen = circumference * pct
    const dashGap = circumference - dashLen
    const offset = -circumference * accumulated + circumference * 0.25
    const midAngle = (accumulated + pct / 2) * 2 * Math.PI - Math.PI / 2
    accumulated += pct
    return { ...seg, dashLen, dashGap, offset, index: i, pct, midAngle, isOwner: i === largestIdx }
  })

  return (
    <div
      ref={cogRef}
      className="relative flex flex-col items-center"
      style={{ width: cogSize, height: cogSize + 70 }}
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
    >
      {/* Ripple rings - gold */}
      {ripple && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: cogSize * 0.7,
            height: cogSize * 0.7,
            top: (cogSize - cogSize * 0.7) / 2,
            borderRadius: '50%',
            border: '1px solid rgba(200,165,90,0.3)',
          }}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeOut' }}
        />
      ))}

      {/* Metallic background circle */}
      <div
        style={{
          position: 'absolute',
          width: svgSize * 0.85,
          height: svgSize * 0.85,
          top: (cogSize - svgSize * 0.85) / 2,
          left: (cogSize - svgSize * 0.85) / 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #2a2d3a 0%, #1a1d2e 70%, #15172a 100%)',
          border: '1px solid rgba(200,165,90,0.2)',
        }}
      />

      {/* Gold border ring */}
      <div
        style={{
          position: 'absolute',
          width: svgSize * 0.78,
          height: svgSize * 0.78,
          top: (cogSize - svgSize * 0.78) / 2,
          left: (cogSize - svgSize * 0.78) / 2,
          borderRadius: '50%',
          border: '1px solid rgba(200,165,90,0.25)',
          boxShadow: 'inset 0 0 10px rgba(200,165,90,0.05)',
        }}
      />

      {/* Cog frame - slow rotation, speeds up on hover */}
      <motion.img
        src="/images/nav_cog.svg"
        alt=""
        style={{
          position: 'absolute',
          width: cogSize,
          height: cogSize,
          top: 0,
          pointerEvents: 'none',
        }}
        animate={{
          rotate: isHoveringCard ? [0, 360] : [0, 360],
        }}
        transition={{
          rotate: {
            duration: isHoveringCard ? 30 : 180,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      />

      {/* SVG Donut */}
      <svg
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', top: (cogSize - svgSize) / 2 }}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        {/* Background ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />

        {/* Data segments with staggered entrance */}
        {arcs.map((arc) => (
          <motion.circle
            key={arc.index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLen} ${arc.dashGap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="butt"
            style={{
              cursor: 'pointer',
              pointerEvents: 'auto',
              filter: hoveredIndex === arc.index
                ? `drop-shadow(0 0 8px ${arc.color})`
                : 'none',
            }}
            initial={entered ? undefined : { strokeDasharray: `0 ${circumference}` }}
            animate={{
              strokeDasharray: `${arc.dashLen} ${arc.dashGap}`,
              strokeWidth: hoveredIndex === arc.index ? strokeWidth + 4 : strokeWidth,
              opacity: hoveredIndex !== null && hoveredIndex !== arc.index ? 0.5 : 1,
            }}
            transition={{
              strokeDasharray: { duration: 0.6, delay: arc.index * 0.1 },
              strokeWidth: { duration: 0.2 },
              opacity: { duration: 0.2 },
            }}
            onMouseEnter={() => setHoveredIndex(arc.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSegmentClick?.(arc)}
          />
        ))}

        {/* Owner indicator - subtle dot */}
      </svg>

      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          top: (cogSize - svgSize) / 2,
          width: svgSize,
          height: svgSize,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 2,
              border: '1px solid rgba(200,165,90,0.3)',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 12,
          fontWeight: 900,
          color: '#8a6d2b',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}>
          {title}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: '#2a2d3a',
        }}>
          {total.toLocaleString()}
        </span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            style={{
              position: 'absolute',
              zIndex: 50,
              top: -50,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #2a2d3a, #1a1d2e)',
              border: '1px solid #c8a55a',
              padding: '8px 12px',
              fontSize: 12,
              pointerEvents: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: arcs[hoveredIndex].color,
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                color: arcs[hoveredIndex].isYou ? '#c8a55a' : '#fff',
              }}>
                {arcs[hoveredIndex].label}
                {arcs[hoveredIndex].isOwner && ' ★'}
                {arcs[hoveredIndex].isYou && ' (You)'}
              </span>
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              color: '#4a4d5a',
              marginTop: 4,
            }}>
              {arcs[hoveredIndex].value.toLocaleString()} ({(arcs[hoveredIndex].pct * 100).toFixed(1)}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
