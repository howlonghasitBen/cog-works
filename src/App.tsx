/** Cog Works — Component Playground */
import { useState } from 'react'
import CogMenu from './components/CogMenu'
import CogSidebar from './components/CogSidebar'
import CogDropdown from './components/CogDropdown'

const sidebarSections = [
  {
    label: 'Navigation',
    items: [
      { label: 'Dashboard', icon: '📊', active: true },
      { label: 'Explore', icon: '🔍' },
      { label: 'Portfolio', icon: '💼', badge: 3 },
    ],
  },
  {
    label: 'Trading',
    items: [
      { label: 'Swap', icon: '🔄' },
      { label: 'Stake', icon: '🏗️' },
      { label: 'Bridge', icon: '🌉', badge: 'NEW' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Profile', icon: '👤' },
      { label: 'Wallet', icon: '🔑' },
      { label: 'Theme', icon: '🎨' },
    ],
  },
]

const radialItems = [
  { label: 'Home', icon: '🏠', onClick: () => console.log('Home') },
  { label: 'Cards', icon: '🃏', onClick: () => console.log('Cards') },
  { label: 'Swap', icon: '🔄', onClick: () => console.log('Swap') },
  {
    label: 'More',
    icon: '⚡',
    items: [
      { label: 'Bridge', icon: '🌉', onClick: () => console.log('Bridge') },
      { label: 'Govern', icon: '🏛️', onClick: () => console.log('Govern') },
      { label: 'Docs', icon: '📄', onClick: () => console.log('Docs') },
    ],
  },
  { label: 'Profile', icon: '👤', onClick: () => console.log('Profile') },
]

const dropdownItems = [
  { label: 'Settings', icon: '⚙️', onClick: () => console.log('Settings') },
  { label: 'Notifications', icon: '🔔', onClick: () => console.log('Notifs') },
  { divider: true, label: '' },
  { label: 'Documentation', icon: '📖', href: '#docs' },
  { label: 'GitHub', icon: '🐙', href: 'https://github.com/howlonghasitBen/cog-works' },
  { divider: true, label: '' },
  { label: 'Disconnect', icon: '🔌', onClick: () => console.log('Disconnect') },
]

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeDemo, setActiveDemo] = useState<'radial' | 'sidebar' | 'dropdown'>('sidebar')

  return (
    <div className="flex h-screen">
      {/* Live sidebar demo */}
      <CogSidebar
        sections={sidebarSections}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-gray-200 bg-white">
          <h1 className="text-lg font-bold" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            ⚙️ Cog Works
          </h1>
          <div className="flex items-center gap-4">
            <CogDropdown items={dropdownItems} label="Options" />
          </div>
        </header>

        {/* Demo tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['radial', 'sidebar', 'dropdown'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border cursor-pointer transition-colors ${
                activeDemo === tab
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveDemo(tab)}
            >
              {tab === 'radial' ? '🎯 Radial Menu' : tab === 'sidebar' ? '📋 Sidebar' : '📂 Dropdown'}
            </button>
          ))}
        </div>

        {/* Demo area */}
        <div className="flex-1 p-6 overflow-auto">
          {activeDemo === 'radial' && (
            <div className="flex flex-col items-center gap-8">
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  CogMenu — Radial Navigation
                </h2>
                <p className="text-sm text-gray-500 mb-8 max-w-lg">
                  Click the cog to expand menu items in a radial arc. Supports nested submenus,
                  configurable arc angle, radius, and trigger mode (click or hover).
                </p>
              </div>
              <div className="flex gap-16 items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-4 font-mono">click trigger (default)</p>
                  <CogMenu items={radialItems} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-4 font-mono">hover trigger, 270° arc</p>
                  <CogMenu items={radialItems} trigger="hover" arc={270} startAngle={180} radius={140} />
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'sidebar' && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                CogSidebar — Collapsible Section Navigation
              </h2>
              <p className="text-sm text-gray-500 mb-4 max-w-lg">
                The sidebar on the left is a live demo. Click the ⚙️ to collapse/expand.
                Each section has a spinning cog when active. Supports badges, icons, and href links.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-lg mt-8">
                <button
                  className="px-4 py-3 border border-gray-200 bg-white text-sm font-medium cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-colors"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  Expand Sidebar
                </button>
                <button
                  className="px-4 py-3 border border-gray-200 bg-white text-sm font-medium cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-colors"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  Collapse Sidebar
                </button>
              </div>
            </div>
          )}

          {activeDemo === 'dropdown' && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                CogDropdown — Inline Gear Dropdown
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-lg">
                A standard dropdown with cog flair. Gear icon spins on open. The one in the top-right
                header is a live demo. Here are more variations:
              </p>
              <div className="flex gap-6 items-start">
                <CogDropdown items={dropdownItems} label="Left aligned" />
                <CogDropdown items={dropdownItems} label="Right aligned" align="right" />
                <CogDropdown items={dropdownItems.slice(0, 3)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-gray-200 text-xs text-gray-400 font-mono">
          cog-works v0.1.0 — drop-in React cog navigation components
        </footer>
      </div>
    </div>
  )
}
