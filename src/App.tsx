/** Cog Works — Component Playground
 *
 * Scroll-driven parallax: background at 1x, cog at ~0.35x.
 * Always scrollable. Snap zones handle hero↔content transitions.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** Generate a randomized lightning bolt path from origin toward target center */
function generateBolt(
  startX: number, startY: number,
  endX: number, endY: number,
  segments: number = 8
): string {
  const points: [number, number][] = [[startX, startY]]
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const baseX = startX + (endX - startX) * t
    const baseY = startY + (endY - startY) * t
    // Random perpendicular offset — bigger in middle, smaller at ends
    const spread = Math.sin(t * Math.PI) * 12
    const offsetX = (Math.random() - 0.5) * spread
    const offsetY = (Math.random() - 0.5) * spread
    points.push([baseX + offsetX, baseY + offsetY])
  }
  return 'M ' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
}

/** Generate a fork/branch off a main bolt */
function generateFork(
  mainPoints: string,
  forkAt: number, // 0-1 along the bolt
  endX: number, endY: number
): string {
  // Parse the main path to find the fork point
  const coords = mainPoints.replace('M ', '').split(' L ').map(s => {
    const [x, y] = s.trim().split(' ').map(Number)
    return [x, y] as [number, number]
  })
  const idx = Math.floor(forkAt * (coords.length - 1))
  const [fx, fy] = coords[idx]
  // Fork toward endX/endY with fewer segments
  return generateBolt(fx, fy, endX + (Math.random() - 0.5) * 15, endY + (Math.random() - 0.5) * 15, 5)
}

