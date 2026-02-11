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

interface CogPos { x: number; y: number; r: number }

/**
 * Builds a path of [x,y] points that:
 * 1. Enters from an edge point
 * 2. Arcs clockwise around each satellite (semi-circle on the outer side)
 * 3. Travels to the next satellite
 * 4. Finally shoots into the center cog
 */
function buildLightningPath(
  entry: { x: number; y: number },
  satellites: CogPos[],
  center: CogPos,
  clockwise: boolean,
): [number, number][] {
  const pts: [number, number][] = []
  const arcSteps = 16

  // Start from entry
  pts.push([entry.x, entry.y])

  for (let si = 0; si < satellites.length; si++) {
    const sat = satellites[si]
    const arcR = sat.r * 0.52

    // Angle from previous point (or entry) to this satellite
    const prev = pts[pts.length - 1]
    const inAngle = Math.atan2(sat.y - prev[1], sat.x - prev[0])

    // Arc: semi-circle on the far side from center, clockwise
    const sweepDir = clockwise ? 1 : -1
    for (let j = 0; j <= arcSteps; j++) {
      const t = j / arcSteps
      const a = inAngle + Math.PI * 0.1 + t * Math.PI * sweepDir
      pts.push([sat.x + Math.cos(a) * arcR, sat.y + Math.sin(a) * arcR])
    }
  }

  // Final: shoot into center
  pts.push([center.x, center.y])
  return pts
}

/** Sample a point along a polyline path at fractional distance t ∈ [0,1] */
function samplePath(pts: [number, number][], t: number): [number, number] {
  if (pts.length < 2) return pts[0] || [0, 0]
  // Compute total length
  let totalLen = 0
  const segLens: number[] = []
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1]
    const len = Math.sqrt(dx * dx + dy * dy)
    segLens.push(len)
    totalLen += len
  }
  const target = t * totalLen
  let acc = 0
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const frac = segLens[i] > 0 ? (target - acc) / segLens[i] : 0
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * frac,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * frac,
      ]
    }
    acc += segLens[i]
  }
  return pts[pts.length - 1]
}

/**
 * LightningStreaks — canvas overlay that draws animated light streaks
 * flowing from edges, wrapping clockwise around satellites, converging to center.
 * Matches the fingertip light streak gradient style (#60a5fa → transparent).
 */
function LightningStreaks({
  width, height,
  center, satellites,
}: {
  width: number; height: number
  center: CogPos
  satellites: CogPos[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)

  // Sort satellites clockwise by angle from center for path chaining
  const sortedCW = useMemo(() => {
    if (!satellites.length) return []
    return [...satellites].sort((a, b) => {
      const aa = Math.atan2(a.y - center.y, a.x - center.x)
      const ab = Math.atan2(b.y - center.y, b.x - center.x)
      return aa - ab
    })
  }, [satellites, center])

  const sortedCCW = useMemo(() => [...sortedCW].reverse(), [sortedCW])

  // Build two paths: one CW, one CCW, entering from opposite sides
  const paths = useMemo(() => {
    if (!sortedCW.length) return []
    const half = Math.ceil(sortedCW.length / 2)

    // Path A: enters from left, takes first half of satellites CW
    const satsA = sortedCW.slice(0, half)
    const entryA = { x: 0, y: center.y - 30 }
    const pathA = buildLightningPath(entryA, satsA, center, true)

    // Path B: enters from right, takes second half CCW
    const satsB = sortedCCW.slice(0, sortedCW.length - half)
    const entryB = { x: width, y: center.y + 30 }
    const pathB = buildLightningPath(entryB, satsB, center, false)

    return [pathA, pathB]
  }, [sortedCW, sortedCCW, center, width])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const now = performance.now() / 1000
    // Each streak is a moving head with a fading tail
    const speed = 0.15 // full path traversal time fraction per second
    const tailLen = 0.25 // fraction of path that's visible behind head

    const colors = ['#60a5fa', '#f97316'] // blue from left, orange from right

    paths.forEach((path, pi) => {
      if (path.length < 2) return

      // Head position cycles along the path
      const headT = (now * speed + pi * 0.5) % 1.0
      const tailT = Math.max(0, headT - tailLen)

      // Draw the streak as a gradient line segment
      const segments = 40
      for (let s = 0; s < segments; s++) {
        const t1 = tailT + (headT - tailT) * (s / segments)
        const t2 = tailT + (headT - tailT) * ((s + 1) / segments)
        const p1 = samplePath(path, t1)
        const p2 = samplePath(path, t2)

        const alpha = (s / segments) // brighter toward head
        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = colors[pi]
        ctx.lineWidth = 2
        ctx.globalAlpha = alpha * 0.5
        ctx.shadowColor = colors[pi]
        ctx.shadowBlur = 8
        ctx.stroke()
      }

      // Thin secondary streak (offset, dimmer, slightly behind)
      const head2T = (now * speed + pi * 0.5 - 0.03) % 1.0
      const tail2T = Math.max(0, head2T - tailLen * 0.6)
      for (let s = 0; s < 20; s++) {
        const t1 = tail2T + (head2T - tail2T) * (s / 20)
        const t2 = tail2T + (head2T - tail2T) * ((s + 1) / 20)
        const p1 = samplePath(path, t1)
        const p2 = samplePath(path, t2)
        ctx.beginPath()
        ctx.moveTo(p1[0] + 3, p1[1] + 3)
        ctx.lineTo(p2[0] + 3, p2[1] + 3)
        ctx.strokeStyle = colors[pi]
        ctx.lineWidth = 1
        ctx.globalAlpha = (s / 20) * 0.25
        ctx.shadowBlur = 4
        ctx.stroke()
      }
    })

    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    frameRef.current = requestAnimationFrame(draw)
  }, [width, height, paths])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[15] pointer-events-none"
      style={{ width, height }}
    />
  )
}

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

  // Compute satellite positions for CSS lightning arcs
  const satSize = 130 * scale
  const centerCogSize = 300 * scale

  const satellitePositions: CogPos[] = useMemo(() => {
    if (!menuOpen) return []
    return items.map((_, i) => {
      const angle = startAngle + angleStep * i
      const isActive = activeSubmenu === i
      const r = isActive ? pullInRadius : radius
      // Positions relative to container center
      const hw = (radius * 2 + 280) / 2
      return { x: hw + Math.cos(angle) * r, y: hw + Math.sin(angle) * r, r: satSize }
    })
  }, [menuOpen, items.length, activeSubmenu, startAngle, angleStep, radius, pullInRadius, satSize, scale])

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
        </>
      )}

      {/* Gear assembly */}
      <div
        ref={containerRef}
        className="relative z-10"
        style={{ width: radius * 2 + 280, height: radius * 2 + 280 }}
      >
        {/* Animated lightning streaks: enter from edges, arc CW around satellites, converge to center */}
        {menuOpen && satellitePositions.length > 0 && (
          <LightningStreaks
            width={radius * 2 + 280}
            height={radius * 2 + 280}
            center={{ x: (radius * 2 + 280) / 2, y: (radius * 2 + 280) / 2, r: centerCogSize }}
            satellites={satellitePositions}
          />
        )}

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
