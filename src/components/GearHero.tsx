/** GearHero — Industrial gear navigation hero section
 *
 * Large central gear that reveals satellite gears on click.
 * Satellites can open sub-sub-menus of 3 cogs each.
 * Uses nav_cog.svg + nav_cog_innard.png assets.
 *
 * Behavior:
 * - No rotation by default; gears spin with ease-in-out on click
 * - Satellites hidden until center cog clicked (spin-in entrance)
 * - Clicking a satellite opens 3 sub-sub-cogs + moves satellite toward center
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GearSubItem {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

export interface GearNavItem {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
  subItems?: GearSubItem[]
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

/** Cog visual — outer SVG gear + inner circle image + content overlay */
function Cog({
  size,
  cogSrc,
  innardSrc,
  rotation = 0,
  children,
}: {
  size: number
  cogSrc: string
  innardSrc?: string
  rotation?: number
  children?: React.ReactNode
}) {
  // Innard fills ~72% of cog to close the gap
  const innardSize = size * 0.72
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.img
        src={cogSrc}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        draggable={false}
      />
      {innardSrc && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
          style={{ width: innardSize, height: innardSize }}
        >
          <img src={innardSrc} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      )}
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [centerRotation, setCenterRotation] = useState(0)
  const [satRotations, setSatRotations] = useState<number[]>(() => items.map(() => 0))
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null)
  const [subRotations, setSubRotations] = useState<number[]>([0, 0, 0])
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleCenterClick = () => {
    const opening = !menuOpen
    setCenterRotation(r => r + 360)
    if (opening) {
      // Stagger satellite spin-in rotations
      setSatRotations(items.map((_, i) => 360 + i * 30))
    }
    setMenuOpen(opening)
    setActiveSubmenu(null)
  }

  const handleSatelliteClick = (index: number, item: GearNavItem) => {
    if (item.subItems && item.subItems.length > 0) {
      const opening = activeSubmenu !== index
      // Spin the clicked satellite
      setSatRotations(prev => {
        const next = [...prev]
        next[index] = prev[index] + 180
        return next
      })
      if (opening) {
        setSubRotations([360, 360 + 40, 360 + 80])
      }
      setActiveSubmenu(opening ? index : null)
    } else {
      item.onClick?.()
    }
  }

  const handleSubClick = (subItem: GearSubItem, subIdx: number) => {
    setSubRotations(prev => {
      const next = [...prev]
      next[subIdx] = prev[subIdx] + 180
      return next
    })
    subItem.onClick?.()
  }

  const radius = 280
  const subRadius = 120
  const pullInRadius = 220 // Satellite moves closer when submenu open (tiny gap preserved)
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
      <div
        ref={containerRef}
        className="relative z-10"
        style={{ width: radius * 2 + 280, height: radius * 2 + 280 }}
      >
        {/* Center gear — highest z-index */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
          onClick={handleCenterClick}
        >
          <Cog size={300} cogSrc={cogSrc} innardSrc={innardSrc} rotation={centerRotation}>
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

        {/* Satellite gears — only visible when menu is open */}
        <AnimatePresence>
          {menuOpen && items.map((item, i) => {
            const angle = startAngle + angleStep * i
            const isActive = activeSubmenu === i
            const r = isActive ? pullInRadius : radius
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            const satSize = 130

            return (
              <motion.div
                key={`sat-${i}`}
                className="absolute left-1/2 top-1/2 z-10"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
                animate={{
                  x: x - satSize / 2,
                  y: y - satSize / 2,
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: i * 0.07,
                }}
              >
                {/* Satellite cog */}
                <div
                  className="cursor-pointer"
                  onClick={() => handleSatelliteClick(i, item)}
                >
                  <motion.div
                    animate={{ scale: isActive ? 0.9 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Cog size={satSize} cogSrc={cogSrc} innardSrc={innardSrc} rotation={satRotations[i]}>
                      <span className="text-2xl drop-shadow-lg"
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
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
                </div>

                {/* Sub-sub-menu cogs (3 per satellite) */}
                <AnimatePresence>
                  {isActive && item.subItems && item.subItems.slice(0, 3).map((sub, si) => {
                    // Fan out from satellite, away from center
                    const subAngleBase = angle // Continue outward from center
                    const subSpread = Math.PI * 0.35
                    const subAngle = subAngleBase + (si - 1) * subSpread
                    const sx = Math.cos(subAngle) * subRadius
                    const sy = Math.sin(subAngle) * subRadius
                    const subSize = 85

                    return (
                      <motion.div
                        key={`sub-${i}-${si}`}
                        className="absolute z-0"
                        style={{ left: satSize / 2, top: satSize / 2 }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.1 }}
                        animate={{
                          x: sx - subSize / 2,
                          y: sy - subSize / 2,
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{ x: 0, y: 0, opacity: 0, scale: 0.1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 250,
                          damping: 18,
                          delay: si * 0.06,
                        }}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => handleSubClick(sub, si)}
                        >
                          <motion.div whileHover={{ scale: 1.12 }}>
                            <Cog size={subSize} cogSrc={cogSrc} innardSrc={innardSrc} rotation={subRotations[si]}>
                              <span className="text-lg drop-shadow-lg">{sub.icon}</span>
                              <span
                                className="text-[7px] font-bold text-white tracking-[0.12em] uppercase mt-0.5"
                                style={{ fontFamily: "'Inter Tight', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                              >
                                {sub.label}
                              </span>
                            </Cog>
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
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
