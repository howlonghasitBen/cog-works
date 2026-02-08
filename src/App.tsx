/** Cog Works — Component Playground */
import GearHero from './components/GearHero'

const heroItems = [
  {
    label: 'Services',
    icon: '🔧',
    subItems: [
      { label: 'Design', icon: '🎨', onClick: () => console.log('Design') },
      { label: 'Develop', icon: '💻', onClick: () => console.log('Develop') },
      { label: 'Deploy', icon: '🚀', onClick: () => console.log('Deploy') },
    ],
  },
  {
    label: 'Solutions',
    icon: '⚙️',
    subItems: [
      { label: 'Web3', icon: '🔗', onClick: () => console.log('Web3') },
      { label: 'AI', icon: '🤖', onClick: () => console.log('AI') },
      { label: 'Cloud', icon: '☁️', onClick: () => console.log('Cloud') },
    ],
  },
  {
    label: 'Support',
    icon: '🎧',
    subItems: [
      { label: 'Docs', icon: '📖', onClick: () => console.log('Docs') },
      { label: 'Chat', icon: '💬', onClick: () => console.log('Chat') },
      { label: 'FAQ', icon: '❓', onClick: () => console.log('FAQ') },
    ],
  },
  {
    label: 'About',
    icon: 'ℹ️',
    subItems: [
      { label: 'Team', icon: '👥', onClick: () => console.log('Team') },
      { label: 'Mission', icon: '🎯', onClick: () => console.log('Mission') },
      { label: 'Press', icon: '📰', onClick: () => console.log('Press') },
    ],
  },
  {
    label: 'Blog',
    icon: '📝',
    subItems: [
      { label: 'Latest', icon: '🆕', onClick: () => console.log('Latest') },
      { label: 'Guides', icon: '📚', onClick: () => console.log('Guides') },
      { label: 'Videos', icon: '🎬', onClick: () => console.log('Videos') },
    ],
  },
  {
    label: 'Contact',
    icon: '✉️',
    subItems: [
      { label: 'Email', icon: '📧', onClick: () => console.log('Email') },
      { label: 'Discord', icon: '💜', onClick: () => console.log('Discord') },
      { label: 'Twitter', icon: '🐦', onClick: () => console.log('Twitter') },
    ],
  },
]

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <GearHero
        title="COG WORKS"
        subtitle="Engineering the Future"
        items={heroItems}
      />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          Drop-in React Components
        </h2>
        <p className="text-gray-400 leading-relaxed">
          Click the central gear to reveal navigation. Click any satellite to open its sub-menu of 3 cogs.
          Each interaction spins the gears with ease-in-out transitions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { name: 'GearHero', desc: 'Central gear + radial satellites + sub-sub-menus, all click-driven with spin animations' },
            { name: 'CogMenu', desc: 'Compact radial menu expanding from a single cog icon' },
            { name: 'CogSidebar', desc: 'Collapsible sidebar with spinning gear section headers' },
            { name: 'CogDropdown', desc: 'Inline gear-triggered dropdown with dividers' },
          ].map(c => (
            <div key={c.name} className="border border-gray-800 p-5 hover:border-amber-700/50 transition-colors">
              <h3 className="text-white font-bold text-sm mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                {'<'}{c.name}{' />'}
              </h3>
              <p className="text-gray-500 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
