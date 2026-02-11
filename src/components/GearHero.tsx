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

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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
  const streaksRef = useRef<HTMLCanvasElement>(null)
  const streaksFrameRef = useRef<number>(0)

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

  // Draw the light streaks — same visual as the original CSS divs, but able to curve
  const drawStreaks = useCallback(() => {
    const canvas = streaksRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2

    // Helper: draw a glowing line along a set of points
    const drawGlowLine = (pts: [number, number][], color: string, width: number, alpha: number) => {
      if (pts.length < 2) return
      // Glow pass
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.strokeStyle = color
      ctx.lineWidth = width + 4
      ctx.globalAlpha = alpha * 0.3
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.stroke()
      // Main line
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.globalAlpha = alpha
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    if (!menuOpen) {
      // Closed state: draw the original straight streaks exactly as the CSS divs did
      // Left blue main: h-[2px] w-[55%] left-0 top-[33%] opacity-30
      drawGlowLine([[0, h * 0.33], [w * 0.55, h * 0.33]], '#3b82f6', 2, 0.3)
      // Left blue secondary: h-[1px] w-[40%] left-0 top-[36%] opacity-20
      drawGlowLine([[0, h * 0.36], [w * 0.40, h * 0.36]], '#60a5fa', 1, 0.2)
      // Right orange main: h-[2px] w-[50%] right-0 top-[64%] opacity-30
      drawGlowLine([[w, h * 0.64], [w * 0.50, h * 0.64]], '#f97316', 2, 0.3)
      // Right orange secondary: h-[1px] w-[35%] right-0 top-[67%] opacity-15
      drawGlowLine([[w, h * 0.67], [w * 0.65, h * 0.67]], '#fb923c', 1, 0.15)
    } else {
      // Open state: streaks curve CW around satellite ring then converge to center
      // Compute satellite positions in section coords
      const sats = items.map((_, i) => {
        const a = startAngle + angleStep * i
        const isActive = activeSubmenu === i
        const r = isActive ? pullInRadius : radius
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, angle: a }
      })
      // Sort CW by angle
      const sorted = [...sats].sort((a, b) => a.angle - b.angle)
      const n = sorted.length
      const ringR = radius // ring radius from center
      const cogArcR = 65 * scale * 0.55 // semi-circle arc radius around each cog

      // Build a full CW ring path through all satellites
      const ringPath: [number, number][] = []
      for (let step = 0; step < n; step++) {
        const sat = sorted[step]
        // Semi-circle arc on the outer side of this satellite
        const angleFromCenter = Math.atan2(sat.y - cy, sat.x - cx)
        for (let j = 0; j <= 10; j++) {
          const t = j / 10
          const a = angleFromCenter + Math.PI + t * Math.PI // CW outer semi-circle
          ringPath.push([sat.x + Math.cos(a) * cogArcR, sat.y + Math.sin(a) * cogArcR])
        }
        // Connect to next sat along the ring
        if (step < n - 1) {
          const nextSat = sorted[step + 1]
          const a1 = Math.atan2(sat.y - cy, sat.x - cx)
          let a2 = Math.atan2(nextSat.y - cy, nextSat.x - cx)
          if (a2 <= a1) a2 += Math.PI * 2
          for (let j = 1; j <= 5; j++) {
            const t = j / 6
            const a = a1 + (a2 - a1) * t
            ringPath.push([cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR])
          }
        }
      }
      // Close the ring: connect last sat back to first
      const lastSat = sorted[n - 1]
      const firstSat = sorted[0]
      const aLast = Math.atan2(lastSat.y - cy, lastSat.x - cx)
      let aFirst = Math.atan2(firstSat.y - cy, firstSat.x - cx)
      if (aFirst <= aLast) aFirst += Math.PI * 2
      for (let j = 1; j <= 5; j++) {
        const t = j / 6
        const a = aLast + (aFirst - aLast) * t
        ringPath.push([cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR])
      }

      // Find the ring point nearest to each finger tip
      const fingerL: [number, number] = [w * 0.55, h * 0.33] // left blue streak tip
      const fingerR: [number, number] = [w * 0.50, h * 0.64] // right orange streak tip

      const findNearestIdx = (fx: number, fy: number) => {
        let best = 0, bestD = Infinity
        ringPath.forEach((p, i) => {
          const d = Math.sqrt((p[0] - fx) ** 2 + (p[1] - fy) ** 2)
          if (d < bestD) { bestD = d; best = i }
        })
        return best
      }

      const leftContact = findNearestIdx(fingerL[0], fingerL[1])
      const rightContact = findNearestIdx(fingerR[0], fingerR[1])

      // LEFT BLUE PATH: finger tip → contact point → CW around full ring → converge to center
      const pathL: [number, number][] = [
        [0, h * 0.33],  // start from left edge (finger origin)
        fingerL,          // finger tip
        ringPath[leftContact], // contact ring
      ]
      // CW from leftContact through the full ring
      for (let i = 1; i < ringPath.length; i++) {
        const idx = (leftContact + i) % ringPath.length
        pathL.push(ringPath[idx])
      }
      pathL.push([cx, cy]) // converge to center

      // RIGHT ORANGE PATH: finger tip → contact point → CW around full ring → converge to center
      const pathR: [number, number][] = [
        [w, h * 0.64],  // start from right edge (finger origin)
        fingerR,          // finger tip
        ringPath[rightContact], // contact ring
      ]
      // CW from rightContact through the full ring
      for (let i = 1; i < ringPath.length; i++) {
        const idx = (rightContact + i) % ringPath.length
        pathR.push(ringPath[idx])
      }
      pathR.push([cx, cy]) // converge to center

      // Draw both paths
      drawGlowLine(pathL, '#3b82f6', 2, 0.3)
      drawGlowLine(pathR, '#f97316', 2, 0.3)

      // Secondary thinner lines
      const offsetPath = (pts: [number, number][], dx: number, dy: number): [number, number][] =>
        pts.map(([x, y]) => [x + dx, y + dy] as [number, number])
      drawGlowLine(offsetPath(pathL, 0, h * 0.03), '#60a5fa', 1, 0.2)
      drawGlowLine(offsetPath(pathR, 0, h * 0.03), '#fb923c', 1, 0.15)
    }

    ctx.globalAlpha = 1
  }, [menuOpen, items.length, activeSubmenu, startAngle, angleStep, radius, pullInRadius, scale])

  useEffect(() => {
    // Redraw whenever menu state changes
    cancelAnimationFrame(streaksFrameRef.current)
    drawStreaks()
    // Also handle resize
    const onResize = () => drawStreaks()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(streaksFrameRef.current)
    }
  }, [drawStreaks])

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

          {/* Light streaks — canvas replaces CSS divs so they can curve when menu opens */}
          <canvas
            ref={streaksRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

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