/** Lightning bolts between Adam and God Pepe fingers */
function LightningBolt({ visible, satCount = 6, touchStep, setTouchStep }: { visible: boolean; satCount?: number; touchStep: number; setTouchStep: React.Dispatch<React.SetStateAction<number>> }) {
  // Adam's fingertip: bottom-left (~20%, 72%)
  // God's fingertip: top-right (~68%, 28%) — his outstretched finger
  const adamX = 20, adamY = 72
  const godX = 68, godY = 28
  const cx = 50, cy = 48

  // Satellite positions in viewBox 0-100 coords (mirror GearHero layout)
  const sats = useMemo(() => {
    const startAngle = -Math.PI * 0.75
    const angleStep = (Math.PI * 2) / satCount
    const r = 19 // ~radius in viewBox % units
    return Array.from({ length: satCount }, (_, i) => {
      const a = startAngle + angleStep * i
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * (100 / 100), angle: a }
    }).sort((a, b) => a.angle - b.angle)
  }, [satCount])

  // Step through satellites: -1=off, 0..N-1=targeting sat, N=targeting center
  useEffect(() => {
    if (!visible) { setTouchStep(-1); return }
    const t = setTimeout(() => setTouchStep(0), 500)
    return () => clearTimeout(t)
  }, [visible])
  useEffect(() => {
    if (touchStep < 0) return
    if (touchStep > sats.length) {
      // All touched + reached center → reset for next cycle
      const t = setTimeout(() => setTouchStep(0), 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setTouchStep(s => s + 1), 250)
    return () => clearTimeout(t)
  }, [touchStep, sats.length])

  // Build CW path from a finger through satellites to center
  const buildCWPath = useCallback((fingerX: number, fingerY: number) => {
    // Find nearest satellite
    let nearestIdx = 0, nearestDist = Infinity
    sats.forEach((s, i) => {
      const d = Math.sqrt((s.x - fingerX) ** 2 + (s.y - fingerY) ** 2)
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    })
    // Order CW starting from nearest
    const ordered = []
    for (let i = 0; i < sats.length; i++) {
      ordered.push(sats[(nearestIdx + i) % sats.length])
    }
    return ordered
  }, [sats])

  const adamPath = useMemo(() => buildCWPath(adamX, adamY), [buildCWPath])
  const godPath = useMemo(() => buildCWPath(godX, godY), [buildCWPath])

  // Current origin + target for each bolt — chains from sat to sat
  const adamFrom = touchStep <= 0 ? { x: adamX, y: adamY } :
    touchStep > sats.length ? adamPath[adamPath.length - 1] :
    adamPath[touchStep - 1]
  const adamTarget = touchStep >= sats.length ? { x: cx, y: cy } :
    touchStep >= 0 ? adamPath[touchStep] : adamPath[0]

  const godFrom = touchStep <= 0 ? { x: godX, y: godY } :
    touchStep > sats.length ? godPath[godPath.length - 1] :
    godPath[touchStep - 1]
  const godTarget = touchStep >= sats.length ? { x: cx, y: cy } :
    touchStep >= 0 ? godPath[touchStep] : godPath[0]

  const [bolts, setBolts] = useState<{ path: string; forks: string[] }[]>([])
  const [tick, setTick] = useState(0)

  // Regenerate bolts periodically for crackling effect — target changes with touchStep
  useEffect(() => {
    if (!visible) { setBolts([]); setTick(0); return }
    const generate = () => {
      const newBolts = []
      const afx = adamFrom.x, afy = adamFrom.y
      const atx = adamTarget.x + (Math.random() - 0.5) * 2
      const aty = adamTarget.y + (Math.random() - 0.5) * 2
      const gfx = godFrom.x, gfy = godFrom.y
      const gtx = godTarget.x + (Math.random() - 0.5) * 2
      const gty = godTarget.y + (Math.random() - 0.5) * 2
      // 2 bolts from Adam's current position → next satellite (or center)
      for (let i = 0; i < 2; i++) {
        const main = generateBolt(afx, afy, atx, aty)
        const forks = [
          generateFork(main, 0.3 + Math.random() * 0.2, atx + (Math.random() - 0.5) * 2, aty + (Math.random() - 0.5) * 2),
          generateFork(main, 0.6 + Math.random() * 0.2, atx + (Math.random() - 0.5) * 2, aty + (Math.random() - 0.5) * 2),
        ]
        newBolts.push({ path: main, forks })
      }
      // 2 bolts from God's current position → next satellite (or center)
      for (let i = 0; i < 2; i++) {
        const main = generateBolt(gfx, gfy, gtx, gty)
        const forks = [
          generateFork(main, 0.3 + Math.random() * 0.2, gtx + (Math.random() - 0.5) * 2, gty + (Math.random() - 0.5) * 2),
          generateFork(main, 0.6 + Math.random() * 0.2, gtx + (Math.random() - 0.5) * 2, gty + (Math.random() - 0.5) * 2),
        ]
        newBolts.push({ path: main, forks })
      }
      setBolts(newBolts)
    }
    generate()
    const interval = setInterval(() => {
      generate()
      setTick(t => t + 1)
    }, 250) // Match step timing so bolts regenerate at each new target
    return () => clearInterval(interval)
  }, [visible, adamFrom.x, adamFrom.y, adamTarget.x, adamTarget.y, godFrom.x, godFrom.y, godTarget.x, godTarget.y])

  // Hard guard: absolutely nothing renders when menu is closed
  if (!visible) return null
  if (bolts.length === 0 || touchStep < 0) return null

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5, opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowBright">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {bolts.map((bolt, i) => (
        <g key={`${tick}-${i}`}>
          {/* Main bolt — bright core, stays visible */}
          <motion.path
            d={bolt.path}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.35}
            strokeLinecap="round"
            filter="url(#glowBright)"
            initial={{ pathLength: 0, opacity: 0.8 }}
            animate={{ pathLength: 1, opacity: [0.6, 1, 0.8] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          {/* Main bolt — blue aura */}
          <motion.path
            d={bolt.path}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={0.25}
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0.5 }}
            animate={{ pathLength: 1, opacity: [0.4, 0.7, 0.5] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Forks — branch toward same target */}
          {bolt.forks.map((fork, j) => (
            <motion.path
              key={j}
              d={fork}
              fill="none"
              stroke="#93c5fd"
              strokeWidth={0.18}
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0.3 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.3] }}
              transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}
