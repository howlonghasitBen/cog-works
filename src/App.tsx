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
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
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
        Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
      </p>

      <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Deep Dive
      </h3>

      <p className="text-gray-400 leading-relaxed mb-8">
        Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Est enim felis euismod diam, nec tristique elit velit vitae erat. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui. Maecenas faucibus mollis interdum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cras mattis consectetur purus sit amet fermentum. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
      </p>

      <p className="text-gray-400 leading-relaxed mb-8">
        Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit.
      </p>

      <p className="text-gray-400 leading-relaxed">
        Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Cras justo odio, dapibus ut facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
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
    <div ref={containerRef} className="relative min-h-screen bg-gray-950">
      {/* Hero section — sticky at top, parallax offset when content active */}
      <motion.div
        className={`sticky top-0 w-full ${activePage ? 'z-50' : 'z-10'}`}
        animate={{
          y: activePage ? '-60vh' : '0vh',
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

      {/* Content page — scrollable below the sticky hero */}
      <AnimatePresence mode="wait">
        {activePage && (
          <motion.div
            key={activePage.sub.id || activePage.sub.label}
            className="relative z-20"
            initial={{ opacity: 0, y: 60 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 },
            }}
            exit={{
              opacity: 0,
              y: 60,
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            <div className="relative bg-gray-950 pb-24">
              <ContentPage parent={activePage.parent.label} sub={activePage.sub.label} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
