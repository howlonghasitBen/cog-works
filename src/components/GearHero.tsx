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

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GearSubItem {
  id?: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
  content?: React.ReactNode
  innardSrc?: string
  innardSpin?: number
  innardScale?: number
  innardBg?: string
  innardImgScale?: number
}

export interface GearNavItem {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
  subItems?: GearSubItem[]
  /** Override innard image for this satellite (e.g. whirlpool.png) */
  innardSrc?: string
  /** Slowly spin the innard image (degrees per second) */
  innardSpin?: number
  /** Override innard size as fraction of cog size (default 0.72) */
  innardScale?: number
}

export interface GearHeroProps {
  title: string
  subtitle?: string
  items: GearNavItem[]
  backgroundImage?: string
  cogSrc?: string
  innardSrc?: string
  className?: string
  /** Called when a sub-cog is clicked with the sub-item data */
  onNavigate?: (parentItem: GearNavItem, subItem: GearSubItem, parentIndex: number, subIndex: number) => void
}

/** Cog visual — outer SVG gear + inner circle image + content overlay */
function Cog({
  size,
  cogSrc,
  rotation = 0,
  innardSrc,
  innardSpin,
  innardScale: innardScaleProp,
  innardBg,
  innardImgScale,
  children,
}: {
  size: number
  cogSrc: string
  innardSrc?: string
  innardSpin?: number
  innardScale?: number
  innardBg?: string
  innardImgScale?: number
  rotation?: number
  children?: React.ReactNode
}) {
  const innardScaleVal = innardScaleProp ?? (innardSpin ? 0.82 : 0.72)
  const innardSize = size * innardScaleVal
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.img
        src={cogSrc}
        alt=""
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        draggable={false}
      />
      {innardSrc && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden z-0"
          style={{ width: innardSize, height: innardSize, backgroundColor: innardBg || 'transparent' }}
        >
          <img
            src={innardSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{
              borderRadius: '50%',
              ...(innardSpin ? { animation: `innardSpin ${360 / innardSpin}s linear infinite` } : {}),
              ...(innardImgScale ? { transform: `scale(${innardImgScale})` } : {}),
            }}
            draggable={false}
          />
        </div>
      )}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
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
  transparentBg = false,
  onNavigate,
  onCenterClick,
  onMenuToggle,
}: GearHeroProps & { transparentBg?: boolean; onCenterClick?: () => void; onMenuToggle?: (open: boolean) => void }) {
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
    // If external handler provided (e.g. return to nav), use it
    if (onCenterClick) { onCenterClick(); return }
    const opening = !menuOpen
    // Center: clockwise (+)
    setCenterRotation(r => r + 360)
    if (opening) {
      // Satellites: counter-clockwise (-), staggered
      setSatRotations(items.map((_, i) => -360 - i * 30))
    }
    setMenuOpen(opening)
    setActiveSubmenu(null)
    onMenuToggle?.(opening)
  }

  const handleSatelliteClick = (index: number, item: GearNavItem) => {
    if (item.subItems && item.subItems.length > 0) {
      const opening = activeSubmenu !== index
      // Satellite: counter-clockwise (-), center reacts clockwise (+)
      setSatRotations(prev => {
        const next = [...prev]
        next[index] = prev[index] - 180
        return next
      })
      setCenterRotation(r => r + 90)
      if (opening) {
        // Sub-cogs: clockwise (+)
        setSubRotations([360, 360 + 40, 360 + 80])
      }
      setActiveSubmenu(opening ? index : null)
    } else {
      item.onClick?.()
    }
  }

  const handleSubClick = (subItem: GearSubItem, subIdx: number) => {
    // Sub-cog: clockwise (+), parent satellite reacts counter-clockwise (-)
    setSubRotations(prev => {
      const next = [...prev]
      next[subIdx] = prev[subIdx] + 180
      return next
    })
    const parentIdx = activeSubmenu
    if (parentIdx !== null) {
      setSatRotations(prev => {
        const next = [...prev]
        next[parentIdx] = prev[parentIdx] - 90
        return next
      })
      setCenterRotation(r => r + 45)
    }
    if (subItem.href) {
      window.open(subItem.href, '_blank', 'noopener')
      // Keep menu open for external links so user can navigate more
      return
    }
    subItem.onClick?.()

    // Close menu + trigger navigation (internal pages only)
    setTimeout(() => {
      setMenuOpen(false)
      setActiveSubmenu(null)
      if (onNavigate && parentIdx !== null) {
        onNavigate(items[parentIdx], subItem, parentIdx, subIdx)
      }
    }, 400) // Brief delay so spin animation is visible
  }

  // Responsive scaling — shrink on mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const scale = useMemo(() => {
    if (windowWidth < 480) return 0.45   // small phone
    if (windowWidth < 640) return 0.55   // phone
    if (windowWidth < 768) return 0.65   // large phone / small tablet
    if (windowWidth < 1024) return 0.8   // tablet
    return 1                              // desktop
  }, [windowWidth])

  const radius = 280 * scale
  const subRadius = 120 * scale
  const pullInRadius = 220 * scale
  const angleStep = (Math.PI * 2) / items.length
  const startAngle = -Math.PI * 0.75

  // Lightning path: grows segment by segment from fingertip → nearest sat → next CW sat → ... → center
  const [touchStep, setTouchStep] = useState(-1) // -1=hidden, 0=first seg, N=to center, N+1=done
  useEffect(() => {
    if (!menuOpen) { setTouchStep(-1); return }
    const t = setTimeout(() => setTouchStep(0), 500)
    return () => clearTimeout(t)
  }, [menuOpen])
  useEffect(() => {
    if (touchStep < 0 || touchStep > items.length) return
    const t = setTimeout(() => setTouchStep(s => s + 1), 400)
    return () => clearTimeout(t)
  }, [touchStep, items.length])

  // Compute the full ordered path for each bolt: fingertip → nearest sat → CW through all → center
  const lightningSegments = useMemo(() => {
    const vw = windowWidth
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900
    const cx = vw / 2, cy = vh / 2

    // All satellite positions with their original indices
    const sats = items.map((_, i) => {
      const a = startAngle + angleStep * i
      return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, angle: a, idx: i }
    })

    const dist = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

    // Build CW-ordered path starting from nearest sat to each finger
    const buildPath = (fingerX: number, fingerY: number) => {
      const finger = { x: fingerX, y: fingerY }
      // Find nearest satellite
      let nearestIdx = 0, nearestDist = Infinity
      sats.forEach((s, i) => {
        const d = dist(finger, s)
        if (d < nearestDist) { nearestDist = d; nearestIdx = i }
      })

      // Walk CW from nearest: sort by angle, then reorder starting from nearest
      const sorted = [...sats].sort((a, b) => a.angle - b.angle)
      const startPos = sorted.findIndex(s => s.idx === nearestIdx)
      const ordered: typeof sats = []
      for (let i = 0; i < sorted.length; i++) {
        ordered.push(sorted[(startPos + i) % sorted.length])
      }

      // Build segments: finger→sat0, sat0→sat1, ..., satN-1→center
      const segments: Array<{fromX:number, fromY:number, toX:number, toY:number}> = []
      segments.push({ fromX: finger.x, fromY: finger.y, toX: ordered[0].x, toY: ordered[0].y })
      for (let i = 1; i < ordered.length; i++) {
        segments.push({ fromX: ordered[i-1].x, fromY: ordered[i-1].y, toX: ordered[i].x, toY: ordered[i].y })
      }
      segments.push({ fromX: ordered[ordered.length-1].x, fromY: ordered[ordered.length-1].y, toX: cx, toY: cy })
      return segments
    }

    // Left finger at left edge ~33%, right finger at right edge ~64%
    return {
      left: buildPath(0, vh * 0.33),
      right: buildPath(vw, vh * 0.64),
    }
  }, [items.length, startAngle, angleStep, radius, windowWidth])

  return (
    <section
      className={`relative w-full h-screen flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
      style={transparentBg ? { background: 'transparent' } : {
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 30%, #0d1b2a 70%, #0a1628 100%)',
      }}
    >
      {!transparentBg && (
        <>
          <div className="absolute inset-0 bg-black/30" />

          {/* Lightning — grows segment by segment from fingertips through satellites to center */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ opacity: menuOpen ? 1 : 0, transition: 'opacity 0.6s ease-in-out', zIndex: 10 }}>
            {/* DEBUG: remove after confirming visibility */}
            {touchStep >= 0 && console.log('Lightning touchStep:', touchStep, 'left segs:', lightningSegments.left.length, 'right segs:', lightningSegments.right.length)}
            {/* Render accumulated segments for both bolts */}
            {touchStep >= 0 && lightningSegments.left.slice(0, touchStep + 1).map((seg, i) => {
              const dx = seg.toX - seg.fromX, dy = seg.toY - seg.fromY
              const len = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              return (
                <div key={`left-${i}`}>
                  <div className="absolute origin-left" style={{
                    left: seg.fromX, top: seg.fromY,
                    width: len, height: 2,
                    transform: `rotate(${angle}deg)`,
                    background: i === 0
                      ? 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #3b82f6 100%)'
                      : '#3b82f6',
                    filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))',
                    opacity: 0.6,
                  }} />
                  <div className="absolute origin-left" style={{
                    left: seg.fromX, top: seg.fromY + 3,
                    width: len * 0.85, height: 1,
                    transform: `rotate(${angle}deg)`,
                    background: i === 0
                      ? 'linear-gradient(90deg, transparent 0%, #60a5fa 40%, #60a5fa 100%)'
                      : '#60a5fa',
                    filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.4))',
                    opacity: 0.4,
                  }} />
                </div>
              )
            })}
            {touchStep >= 0 && lightningSegments.right.slice(0, touchStep + 1).map((seg, i) => {
              const dx = seg.toX - seg.fromX, dy = seg.toY - seg.fromY
              const len = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              return (
                <div key={`right-${i}`}>
                  <div className="absolute origin-left" style={{
                    left: seg.fromX, top: seg.fromY,
                    width: len, height: 2,
                    transform: `rotate(${angle}deg)`,
                    background: i === 0
                      ? 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #3b82f6 100%)'
                      : '#3b82f6',
                    filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))',
                    opacity: 0.6,
                  }} />
                  <div className="absolute origin-left" style={{
                    left: seg.fromX, top: seg.fromY + 3,
                    width: len * 0.85, height: 1,
                    transform: `rotate(${angle}deg)`,
                    background: i === 0
                      ? 'linear-gradient(90deg, transparent 0%, #60a5fa 40%, #60a5fa 100%)'
                      : '#60a5fa',
                    filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.4))',
                    opacity: 0.4,
                  }} />
                </div>
              )
            })}
          </div>

          {/* Glow rings */}
          <div className="absolute pointer-events-none" style={{ width: 520, height: 520 }}>
            <div className="absolute inset-0 rounded-full opacity-15"
              style={{ border: '1px solid #3b82f6', animation: 'gearPulse 4s ease-in-out infinite' }} />
            <div className="absolute rounded-full opacity-10"
              style={{ inset: -35, border: '1px solid #60a5fa', animation: 'gearPulse 4s ease-in-out infinite 1s' }} />
          </div>
        </>
      )}

      {/* Gear assembly */}
      <div
        ref={containerRef}
        className="relative z-10"
        style={{ width: radius * 2 + 280, height: radius * 2 + 280 }}
      >
        {/* Center gear — highest z-index */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 pointer-events-auto"
          onClick={handleCenterClick}
        >
          <Cog size={300 * scale} cogSrc={cogSrc} innardSrc={innardSrc} rotation={centerRotation} />
        </div>

        {/* Satellite gears — only visible when menu is open */}
        {/* Sub-cogs layer — z-0, rendered BEFORE satellites so they're behind */}
        <AnimatePresence>
          {menuOpen && items.map((item, i) => {
            if (activeSubmenu !== i || !item.subItems) return null
            const angle = startAngle + angleStep * i
            const r = pullInRadius
            const satCenterX = Math.cos(angle) * r
            const satCenterY = Math.sin(angle) * r

            return item.subItems.slice(0, 3).map((sub, si) => {
              const subAngleBase = angle
              const subSpread = Math.PI * 0.35
              const subAngle = subAngleBase + (si - 1) * subSpread
              const sx = satCenterX + Math.cos(subAngle) * subRadius
              const sy = satCenterY + Math.sin(subAngle) * subRadius
              const subSize = 85 * scale

              return (
                <motion.div
                  key={`sub-${i}-${si}`}
                  className="absolute left-1/2 top-1/2 z-0"
                  initial={{ x: satCenterX - subSize / 2, y: satCenterY - subSize / 2, opacity: 0, scale: 0.1 }}
                  animate={{
                    x: sx - subSize / 2,
                    y: sy - subSize / 2,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ x: satCenterX - subSize / 2, y: satCenterY - subSize / 2, opacity: 0, scale: 0.1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 18,
                    delay: si * 0.06,
                  }}
                >
                  <div
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => handleSubClick(sub, si)}
                  >
                    <motion.div whileHover={{ scale: 1.12 }}>
                      <Cog size={subSize} cogSrc={cogSrc} innardSrc={sub.innardSrc || innardSrc} innardSpin={sub.innardSpin} innardScale={sub.innardScale} innardBg={sub.innardBg} innardImgScale={sub.innardImgScale} rotation={subRotations[si]} />
                    </motion.div>
                  </div>
                </motion.div>
              )
            })
          })}
        </AnimatePresence>

        {/* Satellite cogs layer — z-10, rendered AFTER sub-cogs so they're in front */}
        <AnimatePresence>
          {menuOpen && items.map((item, i) => {
            const angle = startAngle + angleStep * i
            const isActive = activeSubmenu === i
            const r = isActive ? pullInRadius : radius
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            const satSize = 130 * scale

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
                  ...(activeSubmenu !== null ? {} : { delay: i * 0.07 }),
                }}
              >
                <div
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => handleSatelliteClick(i, item)}
                >
                  <motion.div
                    animate={{ scale: isActive ? 0.9 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Cog size={satSize} cogSrc={cogSrc} innardSrc={item.innardSrc || innardSrc} innardSpin={item.innardSpin} innardScale={item.innardScale} rotation={satRotations[i]} />
                  </motion.div>
                </div>
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
        @keyframes innardSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}