import GearHero from './components/GearHero'
import type { GearNavItem, GearSubItem } from './components/GearHero'
import StakingDashboard from './pages/StakingDashboard'
import MumuGallery from './pages/MumuGallery'
import SwapPage from './pages/SwapPage'
import MintPage from './pages/MintPage'

// ─── Content Page ───────────────────────────────────────────────
function ContentPage({ parent, sub }: { parent: string; sub: string }) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 bg-[#1a1d2e] rounded border-2 border-[#2a2d40] shadow-[0_4px_20px_rgba(0,0,0,0.3)] my-8" style={{ minHeight: '100vh', marginTop: 60 }}>
      <p className="text-xs text-amber-500 uppercase tracking-[0.3em] mb-3 font-mono">{parent}</p>
      <h2 className="text-4xl font-black text-white mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{sub}</h2>
      <div className="h-px bg-gray-800 mb-8" />
      <p className="text-gray-400 leading-relaxed text-lg mb-8">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      </p>
      <p className="text-gray-400 leading-relaxed mb-8">
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="border border-gray-800 p-6 hover:border-amber-700/50 transition-colors">
            <div className="w-10 h-10 bg-gray-800 rounded-sm mb-4 flex items-center justify-center text-gray-500 font-mono text-sm">{String(i).padStart(2, '0')}</div>
            <h3 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Section {i}</h3>
            <p className="text-gray-500 text-sm">Content block for {sub} — section {i}. Replace with your actual component content.</p>
          </div>
        ))}
      </div>
      <p className="text-gray-400 leading-relaxed mb-8">Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
      <p className="text-gray-400 leading-relaxed mb-8">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
      <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Deep Dive</h3>
      <p className="text-gray-400 leading-relaxed mb-8">Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.</p>
      <p className="text-gray-400 leading-relaxed mb-8">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
      <p className="text-gray-400 leading-relaxed mb-8">Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper. Aenean lacinia bibendum nulla sed consectetur.</p>
      <p className="text-gray-400 leading-relaxed mb-8">Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.</p>
      <p className="text-gray-400 leading-relaxed">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
    </div>
  )
}

