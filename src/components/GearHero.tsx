/** GearHero — Industrial gear navigation hero section
 *
 * A large central gear with title text, surrounded by smaller satellite gears
 * arranged radially. Each satellite is a clickable nav item with icon + label.
 * Metallic textures via CSS gradients, animated rotation, industrial backdrop.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface GearNavItem {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

export interface GearHeroProps {
  title: string
  subtitle?: string
  items: GearNavItem[]
  backgroundImage?: string
  className?: string
}

/** Generate SVG gear path with n teeth */
function gearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const points: string[] = []
  const step = (Math.PI * 2) / teeth
  const toothDepth = outerR - innerR
  const toothWidth = step * 0.35

  for (let i = 0; i < teeth; i++) {
    const angle = step * i - Math.PI / 2
    // Inner point before tooth
    const a1 = angle - step * 0.5 + toothWidth * 0.3
    // Outer tooth start
    const a2 = angle - toothWidth
    // Outer tooth end
    const a3 = angle + toothWidth
    // Inner point after tooth
    const a4 = angle + step * 0.5 - toothWidth * 0.3

    if (i === 0) {
      points.push(`M ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)}`)
    } else {
      points.push(`L ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)}`)
    }
    points.push(`L ${cx + (innerR + toothDepth * 0.3) * Math.cos(a2)} ${cy + (innerR + toothDepth * 0.3) * Math.sin(a2)}`)
    points.push(`L ${cx + outerR * Math.cos(a2 + toothWidth * 0.4)} ${cy + outerR * Math.sin(a2 + toothWidth * 0.4)}`)
    points.push(`L ${cx + outerR * Math.cos(a3 - toothWidth * 0.4)} ${cy + outerR * Math.sin(a3 - toothWidth * 0.4)}`)
    points.push(`L ${cx + (innerR + toothDepth * 0.3) * Math.cos(a3)} ${cy + (innerR + toothDepth * 0.3) * Math.sin(a3)}`)
    points.push(`L ${cx + innerR * Math.cos(a4)} ${cy + innerR * Math.sin(a4)}`)
  }
  points.push('Z')
  return points.join(' ')
}

