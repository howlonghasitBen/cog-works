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

/** Draw a jagged lightning bolt between two points */
function drawBolt(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  t: number, seed: number, jitter: number = 8,
) {
  const steps = 12
  const dx = x2 - x1, dy = y2 - y1
  // Perpendicular direction for jaggedness
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len, ny = dx / len

  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps
    const bx = x1 + dx * frac
    const by = y1 + dy * frac
    const jag = i === 0 || i === steps ? 0
      : (Math.sin(i * 7.3 + t * 11 + seed) * jitter + Math.sin(i * 13.7 + t * 7 + seed * 2) * jitter * 0.5)
    const px = bx + nx * jag
    const py = by + ny * jag
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

/** Draw a lightning arc that follows a circular path */
function drawArcBolt(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  startAngle: number, arcLen: number,
  t: number, seed: number, jitter: number = 6,
) {
  const steps = 20
  const step = arcLen / steps
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + step * i
    const jag = i === 0 || i === steps ? 0
      : (Math.sin(i * 7.3 + t * 12 + seed) * jitter + Math.sin(i * 13.1 + t * 8) * jitter * 0.4)
    const px = cx + Math.cos(a) * (r + jag)
    const py = cy + Math.sin(a) * (r + jag)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

interface CogPos { x: number; y: number; r: number }

/** Full-assembly lightning overlay: arcs around cogs + bolts connecting them */
function LightningOverlay({
  width, height,
  center, satellites, subCogs,
  activeSubmenu,
}: {
  width: number; height: number
  center: CogPos
  satellites: CogPos[]
  subCogs: CogPos[][] // subCogs[satIdx][subIdx]
  activeSubmenu: number | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const seedsRef = useRef<number[]>([])

  // Stable random seeds for each connection
  if (seedsRef.current.length < 50) {
    seedsRef.current = Array.from({ length: 50 }, () => Math.random() * 1000)
  }

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

    const t = performance.now() / 1000
    const seeds = seedsRef.current
    const color = '#60a5fa'
    const colorBright = '#93c5fd'

    // --- 1. Arc lightning around center cog ---
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.globalAlpha = 0.5
    drawArcBolt(ctx, center.x, center.y, center.r * 0.46, t * 0.6, Math.PI * 0.8, t, seeds[0])
    drawArcBolt(ctx, center.x, center.y, center.r * 0.46, t * 0.6 + Math.PI, Math.PI * 0.6, t, seeds[1])

    // --- 2. Bolts from center edge → each satellite ---
    satellites.forEach((sat, i) => {
      const dx = sat.x - center.x, dy = sat.y - center.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const ux = dx / dist, uy = dy / dist
      // Start from center cog edge, end at satellite cog edge
      const x1 = center.x + ux * center.r * 0.48
      const y1 = center.y + uy * center.r * 0.48
      const x2 = sat.x - ux * sat.r * 0.48
      const y2 = sat.y - uy * sat.r * 0.48

      // Pulse: bolts flicker
      const flicker = Math.sin(t * 4 + seeds[i + 2]) * 0.5 + 0.5
      ctx.globalAlpha = 0.3 + flicker * 0.4
      ctx.strokeStyle = colorBright
      ctx.lineWidth = 1.2
      drawBolt(ctx, x1, y1, x2, y2, t, seeds[i + 2], 10)

      // Glow pass
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.08 + flicker * 0.07
      drawBolt(ctx, x1, y1, x2, y2, t, seeds[i + 2], 10)

      // --- Arc around satellite cog ---
      ctx.strokeStyle = color
      ctx.lineWidth = 1.2
      ctx.globalAlpha = 0.35
      const satArcStart = Math.atan2(-uy, -ux) + Math.PI * 0.3
      drawArcBolt(ctx, sat.x, sat.y, sat.r * 0.46, satArcStart + t * 0.4, Math.PI * 0.7, t, seeds[i + 10])
    })

    // --- 3. Bolts from active satellite → sub-cogs ---
    if (activeSubmenu !== null && subCogs[activeSubmenu]) {
      const sat = satellites[activeSubmenu]
      if (sat) {
        subCogs[activeSubmenu].forEach((sub, si) => {
          const dx = sub.x - sat.x, dy = sub.y - sat.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const ux = dx / dist, uy = dy / dist
          const x1 = sat.x + ux * sat.r * 0.48
          const y1 = sat.y + uy * sat.r * 0.48
          const x2 = sub.x - ux * sub.r * 0.48
          const y2 = sub.y - uy * sub.r * 0.48

          const flicker = Math.sin(t * 5 + seeds[si + 20]) * 0.5 + 0.5
          ctx.globalAlpha = 0.3 + flicker * 0.5
          ctx.strokeStyle = colorBright
          ctx.lineWidth = 1
          drawBolt(ctx, x1, y1, x2, y2, t, seeds[si + 20], 6)

          // Arc around sub-cog
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.globalAlpha = 0.3
          drawArcBolt(ctx, sub.x, sub.y, sub.r * 0.46, t * 0.8 + si, Math.PI * 0.5, t, seeds[si + 30])
        })
      }
    }

    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    frameRef.current = requestAnimationFrame(draw)
  }, [width, height, center, satellites, subCogs, activeSubmenu])

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

  // Compute cog positions for lightning overlay (relative to container center)
  const containerW = radius * 2 + 280
  const containerH = radius * 2 + 280
  const cx = containerW / 2
  const cy = containerH / 2
  const centerCogSize = 300 * scale
  const satSize = 130 * scale
  const subSize = 85 * scale

  const lightningCenter: CogPos = { x: cx, y: cy, r: centerCogSize }

  const lightningSatellites: CogPos[] = useMemo(() => {
    if (!menuOpen) return []
    return items.map((_, i) => {
      const angle = startAngle + angleStep * i
      const isActive = activeSubmenu === i
      const r = isActive ? pullInRadius : radius
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, r: satSize }
    })
  }, [menuOpen, items.length, activeSubmenu, startAngle, angleStep, radius, pullInRadius, cx, cy, satSize, scale])

  const lightningSubCogs: CogPos[][] = useMemo(() => {
    if (!menuOpen || activeSubmenu === null) return []
    return items.map((item, i) => {
      if (i !== activeSubmenu || !item.subItems) return []
      const angle = startAngle + angleStep * i
      const satCX = Math.cos(angle) * pullInRadius
      const satCY = Math.sin(angle) * pullInRadius
      return item.subItems.slice(0, 3).map((_, si) => {
        const subAngle = angle + (si - 1) * (Math.PI * 0.35)
        return {
          x: cx + satCX + Math.cos(subAngle) * subRadius,
          y: cy + satCY + Math.sin(subAngle) * subRadius,
          r: subSize,
        }
      })
    })
  }, [menuOpen, activeSubmenu, items, startAngle, angleStep, pullInRadius, subRadius, cx, cy, subSize, scale])

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
        {/* Lightning overlay connecting all cogs */}
        {menuOpen && (
          <LightningOverlay
            width={containerW}
            height={containerH}
            center={lightningCenter}
            satellites={lightningSatellites}
            subCogs={lightningSubCogs}
            activeSubmenu={activeSubmenu}
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
