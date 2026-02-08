/** GearHero — Industrial gear navigation hero section
 *
 * Large central gear with title text, surrounded by smaller satellite gears.
 * Uses nav_cog.svg for gear shape and nav_cog_innard.png for center fill.
 * Each satellite is a clickable nav item with icon + label.
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
  cogSrc?: string
  innardSrc?: string
  className?: string
}

/** A single cog with optional innard image and overlay content */
function Cog({
  size,
  cogSrc,
  innardSrc,
  children,
  rotation = 0,
  className = '',
}: {
  size: number
  cogSrc: string
  innardSrc?: string
  children?: React.ReactNode
  rotation?: number
  className?: string
}) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Rotating cog SVG */}
      <motion.img
        src={cogSrc}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0, ease: 'linear' }}
        draggable={false}
      />
      {/* Static innard image (centered, ~60% of cog size) */}
      {innardSrc && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
          style={{ width: size * 0.52, height: size * 0.52 }}
        >
          <img
            src={innardSrc}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}
      {/* Overlay content (text, icons) — static, doesn't rotate */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}

export default function GearHero({
  title,
  subtitle,
  items,
  backgroundImage,
  cogSrc = '/images/nav_cog.svg',
  innardSrc = '/images/nav_cog_innard.png',
  className = '',
}: GearHeroProps) {
  const [rotation, setRotation] = useState(0)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  // Slow continuous rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => r + 0.12)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const radius = 280
  const angleStep = (Math.PI * 2) / items.length
  const startAngle = -Math.PI * 0.75

  return (
    <section
      className={`relative w-full min-h-[750px] flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 30%, #0d1b2a 70%, #0a1628 100%)',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Light streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute h-[2px] w-[55%] left-0 top-[33%] opacity-30"
          style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
        <div className="absolute h-[1px] w-[40%] left-0 top-[36%] opacity-20"
          style={{ background: 'linear-gradient(90deg, #60a5fa, transparent)' }} />
        <div className="absolute h-[2px] w-[50%] right-0 top-[64%] opacity-30"
          style={{ background: 'linear-gradient(270deg, #f97316, transparent)' }} />
        <div className="absolute h-[1px] w-[35%] right-0 top-[67%] opacity-15"
          style={{ background: 'linear-gradient(270deg, #fb923c, transparent)' }} />
      </div>

      {/* Glow rings */}
      <div className="absolute pointer-events-none" style={{ width: 520, height: 520 }}>
        <div className="absolute inset-0 rounded-full opacity-15"
          style={{ border: '1px solid #3b82f6', animation: 'gearPulse 4s ease-in-out infinite' }} />
        <div className="absolute rounded-full opacity-10"
          style={{ inset: -35, border: '1px solid #60a5fa', animation: 'gearPulse 4s ease-in-out infinite 1s' }} />
      </div>

      {/* Gear assembly */}
      <div className="relative z-10" style={{ width: radius * 2 + 220, height: radius * 2 + 220 }}>
        {/* Center gear */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Cog size={300} cogSrc={cogSrc} innardSrc={innardSrc} rotation={rotation}>
            <h1
              className="text-3xl font-black text-white tracking-wider drop-shadow-lg"
              style={{ fontFamily: "'Inter Tight', sans-serif", textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-xs text-gray-200 tracking-[0.3em] mt-1 uppercase"
                style={{ fontFamily: "'DM Mono', monospace", textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
              >
                {subtitle}
              </p>
            )}
          </Cog>
        </div>

        {/* Satellite gears */}
        {items.map((item, i) => {
          const angle = startAngle + angleStep * i
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const isHovered = hoveredItem === i
          const satRotation = -rotation * 1.4 // Counter-rotate for interlocking feel

          const El = item.href ? 'a' : 'div'

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(${x - 65}px, ${y - 65}px)` }}
            >
              <El
                className="relative block cursor-pointer"
                style={{ width: 130, height: 130 }}
                onClick={item.onClick}
                onMouseEnter={() => setHoveredItem(i)}
                onMouseLeave={() => setHoveredItem(null)}
                {...(item.href ? { href: item.href } : {})}
              >
                <motion.div
                  animate={{ scale: isHovered ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Cog size={130} cogSrc={cogSrc} innardSrc={innardSrc} rotation={satRotation}>
                    <span className="text-2xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
                      {item.icon}
                    </span>
                    <span
                      className="text-[9px] font-bold text-white tracking-[0.15em] uppercase mt-0.5"
                      style={{ fontFamily: "'Inter Tight', sans-serif", textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {item.label}
                    </span>
                  </Cog>
                </motion.div>
              </El>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes gearPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </section>
  )
}