// ─── Nav Items ──────────────────────────────────────────────────
const heroItems: GearNavItem[] = [
  { label: 'mumuFrens', icon: '🐄', innardSrc: '/images/mumu-hero.gif', innardScale: 0.69, subItems: [
    { id: 'mumu-v1', label: 'v1', icon: '🎨', innardSrc: '/images/scatter.svg', innardScale: 0.70, innardBg: '#36454F', innardImgScale: 0.857, href: 'https://www.scatter.art/collection/mumu-frens' },
    { id: 'mumu-v2', label: 'v2', icon: '🖼️', innardSrc: '/images/mumuFrensv2Logo.png', innardScale: 0.70 },
    { id: 'mumu-discord', label: 'discord', icon: '💬', innardSrc: '/images/discord.jpg', innardScale: 0.70, href: 'https://discord.gg/WZnMhsFGXn' },
  ]},
  { label: 'Whirlpool', icon: '🌀', innardSrc: '/images/whirlpool.png', innardSpin: 15, subItems: [
    { id: 'whirlpool-mint', label: 'mint', icon: '🔗', innardSrc: '/images/nftMint.png' },
    { id: 'whirlpool-stake', label: 'stake', icon: '🔄', innardSrc: '/images/stakeLogo.png' },
    { id: 'whirlpool-swap', label: 'swap', icon: '🔀', innardSrc: '/images/surfSwap.png' },
  ]},
  { label: 'Generic-1', icon: '⚙️', subItems: [
    { id: 'g1-sub1', label: 'Sub 1', icon: '○' },
    { id: 'g1-sub2', label: 'Sub 2', icon: '○' },
    { id: 'g1-sub3', label: 'Sub 3', icon: '○' },
  ]},
  { label: 'Generic-2', icon: '⚙️', subItems: [
    { id: 'g2-sub1', label: 'Sub 1', icon: '○' },
    { id: 'g2-sub2', label: 'Sub 2', icon: '○' },
    { id: 'g2-sub3', label: 'Sub 3', icon: '○' },
  ]},
  { label: 'Generic-3', icon: '⚙️', subItems: [
    { id: 'g3-sub1', label: 'Sub 1', icon: '○' },
    { id: 'g3-sub2', label: 'Sub 2', icon: '○' },
    { id: 'g3-sub3', label: 'Sub 3', icon: '○' },
  ]},
  { label: 'Generic-4', icon: '⚙️', subItems: [
    { id: 'g4-sub1', label: 'Sub 1', icon: '○' },
    { id: 'g4-sub2', label: 'Sub 2', icon: '○' },
    { id: 'g4-sub3', label: 'Sub 3', icon: '○' },
  ]},
  { label: 'xLinks', icon: '✖', innardSrc: '/images/xLogo.png', subItems: [
    { id: 'x-ben', label: 'howlonghasitben', icon: '👤', innardSrc: '/images/pfp_howlonghasitben.png', href: 'https://x.com/howlonghasitBen' },
    { id: 'x-surfgod', label: 'surfgod69', icon: '🏄', innardSrc: '/images/pfp_surfgod69.png', href: 'https://x.com/SurfGod69' },
    { id: 'x-wavestcg', label: 'wavesTCG', icon: '🃏', innardSrc: '/images/pfp_wavestcg.png', href: 'https://x.com/wavesTCG' },
  ]},
]

