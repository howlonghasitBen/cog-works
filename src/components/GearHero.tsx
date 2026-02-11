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
  const lightningCanvasRef = useRef<HTMLCanvasElement>(null)
  const lightningFrameRef = useRef<number>(0)

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

  // Lightning canvas: draws paths from finger tips → CW through satellites → center
  const drawLightning = useCallback(() => {
    const canvas = lightningCanvasRef.current
    if (!canvas || !menuOpen) {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // Section center (where the gear assembly is centered)
    const cx = w / 2
    const cy = h / 2

    // Satellite positions in section coords
    const satPositions = items.map((_, i) => {
      const angle = startAngle + angleStep * i
      const isActive = activeSubmenu === i
      const r = isActive ? pullInRadius : radius
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        angle,
      }
    })

    // Sort satellites by angle for CW traversal
    const sorted = [...satPositions].sort((a, b) => a.angle - b.angle)

    // Finger tip positions (where the CSS light streaks end)
    // Left finger: ~55% from left, 33% from top
    const leftFingerX = w * 0.55
    const leftFingerY = h * 0.33
    // Right finger: ~50% from right = 50% from left, 64% from top
    const rightFingerX = w * 0.50
    const rightFingerY = h * 0.64

    // Find nearest satellite to each finger
    const findNearest = (fx: number, fy: number) => {
      let best = 0, bestDist = Infinity
      sorted.forEach((s, i) => {
        const d = Math.sqrt((s.x - fx) ** 2 + (s.y - fy) ** 2)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    }

    const leftStart = findNearest(leftFingerX, leftFingerY)
    const rightStart = findNearest(rightFingerX, rightFingerY)
    const n = sorted.length
    const satR = radius // distance from center to satellite ring
    const cogR = 65 * scale // half satellite cog size for arc radius

    // Build path: finger → first sat → CW through half the ring → center
    const buildPath = (fingerX: number, fingerY: number, startIdx: number, count: number): [number, number][] => {
      const pts: [number, number][] = [[fingerX, fingerY]]

      for (let step = 0; step < count; step++) {
        const si = (startIdx + step) % n
        const sat = sorted[si]

        // Arc CW around this satellite (outer half, ~180°)
        const angleFromCenter = Math.atan2(sat.y - cy, sat.x - cx)
        const arcR = cogR * 0.85
        const arcStart = angleFromCenter + Math.PI // start from side facing center
        for (let j = 0; j <= 12; j++) {
          const t = j / 12
          const a = arcStart + t * Math.PI // CW semicircle on outer side
          pts.push([sat.x + Math.cos(a) * arcR, sat.y + Math.sin(a) * arcR])
        }

        // Connect to next satellite along the ring arc
        if (step < count - 1) {
          const nextSi = (startIdx + step + 1) % n
          const nextSat = sorted[nextSi]
          const a1 = Math.atan2(sat.y - cy, sat.x - cx)
          let a2 = Math.atan2(nextSat.y - cy, nextSat.x - cx)
          if (a2 <= a1) a2 += Math.PI * 2 // ensure CW
          for (let j = 1; j <= 6; j++) {
            const t = j / 7
            const a = a1 + (a2 - a1) * t
            pts.push([cx + Math.cos(a) * satR, cy + Math.sin(a) * satR])
          }
        }
      }

      // Converge to center
      pts.push([cx, cy])
      return pts
    }

    // Left streak: CW from leftStart through ~half satellites
    const halfN = Math.ceil(n / 2)
    const pathLeft = buildPath(leftFingerX, leftFingerY, leftStart, halfN)
    // Right streak: CW from rightStart through the other half
    const pathRight = buildPath(rightFingerX, rightFingerY, rightStart, n - halfN + 1)

    // Animate: draw each path as a traveling streak
    const now = performance.now() / 1000
    const speed = 0.1 // path cycle speed
    const tailLen = 0.35

    const drawPath = (path: [number, number][], color: string, seed: number) => {
      if (path.length < 2) return

      // Compute total path length
      let totalLen = 0
      const lens: number[] = []
      for (let i = 1; i < path.length; i++) {
        const dx = path[i][0] - path[i-1][0], dy = path[i][1] - path[i-1][1]
        const l = Math.sqrt(dx*dx + dy*dy)
        lens.push(l)
        totalLen += l
      }

      const sample = (t: number): [number, number] => {
        const target = t * totalLen
        let acc = 0
        for (let i = 0; i < lens.length; i++) {
          if (acc + lens[i] >= target) {
            const frac = lens[i] > 0 ? (target - acc) / lens[i] : 0
            return [
              path[i][0] + (path[i+1][0] - path[i][0]) * frac,
              path[i][1] + (path[i+1][1] - path[i][1]) * frac,
            ]
          }
          acc += lens[i]
        }
        return path[path.length - 1]
      }

      const headT = (now * speed + seed) % 1.0
      const tailT = Math.max(0, headT - tailLen)
      const segments = 50

      // Main streak
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      for (let s = 0; s < segments; s++) {
        const t1 = tailT + (headT - tailT) * (s / segments)
        const t2 = tailT + (headT - tailT) * ((s + 1) / segments)
        const p1 = sample(t1)
        const p2 = sample(t2)
        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = (s / segments) * 0.5
        ctx.stroke()
      }

      // Bright head
      const hp = sample(headT)
      ctx.beginPath()
      ctx.arc(hp[0], hp[1], 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.globalAlpha = 0.8
      ctx.shadowBlur = 12
      ctx.fill()

      // Thin secondary
      ctx.shadowBlur = 3
      for (let s = 0; s < 25; s++) {
        const t1 = tailT + (headT - tailT) * (s / 25)
        const t2 = tailT + (headT - tailT) * ((s + 1) / 25)
        const p1 = sample(t1)
        const p2 = sample(t2)
        ctx.beginPath()
        ctx.moveTo(p1[0] + 3, p1[1] + 3)
        ctx.lineTo(p2[0] + 3, p2[1] + 3)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.globalAlpha = (s / 25) * 0.2
        ctx.stroke()
      }
    }

    // Use the SAME colors as the finger streaks
    drawPath(pathLeft, '#3b82f6', 0)      // blue (left finger)
    drawPath(pathRight, '#f97316', 0.5)   // orange (right finger)

    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    lightningFrameRef.current = requestAnimationFrame(drawLightning)
  }, [menuOpen, items.length, activeSubmenu, startAngle, angleStep, radius, pullInRadius, scale])

  useEffect(() => {
    if (menuOpen) {
      lightningFrameRef.current = requestAnimationFrame(drawLightning)
    }
    return () => cancelAnimationFrame(lightningFrameRef.current)
  }, [menuOpen, drawLightning])

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

          {/* Light streaks from fingers */}
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

          {/* Lightning path canvas — extends from finger tips, arcs CW through satellites, converges to center */}
          <canvas
            ref={lightningCanvasRef}
            className="absolute inset-0 pointer-events-none z-[5]"
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