/** Single gear SVG with metallic gradient */
function GearSVG({
  size,
  teeth = 12,
  holeRatio = 0.35,
  id,
  color = 'steel',
}: {
  size: number
  teeth?: number
  holeRatio?: number
  id: string
  color?: 'steel' | 'bronze' | 'dark'
}) {
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.48
  const innerR = outerR * 0.78
  const holeR = outerR * holeRatio
  const boltR = outerR * 0.58
  const boltSize = size * 0.022

  const colors = {
    steel: { light: '#b8bfc6', mid: '#8a9199', dark: '#5a6370', rim: '#6b7280' },
    bronze: { light: '#c9a86c', mid: '#9a7b4f', dark: '#6b5535', rim: '#8b6914' },
    dark: { light: '#6b7280', mid: '#4b5563', dark: '#1f2937', rim: '#374151' },
  }
  const c = colors[color]

  // Bolt hole positions
  const boltAngles = Array.from({ length: 6 }, (_, i) => (i * Math.PI * 2) / 6 - Math.PI / 2)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {/* Metallic radial gradient */}
        <radialGradient id={`${id}-metal`} cx="35%" cy="35%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="40%" stopColor={c.mid} />
          <stop offset="80%" stopColor={c.dark} />
          <stop offset="100%" stopColor={c.dark} stopOpacity="0.9" />
        </radialGradient>
        {/* Rim highlight */}
        <radialGradient id={`${id}-rim`} cx="50%" cy="50%">
          <stop offset="85%" stopColor="transparent" />
          <stop offset="92%" stopColor={c.light} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Inner shadow */}
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
        {/* Rust/wear texture */}
        <filter id={`${id}-texture`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="overlay" />
        </filter>
      </defs>

      {/* Main gear body */}
      <g filter={`url(#${id}-shadow)`}>
        <path
          d={gearPath(cx, cy, outerR, innerR, teeth)}
          fill={`url(#${id}-metal)`}
          stroke={c.rim}
          strokeWidth="1"
          filter={`url(#${id}-texture)`}
        />
        {/* Rim highlight overlay */}
        <path
          d={gearPath(cx, cy, outerR, innerR, teeth)}
          fill={`url(#${id}-rim)`}
        />
      </g>

      {/* Center hole */}
      <circle cx={cx} cy={cy} r={holeR} fill="#1a2332" stroke={c.dark} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={holeR * 0.85} fill="none" stroke={c.mid} strokeWidth="0.5" opacity="0.5" />

      {/* Bolt holes */}
      {boltAngles.map((angle, i) => (
        <circle
          key={i}
          cx={cx + boltR * Math.cos(angle)}
          cy={cy + boltR * Math.sin(angle)}
          r={boltSize}
          fill="#1a2332"
          stroke={c.dark}
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}

export default function GearHero({
  title,
  subtitle,
  items,
  backgroundImage,
  className = '',
}: GearHeroProps) {
  const [rotation, setRotation] = useState(0)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  // Slow continuous rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => r + 0.15)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const radius = 260
  const angleStep = (Math.PI * 2) / items.length
  // Start from top-left, distributed evenly
  const startAngle = -Math.PI * 0.75

  return (
    <section
      className={`relative w-full min-h-[700px] flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 30%, #0d1b2a 70%, #0a1628 100%)',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Horizontal light streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute h-[2px] w-[60%] left-0 top-[35%] opacity-40"
          style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }}
        />
        <div
          className="absolute h-[1px] w-[45%] left-0 top-[38%] opacity-25"
          style={{ background: 'linear-gradient(90deg, #60a5fa, transparent)' }}
        />
        <div
          className="absolute h-[2px] w-[55%] right-0 top-[62%] opacity-35"
          style={{ background: 'linear-gradient(270deg, #f97316, transparent)' }}
        />
        <div
          className="absolute h-[1px] w-[40%] right-0 top-[65%] opacity-20"
          style={{ background: 'linear-gradient(270deg, #fb923c, transparent)' }}
        />
      </div>

      {/* Circular glow rings behind center gear */}
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500 }}>
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            border: '1px solid #3b82f6',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            inset: -30,
            border: '1px solid #60a5fa',
            animation: 'pulse 4s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Main gear assembly */}
      <div className="relative z-10" style={{ width: radius * 2 + 200, height: radius * 2 + 200 }}>
        {/* Center gear */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 0, ease: 'linear' }}
          >
            <GearSVG size={280} teeth={16} holeRatio={0.55} id="center" color="bronze" />
          </motion.div>
          {/* Center text overlay (doesn't rotate) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1
              className="text-3xl font-black text-white tracking-wider"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(59,130,246,0.2)',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-sm text-gray-300 tracking-[0.3em] mt-1 uppercase"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Satellite gears */}
        {items.map((item, i) => {
          const angle = startAngle + angleStep * i
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const isHovered = hoveredItem === i
          // Counter-rotate satellites for interlocking feel
          const satRotation = -rotation * 1.3

          const Wrapper = item.href ? 'a' : 'div'

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(${x - 60}px, ${y - 60}px)` }}
            >
              <Wrapper
                className="relative block cursor-pointer group"
                style={{ width: 120, height: 120 }}
                onClick={item.onClick}
                onMouseEnter={() => setHoveredItem(i)}
                onMouseLeave={() => setHoveredItem(null)}
                {...(item.href ? { href: item.href } : {})}
              >
                {/* Satellite gear (rotates) */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    rotate: satRotation,
                    scale: isHovered ? 1.12 : 1,
                  }}
                  transition={isHovered ? { type: 'spring', stiffness: 300 } : { duration: 0 }}
                >
                  <GearSVG size={120} teeth={10} holeRatio={0.5} id={`sat-${i}`} color={isHovered ? 'bronze' : 'steel'} />
                </motion.div>

                {/* Icon + label overlay (doesn't rotate) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <span
                    className="text-2xl mb-0.5 drop-shadow-lg"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="text-[10px] font-bold text-white tracking-widest uppercase"
                    style={{
                      fontFamily: "'Inter Tight', sans-serif",
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </Wrapper>
            </div>
          )
        })}
      </div>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </section>
  )
}
