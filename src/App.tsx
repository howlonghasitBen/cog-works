/** Cog Works — Component Playground
 *
 * Full-page gear navigation with true scroll-driven parallax.
 * Background scrolls at 1x speed (normal), cog assembly at 0.4x (slower).
 * When background is fully off-screen, cog remains peeking at the top.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GearHero from './components/GearHero'
import type { GearNavItem, GearSubItem } from './components/GearHero'

/** Placeholder content pages for each sub-cog */
function ContentPage({ parent, sub }: { parent: string; sub: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16" style={{ minHeight: '150vh' }}>
      <p className="text-xs text-amber-500 uppercase tracking-[0.3em] mb-3 font-mono">
        {parent}
      </p>
      <h2 className="text-4xl font-black text-white mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        {sub}
      </h2>
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
            <div className="w-10 h-10 bg-gray-800 rounded-sm mb-4 flex items-center justify-center text-gray-500 font-mono text-sm">
              {String(i).padStart(2, '0')}
            </div>
            <h3 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
              Section {i}
            </h3>
            <p className="text-gray-500 text-sm">
              Content block for {sub} — section {i}. Replace with your actual component content.
            </p>
          </div>
        ))}
      </div>

      <p className="text-gray-400 leading-relaxed mb-8">
        Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.
      </p>

      <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Deep Dive
      </h3>

      <p className="text-gray-400 leading-relaxed mb-8">
        Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Cras justo odio, dapibus ut facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus.
      </p>

      <p className="text-gray-400 leading-relaxed">
        Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cras mattis consectetur purus sit amet fermentum. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
      </p>
    </div>
  )
}

const heroItems: GearNavItem[] = [
  {
    label: 'Services',
    icon: '🔧',
    subItems: [
      { id: 'design', label: 'Design', icon: '🎨' },
      { id: 'develop', label: 'Develop', icon: '💻' },
      { id: 'deploy', label: 'Deploy', icon: '🚀' },
    ],
  },
  {
    label: 'Solutions',
    icon: '⚙️',
    subItems: [
      { id: 'web3', label: 'Web3', icon: '🔗' },
      { id: 'ai', label: 'AI', icon: '🤖' },
      { id: 'cloud', label: 'Cloud', icon: '☁️' },
    ],
  },
  {
    label: 'Support',
    icon: '🎧',
    subItems: [
      { id: 'docs', label: 'Docs', icon: '📖' },
      { id: 'chat', label: 'Chat', icon: '💬' },
      { id: 'faq', label: 'FAQ', icon: '❓' },
    ],
  },
  {
    label: 'About',
    icon: 'ℹ️',
    subItems: [
      { id: 'team', label: 'Team', icon: '👥' },
      { id: 'mission', label: 'Mission', icon: '🎯' },
      { id: 'press', label: 'Press', icon: '📰' },
    ],
  },
  {
    label: 'Blog',
    icon: '📝',
    subItems: [
      { id: 'latest', label: 'Latest', icon: '🆕' },
      { id: 'guides', label: 'Guides', icon: '📚' },
      { id: 'videos', label: 'Videos', icon: '🎬' },
    ],
  },
  {
    label: 'Contact',
    icon: '✉️',
    subItems: [
      { id: 'email', label: 'Email', icon: '📧' },
      { id: 'discord', label: 'Discord', icon: '💜' },
      { id: 'twitter', label: 'Twitter', icon: '🐦' },
    ],
  },
]

// Parallax: background at 1x, cog interpolates from center → top
const BG_SPEED = 1.0

export default function App() {
  const [activePage, setActivePage] = useState<{ parent: GearNavItem; sub: GearSubItem } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bgLayerRef = useRef<HTMLDivElement>(null)
  const cogLayerRef = useRef<HTMLDivElement>(null)

  const handleNavigate = useCallback((_parent: GearNavItem, subItem: GearSubItem, _pi: number, _si: number) => {
    setActivePage({ parent: _parent, sub: subItem })
    // Auto-scroll to content after a beat
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    })
  }, [])

  const handleBackToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    // Clear active page once scroll reaches top
    const checkScroll = () => {
      if (scrollRef.current && scrollRef.current.scrollTop < 10) {
        setActivePage(null)
      } else {
        requestAnimationFrame(checkScroll)
      }
    }
    requestAnimationFrame(checkScroll)
  }

  // Parallax via direct DOM manipulation — no React re-renders during scroll
  useEffect(() => {
    const el = scrollRef.current
    const bgEl = bgLayerRef.current
    const cogEl = cogLayerRef.current
    if (!el || !bgEl || !cogEl) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const sy = el.scrollTop
        const vh = window.innerHeight
        const progress = Math.min(sy / vh, 1)

        // Background: full speed
        bgEl.style.transform = `translateY(${-(sy * BG_SPEED)}px)`

        // Cog: slower — center to top peek
        const cogEndY = -(vh * 0.5 + 80)
        const cogY = cogEndY * progress
        cogEl.style.transform = `translateY(${cogY}px)`
        cogEl.style.opacity = String(1 - progress * 0.5)

        ticking = false
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Reset scroll when leaving content
  useEffect(() => {
    if (!activePage && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 })
      // Reset transforms
      if (bgLayerRef.current) bgLayerRef.current.style.transform = 'translateY(0px)'
      if (cogLayerRef.current) {
        cogLayerRef.current.style.transform = 'translateY(0px)'
        cogLayerRef.current.style.opacity = '1'
      }
    }
  }, [activePage])

  return (
    <div
      ref={scrollRef}
      className="h-screen bg-gray-950"
      style={{ overflowY: activePage ? 'auto' : 'hidden' }}
    >
      {/* Fixed hero layers — positioned behind scrollable content */}
      <div className="fixed inset-0 z-0">
        {/* Background layer — scrolls away fast */}
        <div
          ref={bgLayerRef}
          className="absolute inset-0"
          style={{ willChange: 'transform' }}
        >
          <div
            className="w-full h-screen"
            style={{
              background: 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 30%, #0d1b2a 70%, #0a1628 100%)',
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
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 520, height: 520 }}>
              <div className="absolute inset-0 rounded-full opacity-15"
                style={{ border: '1px solid #3b82f6', animation: 'gearPulse 4s ease-in-out infinite' }} />
              <div className="absolute rounded-full opacity-10"
                style={{ inset: -35, border: '1px solid #60a5fa', animation: 'gearPulse 4s ease-in-out infinite 1s' }} />
            </div>
          </div>
        </div>

      </div>

      {/* Cog layer — OUTSIDE the z-0 fixed container so it stacks above content */}
      <div
        ref={cogLayerRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 20,
          willChange: 'transform, opacity',
        }}
      >
        <div
          className={`pointer-events-auto ${activePage ? 'cursor-pointer' : ''}`}
          onClick={activePage ? handleBackToTop : undefined}
          title={activePage ? 'Back to navigation' : undefined}
        >
          <GearHero
            title="COG WORKS"
            subtitle="Engineering the Future"
            items={heroItems}
            onNavigate={handleNavigate}
            transparentBg
          />
        </div>
      </div>

      {/* Spacer — hero occupies the first screen height, pointer-events pass through to fixed cog */}
      <div className="relative h-screen z-0 pointer-events-none" />

      {/* Content page — scrollable, positioned after the hero spacer */}
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
              <ContentPage parent={activePage.parent.label} sub={activePage.sub.label} />
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
