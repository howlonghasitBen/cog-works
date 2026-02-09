/** CogDonut — Donut chart framed by the nav_cog.svg */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CogDonutSegment {
  label: string
  value: number
  color: string
}

export interface CogDonutProps {
  title: string
  total: number
  segments: CogDonutSegment[]
  size?: number
  onSegmentClick?: (segment: CogDonutSegment) => void
  /** Delay before ripple fires (ms) — used for staggered entrance */
  rippleDelay?: number
  /** Bump this to re-trigger the ripple */
  rippleKey?: number
}

export default function CogDonut({
  title,
  total,
  segments,
  size = 250,
  onSegmentClick,
  rippleDelay = 0,
  rippleKey = 0,
}: CogDonutProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [showRipple, setShowRipple] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; seg: CogDonutSegment } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ripple on mount + rippleKey change
  useEffect(() => {
    setShowRipple(false)
    const t = setTimeout(() => setShowRipple(true), rippleDelay)
    return () => clearTimeout(t)
  }, [rippleKey, rippleDelay])

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.32
  const strokeWidth = size * 0.12
  const circumference = 2 * Math.PI * radius

  // Build segment angles
  const totalValue = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let accumulated = 0
  const arcs = segments.map((seg) => {
    const fraction = seg.value / totalValue
    const dashLength = fraction * circumference
    const dashOffset = -(accumulated * circumference) + circumference * 0.25 // rotate -90deg start
    accumulated += fraction
    return { ...seg, fraction, dashLength, dashOffset }
  })

  const handleMouseMove = (e: React.MouseEvent, seg: CogDonutSegment) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, seg })
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Cog frame */}
      <motion.img
        src="/images/nav_cog.svg"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ filter: 'brightness(0.6) sepia(0.3) saturate(1.5) hue-rotate(15deg)' }}
        animate={{ rotate: hovered !== null ? 8 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />

      {/* Ripple rings */}
      <AnimatePresence>
        {showRipple && [0, 1, 2].map((i) => (
          <motion.img
            key={`ripple-${rippleKey}-${i}`}
            src="/images/nav_cog.svg"
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{ filter: 'brightness(0.4) sepia(0.2)' }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* SVG donut */}
      <svg width={size} height={size} className="absolute inset-0" style={{ zIndex: 2 }}>
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        {/* Data segments */}
        {arcs.map((arc, i) => (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
            className="cursor-pointer"
            style={{ filter: hovered === i ? 'brightness(1.3)' : 'none' }}
            animate={{
              strokeWidth: hovered === i ? strokeWidth + 6 : strokeWidth,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => { setHovered(null); setTooltip(null) }}
            onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent, arc)}
            onClick={() => onSegmentClick?.(arc)}
          />
        ))}
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center" style={{ zIndex: 3 }}>
        <span
          className="text-white font-bold leading-tight text-center"
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: size * 0.072,
            maxWidth: size * 0.38,
          }}
        >
          {title}
        </span>
        <span
          className="text-amber-500 font-mono"
          style={{ fontSize: size * 0.056 }}
        >
          {total.toLocaleString()}
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-xs pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <span className="font-mono text-gray-300">{tooltip.seg.label}</span>
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-white font-bold">{tooltip.seg.value.toLocaleString()}</span>
          <span className="mx-1 text-gray-500">
            ({((tooltip.seg.value / totalValue) * 100).toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  )
}
