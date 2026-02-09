import { useState, useEffect } from 'react'
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
  delay?: number
  onSegmentClick?: (segment: CogDonutSegment) => void
}

export default function CogDonut({ title, total, segments, size = 250, delay = 0, onSegmentClick }: CogDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [ripple, setRipple] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRipple(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const cogSize = size
  const svgSize = size * 0.75
  const radius = svgSize * 0.32
  const strokeWidth = svgSize * 0.12
  const circumference = 2 * Math.PI * radius
  const center = svgSize / 2

  // Build segments
  let accumulated = 0
  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? seg.value / total : 0
    const dashLen = circumference * pct
    const dashGap = circumference - dashLen
    const offset = -circumference * accumulated + circumference * 0.25 // start at top
    accumulated += pct
    return { ...seg, dashLen, dashGap, offset, index: i, pct }
  })

  return (
    <div className="relative flex flex-col items-center" style={{ width: cogSize, height: cogSize + 40 }}>
      {/* Ripple rings */}
      {ripple && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-amber-500/30"
          style={{ width: cogSize * 0.7, height: cogSize * 0.7, top: (cogSize - cogSize * 0.7) / 2 }}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeOut' }}
        />
      ))}

      {/* Cog frame */}
      <motion.img
        src="/images/nav_cog.svg"
        alt=""
        className="absolute pointer-events-none"
        style={{ width: cogSize, height: cogSize, top: 0 }}
        animate={{ rotate: hoveredIndex !== null ? 8 : 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      />

      {/* SVG Donut */}
      <svg
        width={svgSize}
        height={svgSize}
        className="absolute"
        style={{ top: (cogSize - svgSize) / 2 }}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        {/* Background ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />

        {/* Data segments */}
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
            className="cursor-pointer"
            style={{ pointerEvents: 'auto' }}
            animate={{
              strokeWidth: hoveredIndex === arc.index ? strokeWidth + 4 : strokeWidth,
              opacity: hoveredIndex !== null && hoveredIndex !== arc.index ? 0.5 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(arc.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSegmentClick?.(arc)}
          />
        ))}
      </svg>

      {/* Center label */}
      <div
        className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ top: (cogSize - svgSize) / 2, width: svgSize, height: svgSize }}
      >
        <span className="text-xs font-bold text-white truncate max-w-[80px]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          {title}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{total.toLocaleString()}</span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            className="absolute z-50 bg-gray-900 border border-gray-700 px-3 py-2 text-xs pointer-events-none"
            style={{ top: -45, left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: arcs[hoveredIndex].color }} />
              <span className="text-white font-mono">{arcs[hoveredIndex].label}</span>
            </div>
            <div className="text-gray-400 font-mono mt-1">
              {arcs[hoveredIndex].value.toLocaleString()} ({(arcs[hoveredIndex].pct * 100).toFixed(1)}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
