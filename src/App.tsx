/** Cog Works — Component Playground */
import GearHero from './components/GearHero'

const heroItems = [
  { label: 'Services', icon: '🔧', onClick: () => console.log('Services') },
  { label: 'Solutions', icon: '⚙️', onClick: () => console.log('Solutions') },
  { label: 'Support', icon: '🎧', onClick: () => console.log('Support') },
  { label: 'About', icon: 'ℹ️', onClick: () => console.log('About') },
  { label: 'Blog', icon: '📝', onClick: () => console.log('Blog') },
  { label: 'Contact', icon: '✉️', onClick: () => console.log('Contact') },
]

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <GearHero
        title="COG WORKS"
        subtitle="Engineering the Future"
        items={heroItems}
      />

      {/* Below-fold content placeholder */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2
          className="text-2xl font-bold text-white mb-4"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Drop-in React Components
        </h2>
        <p className="text-gray-400 leading-relaxed">
          Cog Works provides industrial-themed navigation components for React applications.
          Each component features metallic gear aesthetics, smooth Framer Motion animations,
          and full TypeScript support.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { name: 'GearHero', desc: 'Full-width hero with central gear + radial satellite nav' },
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
