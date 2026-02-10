/** Cog Works — Component Playground
 *
 * Scroll-driven parallax: background at 1x, cog at ~0.35x.
 * Always scrollable. Snap zones handle hero↔content transitions.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
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
function LightningBolt({ visible }: { visible: boolean }) {
  // Adam's fingertip: bottom-left (~20%, 72%)
  // God's fingertip: top-right (~68%, 28%) — his outstretched finger
  // Both aim toward center (~50%, 48%)
  const [bolts, setBolts] = useState<{ path: string; forks: string[] }[]>([])
  const [tick, setTick] = useState(0)

  // Regenerate bolts periodically for crackling effect
  useEffect(() => {
    if (!visible) { setBolts([]); return }
    const generate = () => {
      const newBolts = []
      // 2 bolts from Adam (bottom-left → center)
      for (let i = 0; i < 2; i++) {
        const main = generateBolt(20, 72, 48 + Math.random() * 4, 48 + Math.random() * 4)
        const forks = [
          generateFork(main, 0.3 + Math.random() * 0.2, 45, 50),
          generateFork(main, 0.6 + Math.random() * 0.2, 50, 45),
        ]
        newBolts.push({ path: main, forks })
      }
      // 2 bolts from God (top-right → center)
      for (let i = 0; i < 2; i++) {
        const main = generateBolt(68, 28, 52 + Math.random() * 4, 48 + Math.random() * 4)
        const forks = [
          generateFork(main, 0.3 + Math.random() * 0.2, 55, 42),
          generateFork(main, 0.6 + Math.random() * 0.2, 50, 48),
        ]
        newBolts.push({ path: main, forks })
      }
      setBolts(newBolts)
    }
    generate()
    const interval = setInterval(() => {
      generate()
      setTick(t => t + 1)
    }, 1200) // Regenerate every 1.2s — watch the arcs draw
    return () => clearInterval(interval)
  }, [visible])

  if (!visible || bolts.length === 0) return null

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }} viewBox="0 0 100 100" preserveAspectRatio="none">
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
          {/* Main bolt — bright core, draws from origin to center */}
          <motion.path
            d={bolt.path}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.35}
            strokeLinecap="round"
            filter="url(#glowBright)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0.2, 1, 0.8, 0.3, 0] }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
          />
          {/* Main bolt — blue aura, slightly behind */}
          <motion.path
            d={bolt.path}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={0.25}
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0.1, 0.7, 0.5, 0.2, 0] }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
          {/* Forks — branch out partway through */}
          {bolt.forks.map((fork, j) => (
            <motion.path
              key={j}
              d={fork}
              fill="none"
              stroke="#93c5fd"
              strokeWidth={0.18}
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.6, 0.3, 0] }}
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
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

// ─── Content Page ───────────────────────────────────────────────
function ContentPage({ parent, sub }: { parent: string; sub: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16" style={{ minHeight: '150vh' }}>
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
  { label: 'Services', icon: '🔧', subItems: [
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'develop', label: 'Develop', icon: '💻' },
    { id: 'deploy', label: 'Deploy', icon: '🚀' },
  ]},
  { label: 'Solutions', icon: '⚙️', subItems: [
    { id: 'web3', label: 'Web3', icon: '🔗' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'cloud', label: 'Cloud', icon: '☁️' },
  ]},
  { label: 'Support', icon: '🎧', subItems: [
    { id: 'docs', label: 'Docs', icon: '📖' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
  ]},
  { label: 'About', icon: 'ℹ️', subItems: [
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'mission', label: 'Mission', icon: '🎯' },
    { id: 'press', label: 'Press', icon: '📰' },
  ]},
  { label: 'Blog', icon: '📝', subItems: [
    { id: 'latest', label: 'Latest', icon: '🆕' },
    { id: 'guides', label: 'Guides', icon: '📚' },
    { id: 'videos', label: 'Videos', icon: '🎬' },
  ]},
  { label: 'Dashboard', icon: '📊', subItems: [
    { id: 'staking', label: 'Staking', icon: '🔄' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'history', label: 'History', icon: '📜' },
  ]},
  { label: 'Contact', icon: '✉️', subItems: [
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'discord', label: 'Discord', icon: '💜' },
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
  ]},
]

// ─── App ────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState<{ parent: GearNavItem; sub: GearSubItem } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pepesEnabled, setPepesEnabled] = useState(true)

  // DOM refs for direct manipulation (no React re-renders during scroll)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const cogRef = useRef<HTMLDivElement>(null)

  // Programmatic scroll flag — prevents snap logic from fighting smooth scrolls
  const isAnimating = useRef(false)

  // ─── Navigation ─────────────────────────────────────────────
  const handleNavigate = useCallback((parent: GearNavItem, sub: GearSubItem) => {
    setActivePage({ parent, sub })
    isAnimating.current = true
    // Smooth scroll to content
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    })
    // Release animation lock after scroll settles
    setTimeout(() => { isAnimating.current = false }, 1200)
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
          isAnimating.current = true
          el.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => {
            isAnimating.current = false
            setActivePage(null)
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
      className="h-screen overflow-y-auto bg-gray-950"
    >
      {/* ─── Fixed background (parallax 1x) ─── */}
      <div className="fixed inset-0 z-0">
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{ willChange: 'transform' }}
        >
          <div className="w-full h-screen" style={{
            background: 'linear-gradient(135deg, #0d0e1a 0%, #151838 30%, #1a1c3e 50%, #151838 70%, #0d0e1a 100%)',
          }}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute h-[2px] w-[55%] left-0 top-[33%] opacity-20" style={{ background: 'linear-gradient(90deg, #4a5699, transparent)' }} />
              <div className="absolute h-[1px] w-[40%] left-0 top-[36%] opacity-15" style={{ background: 'linear-gradient(90deg, #6875b0, transparent)' }} />
              <div className="absolute h-[2px] w-[50%] right-0 top-[64%] opacity-20" style={{ background: 'linear-gradient(270deg, #4a5699, transparent)' }} />
              <div className="absolute h-[1px] w-[35%] right-0 top-[67%] opacity-15" style={{ background: 'linear-gradient(270deg, #6875b0, transparent)' }} />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 520, height: 520 }}>
              <div className="absolute inset-0 rounded-full opacity-15" style={{ border: '1px solid #3b82f6', animation: 'gearPulse 4s ease-in-out infinite' }} />
              <div className="absolute rounded-full opacity-10" style={{ inset: -35, border: '1px solid #60a5fa', animation: 'gearPulse 4s ease-in-out infinite 1s' }} />
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
                <LightningBolt visible={menuOpen} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Suite/palette toggle — top-left corner ─── */}
      <button
        onClick={() => setPepesEnabled(p => !p)}
        className="fixed top-4 left-4 z-30 bg-gray-900/80 border border-gray-700 hover:border-amber-500/50 px-3 py-2 text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
        title={pepesEnabled ? 'Switch to minimal theme' : 'Switch to Sistine theme'}
      >
        {pepesEnabled ? '🎨 Sistine' : '⚙️ Minimal'}
      </button>

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
        />
      </div>

      {/* ─── Scroll spacer (hero zone = 1 viewport height) ─── */}
      <div className="relative h-screen z-0 pointer-events-none" />

      {/* ─── Content ─── */}
      <AnimatePresence mode="wait">
        {activePage && (
          <motion.div
            key={activePage.sub.id || activePage.sub.label}
            className="relative z-10 bg-gray-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="relative pb-24">
              {activePage.sub.id === 'staking' ? (
                <StakingDashboard />
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