// ─── App ────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState<{ parent: GearNavItem; sub: GearSubItem } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightningStep, setLightningStep] = useState(-1)
  const [pepesEnabled, setPepesEnabled] = useState(true)

  // DOM refs for direct manipulation (no React re-renders during scroll)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const cogRef = useRef<HTMLDivElement>(null)

  // Programmatic scroll flag — prevents snap logic from fighting smooth scrolls
  const isAnimating = useRef(false)

  // Navigate from staking → swap
  const navigateToSwap = useCallback(() => {
    const whirlpool = heroItems.find(h => h.label === 'Whirlpool')
    const swapSub = whirlpool?.subItems?.find(s => s.id === 'whirlpool-swap')
    if (whirlpool && swapSub) {
      setActivePage({ parent: whirlpool, sub: swapSub })
    }
  }, [])

  // ─── Navigation ─────────────────────────────────────────────
  const handleNavigate = useCallback((parent: GearNavItem, sub: GearSubItem) => {
    // External links open in new tab, don't scroll to ContentPage
    if (sub.href) {
      window.open(sub.href, '_blank', 'noopener')
      return
    }
    // Set animation lock IMMEDIATELY to prevent snap logic from fighting
    isAnimating.current = true
    setActivePage({ parent, sub })
    setMenuOpen(false)
    // Smooth scroll to content — delay slightly to ensure DOM has rendered content
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    }, 50)
    // Release animation lock after scroll settles
    setTimeout(() => { isAnimating.current = false }, 1500)
  }, [])

  const handleBackToTop = useCallback(() => {
    isAnimating.current = true
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    // Release lock + clear page after scroll settles
    setTimeout(() => {
      isAnimating.current = false
      setActivePage(null)
    }, 800)
  }, [])

  // ─── Single scroll handler — always active ──────────────────
  useEffect(() => {
    const el = scrollRef.current
    const bgEl = bgRef.current
    const cogEl = cogRef.current
    if (!el || !bgEl || !cogEl) return

    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const sy = el.scrollTop
        const vh = window.innerHeight
        const progress = Math.min(sy / vh, 1) // 0 = hero centered, 1 = content visible

        // Parallax: background at 1x, cog at ~0.35x
        bgEl.style.transform = `translateY(${-sy}px)`

        const cogEndY = -(vh * 0.5 + 80) // cog peek position
        cogEl.style.transform = `translateY(${cogEndY * progress}px)`
        cogEl.style.opacity = String(1 - progress * 0.5)
      })
    }

    // Snap zones: when user stops scrolling in the "dead zone" (10%–90%), snap to nearest edge
    let snapTimer: ReturnType<typeof setTimeout> | null = null

    const onScrollEnd = () => {
      if (snapTimer) clearTimeout(snapTimer)
      snapTimer = setTimeout(() => {
        if (isAnimating.current) return
        const sy = el.scrollTop
        const vh = window.innerHeight
        const progress = sy / vh

        if (progress > 0.1 && progress < 0.5) {
          // In upper dead zone → snap back to hero
          // But NOT if we just navigated to a page (handleNavigate sets activePage before scroll starts)
          isAnimating.current = true
          el.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => {
            isAnimating.current = false
            // Only clear page if we actually snapped back (scroll is near top)
            if (el.scrollTop < window.innerHeight * 0.1) {
              setActivePage(null)
            }
          }, 600)
        } else if (progress >= 0.5 && progress < 0.9) {
          // In lower dead zone → snap to content
          isAnimating.current = true
          el.scrollTo({ top: vh, behavior: 'smooth' })
          setTimeout(() => { isAnimating.current = false }, 600)
        }
      }, 150) // 150ms debounce — wait for scroll to actually stop
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scroll', onScrollEnd, { passive: true })

    // Initial parallax update
    onScroll()

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scroll', onScrollEnd)
      if (snapTimer) clearTimeout(snapTimer)
    }
  }, []) // No dependencies — refs are stable, never re-creates

  // Reset transforms when activePage clears (returning to hero)
  useEffect(() => {
    if (!activePage && bgRef.current && cogRef.current) {
      bgRef.current.style.transform = 'translateY(0px)'
      cogRef.current.style.transform = 'translateY(0px)'
      cogRef.current.style.opacity = '1'
    }
  }, [activePage])

  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #D6DAF0 0%, #C9CEE8 50%, #BCC2E0 100%)' }}
    >
      {/* ─── Fixed background (parallax 1x) ─── */}
      <div className="fixed inset-0 z-0">
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{ willChange: 'transform' }}
        >
          <div className="w-full h-screen" style={{
            background: 'linear-gradient(135deg, #C9CEE8 0%, #D6DAF0 30%, #DEE2F4 50%, #D6DAF0 70%, #C9CEE8 100%)',
          }}>
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.4s' }}>
              <div className="absolute h-[2px] w-[55%] left-0 top-[33%] opacity-20" style={{ background: 'linear-gradient(90deg, #8890b8, transparent)' }} />
              <div className="absolute h-[1px] w-[40%] left-0 top-[36%] opacity-15" style={{ background: 'linear-gradient(90deg, #9aa0c8, transparent)' }} />
              <div className="absolute h-[2px] w-[50%] right-0 top-[64%] opacity-20" style={{ background: 'linear-gradient(270deg, #8890b8, transparent)' }} />
              <div className="absolute h-[1px] w-[35%] right-0 top-[67%] opacity-15" style={{ background: 'linear-gradient(270deg, #9aa0c8, transparent)' }} />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 520, height: 520 }}>
              <div className="absolute inset-0 rounded-full opacity-15" style={{ border: '1px solid rgba(100,110,160,0.4)', animation: 'gearPulse 4s ease-in-out infinite' }} />
              <div className="absolute rounded-full opacity-10" style={{ inset: -35, border: '1px solid rgba(100,110,160,0.3)', animation: 'gearPulse 4s ease-in-out infinite 1s' }} />
            </div>

            {/* PSC figures + lightning — togglable */}
            {pepesEnabled && (
              <>
                <img
                  src="/images/pscLeft.png"
                  alt=""
                  className="absolute bottom-0 left-0 pointer-events-none"
                  style={{ height: '55%', objectFit: 'contain', objectPosition: 'bottom left' }}
                />
                <img
                  src="/images/pscRight.png"
                  alt=""
                  className="absolute top-0 right-0 pointer-events-none"
                  style={{ height: '55%', objectFit: 'contain', objectPosition: 'top right' }}
                />
                <LightningBolt visible={menuOpen} satCount={heroItems.length} touchStep={lightningStep} setTouchStep={setLightningStep} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Fixed cog layer (parallax ~0.35x) — above content ─── */}
      <div
        ref={cogRef}
        className="fixed inset-0 pointer-events-none select-none"
        style={{ zIndex: 20, willChange: 'transform, opacity' }}
      >
        <GearHero
          title="COG WORKS"
          subtitle="Engineering the Future"
          items={heroItems}
          onNavigate={handleNavigate}
          transparentBg
          onCenterClick={activePage ? handleBackToTop : undefined}
          onMenuToggle={setMenuOpen}
          lightningStep={lightningStep}
        />
      </div>

      {/* ─── Scroll spacer (hero zone = 1 viewport height) ─── */}
      <div className="relative h-screen z-0 pointer-events-none">
        {/* Suite/palette toggle — top-left of hero */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 pointer-events-auto flex border-2 border-[#2a2d40] bg-[#1a1d2e] rounded-sm overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setPepesEnabled(false)}
            className={`px-3 py-2 text-xl sm:px-5 sm:py-3 sm:text-3xl cursor-pointer transition-colors ${!pepesEnabled ? 'bg-[#2a2d40] text-white' : 'text-gray-500 hover:text-white'}`}
            title="Minimal theme"
          >🤵</button>
          <div className="w-px bg-[#2a2d40]" />
          <button
            onClick={() => setPepesEnabled(true)}
            className={`px-3 py-2 text-xl sm:px-5 sm:py-3 sm:text-3xl cursor-pointer transition-colors ${pepesEnabled ? 'bg-[#2a2d40] text-white' : 'text-gray-500 hover:text-white'}`}
            title="Sistine theme"
          >🎨</button>
        </div>
        {/* Wallet Connect — bottom-right of hero */}
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
          <button
            className="group relative flex items-center gap-3 px-5 py-2.5 cursor-pointer overflow-hidden rounded-sm border-2 border-[#2a2d40] bg-[#1a1d2e] text-white font-bold text-sm tracking-wider transition-all duration-200 hover:border-cyan-500/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {/* Animated gradient border glow */}
            <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.05), transparent 50%)' }} />
            {/* Pulse dot */}
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 group-hover:bg-emerald-400 transition-colors" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-40" />
            </div>
            {/* Wallet icon */}
            <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
            <span className="relative z-10 uppercase">Connect Wallet</span>
            {/* Chevron */}
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <AnimatePresence mode="wait">
        {activePage && (
          <motion.div
            key={activePage.sub.id || activePage.sub.label}
            className="relative z-10"
            style={{ background: 'linear-gradient(180deg, #D6DAF0 0%, #C9CEE8 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="relative pb-24">
              {activePage.sub.id === 'mumu-v2' ? (
                <MumuGallery />
              ) : activePage.sub.id === 'whirlpool-stake' ? (
                <StakingDashboard onNavigateSwap={navigateToSwap} />
              ) : activePage.sub.id === 'whirlpool-swap' ? (
                <SwapPage />
              ) : activePage.sub.id === 'whirlpool-mint' ? (
                <MintPage />
              ) : (
                <ContentPage parent={activePage.parent.label} sub={activePage.sub.label} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gearPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
