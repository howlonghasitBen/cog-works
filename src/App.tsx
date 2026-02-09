/** Cog Works — Component Playground
 *
 * Full-page gear navigation with parallax scroll transitions.
 * Clicking a sub-cog scrolls the background down with parallax on the main cog,
 * leaving 1/3 of the bottom visible at the top of the content screen.
 */
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GearHero from './components/GearHero'
import type { GearNavItem, GearSubItem } from './components/GearHero'

/** Placeholder content pages for each sub-cog */
function ContentPage({ parent, sub }: { parent: string; sub: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-xs text-amber-500 uppercase tracking-[0.3em] mb-3 font-mono">
        {parent}
      </p>
      <h2 className="text-4xl font-black text-white mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        {sub}
      </h2>
      <div className="h-px bg-gray-800 mb-8" />
      <p className="text-gray-400 leading-relaxed text-lg mb-8">
        This is the content area for <strong className="text-white">{sub}</strong> under{' '}
        <strong className="text-white">{parent}</strong>. Each sub-cog navigation item loads its
        own independently rendered content here.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

export default function App() {
  const [activePage, setActivePage] = useState<{ parent: GearNavItem; sub: GearSubItem } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNavigate = useCallback((_parent: GearNavItem, subItem: GearSubItem, _pi: number, _si: number) => {
    setActivePage({ parent: _parent, sub: subItem })
  }, [])

  const handleBackToTop = () => {
    setActivePage(null)
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gray-950 overflow-hidden">
      {/* Hero section — parallax: moves up slower than content, stays partially visible */}
      <motion.div
        className={`relative w-full ${activePage ? 'z-50' : 'z-10'}`}
        animate={{
          y: activePage ? '-40vh' : '0vh',  // Parallax: less offset = more cog visible
        }}
        transition={{
          duration: 0.7,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <div
          className={activePage ? 'cursor-pointer' : ''}
          onClick={activePage ? handleBackToTop : undefined}
          title={activePage ? 'Back to navigation' : undefined}
        >
          <GearHero
            title="COG WORKS"
            subtitle="Engineering the Future"
            items={heroItems}
            onNavigate={handleNavigate}
          />
        </div>
      </motion.div>

      {/* Content page — slides up from below, sits under the cog peek */}
      <AnimatePresence mode="wait">
        {activePage && (
          <motion.div
            key={activePage.sub.id || activePage.sub.label}
            className="absolute top-0 left-0 w-full min-h-screen z-20"
            style={{ paddingTop: '60vh' }}  // Content starts below the cog peek zone
            initial={{ y: '100vh', opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 },
            }}
            exit={{
              y: '100vh',
              opacity: 0,
              transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            {/* Gradient fade from cog peek into content */}
            <div
              className="absolute top-0 left-0 w-full pointer-events-none"
              style={{
                height: '60vh',
                background: 'linear-gradient(to bottom, transparent 60%, #030712)',
              }}
            />

            {/* Content */}
            <div className="relative bg-gray-950 pb-24" style={{ minHeight: '120vh' }}>
              <ContentPage parent={activePage.parent.label} sub={activePage.sub.label} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
